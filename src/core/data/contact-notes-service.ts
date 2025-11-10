/**
 * Contact Notes Service
 * Manages notes for CRM contacts with hierarchical access control
 * Users can only see and manage notes created by themselves or their subordinates
 */

import { lmdb } from './lmdb';
import { v4 as uuidv4 } from 'uuid';
import { ContactNote } from '@/shared/types/database';
import { User } from '@/shared/types/database';

export interface CreateContactNoteInput {
  contactId: string;
  content: string;
}

export interface UpdateContactNoteInput {
  content: string;
}

export class ContactNotesService {
  private static readonly DB_NAME = 'contactNotes';
  private static readonly USERS_DB_NAME = 'users';

  /**
   * Get all subordinate user IDs for a given user (including the user themselves)
   */
  private static async getSubordinateUserIds(userId: string): Promise<string[]> {
    try {
      await lmdb.initialize();
      const db = lmdb.getDatabase(this.USERS_DB_NAME);

      const subordinateIds: string[] = [userId]; // Include the user themselves
      const toProcess = [userId];

      while (toProcess.length > 0) {
        const currentUserId = toProcess.shift()!;

        // Find all users who report to currentUserId
        for (const { value } of db.getRange()) {
          const user = value as User;
          if (user.managerId === currentUserId && !subordinateIds.includes(user.id)) {
            subordinateIds.push(user.id);
            toProcess.push(user.id);
          }
        }
      }

      return subordinateIds;
    } catch (error) {
      console.error('Error getting subordinate user IDs:', error);
      // If there's an error, just return the user's own ID
      return [userId];
    }
  }

  /**
   * Get user display name by ID
   */
  private static async getUserDisplayName(userId: string): Promise<string> {
    try {
      await lmdb.initialize();
      const usersDb = lmdb.getDatabase(this.USERS_DB_NAME);
      const user = await usersDb.get(userId) as User | undefined;
      
      if (user) {
        return user.fullNameEn || user.fullNameAr || user.email || userId;
      }
      return userId;
    } catch (error) {
      console.error('Error getting user display name:', error);
      return userId;
    }
  }

  /**
   * Get all notes for a specific contact that the user has access to
   * (notes created by the user or their subordinates)
   */
  static async getContactNotes(contactId: string, userId: string): Promise<ContactNote[]> {
    await lmdb.initialize();
    const db = lmdb.getDatabase(this.DB_NAME);

    // Get all subordinate user IDs (including the user themselves)
    const accessibleUserIds = await this.getSubordinateUserIds(userId);

    const notes: ContactNote[] = [];

    for (const { value } of db.getRange()) {
      const note = value as ContactNote;
      if (note.contactId === contactId && accessibleUserIds.includes(note.createdBy)) {
        notes.push(note);
      }
    }

    // Add user display names to notes
    const notesWithNames = await Promise.all(
      notes.map(async (note) => ({
        ...note,
        createdByName: await this.getUserDisplayName(note.createdBy),
      }))
    );

    // Sort by creation date (newest first)
    return notesWithNames.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get a specific note by ID
   * Returns null if not found or user doesn't have access
   */
  static async getNoteById(noteId: string, userId: string): Promise<ContactNote | null> {
    await lmdb.initialize();
    const db = lmdb.getDatabase(this.DB_NAME);

    const note = await db.get(noteId) as ContactNote | undefined;

    if (!note) {
      return null;
    }

    // Check if user has access to this note
    const accessibleUserIds = await this.getSubordinateUserIds(userId);
    if (!accessibleUserIds.includes(note.createdBy)) {
      return null;
    }

    // Add display name
    return {
      ...note,
      createdByName: await this.getUserDisplayName(note.createdBy),
    };
  }

  /**
   * Create a new note for a contact
   */
  static async createNote(userId: string, input: CreateContactNoteInput): Promise<ContactNote> {
    await lmdb.initialize();
    const db = lmdb.getDatabase(this.DB_NAME);

    const noteId = uuidv4();
    const now = new Date().toISOString();

    const note: ContactNote = {
      id: noteId,
      contactId: input.contactId,
      userId,
      content: input.content,
      createdBy: userId,
      createdByName: await this.getUserDisplayName(userId),
      createdAt: now,
      updatedAt: now,
    };

    await db.put(noteId, note);

    return note;
  }

  /**
   * Update an existing note
   * Only the creator or their managers can update
   */
  static async updateNote(
    noteId: string,
    userId: string,
    input: UpdateContactNoteInput
  ): Promise<ContactNote | null> {
    await lmdb.initialize();
    const db = lmdb.getDatabase(this.DB_NAME);

    const note = await this.getNoteById(noteId, userId);

    if (!note) {
      return null;
    }

    // Check if user has permission to update
    const accessibleUserIds = await this.getSubordinateUserIds(userId);
    if (!accessibleUserIds.includes(note.createdBy)) {
      return null;
    }

    const updatedNote: ContactNote = {
      ...note,
      content: input.content,
      createdByName: await this.getUserDisplayName(note.createdBy),
      updatedAt: new Date().toISOString(),
    };

    await db.put(noteId, updatedNote);

    return updatedNote;
  }

  /**
   * Delete a note
   * Only the creator or their managers can delete
   */
  static async deleteNote(noteId: string, userId: string): Promise<boolean> {
    await lmdb.initialize();
    const db = lmdb.getDatabase(this.DB_NAME);

    const note = await this.getNoteById(noteId, userId);

    if (!note) {
      return false;
    }

    // Check if user has permission to delete
    const accessibleUserIds = await this.getSubordinateUserIds(userId);
    if (!accessibleUserIds.includes(note.createdBy)) {
      return false;
    }

    await db.remove(noteId);

    return true;
  }

  /**
   * Get notes count for a contact
   */
  static async getNotesCount(contactId: string, userId: string): Promise<number> {
    const notes = await this.getContactNotes(contactId, userId);
    return notes.length;
  }

  /**
   * Delete all notes for a contact (used when deleting a contact)
   */
  static async deleteAllContactNotes(contactId: string): Promise<void> {
    await lmdb.initialize();
    const db = lmdb.getDatabase(this.DB_NAME);

    const notesToDelete: string[] = [];

    for (const { key, value } of db.getRange()) {
      const note = value as ContactNote;
      if (note.contactId === contactId) {
        notesToDelete.push(key as string);
      }
    }

    for (const noteId of notesToDelete) {
      await db.remove(noteId);
    }
  }
}

import { lmdb } from './lmdb';
import { v4 as uuidv4 } from 'uuid';

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  color: string;
  position: number;
  archived: boolean;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteInput {
  title?: string;
  content: string;
  color?: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  color?: string;
  position?: number;
  archived?: boolean;
  pinned?: boolean;
}

/**
 * Notes Service
 * Manages user notes with color customization and positioning
 */
export class NotesService {
  private static readonly DB_NAME = 'notes';

  /**
   * Get all notes for a user
   */
  static async getUserNotes(userId: string, includeArchived = false): Promise<Note[]> {
    await lmdb.initialize();
    const db = lmdb.getDatabase(this.DB_NAME);

    const allNotes: Note[] = [];
    
    for (const { value } of db.getRange()) {
      const note = value as Note;
      if (note.userId === userId) {
        if (includeArchived || !note.archived) {
          allNotes.push(note);
        }
      }
    }

    // Sort by position (pinned first, then by position)
    return allNotes.sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }
      return a.position - b.position;
    });
  }

  /**
   * Get a specific note by ID
   */
  static async getNoteById(noteId: string, userId: string): Promise<Note | null> {
    await lmdb.initialize();
    const db = lmdb.getDatabase(this.DB_NAME);

    const note = await db.get(noteId) as Note | undefined;
    
    if (!note || note.userId !== userId) {
      return null;
    }

    return note;
  }

  /**
   * Create a new note
   */
  static async createNote(userId: string, input: CreateNoteInput): Promise<Note> {
    await lmdb.initialize();
    const db = lmdb.getDatabase(this.DB_NAME);

    const noteId = uuidv4();
    const now = new Date().toISOString();

    // Get highest position for user
    const userNotes = await this.getUserNotes(userId, true);
    const maxPosition = userNotes.length > 0 
      ? Math.max(...userNotes.map(n => n.position))
      : 0;

    const note: Note = {
      id: noteId,
      userId,
      title: input.title || '',
      content: input.content,
      color: input.color || 'default',
      position: maxPosition + 1,
      archived: false,
      pinned: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.put(noteId, note);

    return note;
  }

  /**
   * Update a note
   */
  static async updateNote(
    noteId: string,
    userId: string,
    input: UpdateNoteInput
  ): Promise<Note | null> {
    await lmdb.initialize();
    const db = lmdb.getDatabase(this.DB_NAME);

    const existingNote = await this.getNoteById(noteId, userId);
    
    if (!existingNote) {
      return null;
    }

    const updatedNote: Note = {
      ...existingNote,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    await db.put(noteId, updatedNote);

    return updatedNote;
  }

  /**
   * Delete a note
   */
  static async deleteNote(noteId: string, userId: string): Promise<boolean> {
    await lmdb.initialize();
    const db = lmdb.getDatabase(this.DB_NAME);

    const existingNote = await this.getNoteById(noteId, userId);
    
    if (!existingNote) {
      return false;
    }

    await db.remove(noteId);

    return true;
  }

  /**
   * Update note position (for drag and drop)
   */
  static async updateNotePosition(
    noteId: string,
    userId: string,
    newPosition: number
  ): Promise<Note | null> {
    return this.updateNote(noteId, userId, { position: newPosition });
  }

  /**
   * Toggle note archived status
   */
  static async toggleArchive(noteId: string, userId: string): Promise<Note | null> {
    const note = await this.getNoteById(noteId, userId);
    
    if (!note) {
      return null;
    }

    return this.updateNote(noteId, userId, { archived: !note.archived });
  }

  /**
   * Toggle note pinned status
   */
  static async togglePin(noteId: string, userId: string): Promise<Note | null> {
    const note = await this.getNoteById(noteId, userId);
    
    if (!note) {
      return null;
    }

    return this.updateNote(noteId, userId, { pinned: !note.pinned });
  }

  /**
   * Reorder notes after drag and drop
   */
  static async reorderNotes(
    userId: string,
    noteIds: string[]
  ): Promise<void> {
    await lmdb.initialize();
    const db = lmdb.getDatabase(this.DB_NAME);

    for (let i = 0; i < noteIds.length; i++) {
      const note = await this.getNoteById(noteIds[i], userId);
      if (note) {
        note.position = i;
        note.updatedAt = new Date().toISOString();
        await db.put(note.id, note);
      }
    }
  }
}

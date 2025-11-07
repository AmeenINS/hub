'use client';

import * as React from 'react';
import { NoteCard } from './note-card';
import { useI18n } from '@/shared/i18n/i18n-context';
import type { Note } from '@/core/data/notes-service';

interface NotesGridProps {
  notes: Note[];
  onNoteUpdate: (note: Note) => void;
  onNoteDelete: (noteId: string) => void;
  onNoteArchive: (noteId: string) => void;
  onNotePin: (noteId: string) => void;
  onNoteColorChange: (noteId: string, color: string) => void;
  onNotesReorder: (noteIds: string[]) => void;
}

export function NotesGrid({
  notes,
  onNoteUpdate,
  onNoteDelete,
  onNoteArchive,
  onNotePin,
  onNoteColorChange,
  onNotesReorder,
}: NotesGridProps) {
  const { t } = useI18n();
  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null);
  const [draggedNote, setDraggedNote] = React.useState<Note | null>(null);

  const handleDragStart = (note: Note) => {
    setDraggedNote(note);
  };

  const handleDragEnd = () => {
    setDraggedNote(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetNote: Note) => {
    e.preventDefault();
    
    if (!draggedNote || draggedNote.id === targetNote.id) {
      return;
    }

    const currentNotes = [...notes];
    const draggedIndex = currentNotes.findIndex(n => n.id === draggedNote.id);
    const targetIndex = currentNotes.findIndex(n => n.id === targetNote.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    // Reorder array
    currentNotes.splice(draggedIndex, 1);
    currentNotes.splice(targetIndex, 0, draggedNote);

    // Update positions
    onNotesReorder(currentNotes.map(n => n.id));
  };

  const handleEdit = (note: Note) => {
    setEditingNoteId(note.id);
  };

  const handleSave = (note: Note) => {
    onNoteUpdate(note);
    setEditingNoteId(null);
  };

  // Separate pinned and unpinned notes
  const pinnedNotes = notes.filter(n => n.pinned);
  const unpinnedNotes = notes.filter(n => !n.pinned);

  return (
    <div className="space-y-8">
      {/* Pinned notes section */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {t('notes.pinned')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pinnedNotes.map((note) => (
              <div
                key={note.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, note)}
              >
                <NoteCard
                  note={note}
                  isEditing={editingNoteId === note.id}
                  onEdit={handleEdit}
                  onSave={handleSave}
                  onDelete={onNoteDelete}
                  onArchive={onNoteArchive}
                  onPin={onNotePin}
                  onColorChange={onNoteColorChange}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular notes section */}
      {unpinnedNotes.length > 0 && (
        <div className="space-y-4">
          {pinnedNotes.length > 0 && (
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {t('notes.others')}
            </h3>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {unpinnedNotes.map((note) => (
              <div
                key={note.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, note)}
              >
                <NoteCard
                  note={note}
                  isEditing={editingNoteId === note.id}
                  onEdit={handleEdit}
                  onSave={handleSave}
                  onDelete={onNoteDelete}
                  onArchive={onNoteArchive}
                  onPin={onNotePin}
                  onColorChange={onNoteColorChange}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {notes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">{t('notes.noNotes')}</p>
          <p className="text-sm">{t('notes.noNotesDescription')}</p>
        </div>
      )}
    </div>
  );
}

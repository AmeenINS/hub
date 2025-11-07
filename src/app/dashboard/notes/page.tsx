'use client';

import * as React from 'react';
import { Lightbulb, Archive as ArchiveIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { CreateNoteCard } from '@/features/notes/components/create-note-card';
import { NotesGrid } from '@/features/notes/components/notes-grid';
import { Button } from '@/shared/components/ui/button';
import { useI18n } from '@/shared/i18n/i18n-context';
import { useModuleVisibility } from '@/shared/hooks/use-module-visibility';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import type { Note } from '@/core/data/notes-service';

export default function NotesPage() {
  const { t } = useI18n();
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = React.useState(true);
  const [showArchived, setShowArchived] = React.useState(false);
  
  const { canView, canWrite, canFull, isLoading } = usePermissionLevel('notes');

  // Fetch notes - MUST be defined before any early returns
  const fetchNotes = React.useCallback(async () => {
    try {
      setIsLoadingNotes(true);
      const response = await apiClient.get<Note[]>(
        `/api/notes${showArchived ? '?archived=true' : ''}`
      );

      if (response.success && response.data) {
        setNotes(response.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to fetch notes'));
    } finally {
      setIsLoadingNotes(false);
    }
  }, [showArchived]);

  React.useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Derived permission variables
  const canCreate = canWrite;
  const canEdit = canWrite;
  const canDelete = canFull;

  // Show loading state - moved after all hooks
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Check if user has at least READ permission for Notes - moved after all hooks
  if (!canView) {
    return null;
  }

  // Create note
  const handleCreateNote = async (data: { title: string; content: string; color: string }) => {
    try {
      const response = await apiClient.post<Note>('/api/notes', data);

      if (response.success && response.data) {
        setNotes((prev) => [response.data as Note, ...prev]);
        toast.success(t('notes.created'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('notes.createError')));
    }
  };

  // Update note
  const handleUpdateNote = async (note: Note) => {
    try {
      const response = await apiClient.put<Note>(`/api/notes/${note.id}`, {
        title: note.title,
        content: note.content,
      });

      if (response.success && response.data) {
        setNotes((prev) =>
          prev.map((n) => (n.id === note.id ? response.data as Note : n))
        );
        toast.success(t('notes.updated'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('notes.updateError')));
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    try {
      const response = await apiClient.delete(`/api/notes/${noteId}`);

      if (response.success) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        toast.success(t('notes.deleted'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('notes.deleteError')));
    }
  };

  // Archive note
  const handleArchiveNote = async (noteId: string) => {
    try {
      const response = await apiClient.patch<Note>(`/api/notes/${noteId}`, {
        action: 'archive',
      });

      if (response.success && response.data) {
        const noteData = response.data as Note;
        if (showArchived) {
          // Update note in list
          setNotes((prev) =>
            prev.map((n) => (n.id === noteId ? noteData : n))
          );
        } else {
          // Remove from list when not showing archived
          setNotes((prev) => prev.filter((n) => n.id !== noteId));
        }
        toast.success(noteData.archived ? t('notes.archived') : t('notes.unarchived'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('notes.archiveError')));
    }
  };

  // Pin note
  const handlePinNote = async (noteId: string) => {
    try {
      const response = await apiClient.patch<Note>(`/api/notes/${noteId}`, {
        action: 'pin',
      });

      if (response.success && response.data) {
        const noteData = response.data as Note;
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? noteData : n))
        );
        toast.success(noteData.pinned ? t('notes.pinNotification') : t('notes.unpinNotification'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('notes.pinError')));
    }
  };

  // Change note color
  const handleColorChange = async (noteId: string, color: string) => {
    try {
      const response = await apiClient.put<Note>(`/api/notes/${noteId}`, {
        color,
      });

      if (response.success && response.data) {
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? response.data as Note : n))
        );
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('notes.colorError')));
    }
  };

  // Reorder notes
  const handleReorderNotes = async (noteIds: string[]) => {
    try {
      // Optimistically update UI
      const reorderedNotes = noteIds
        .map((id) => notes.find((n) => n.id === id))
        .filter((n): n is Note => n !== undefined);
      setNotes(reorderedNotes);

      // Send to server
      await apiClient.post('/api/notes/reorder', { noteIds });
    } catch (error) {
      toast.error(getErrorMessage(error, t('notes.reorderError')));
      // Revert on error
      fetchNotes();
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-8 w-8 text-yellow-500" />
          <h2 className="text-3xl font-bold tracking-tight">{t('notes.title')}</h2>
        </div>

        <Button
          variant={showArchived ? 'default' : 'outline'}
          onClick={() => setShowArchived(!showArchived)}
        >
          <ArchiveIcon className="h-4 w-4 mr-2" />
          {showArchived ? t('notes.showActive') : t('notes.showArchived')}
        </Button>
      </div>

      {/* Create note card */}
      {canCreate && (
        <div className="max-w-2xl mx-auto">
          <CreateNoteCard onCreate={handleCreateNote} />
        </div>
      )}

      {/* Notes grid */}
      {isLoadingNotes ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{t('notes.loading')}</div>
        </div>
      ) : (
        <NotesGrid
          notes={notes}
          onNoteUpdate={handleUpdateNote}
          onNoteDelete={handleDeleteNote}
          onNoteArchive={handleArchiveNote}
          onNotePin={handlePinNote}
          onNoteColorChange={handleColorChange}
          onNotesReorder={handleReorderNotes}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}
    </div>
  );
}

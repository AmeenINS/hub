import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/core/auth/jwt';
import { NotesService } from '@/core/data/notes-service';
import { getErrorMessage } from '@/core/api/client';

/**
 * PUT /api/notes/[id] - Update a note
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = JWTService.verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id: noteId } = await params;

    const updatedNote = await NotesService.updateNote(
      noteId,
      decoded.userId,
      body
    );

    if (!updatedNote) {
      return NextResponse.json(
        { success: false, message: 'Note not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Note updated successfully',
      data: updatedNote,
    });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { success: false, message: getErrorMessage(error, 'Failed to update note') },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notes/[id] - Delete a note
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = JWTService.verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const { id: noteId } = await params;
    const deleted = await NotesService.deleteNote(noteId, decoded.userId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Note not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { success: false, message: getErrorMessage(error, 'Failed to delete note') },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notes/[id] - Partial update (for actions like archive/pin)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = JWTService.verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id: noteId } = await params;

    // Handle specific actions
    if (body.action === 'archive') {
      const note = await NotesService.toggleArchive(noteId, decoded.userId);
      if (!note) {
        return NextResponse.json(
          { success: false, message: 'Note not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: note.archived ? 'Note archived' : 'Note unarchived',
        data: note,
      });
    }

    if (body.action === 'pin') {
      const note = await NotesService.togglePin(noteId, decoded.userId);
      if (!note) {
        return NextResponse.json(
          { success: false, message: 'Note not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: note.pinned ? 'Note pinned' : 'Note unpinned',
        data: note,
      });
    }

    // Default partial update
    const updatedNote = await NotesService.updateNote(
      noteId,
      decoded.userId,
      body
    );

    if (!updatedNote) {
      return NextResponse.json(
        { success: false, message: 'Note not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Note updated successfully',
      data: updatedNote,
    });
  } catch (error) {
    console.error('Error patching note:', error);
    return NextResponse.json(
      { success: false, message: getErrorMessage(error, 'Failed to update note') },
      { status: 500 }
    );
  }
}

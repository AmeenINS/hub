/**
 * Individual Contact Note API Routes
 * PUT /api/crm/contacts/[id]/notes/[noteId] - Update a note
 * DELETE /api/crm/contacts/[id]/notes/[noteId] - Delete a note
 */

import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/core/auth/jwt';
import { ContactNotesService } from '@/core/data/contact-notes-service';
import { checkPermission } from '@/core/auth/middleware';

/**
 * PUT /api/crm/contacts/[id]/notes/[noteId]
 * Update a note (only creator or their managers can update)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check permission for contacts module
    const hasAccess = await checkPermission(payload.userId, 'crm_contacts', 'update');

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    const { noteId } = await params;
    const body = await request.json();

    if (!body.content || typeof body.content !== 'string' || body.content.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Note content is required' },
        { status: 400 }
      );
    }

    // Update note (service will check hierarchical access)
    const updatedNote = await ContactNotesService.updateNote(
      noteId,
      payload.userId,
      { content: body.content.trim() }
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
    console.error('Error updating contact note:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/crm/contacts/[id]/notes/[noteId]
 * Delete a note (only creator or their managers can delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check permission for contacts module
    const hasAccess = await checkPermission(payload.userId, 'crm_contacts', 'delete');

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    const { noteId } = await params;

    // Delete note (service will check hierarchical access)
    const deleted = await ContactNotesService.deleteNote(noteId, payload.userId);

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
    console.error('Error deleting contact note:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

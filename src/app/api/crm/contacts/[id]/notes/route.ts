/**
 * Contact Notes API Routes
 * GET /api/crm/contacts/[id]/notes - Get all notes for a contact
 * POST /api/crm/contacts/[id]/notes - Create a new note for a contact
 */

import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/core/auth/jwt';
import { ContactNotesService } from '@/core/data/contact-notes-service';
import { checkPermission } from '@/core/auth/middleware';

/**
 * GET /api/crm/contacts/[id]/notes
 * Get all notes for a contact (user can see their own notes and subordinates' notes)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const hasAccess = await checkPermission(payload.userId, 'crm_contacts', 'read');

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    const { id: contactId } = await params;

    // Get notes (filtered by hierarchical access)
    const notes = await ContactNotesService.getContactNotes(contactId, payload.userId);

    return NextResponse.json({
      success: true,
      data: notes,
    });
  } catch (error) {
    console.error('Error fetching contact notes:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crm/contacts/[id]/notes
 * Create a new note for a contact
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: contactId } = await params;
    const body = await request.json();

    if (!body.content || typeof body.content !== 'string' || body.content.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Note content is required' },
        { status: 400 }
      );
    }

    // Create note
    const note = await ContactNotesService.createNote(payload.userId, {
      contactId,
      content: body.content.trim(),
    });

    return NextResponse.json({
      success: true,
      message: 'Note created successfully',
      data: note,
    });
  } catch (error) {
    console.error('Error creating contact note:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

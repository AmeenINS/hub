import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/lib/auth/jwt';
import { NotesService } from '@/lib/db/notes-service';
import { getErrorMessage } from '@/lib/api-client';

/**
 * GET /api/notes - Get all notes for the authenticated user
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('archived') === 'true';

    const notes = await NotesService.getUserNotes(decoded.userId, includeArchived);

    return NextResponse.json({
      success: true,
      data: notes,
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { success: false, message: getErrorMessage(error, 'Failed to fetch notes') },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notes - Create a new note
 */
export async function POST(request: NextRequest) {
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
    
    // Validate required fields
    if (!body.content || body.content.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Content is required' },
        { status: 400 }
      );
    }

    const note = await NotesService.createNote(decoded.userId, {
      title: body.title || '',
      content: body.content,
      color: body.color || '#ffffff',
    });

    return NextResponse.json({
      success: true,
      message: 'Note created successfully',
      data: note,
    });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { success: false, message: getErrorMessage(error, 'Failed to create note') },
      { status: 500 }
    );
  }
}

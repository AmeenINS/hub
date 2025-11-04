import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/lib/auth/jwt';
import { NotesService } from '@/lib/db/notes-service';
import { getErrorMessage } from '@/lib/api-client';

/**
 * POST /api/notes/reorder - Reorder notes after drag and drop
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
    const { noteIds } = body;

    if (!Array.isArray(noteIds)) {
      return NextResponse.json(
        { success: false, message: 'noteIds must be an array' },
        { status: 400 }
      );
    }

    await NotesService.reorderNotes(decoded.userId, noteIds);

    return NextResponse.json({
      success: true,
      message: 'Notes reordered successfully',
    });
  } catch (error) {
    console.error('Error reordering notes:', error);
    return NextResponse.json(
      { success: false, message: getErrorMessage(error, 'Failed to reorder notes') },
      { status: 500 }
    );
  }
}

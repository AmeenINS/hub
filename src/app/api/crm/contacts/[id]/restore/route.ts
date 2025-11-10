import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { ContactService } from '@/core/data/crm-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';

/**
 * POST /api/crm/contacts/[id]/restore
 * Restore a soft-deleted contact (بازیابی)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const hasPermission = await checkPermission(payload.userId, 'crm_contacts', 'delete');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const contactService = new ContactService();
    
    // Restore the contact
    const restored = await contactService.restoreContact(id, payload.userId);

    if (!restored) {
      return NextResponse.json(
        { success: false, error: 'Contact not found in trash' },
        { status: 404 }
      );
    }

    // Revalidate pages
    revalidatePath('/dashboard/crm/contacts');
    revalidatePath('/dashboard/crm/contacts/trash');

    return NextResponse.json({
      success: true,
      data: restored,
      message: 'Contact restored successfully',
    });
  } catch (error) {
    logError('POST /api/crm/contacts/[id]/restore', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

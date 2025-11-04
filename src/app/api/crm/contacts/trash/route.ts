import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/lib/db/crm-service';
import { JWTService } from '@/lib/auth/jwt';
import { checkPermission } from '@/lib/auth/middleware';
import { logError } from '@/lib/logger';

/**
 * GET /api/crm/contacts/trash
 * Get all soft-deleted contacts (سطل زباله)
 */
export async function GET(request: NextRequest) {
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

    const hasPermission = await checkPermission(payload.userId, 'crm_contacts', 'read');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const contactService = new ContactService();
    const deletedContacts = await contactService.getDeletedContacts();

    return NextResponse.json({
      success: true,
      data: deletedContacts,
      count: deletedContacts.length,
    });
  } catch (error) {
    logError('GET /api/crm/contacts/trash', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

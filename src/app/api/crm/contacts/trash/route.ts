import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/core/data/crm-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';

/**
 * GET /api/crm/contacts/trash
 * Get all soft-deleted contacts (سطل زباله)
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
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

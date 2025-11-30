import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { ContactService } from '@/core/data/crm-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';
import { getAccessibleUserIds, filterByHierarchicalAccess } from '@/core/utils/hierarchical-access';

/**
 * GET /api/crm/contacts
 * Get all contacts (requires permission)
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;
    const hasPermission = await checkPermission(userId, 'crm_contacts', 'read');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const contactService = new ContactService();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const assigneeId = searchParams.get('assignee');
    const companyId = searchParams.get('companyId');

    // Get accessible user IDs (self + subordinates)
    const accessibleUserIds = await getAccessibleUserIds(userId);

    let contacts;
    if (companyId) {
      contacts = await contactService.getContactsByCompany(companyId);
    } else if (search) {
      contacts = await contactService.searchContacts(search);
    } else if (assigneeId) {
      contacts = await contactService.getContactsByAssignee(assigneeId);
    } else {
      contacts = await contactService.getAllContacts();
    }

    // Filter contacts by hierarchical access
    const filteredContacts = filterByHierarchicalAccess(contacts, accessibleUserIds);

    return NextResponse.json({
      success: true,
      data: filteredContacts,
    });
  } catch (error) {
    logError('GET /api/crm/contacts', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crm/contacts
 * Create a new contact (requires permission)
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;
    const hasPermission = await checkPermission(userId, 'crm_contacts', 'create');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const contactService = new ContactService();
    
    // Add creator info
    const contactData = {
      ...body,
      createdBy: userId,
      assignedTo: body.assignedTo || userId, // Default to creator if not specified
    };

    const contact = await contactService.createContact(contactData);

    // Revalidate the contacts page to show new contact
    revalidatePath('/dashboard/crm/contacts');

    return NextResponse.json({
      success: true,
      data: contact,
      message: 'Contact created successfully',
    }, { status: 201 });
  } catch (error) {
    logError('POST /api/crm/contacts', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
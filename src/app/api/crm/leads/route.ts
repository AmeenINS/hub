import { NextRequest, NextResponse } from 'next/server';
import { LeadService } from '@/core/data/lead-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';
import { LeadStatus } from '@/shared/types/database';
import { getAccessibleUserIds, filterByHierarchicalAccess } from '@/core/utils/hierarchical-access';

/**
 * GET /api/crm/leads
 * Get all leads with optional filtering
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

    const hasPermission = await checkPermission(payload.userId, 'crm_leads', 'read');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const leadService = new LeadService();
    const { searchParams } = new URL(request.url);
    
    // Filter parameters
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const insuranceType = searchParams.get('insuranceType');
    const contactId = searchParams.get('contactId');
    const companyId = searchParams.get('companyId');
    const search = searchParams.get('search');
    const followUp = searchParams.get('followUp');

    let leads;

    if (search) {
      leads = await leadService.searchLeads(search);
    } else if (followUp === 'true') {
      leads = await leadService.getLeadsRequiringFollowUp();
    } else if (status) {
      leads = await leadService.getLeadsByStatus(status as LeadStatus);
    } else if (assignedTo) {
      leads = await leadService.getLeadsByAssignedUser(assignedTo);
    } else if (insuranceType) {
      leads = await leadService.getLeadsByInsuranceType(insuranceType);
    } else if (contactId) {
      leads = await leadService.getLeadsByContact(contactId);
    } else if (companyId) {
      leads = await leadService.getLeadsByCompany(companyId);
    } else {
      leads = await leadService.getAllLeads();
    }

    // Filter leads by hierarchical access
    const accessibleUserIds = await getAccessibleUserIds(payload.userId);
    const filteredLeads = filterByHierarchicalAccess(leads, accessibleUserIds);

    return NextResponse.json({ success: true, data: filteredLeads });
  } catch (error) {
    logError('GET /api/crm/leads', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/crm/leads
 * Create a new lead
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

    const hasPermission = await checkPermission(payload.userId, 'crm_leads', 'create');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const leadService = new LeadService();
    
    const leadData = {
      ...body,
      createdBy: payload.userId,
      assignedTo: body.assignedTo || payload.userId,
    };

    const lead = await leadService.createLead(leadData);

    return NextResponse.json({
      success: true,
      data: lead,
      message: 'Lead created successfully',
    }, { status: 201 });
  } catch (error) {
    logError('POST /api/crm/leads', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
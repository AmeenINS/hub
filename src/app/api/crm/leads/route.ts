import { NextRequest, NextResponse } from 'next/server';
import { LeadService } from '@/core/data/crm-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const payload = JWTService.verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const hasPermission = await checkPermission(payload.userId, 'crm_leads', 'read');
    if (!hasPermission) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const leadService = new LeadService();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assigneeId = searchParams.get('assignee');

    let leads;
    if (status) {
      leads = await leadService.getLeadsByStatus(status as any);
    } else if (assigneeId) {
      leads = await leadService.getLeadsByAssignee(assigneeId);
    } else {
      leads = await leadService.getAllLeads();
    }

    return NextResponse.json({ success: true, data: leads });
  } catch (error) {
    logError('GET /api/crm/leads', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const payload = JWTService.verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const hasPermission = await checkPermission(payload.userId, 'crm_leads', 'create');
    if (!hasPermission) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const leadService = new LeadService();
    
    const leadData = { ...body, createdBy: payload.userId, assignedTo: body.assignedTo || payload.userId };
    const lead = await leadService.createLead(leadData);

    return NextResponse.json({ success: true, data: lead, message: 'Lead created successfully' }, { status: 201 });
  } catch (error) {
    logError('POST /api/crm/leads', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
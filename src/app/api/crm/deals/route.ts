import { NextRequest, NextResponse } from 'next/server';
import { DealService } from '@/core/data/crm-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const payload = JWTService.verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const hasPermission = await checkPermission(payload.userId, 'crm_deals', 'read');
    if (!hasPermission) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const dealService = new DealService();
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const assigneeId = searchParams.get('assignee');

    let deals;
    if (stage) {
      deals = await dealService.getDealsByStage(stage as any);
    } else if (assigneeId) {
      deals = await dealService.getDealsByAssignee(assigneeId);
    } else {
      deals = await dealService.getAllDeals();
    }

    return NextResponse.json({ success: true, data: deals });
  } catch (error) {
    logError('GET /api/crm/deals', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const payload = JWTService.verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const hasPermission = await checkPermission(payload.userId, 'crm_deals', 'create');
    if (!hasPermission) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const dealService = new DealService();
    
    const dealData = { ...body, createdBy: payload.userId, assignedTo: body.assignedTo || payload.userId };
    const deal = await dealService.createDeal(dealData);

    return NextResponse.json({ success: true, data: deal, message: 'Deal created successfully' }, { status: 201 });
  } catch (error) {
    logError('POST /api/crm/deals', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
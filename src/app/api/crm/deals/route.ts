import { NextRequest, NextResponse } from 'next/server';
import { DealService } from '@/core/data/deal-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';
import { DealStage } from '@/shared/types/database';

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

    const hasPermission = await checkPermission(payload.userId, 'crm_deals', 'read');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const dealService = new DealService();
    const { searchParams } = new URL(request.url);
    
    const stage = searchParams.get('stage');
    const assignedTo = searchParams.get('assignedTo');
    const insuranceType = searchParams.get('insuranceType');
    const contactId = searchParams.get('contactId');
    const companyId = searchParams.get('companyId');
    const leadId = searchParams.get('leadId');
    const search = searchParams.get('search');
    const expiring = searchParams.get('expiring');

    let deals;

    if (search) {
      deals = await dealService.searchDeals(search);
    } else if (expiring) {
      deals = await dealService.getDealsExpiringSoon(parseInt(expiring));
    } else if (stage) {
      deals = await dealService.getDealsByStage(stage as DealStage);
    } else if (assignedTo) {
      deals = await dealService.getDealsByAssignedUser(assignedTo);
    } else if (insuranceType) {
      deals = await dealService.getDealsByInsuranceType(insuranceType);
    } else if (contactId) {
      deals = await dealService.getDealsByContact(contactId);
    } else if (companyId) {
      deals = await dealService.getDealsByCompany(companyId);
    } else if (leadId) {
      deals = await dealService.getDealsByLead(leadId);
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
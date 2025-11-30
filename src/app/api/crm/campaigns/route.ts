import { NextRequest, NextResponse } from 'next/server';
import { CampaignService } from '@/core/data/campaign-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';
import { CampaignType, CampaignStatus } from '@/shared/types/database';
import { getAccessibleUserIds, filterByHierarchicalAccess } from '@/core/utils/hierarchical-access';

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

    const hasPermission = await checkPermission(payload.userId, 'crm_campaigns', 'read');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const campaignService = new CampaignService();
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let campaigns;

    if (search) {
      campaigns = await campaignService.searchCampaigns(search);
    } else if (type) {
      campaigns = await campaignService.getCampaignsByType(type as CampaignType);
    } else if (status) {
      campaigns = await campaignService.getCampaignsByStatus(status as CampaignStatus);
    } else {
      campaigns = await campaignService.getAllCampaigns();
    }

    // Filter campaigns by hierarchical access
    const accessibleUserIds = await getAccessibleUserIds(payload.userId);
    const filteredCampaigns = filterByHierarchicalAccess(campaigns, accessibleUserIds);

    return NextResponse.json({ success: true, data: filteredCampaigns });
  } catch (error) {
    logError('GET /api/crm/campaigns', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

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

    const hasPermission = await checkPermission(payload.userId, 'crm_campaigns', 'create');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const campaignService = new CampaignService();
    
    const campaignData = {
      ...body,
      createdBy: payload.userId,
    };

    const campaign = await campaignService.createCampaign(campaignData);

    return NextResponse.json({
      success: true,
      data: campaign,
      message: 'Campaign created successfully',
    }, { status: 201 });
  } catch (error) {
    logError('POST /api/crm/campaigns', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

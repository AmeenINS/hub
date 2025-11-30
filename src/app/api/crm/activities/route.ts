import { NextRequest, NextResponse } from 'next/server';
import { ActivityService } from '@/core/data/activity-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';
import { ActivityType, ActivityStatus } from '@/shared/types/database';
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

    const hasPermission = await checkPermission(payload.userId, 'crm_activities', 'read');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const activityService = new ActivityService();
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const contactId = searchParams.get('contactId');
    const companyId = searchParams.get('companyId');
    const leadId = searchParams.get('leadId');
    const dealId = searchParams.get('dealId');
    const campaignId = searchParams.get('campaignId');
    const upcoming = searchParams.get('upcoming');
    const overdue = searchParams.get('overdue');
    const search = searchParams.get('search');

    let activities;

    if (search) {
      activities = await activityService.searchActivities(search);
    } else if (upcoming === 'true') {
      activities = await activityService.getUpcomingActivities(assignedTo || undefined);
    } else if (overdue === 'true') {
      activities = await activityService.getOverdueActivities(assignedTo || undefined);
    } else if (type) {
      activities = await activityService.getActivitiesByType(type as ActivityType);
    } else if (status) {
      activities = await activityService.getActivitiesByStatus(status as ActivityStatus);
    } else if (assignedTo) {
      activities = await activityService.getActivitiesByAssignedUser(assignedTo);
    } else if (contactId) {
      activities = await activityService.getActivitiesByContact(contactId);
    } else if (companyId) {
      activities = await activityService.getActivitiesByCompany(companyId);
    } else if (leadId) {
      activities = await activityService.getActivitiesByLead(leadId);
    } else if (dealId) {
      activities = await activityService.getActivitiesByDeal(dealId);
    } else if (campaignId) {
      activities = await activityService.getActivitiesByCampaign(campaignId);
    } else {
      activities = await activityService.getAllActivities();
    }

    // Filter activities by hierarchical access
    const accessibleUserIds = await getAccessibleUserIds(payload.userId);
    const filteredActivities = filterByHierarchicalAccess(activities, accessibleUserIds);

    return NextResponse.json({ success: true, data: filteredActivities });
  } catch (error) {
    logError('GET /api/crm/activities', error);
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

    const hasPermission = await checkPermission(payload.userId, 'crm_activities', 'create');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const activityService = new ActivityService();
    
    const activityData = {
      ...body,
      createdBy: payload.userId,
      assignedTo: body.assignedTo || payload.userId,
    };

    const activity = await activityService.createActivity(activityData);

    return NextResponse.json({
      success: true,
      data: activity,
      message: 'Activity created successfully',
    }, { status: 201 });
  } catch (error) {
    logError('POST /api/crm/activities', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

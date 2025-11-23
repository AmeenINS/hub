import { NextRequest, NextResponse } from 'next/server';
import { DealService } from '@/core/data/deal-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';

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
    const stats = await dealService.getDealStats();

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    logError('GET /api/crm/deals/stats', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

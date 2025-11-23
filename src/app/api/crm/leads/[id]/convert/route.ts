import { NextRequest, NextResponse } from 'next/server';
import { LeadService } from '@/core/data/lead-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const hasPermission = await checkPermission(payload.userId, 'crm_leads', 'update');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const leadService = new LeadService();
    const deal = await leadService.convertToDeal(id);

    return NextResponse.json({
      success: true,
      data: deal,
      message: 'Lead converted to deal successfully',
    });
  } catch (error) {
    logError('POST /api/crm/leads/[id]/convert', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/core/auth/jwt';
import { AdvancedPermissionService } from '@/core/auth/advanced-permission-service';

/**
 * Debug route to inspect user's raw permissions/profile
 * GET /api/users/me/permissions/debug
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const profile = await AdvancedPermissionService.getUserPermissionProfile(payload.userId);

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('permissions debug error', error);
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
  }
}

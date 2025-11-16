import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/core/auth/jwt';
import { UserService } from '@/core/data/user-service';
import { logError } from '@/core/logging/logger';

/**
 * GET /api/users/me/subordinates
 * Return the current user's subordinate hierarchy (direct + indirect)
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

    const userService = new UserService();
    const subordinates = await userService.getAllSubordinates(payload.userId);

    const results = subordinates.map((user) => ({
      id: user.id,
      name: [user.fullNameEn, user.fullNameAr].filter(Boolean).join(' / ') || user.email,
      fullNameEn: user.fullNameEn,
      fullNameAr: user.fullNameAr,
      email: user.email,
    }));

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    logError('Get subordinates error', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/lib/auth/jwt';
import { UserService } from '@/lib/db/user-service';
import { logError } from '@/lib/logger';

/**
 * GET /api/users/me/subordinates
 * Return the current user's subordinate hierarchy (direct + indirect)
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const userService = new UserService();
    const subordinates = await userService.getAllSubordinates(payload.userId);

    const results = subordinates.map((user) => {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
      return {
        id: user.id,
        name: fullName || user.email,
        email: user.email,
      };
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    logError('Get subordinates error', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/core/auth/jwt';
import { getUserModulePermissions } from '@/core/auth/permissions';

/**
 * GET /api/users/me/permissions
 * Returns the current user's permissions for the requested modules.
 * Accepts a comma-separated `modules` query parameter.
 */
export async function GET(request: NextRequest) {
  try {
    // Accept both Authorization header and auth-token cookie to stay compatible
    const headerToken = request.headers.get('authorization');
    const token =
      headerToken?.replace('Bearer ', '') ||
      request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const modulesParam = searchParams.get('modules') ?? '';
    const modules = modulesParam
      .split(',')
      .map(module => module.trim())
      .filter(Boolean);

    if (modules.length === 0) {
      return NextResponse.json({
        success: true,
        data: {},
        message: 'No modules requested',
      });
    }

    const permissions = await getUserModulePermissions(payload.userId, modules);

    return NextResponse.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error('Failed to fetch user permissions:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch permissions',
      },
      { status: 500 }
    );
  }
}

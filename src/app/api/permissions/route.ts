import { NextRequest, NextResponse } from 'next/server';
import { PermissionService } from '@/lib/db/user-service';
import { JWTService } from '@/lib/auth/jwt';
import { checkPermission } from '@/lib/auth/middleware';
import { logError } from '@/lib/logger';

const permissionService = new PermissionService();

/**
 * GET /api/permissions
 * Get all permissions
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = JWTService.verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    // Check permission
    const hasPermission = await checkPermission(userId, 'permissions', 'read');

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    const permissions = await permissionService.getAllPermissions();

    return NextResponse.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    logError('GET /api/permissions', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { RoleService } from '@/core/data/user-service';
import { JWTService } from '@/core/auth/jwt';
import { AdvancedPermissionService } from '@/core/auth/advanced-permission-service';
import { PermissionLevel } from '@/core/auth/permission-levels';
import { logError } from '@/core/logging/logger';

const roleService = new RoleService();

/**
 * GET /api/roles
 * Get all roles
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const token = request.cookies.get('auth-token')?.value;

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
  const hasPermission = await AdvancedPermissionService.hasMinimumLevel(userId, 'roles', PermissionLevel.READ);

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    let roles = await roleService.getAllRoles();
    // Normalize moduleLevels to object for all roles
    roles = roles.map((role) => {
      if (typeof role.moduleLevels === 'string') {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (role as any).moduleLevels = JSON.parse(role.moduleLevels);
        } catch {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (role as any).moduleLevels = {};
        }
      }
      return role;
    });

    return NextResponse.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    logError('Get roles error', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/roles
 * Create a new role
 */
export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const token = request.cookies.get('auth-token')?.value;

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
  const hasPermission = await AdvancedPermissionService.hasMinimumLevel(userId, 'roles', PermissionLevel.ADMIN);

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const role = await roleService.createRole({
      name,
      description: description || '',
      isSystemRole: false,
    });

    return NextResponse.json({
      success: true,
      data: role,
    });
  } catch (error) {
    logError('Create role error', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { RolePermissionService } from '@/core/data/user-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';

const rolePermissionService = new RolePermissionService();

/**
 * GET /api/roles/[id]/permissions
 * Get all permissions for a role
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
    const hasPermission = await checkPermission(userId, 'roles', 'read');

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    const rolePermissions = await rolePermissionService.getPermissionsByRole(id);

    return NextResponse.json({
      success: true,
      data: rolePermissions,
    });
  } catch (error) {
    logError('GET /api/roles/[id]/permissions', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/roles/[id]/permissions
 * Update permissions for a role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
    const hasPermission = await checkPermission(userId, 'roles', 'update');

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { permissionIds } = body;

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json(
        { success: false, error: 'Permission IDs must be an array' },
        { status: 400 }
      );
    }

    // Remove all existing permissions for this role
    const existingPerms = await rolePermissionService.getPermissionsByRole(id);
    for (const perm of existingPerms) {
      await rolePermissionService.removePermissionFromRole(id, perm.permissionId);
    }

    // Add new permissions
    for (const permissionId of permissionIds) {
      await rolePermissionService.assignPermissionToRole(id, permissionId);
    }

    return NextResponse.json({
      success: true,
      message: 'Permissions updated successfully',
    });
  } catch (error) {
    logError('PUT /api/roles/[id]/permissions', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

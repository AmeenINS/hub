import { NextRequest, NextResponse } from 'next/server';
import { UserRoleService } from '@/lib/db/user-service';
import { JWTService } from '@/lib/auth/jwt';
import { checkPermission } from '@/lib/auth/middleware';

const userRoleService = new UserRoleService();

/**
 * GET /api/users/[id]/roles
 * Get roles for a specific user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify JWT token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check permission
    const hasPermission = await checkPermission(payload.userId, 'users', 'read');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;
    
    // Get user roles
    const userRoles = await userRoleService.getUserRolesByUser(id);

    return NextResponse.json({ success: true, data: userRoles });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id]/roles
 * Update user role (replace existing role)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify JWT token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check permission
    const hasPermission = await checkPermission(payload.userId, 'users', 'update');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id: userId } = await params;
    const body = await request.json();
    const { roleId } = body;

    console.log('=== Update User Role ===');
    console.log('User ID:', userId);
    console.log('New Role ID:', roleId);
    console.log('Updated by:', payload.userId);

    if (!roleId) {
      return NextResponse.json(
        { success: false, error: 'Role ID is required' },
        { status: 400 }
      );
    }

    // Remove existing roles
    const existingRoles = await userRoleService.getUserRolesByUser(userId);
    console.log('Existing roles:', existingRoles);
    
    for (const role of existingRoles) {
      await userRoleService.removeRoleFromUser(userId, role.roleId);
      console.log('Removed role:', role.roleId);
    }

    // Assign new role
    await userRoleService.assignRoleToUser(userId, roleId, payload.userId);
    console.log('✅ Assigned new role:', roleId);

    // Verify the change
    const updatedRoles = await userRoleService.getUserRolesByUser(userId);
    console.log('Updated roles:', updatedRoles);
    console.log('========================');

    return NextResponse.json({
      success: true,
      message: 'User role updated successfully',
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

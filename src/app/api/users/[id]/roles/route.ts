import { NextRequest, NextResponse } from 'next/server';
import { UserRoleService } from '@/core/data/user-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';

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

    console.log('\n=== Update User Role ===');
    console.log('User ID:', userId);
    console.log('New Role ID:', roleId);
    console.log('Updated by:', payload.userId);
    console.log('Timestamp:', new Date().toISOString());

    if (!roleId) {
      return NextResponse.json(
        { success: false, error: 'Role ID is required' },
        { status: 400 }
      );
    }

    // Make sure LMDB is initialized
    const { lmdb } = await import('@/core/data/lmdb');
    await lmdb.initialize();
    console.log('LMDB initialized');

    // Remove existing roles
    const existingRoles = await userRoleService.getUserRolesByUser(userId);
    console.log('Existing roles count:', existingRoles.length);
    console.log('Existing roles:', JSON.stringify(existingRoles, null, 2));
    
    for (const role of existingRoles) {
      const removed = await userRoleService.removeRoleFromUser(userId, role.roleId);
      console.log(`Removed role ${role.roleId}:`, removed);
    }

    // Assign new role
    const assignedRole = await userRoleService.assignRoleToUser(userId, roleId, payload.userId);
    console.log('✅ Assigned new role:', JSON.stringify(assignedRole, null, 2));

    // Verify the change
    const updatedRoles = await userRoleService.getUserRolesByUser(userId);
    console.log('Updated roles count:', updatedRoles.length);
    console.log('Updated roles:', JSON.stringify(updatedRoles, null, 2));
    
    if (updatedRoles.length !== 1 || updatedRoles[0].roleId !== roleId) {
      console.error('❌ VERIFICATION FAILED!');
      console.error('Expected 1 role with roleId:', roleId);
      console.error('Got:', updatedRoles.length, 'roles');
      return NextResponse.json({
        success: false,
        error: 'Role assignment verification failed',
      }, { status: 500 });
    }
    
    console.log('✅ Verification passed');
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

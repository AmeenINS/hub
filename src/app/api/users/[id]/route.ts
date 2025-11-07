import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/core/data/user-service';
import { JWTService } from '@/core/auth/jwt';
import { getUserPermissionsContext } from '@/core/auth/permissions';
import { hasPermission } from '@/core/security/permission-utils';

const userService = new UserService();

/**
 * GET /api/users/[id]
 * Get user by ID
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

    const { id } = await params;
    const user = await userService.getUserById(id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[id]
 * Update user (partial update)
 */
export async function PATCH(
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

    const userId = payload.userId;
    const { id } = await params;
    const body = await request.json();

    const { permissionMap, isSuperAdmin } = await getUserPermissionsContext(userId);
    const canUpdateUsers = hasPermission(permissionMap, 'users', 'update');

    if (!canUpdateUsers && !isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get existing user
    const existingUser = await userService.getUserById(id);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get current user to check if they're a top-level admin
    const currentUser = await userService.getUserById(userId);
    const canManageAllUsers =
      isSuperAdmin || hasPermission(permissionMap, 'users', 'assign-role');
    
    // Check if user can manage this target user
    // Top-level admins (no managerId) can manage anyone
    // Other users can only manage themselves or their subordinates
    if (userId !== id && currentUser?.managerId && !canManageAllUsers) {
      const isSubordinate = await userService.isSubordinate(userId, id);
      if (!isSubordinate) {
        return NextResponse.json(
          { success: false, error: 'Forbidden - Can only manage your subordinates' },
          { status: 403 }
        );
      }
    }

    // Update user with partial data
    const updatedUser = await userService.updateUser(id, {
      ...body,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Delete user by ID
 */
export async function DELETE(
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

    const userId = payload.userId;
    const { id } = await params;

    const { permissionMap, isSuperAdmin } = await getUserPermissionsContext(userId);
    const canDeleteUsers = hasPermission(permissionMap, 'users', 'delete');

    if (!canDeleteUsers && !isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Check if user exists
    const existingUser = await userService.getUserById(id);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get current user to check if they're a top-level admin
    const currentUser = await userService.getUserById(userId);
    const canManageAllUsers =
      isSuperAdmin || hasPermission(permissionMap, 'users', 'assign-role');
    
    // Check if user can manage this target user
    // Top-level admins (no managerId) can manage anyone
    // Other users can only manage themselves or their subordinates
    if (userId !== id && currentUser?.managerId && !canManageAllUsers) {
      const isSubordinate = await userService.isSubordinate(userId, id);
      if (!isSubordinate) {
        return NextResponse.json(
          { success: false, error: 'Forbidden - Can only delete your subordinates' },
          { status: 403 }
        );
      }
    }

    // Delete user
    await userService.deleteUser(id);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

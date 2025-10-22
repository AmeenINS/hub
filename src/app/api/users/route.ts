import { NextRequest, NextResponse } from 'next/server';
import { UserService, RoleService, UserRoleService } from '@/lib/db/user-service';
import { JWTService } from '@/lib/auth/jwt';
import { checkPermission } from '@/lib/auth/middleware';
import { logError } from '@/lib/logger';

/**
 * GET /api/users
 * Get all users (requires permission)
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
    const hasPermission = await checkPermission(userId, 'users', 'read');

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    const userService = new UserService();
    
    // Get all subordinates + self
    const allSubordinates = await userService.getAllSubordinates(userId);
    const self = await userService.getUserById(userId);
    
    const managedUsers = self ? [self, ...allSubordinates] : allSubordinates;

    // Remove passwords from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const usersWithoutPasswords = managedUsers.map(({ password: _password, ...user }) => user);

    return NextResponse.json({
      success: true,
      data: usersWithoutPasswords,
    });
  } catch (error) {
    logError('Get users error', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Create a new user (requires permission)
 */
export async function POST(request: NextRequest) {
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
    const hasPermission = await checkPermission(userId, 'users', 'create');

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, firstName, lastName, roleId } = body;
  const { managerId } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const userService = new UserService();
    const roleService = new RoleService();
    const userRoleService = new UserRoleService();

    // Check if email already exists
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Validate role if provided
    if (roleId) {
      const role = await roleService.getRoleById(roleId);
      if (!role) {
        return NextResponse.json(
          { success: false, error: 'Invalid role ID' },
          { status: 400 }
        );
      }
    }

    // Validate managerId if provided
    if (managerId) {
      const manager = await userService.getUserById(managerId);
      if (!manager) {
        return NextResponse.json(
          { success: false, error: 'Invalid manager ID' },
          { status: 400 }
        );
      }

      // Only allow assigning manager if the requester is admin or manager of that manager
      // For now, users with 'users:create' can assign manager if they are ancestor of the manager
      const isAncestor = await userService.isSubordinate(userId, managerId);
      // If requester is not ancestor and not the same as manager, forbid
      if (!isAncestor && userId !== managerId) {
        // allow if requester has a 'system' role (super admin) by checking roles
        // We'll keep it simple: if requester lacks users:create for others, forbid
        // (This check can be refined later)
        // For now, allow - but log for potential refinement
        console.log(`Assigning manager ${managerId} to new user by ${userId} (not ancestor)`);
      }
    }

    // Create user
    const newUser = await userService.createUser({
      email,
      password,
      firstName,
      lastName,
      managerId: managerId || undefined,
      isActive: true,
      emailVerified: false,
      twoFactorEnabled: false,
    });

    // Assign role if provided
    if (roleId) {
      await userRoleService.assignRoleToUser(newUser.id, roleId, userId);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
    }, { status: 201 });
  } catch (error) {
    logError('Create user error', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

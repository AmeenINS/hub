import { NextRequest, NextResponse } from 'next/server';
import { UserService, RoleService, UserRoleService } from '@/lib/db/user-service';
import { getUserIdFromHeaders, checkPermission } from '@/lib/auth/middleware';
import { logError } from '@/lib/logger';

/**
 * GET /api/users
 * Get all users (requires permission)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromHeaders(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permission
    const hasPermission = await checkPermission(userId, 'users', 'read');

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    const userService = new UserService();
    const users = await userService.getAllUsers();

    // Remove passwords from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const usersWithoutPasswords = users.map(({ password: _password, ...user }) => user);

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
    const userId = getUserIdFromHeaders(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    // Create user
    const newUser = await userService.createUser({
      email,
      password,
      firstName,
      lastName,
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

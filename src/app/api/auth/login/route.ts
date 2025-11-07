import { NextRequest, NextResponse } from 'next/server';
import { UserService, UserRoleService, RoleService } from '@/core/data/user-service';
import { JWTService } from '@/core/auth/jwt';
import { AuditService } from '@/core/data/audit-service';
import { AuditAction } from '@/shared/types/database';
import { logSecurity, logError } from '@/core/logging/logger';

/**
 * POST /api/auth/login
 * User login endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const userService = new UserService();
    const userRoleService = new UserRoleService();
    const roleService = new RoleService();
    const auditService = new AuditService();

    // Verify credentials
    const user = await userService.verifyPassword(email, password);

    if (!user) {
      // Log failed login attempt
      logSecurity('Failed login attempt', undefined, { email });
      
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is disabled' },
        { status: 403 }
      );
    }

    // Resolve user roles
    const userRoles = await userRoleService.getUserRolesByUser(user.id);
    const roleNames = (
      await Promise.all(
        userRoles.map(async (userRole) => {
          const role = await roleService.getRoleById(userRole.roleId);
          return role?.name ?? null;
        })
      )
    ).filter((roleName): roleName is string => Boolean(roleName));

    // Generate JWT tokens (include roles)
    const token = JWTService.generateToken(user, roleNames);
    const refreshToken = JWTService.generateRefreshToken(user);

    // Update last login
    await userService.updateUser(user.id, {
      lastLoginAt: new Date().toISOString(),
    });

    // Log successful login
    await auditService.log({
      userId: user.id,
      action: AuditAction.LOGIN,
      resource: 'auth',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    logSecurity('Successful login', user.id, { email });

    // Return user data (without password) and tokens
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...userWithoutPassword,
          roles: roleNames,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    logError('Login error', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

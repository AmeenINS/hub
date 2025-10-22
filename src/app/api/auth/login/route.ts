import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/db/user-service';
import { JWTService } from '@/lib/auth/jwt';
import { AuditService } from '@/lib/db/audit-service';
import { AuditAction } from '@/types/database';
import { logSecurity, logError } from '@/lib/logger';

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

    // Generate JWT tokens
    const token = JWTService.generateToken(user);
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
        user: userWithoutPassword,
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

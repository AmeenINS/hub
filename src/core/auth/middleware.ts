import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/core/auth/jwt';
import { getUserPermissionsContext, hasPermission } from '@/core/auth/permissions-compat';

/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user info to request
 */
export async function authMiddleware(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - No token provided' },
      { status: 401 }
    );
  }

  const payload = JWTService.verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid token' },
      { status: 401 }
    );
  }

  // Attach user info to request headers for use in route handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-roles', JSON.stringify(payload.roles));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * Authorization Middleware
 * Check if user has required permissions
 */
export async function checkPermission(
  userId: string,
  requiredModule: string,
  requiredAction: string
): Promise<boolean> {
  try {
    const { permissionMap } = await getUserPermissionsContext(userId);

    console.log('=== Permission Check ===');
    console.log('User ID:', userId);
    console.log('Required:', `${requiredModule}:${requiredAction}`);
    console.log(
      'User Permissions:',
      Object.entries(permissionMap)
        .flatMap(([module, actions]) => actions.map((action) => `${module}:${action}`))
    );
    
    const allowed = hasPermission(permissionMap, requiredModule, requiredAction);

    console.log('Has Permission:', allowed);
    console.log('======================');

    return allowed;
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
}

/**
 * Role check middleware
 */
export function requireRole(roles: string[]) {
  return (userRoles: string[]): boolean => {
    return roles.some((role) => userRoles.includes(role));
  };
}

/**
 * Extract user ID from request headers
 */
export function getUserIdFromHeaders(request: NextRequest): string | null {
  return request.headers.get('x-user-id');
}

/**
 * Extract user roles from request headers
 */
export function getUserRolesFromHeaders(request: NextRequest): string[] {
  const rolesHeader = request.headers.get('x-user-roles');
  if (!rolesHeader) return [];
  
  try {
    return JSON.parse(rolesHeader);
  } catch {
    return [];
  }
}

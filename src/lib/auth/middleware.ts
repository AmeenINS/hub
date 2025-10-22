import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/lib/auth/jwt';
import { RolePermissionService } from '@/lib/db/user-service';

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
  const rolePermissionService = new RolePermissionService();
  
  try {
    const permissions = await rolePermissionService.getUserPermissions(userId);
    
    // Check if user has the required permission
    const hasPermission = permissions.some(
      (perm) =>
        perm.module === requiredModule &&
        perm.action === requiredAction
    );

    // Also check for admin permission (full access)
    const isAdmin = permissions.some(
      (perm) => perm.module === 'system' && perm.action === 'admin'
    );

    return hasPermission || isAdmin;
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

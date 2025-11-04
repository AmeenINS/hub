import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/lib/auth/jwt';
import { RolePermissionService } from '@/lib/db/user-service';

/**
 * Debug endpoint to see ALL user permissions
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const rolePermissionService = new RolePermissionService();
    const permissions = await rolePermissionService.getUserPermissions(payload.userId);
    
    // Check if user is admin
    const isAdmin = permissions.some(
      (perm) => perm.module === 'system' && perm.action === 'admin'
    );

    // Group permissions by module
    const groupedPermissions: Record<string, string[]> = {};
    permissions.forEach(perm => {
      if (!groupedPermissions[perm.module]) {
        groupedPermissions[perm.module] = [];
      }
      groupedPermissions[perm.module].push(perm.action);
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: payload.userId,
        isAdmin,
        totalPermissions: permissions.length,
        modules: Object.keys(groupedPermissions).length,
        permissions: groupedPermissions,
        rawPermissions: permissions.map(p => ({
          module: p.module,
          action: p.action,
          description: p.description
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching debug permissions:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

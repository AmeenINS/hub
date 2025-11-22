import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/core/auth/jwt';
import { getUserModulePermissions } from '@/core/auth/permissions';

/**
 * GET /api/users/me/all-permissions
 * Get all module permissions for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get all module permissions
    const modules = [
      'system',
      'dashboard',
      'crm',
      'crm_contacts',
      'crm_companies',
      'crm_leads',
      'crm_deals',
      'crm_activities',
      'crm_campaigns',
      'contacts',
      'companies',
      'deals',
      'activities',
      'campaigns',
      'policies',
      'claims',
      'accounting',
      'commission',
      'tasks',
      'scheduler',
      'workflows',
      'users',
      'roles',
      'reports',
      'inventory',
      'procurement',
      'notifications',
      'settings',
      'support',
      'permissions',
      'email',
    ];

    const permissions = await getUserModulePermissions(payload.userId, modules);

    return NextResponse.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error('Error fetching all permissions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

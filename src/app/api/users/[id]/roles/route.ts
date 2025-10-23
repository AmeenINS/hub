import { NextRequest, NextResponse } from 'next/server';
import { UserRoleService } from '@/lib/db/user-service';
import { JWTService } from '@/lib/auth/jwt';

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

    const { id } = await params;
    
    // Get user roles
    const userRoles = await userRoleService.getUserRolesByUser(id);

    return NextResponse.json(userRoles);
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

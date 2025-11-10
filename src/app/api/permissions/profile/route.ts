/**
 * API Route: Get User's Complete Permission Profile
 * GET /api/permissions/profile
 * Returns the user's complete permission profile with all module levels
 */

import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/core/auth/jwt';
import { AdvancedPermissionService } from '@/core/auth/advanced-permission-service';

export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = JWTService.verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user's complete permission profile
    const profile = await AdvancedPermissionService.getUserPermissionProfile(
      decoded.userId
    );

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Failed to get permission profile:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get permission profile',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

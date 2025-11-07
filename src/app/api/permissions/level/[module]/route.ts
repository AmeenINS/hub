/**
 * API Route: Get User's Permission Level for Module
 * GET /api/permissions/level/[module]
 * Returns the user's permission level for a specific module
 */

import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/core/auth/jwt';
import { AdvancedPermissionService } from '@/core/auth/advanced-permission-service';
import { PermissionLevelNames } from '@/core/auth/permission-levels';

export async function GET(
  request: NextRequest,
  { params }: { params: { module: string } }
) {
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

    // Get module from params
    const { module } = params;
    if (!module) {
      return NextResponse.json(
        { success: false, message: 'Module parameter is required' },
        { status: 400 }
      );
    }

    // Get user's permission level for this module
    const level = await AdvancedPermissionService.getUserModuleLevel(
      decoded.userId,
      module
    );

    return NextResponse.json({
      success: true,
      data: {
        level,
        module,
        levelName: PermissionLevelNames[level],
      },
    });
  } catch (error) {
    console.error('Failed to get permission level:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get permission level',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

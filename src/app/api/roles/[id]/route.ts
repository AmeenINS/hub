import { NextRequest, NextResponse } from 'next/server';
import { RoleService } from '@/core/data/user-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';

const roleService = new RoleService();

/**
 * GET /api/roles/[id]
 * Get a single role by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get token from Authorization header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = JWTService.verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    // Check permission
    const hasPermission = await checkPermission(userId, 'roles', 'read');

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get role
    const role = await roleService.getRoleById(id);

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: role,
    });
  } catch (error) {
    logError('GET /api/roles/[id]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/roles/[id]
 * Update a role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get token from Authorization header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = JWTService.verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    // Check permission
    const hasPermission = await checkPermission(userId, 'roles', 'update');

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description, moduleLevels } = body as {
      name?: string;
      description?: string;
      moduleLevels?: Record<string, number> | string;
    };

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Optional: validate moduleLevels if provided
    let validatedModuleLevels: Record<string, number> | undefined;
    if (moduleLevels) {
      try {
        const levelsObj = typeof moduleLevels === 'string' ? JSON.parse(moduleLevels) : moduleLevels;
        if (typeof levelsObj !== 'object' || Array.isArray(levelsObj)) {
          return NextResponse.json(
            { success: false, error: 'moduleLevels must be an object' },
            { status: 400 }
          );
        }
        // Ensure all values are valid numbers within expected range 0..5
        const entries = Object.entries(levelsObj);
        const normalized: Record<string, number> = {};
        for (const [key, value] of entries) {
          const raw = value as unknown;
          let num: number;
          if (typeof raw === 'string') {
            num = parseInt(raw, 10);
          } else if (typeof raw === 'number') {
            num = raw;
          } else {
            return NextResponse.json(
              { success: false, error: `Invalid level type for module '${key}'` },
              { status: 400 }
            );
          }

          if (!Number.isFinite(num) || num < 0 || num > 5) {
            return NextResponse.json(
              { success: false, error: `Invalid level for module '${key}'` },
              { status: 400 }
            );
          }
          normalized[key] = num;
        }
        validatedModuleLevels = normalized;
      } catch (e) {
        return NextResponse.json(
          { success: false, error: 'Invalid moduleLevels format' },
          { status: 400 }
        );
      }
    }

    // Update role
    const updatedRole = await roleService.updateRole(id, {
      name,
      description,
      ...(validatedModuleLevels ? { moduleLevels: validatedModuleLevels } : {}),
    });

    if (!updatedRole) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedRole,
    });
  } catch (error) {
    logError('PUT /api/roles/[id]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/roles/[id]
 * Delete a role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get token from Authorization header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = JWTService.verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    // Check permission
    const hasPermission = await checkPermission(userId, 'roles', 'delete');

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // Delete role
    const deleted = await roleService.deleteRole(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    logError('DELETE /api/roles/[id]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

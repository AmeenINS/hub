import { NextRequest, NextResponse } from 'next/server';
import { PositionService } from '@/lib/db/user-service';
import { JWTService } from '@/lib/auth/jwt';
import { checkPermission } from '@/lib/auth/middleware';

const positionService = new PositionService();

export async function GET(request: NextRequest) {
  try {
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

    // Check permission (positions module)
    const hasPermission = await checkPermission(payload.userId, 'positions', 'read');

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    const positions = await positionService.getAllPositions();
    // Sort by level
    const sorted = positions.sort((a, b) => a.level - b.level);
    return NextResponse.json({ success: true, data: sorted });
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Check permission
    const hasPermission = await checkPermission(payload.userId, 'positions', 'create');

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, nameAr, description, level, isActive } = body;

    if (!name || !nameAr || level === undefined) {
      return NextResponse.json(
        { success: false, error: 'English and Arabic names with level are required' },
        { status: 400 }
      );
    }

    const position = await positionService.createPosition({
      name,
      nameAr,
      description: description || '',
      level: parseInt(level),
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json({ success: true, data: position }, { status: 201 });
  } catch (error) {
    console.error('Error creating position:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create position' },
      { status: 500 }
    );
  }
}

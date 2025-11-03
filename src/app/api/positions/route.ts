import { NextRequest, NextResponse } from 'next/server';
import { PositionService } from '@/lib/db/user-service';

const positionService = new PositionService();

export async function GET() {
  try {
    const positions = await positionService.getAllPositions();
    // Sort by level
    const sorted = positions.sort((a, b) => a.level - b.level);
    return NextResponse.json(sorted);
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, nameAr, description, level, isActive } = body;

    if (!name || !nameAr || level === undefined) {
      return NextResponse.json(
        { error: 'English and Arabic names with level are required' },
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

    return NextResponse.json(position, { status: 201 });
  } catch (error) {
    console.error('Error creating position:', error);
    return NextResponse.json(
      { error: 'Failed to create position' },
      { status: 500 }
    );
  }
}

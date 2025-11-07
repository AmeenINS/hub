import { NextRequest, NextResponse } from 'next/server';
import { PositionService } from '@/core/data/user-service';

const positionService = new PositionService();

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json();
    const { name, nameAr, description, level, isActive } = body;

    const existing = await positionService.getPositionById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }

    const updated = await positionService.updatePosition(id, {
      name: name || existing.name,
      nameAr: nameAr || existing.nameAr,
      description: description !== undefined ? description : existing.description,
      level: level !== undefined ? parseInt(level) : existing.level,
      isActive: isActive !== undefined ? isActive : existing.isActive,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating position:', error);
    return NextResponse.json(
      { error: 'Failed to update position' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    const existing = await positionService.getPositionById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }

    await positionService.deletePosition(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting position:', error);
    return NextResponse.json(
      { error: 'Failed to delete position' },
      { status: 500 }
    );
  }
}

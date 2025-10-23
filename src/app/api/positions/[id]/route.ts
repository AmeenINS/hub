import { NextRequest, NextResponse } from 'next/server';
import { open } from 'lmdb';
import { Position } from '@/types/database';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'lmdb');
const db = open({ path: dbPath });

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, description, level } = body;

    const existing = await db.get(`position:${id}`);
    if (!existing) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }

    const updated: Position = {
      ...existing,
      name: name || existing.name,
      description: description !== undefined ? description : existing.description,
      level: level !== undefined ? parseInt(level) : existing.level,
      updatedAt: new Date().toISOString(),
    };

    await db.put(`position:${id}`, updated);

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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existing = await db.get(`position:${id}`);
    if (!existing) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }

    await db.remove(`position:${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting position:', error);
    return NextResponse.json(
      { error: 'Failed to delete position' },
      { status: 500 }
    );
  }
}

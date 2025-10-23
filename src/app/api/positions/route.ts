import { NextRequest, NextResponse } from 'next/server';
import { open } from 'lmdb';
import { Position } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'lmdb');
const db = open({ path: dbPath });

export async function GET() {
  try {
    const positions: Position[] = [];
    const range = db.getRange({ start: 'position:' });

    for (const { key, value } of range) {
      if (typeof key === 'string' && key.startsWith('position:')) {
        positions.push(value as Position);
      }
    }

    return NextResponse.json(positions);
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
    const { name, description, level } = body;

    if (!name || !level) {
      return NextResponse.json(
        { error: 'Name and level are required' },
        { status: 400 }
      );
    }

    const position: Position = {
      id: uuidv4(),
      name,
      description: description || '',
      level: parseInt(level),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.put(`position:${position.id}`, position);

    return NextResponse.json(position, { status: 201 });
  } catch (error) {
    console.error('Error creating position:', error);
    return NextResponse.json(
      { error: 'Failed to create position' },
      { status: 500 }
    );
  }
}

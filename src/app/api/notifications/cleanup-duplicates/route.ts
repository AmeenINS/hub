import { NextRequest, NextResponse } from 'next/server';
import { lmdb } from '@/core/data/lmdb';
import { JWTService } from '@/core/auth/jwt';
import { UserService } from '@/core/data/user-service';
import { User } from '@/shared/types/database';

// Helper function to verify token and get user
async function verifyToken(token: string): Promise<User | null> {
  const payload = JWTService.verifyToken(token);
  if (!payload) return null;
  
  const userService = new UserService();
  return await userService.getUserById(payload.userId);
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!title) {
      return NextResponse.json({ error: 'Title parameter is required' }, { status: 400 });
    }

    // Get all notifications for user with matching title
    const notifications = await lmdb.query<Record<string, unknown>>('notifications', 
      (notif: Record<string, unknown>) => notif.userId === user.id && notif.title === title
    );

    if (notifications.length === 0) {
      return NextResponse.json({ message: 'No duplicate notifications found' });
    }

    // Keep only the most recent notification, delete the rest
    const sortedNotifications = notifications.sort((a, b) => 
      new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime()
    );

    const duplicates = sortedNotifications.slice(1); // All except the first (most recent)
    
    for (const duplicate of duplicates) {
      await lmdb.delete('notifications', String(duplicate.id));
    }

    return NextResponse.json({
      success: true,
      message: `Removed ${duplicates.length} duplicate notifications`,
      duplicatesRemoved: duplicates.length
    });
  } catch (error) {
    console.error('Error removing duplicate notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
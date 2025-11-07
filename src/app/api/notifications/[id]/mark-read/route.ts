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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch the notification
    const notification = await lmdb.getById<Record<string, unknown>>('notifications', id);
    
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Check if user owns this notification
    if (notification.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Mark as read
    await lmdb.update('notifications', id, {
      ...notification,
      isRead: true,
      readAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true,
      message: 'Notification marked as read' 
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
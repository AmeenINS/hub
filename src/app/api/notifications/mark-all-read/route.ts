import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/db/notification-service';
import { JWTService } from '@/lib/auth/jwt';
import { SSEBroadcast } from '@/lib/sse-broadcast';

async function handleMarkAllAsRead(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const notificationService = new NotificationService();
    await notificationService.markAllAsRead(payload.userId);

    // Broadcast update to SSE connections
    await SSEBroadcast.broadcastToUser(payload.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return handleMarkAllAsRead(request);
}

export async function PATCH(request: NextRequest) {
  return handleMarkAllAsRead(request);
}

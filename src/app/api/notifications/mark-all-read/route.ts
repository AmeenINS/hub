import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/core/data/notification-service';
import { JWTService } from '@/core/auth/jwt';
import { SSEBroadcast } from '@/core/sse/broadcast';

async function handleMarkAllAsRead(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const notificationService = new NotificationService();
    await notificationService.markAllAsRead(payload.userId);

    // Broadcast update to SSE connections
    await SSEBroadcast.broadcastToUser(payload.userId);

    return NextResponse.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json({ success: false, message: 'Failed to update notifications' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return handleMarkAllAsRead(request);
}

export async function PATCH(request: NextRequest) {
  return handleMarkAllAsRead(request);
}

import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/db/notification-service';
import { JWTService } from '@/lib/auth/jwt';
import { SSEBroadcast } from '@/lib/sse-broadcast';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;
    const notificationService = new NotificationService();
    await notificationService.markAsRead(id);

    // Broadcast update to SSE connections
    await SSEBroadcast.broadcastToUser(payload.userId);

    return NextResponse.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ success: false, message: 'Failed to update notification' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;
    const notificationService = new NotificationService();
    await notificationService.deleteNotification(id);

    // Broadcast update to SSE connections
    await SSEBroadcast.broadcastToUser(payload.userId);

    return NextResponse.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete notification' }, { status: 500 });
  }
}

import { NextRequest } from 'next/server';
import { JWTService } from '@/core/auth/jwt';
import { lmdb } from '@/core/data/lmdb';
import { SSEBroadcast } from '@/core/sse/broadcast';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * Test endpoint to create a test notification
 * Only available in development mode
 */
export async function POST(request: NextRequest) {
  // Only in development mode
  if (process.env.NODE_ENV !== 'development') {
    return Response.json({ error: 'Only available in development' }, { status: 403 });
  }

  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { title, message, type = 'info' } = await request.json();

    // Create test notification
    const notificationId = `test-${Date.now()}`;
    const notification: Notification = {
      id: notificationId,
      userId: payload.userId,
      title: title || 'Test Notification',
      message: message || 'This is a test notification',
      type,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    await lmdb.create('notifications', notificationId, notification);

    // Broadcast immediately to user
    await SSEBroadcast.broadcastToUser(payload.userId);

    console.log('✅ Test notification created and broadcasted:', notification);

    return Response.json({
      success: true,
      notification,
      sseConnections: SSEBroadcast.getConnectionCount(payload.userId),
      message: 'Notification created and broadcasted successfully'
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Health check and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Overall statistics
    const allNotifications = await lmdb.query('notifications', () => true) as Notification[];
    const userNotifications = allNotifications.filter(
      (n) => n.userId === payload.userId
    );
    const unreadCount = userNotifications.filter((n) => !n.isRead).length;

    return Response.json({
      stats: {
        totalNotifications: allNotifications.length,
        userNotifications: userNotifications.length,
        unreadCount,
        sseConnections: SSEBroadcast.getConnectionCount(payload.userId),
        totalSseConnections: SSEBroadcast.getConnectionCount()
      },
      recentNotifications: userNotifications.slice(-5).reverse()
    });
  } catch (error) {
    console.error('Error getting test stats:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

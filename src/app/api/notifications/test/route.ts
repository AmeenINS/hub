import { NextRequest } from 'next/server';
import { JWTService } from '@/lib/auth/jwt';
import { lmdb } from '@/lib/db/lmdb';
import { SSEBroadcast } from '@/lib/sse-broadcast';

/**
 * Test endpoint برای ایجاد notification تستی
 * فقط در development mode کار می‌کند
 */
export async function POST(request: NextRequest) {
  // فقط در development
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

    // ایجاد notification تستی
    const notification = {
      id: `test-${Date.now()}`,
      userId: payload.userId,
      title: title || 'Test Notification',
      message: message || 'این یک notification تستی است',
      type,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    await lmdb.insert('notifications', notification);

    // Broadcast فوری به کاربر
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
 * Health check و statistics
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

    // آمار کلی
    const allNotifications = await lmdb.query('notifications', () => true);
    const userNotifications = allNotifications.filter(
      (n: any) => n.userId === payload.userId
    );
    const unreadCount = userNotifications.filter((n: any) => !n.isRead).length;

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

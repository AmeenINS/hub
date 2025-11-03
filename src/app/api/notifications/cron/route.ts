import { NextRequest } from 'next/server';
import { SSEBroadcast } from '@/lib/sse-broadcast';
import { lmdb } from '@/lib/db/lmdb';

// Secret key for cron job authentication (should be in env variable)
const CRON_SECRET = process.env.CRON_SECRET || 'change-me-in-production';

/**
 * Cron job endpoint to check and broadcast notification updates
 * This should be called periodically by an external cron service or internal scheduler
 * 
 * Usage:
 * curl -X POST http://localhost:3000/api/notifications/cron \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token !== CRON_SECRET) {
      console.error('Unauthorized cron job attempt');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('Starting notification cron job...');

    // Get all users who have unread notifications
    const allNotifications = await lmdb.query('notifications', () => true);
    
    // Group notifications by userId
    const userNotifications = new Map<string, number>();
    
    for (const notif of allNotifications) {
      const notification = notif as { userId: string; isRead: boolean };
      if (!notification.isRead) {
        const count = userNotifications.get(notification.userId) || 0;
        userNotifications.set(notification.userId, count + 1);
      }
    }

    console.log(`Found ${userNotifications.size} users with unread notifications`);

    // Broadcast to all users with unread notifications
    let broadcastCount = 0;
    for (const [userId, unreadCount] of userNotifications.entries()) {
      const connectionCount = SSEBroadcast.getConnectionCount(userId);
      if (connectionCount > 0) {
        await SSEBroadcast.broadcastToUser(userId);
        broadcastCount++;
        console.log(`Broadcast to user ${userId}: ${unreadCount} unread notifications`);
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        totalUsersWithUnread: userNotifications.size,
        broadcastCount,
        totalConnections: SSEBroadcast.getConnectionCount()
      }
    };

    console.log('Notification cron job completed:', result);

    return Response.json(result);
  } catch (error) {
    console.error('Error in notification cron job:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return Response.json({
    status: 'ok',
    endpoint: 'notification-cron',
    totalConnections: SSEBroadcast.getConnectionCount(),
    timestamp: new Date().toISOString()
  });
}

// SSE broadcast utility for real-time notifications
import { lmdb } from '@/lib/db/lmdb';

interface NotificationUpdate {
  type: 'notification_update';
  userId: string;
  unreadCount: number;
  timestamp: string;
}

// Store active SSE connections
const sseConnections = new Map<string, Set<ReadableStreamDefaultController>>();

export class SSEBroadcast {
  static addConnection(userId: string, controller: ReadableStreamDefaultController) {
    if (!sseConnections.has(userId)) {
      sseConnections.set(userId, new Set());
    }
    sseConnections.get(userId)!.add(controller);
    
    console.log(`SSE connection added for user ${userId}. Total connections: ${sseConnections.get(userId)!.size}`);
  }

  static removeConnection(userId: string, controller: ReadableStreamDefaultController) {
    if (sseConnections.has(userId)) {
      const userConnections = sseConnections.get(userId)!;
      userConnections.delete(controller);
      
      if (userConnections.size === 0) {
        sseConnections.delete(userId);
      }
      
      console.log(`SSE connection removed for user ${userId}. Total connections: ${userConnections.size}`);
    }
  }

  static async broadcastToUser(userId: string) {
    if (!sseConnections.has(userId)) {
      console.log(`No SSE connections for user ${userId}`);
      return;
    }

    try {
      // Get unread notifications count
      const notifications = await lmdb.query('notifications',
        (notif: unknown) => {
          const notification = notif as { userId: string; isRead: boolean };
          return notification.userId === userId && !notification.isRead;
        }
      );
      
      const unreadCount = notifications.length;
      
      const update: NotificationUpdate = {
        type: 'notification_update',
        userId,
        unreadCount,
        timestamp: new Date().toISOString()
      };

      const data = JSON.stringify(update);
      const message = `data: ${data}\n\n`;
      const encodedMessage = new TextEncoder().encode(message);

      const userConnections = sseConnections.get(userId)!;
      const activeConnections = new Set<ReadableStreamDefaultController>();

      // Send to all connections for this user
      for (const controller of userConnections) {
        try {
          controller.enqueue(encodedMessage);
          activeConnections.add(controller);
        } catch (error) {
          console.error('Error sending SSE message:', error);
          // Remove dead connection
          userConnections.delete(controller);
        }
      }

      console.log(`Broadcast sent to user ${userId}. Unread count: ${unreadCount}. Active connections: ${activeConnections.size}`);
      
      // Update the set with only active connections
      sseConnections.set(userId, activeConnections);
      
    } catch (error) {
      console.error('Error in SSE broadcast:', error);
    }
  }

  static async broadcastToAll() {
    for (const userId of sseConnections.keys()) {
      await this.broadcastToUser(userId);
    }
  }

  static getConnectionCount(userId?: string): number {
    if (userId) {
      return sseConnections.get(userId)?.size || 0;
    }
    
    let total = 0;
    for (const connections of sseConnections.values()) {
      total += connections.size;
    }
    return total;
  }
}
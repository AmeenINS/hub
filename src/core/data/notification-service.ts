import { lmdb } from './lmdb';
import { Notification, NotificationType } from '@/shared/types/database';
import { nanoid } from 'nanoid';

/**
 * Notification Service
 * Handles in-app notifications
 */
export class NotificationService {
  private readonly dbName = 'notifications';

  /**
   * Create a new notification
   */
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }): Promise<Notification> {
    const id = nanoid();
    
    const notification: Notification = {
      id,
      ...data,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    await lmdb.create(this.dbName, id, notification);
    return notification;
  }

  /**
   * Get notifications by user ID
   */
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    const notifications = await lmdb.query<Notification>(
      this.dbName,
      (notif) => notif.userId === userId
    );
    
    return notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Get unread notifications by user ID
   */
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    const notifications = await lmdb.query<Notification>(
      this.dbName,
      (notif) => notif.userId === userId && !notif.isRead
    );
    
    return notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<Notification | null> {
    return lmdb.update<Notification>(this.dbName, id, {
      isRead: true,
      readAt: new Date().toISOString(),
    });
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const unreadNotifications = await this.getUnreadNotifications(userId);
    
    const operations = unreadNotifications.map((notif) => ({
      dbName: this.dbName,
      operation: 'put' as const,
      id: notif.id,
      data: {
        ...notif,
        isRead: true,
        readAt: new Date().toISOString(),
      },
    }));

    if (operations.length > 0) {
      await lmdb.batch(operations);
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(id: string): Promise<boolean> {
    return lmdb.delete(this.dbName, id);
  }

  /**
   * Delete all notifications for user
   */
  async deleteAllForUser(userId: string): Promise<void> {
    const notifications = await this.getNotificationsByUser(userId);
    
    const operations = notifications.map((notif) => ({
      dbName: this.dbName,
      operation: 'delete' as const,
      id: notif.id,
    }));

    if (operations.length > 0) {
      await lmdb.batch(operations);
    }
  }

  /**
   * Get notification count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const unread = await this.getUnreadNotifications(userId);
    return unread.length;
  }
}

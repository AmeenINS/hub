import * as cron from 'node-cron';
import { lmdb } from '@/core/data/lmdb';
import {
  ScheduledEvent,
  SchedulerStatus,
  RecurrenceType,
  NotificationMethod,
  ScheduledNotification,
  NotificationType,
  Notification
} from '@/shared/types/database';
import { SSEBroadcast } from '@/core/sse/broadcast';/**
 * Professional Scheduler Service with Cron Jobs
 * 
 * Features:
 * - Automatic notification processing every minute
 * - Event status management (active, completed, cancelled)
 * - Recurring event handling
 * - SSE real-time broadcasting
 * - Graceful error handling and logging
 * - Singleton pattern for global access
 */
class SchedulerService {
  private static instance: SchedulerService | null = null;
  private notificationTask: cron.ScheduledTask | null = null;
  private eventCleanupTask: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance of SchedulerService
   */
  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  /**
   * Start all scheduler cron jobs
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Scheduler service is already running');
      return;
    }

    try {
      console.log('🚀 Starting Scheduler Service...');

      // Cron job for notification processing - runs every minute
      this.notificationTask = cron.schedule('* * * * *', async () => {
        await this.processNotifications();
      }, {
        timezone: 'Asia/Muscat' // Set appropriate timezone for Oman
      });

      // Cron job for event cleanup - runs every hour
      this.eventCleanupTask = cron.schedule('0 * * * *', async () => {
        await this.cleanupCompletedEvents();
      }, {
        timezone: 'Asia/Muscat'
      });

      this.isRunning = true;

      // Run initial notification check immediately
      await this.processNotifications();

      console.log('✅ Scheduler Service started successfully');
      console.log('📅 Notification processor: Every minute');
      console.log('🧹 Event cleanup: Every hour');

    } catch (error) {
      console.error('❌ Failed to start Scheduler Service:', error);
      throw error;
    }
  }

  /**
   * Stop all scheduler cron jobs
   */
  public stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Scheduler service is not running');
      return;
    }

    try {
      if (this.notificationTask) {
        this.notificationTask.stop();
        this.notificationTask = null;
      }

      if (this.eventCleanupTask) {
        this.eventCleanupTask.stop();
        this.eventCleanupTask = null;
      }

      this.isRunning = false;
      console.log('🛑 Scheduler Service stopped');

    } catch (error) {
      console.error('❌ Error stopping Scheduler Service:', error);
      throw error;
    }
  }

  /**
   * Check if service is running
   */
  public getStatus(): { running: boolean; tasksActive: number } {
    const tasksActive = [this.notificationTask, this.eventCleanupTask]
      .filter(task => task !== null).length;

    return {
      running: this.isRunning,
      tasksActive
    };
  }

  /**
   * Process due notifications for scheduled events
   */
  private async processNotifications(): Promise<void> {
    try {
      const now = new Date();
      
      // Get all active scheduled events
      const activeEvents = await lmdb.query<ScheduledEvent>('scheduledEvents', 
        (event) => event.status === SchedulerStatus.ACTIVE
      );

      let processedCount = 0;
      let completedCount = 0;

      for (const event of activeEvents) {
        const eventDateTime = new Date(`${event.scheduledDate}T${event.scheduledTime}`);
        const notifyDateTime = new Date(eventDateTime.getTime() - (event.notifyBefore || 0) * 60000);
        
        // Check if notification time has arrived and event hasn't been notified yet
        if (now >= notifyDateTime && !event.lastNotifiedAt) {
          console.log(`📅 Processing notifications for event: ${event.title}`);
          
          // Create and send notifications for each method
          for (const method of event.notificationMethods) {
            await this.createAndSendNotification(event, method);
          }

          // Update event's lastNotifiedAt
          await lmdb.update<ScheduledEvent>('scheduledEvents', event.id, {
            lastNotifiedAt: now.toISOString()
          });
          
          processedCount++;
        }

        // Check if event is complete (past due date)
        if (now > eventDateTime && event.status === SchedulerStatus.ACTIVE) {
          console.log(`✅ Marking event as completed: ${event.title}`);
          
          await lmdb.update<ScheduledEvent>('scheduledEvents', event.id, {
            status: SchedulerStatus.COMPLETED,
            completedAt: now.toISOString()
          });

          // Handle recurring events
          if (event.isRecurring && event.recurrenceType) {
            await this.createNextRecurrenceEvent(event);
          }

          completedCount++;
        }
      }

      if (processedCount > 0 || completedCount > 0) {
        console.log(`🎯 Scheduler check: ${processedCount} notifications sent, ${completedCount} events completed`);
      }

    } catch (error) {
      console.error('❌ Error processing notifications:', error);
    }
  }

  /**
   * Create and send notification for an event
   */
  private async createAndSendNotification(
    event: ScheduledEvent, 
    method: NotificationMethod
  ): Promise<void> {
    try {
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const scheduledNotification: ScheduledNotification = {
        id: notificationId,
        scheduledEventId: event.id,
        userId: event.assignedTo || event.createdBy,
        method,
        title: `Scheduler Event: ${event.title}`,
        message: this.generateNotificationMessage(event),
        scheduledFor: now,
        isSent: false,
        isDelivered: false,
        retryCount: 0,
        maxRetries: 3,
        createdAt: now,
      };

      // Save scheduled notification
      await lmdb.create<ScheduledNotification>('scheduledNotifications', notificationId, scheduledNotification);

      // Send notification based on method
      if (method === NotificationMethod.IN_APP) {
        await this.sendInAppNotification(event, scheduledNotification);
      }
      // TODO: Implement EMAIL and SMS methods
      
      // Mark as sent
      await lmdb.update<ScheduledNotification>('scheduledNotifications', notificationId, {
        isSent: true,
        sentAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error creating notification:', error);
    }
  }

  /**
   * Send in-app notification
   */
  private async sendInAppNotification(
    event: ScheduledEvent, 
    scheduledNotification: ScheduledNotification
  ): Promise<void> {
    try {
      const userId = event.assignedTo || event.createdBy;
      const notificationId = `app_notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const notification: Notification = {
        id: notificationId,
        userId,
        type: NotificationType.SCHEDULED_EVENT,
        title: scheduledNotification.title,
        message: scheduledNotification.message,
        link: `/dashboard/scheduler?event=${event.id}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      // Save notification to database
      await lmdb.create<Notification>('notifications', notificationId, notification);

      // Broadcast notification via SSE to user
      SSEBroadcast.broadcastToUser(userId);

      // Mark scheduled notification as delivered
      await lmdb.update<ScheduledNotification>('scheduledNotifications', scheduledNotification.id, {
        isDelivered: true,
        deliveredAt: new Date().toISOString()
      });

      console.log(`📲 In-app notification sent to user ${userId} for event: ${event.title}`);

    } catch (error) {
      console.error('❌ Error sending in-app notification:', error);
    }
  }

  /**
   * Generate notification message for an event
   */
  private generateNotificationMessage(event: ScheduledEvent): string {
    const eventDate = new Date(`${event.scheduledDate}T${event.scheduledTime}`);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = eventDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    let message = `Event scheduled for ${formattedDate} at ${formattedTime}.`;
    
    if (event.description) {
      message += `\n\n${event.description}`;
    }

    return message;
  }

  /**
   * Create next occurrence of a recurring event
   */
  private async createNextRecurrenceEvent(event: ScheduledEvent): Promise<void> {
    try {
      const currentDate = new Date(event.scheduledDate);
      let nextDate: Date;

      switch (event.recurrenceType) {
        case RecurrenceType.DAILY:
          nextDate = new Date(currentDate.setDate(currentDate.getDate() + (event.recurrenceInterval || 1)));
          break;
        case RecurrenceType.WEEKLY:
          nextDate = new Date(currentDate.setDate(currentDate.getDate() + 7 * (event.recurrenceInterval || 1)));
          break;
        case RecurrenceType.MONTHLY:
          nextDate = new Date(currentDate.setMonth(currentDate.getMonth() + (event.recurrenceInterval || 1)));
          break;
        case RecurrenceType.YEARLY:
          nextDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + (event.recurrenceInterval || 1)));
          break;
        default:
          console.log(`⚠️ Unknown recurrence type: ${event.recurrenceType}`);
          return;
      }

      // Check if next occurrence is within recurrence end date
      if (event.recurrenceEnd && nextDate > new Date(event.recurrenceEnd)) {
        console.log(`⏰ Recurrence ended for event: ${event.title}`);
        return;
      }

      // Create next occurrence
      const nextEventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const nextEvent: ScheduledEvent = {
        ...event,
        id: nextEventId,
        scheduledDate: nextDate.toISOString().split('T')[0],
        status: SchedulerStatus.ACTIVE,
        lastNotifiedAt: undefined,
        completedAt: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await lmdb.create<ScheduledEvent>('scheduledEvents', nextEventId, nextEvent);
      console.log(`🔄 Created next recurrence event: ${nextEvent.title} for ${nextEvent.scheduledDate}`);

    } catch (error) {
      console.error('❌ Error creating next recurrence event:', error);
    }
  }

  /**
   * Cleanup old completed events (older than 30 days)
   */
  private async cleanupCompletedEvents(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const completedEvents = await lmdb.query<ScheduledEvent>('scheduledEvents',
        (event) => {
          if (event.status === SchedulerStatus.COMPLETED && event.completedAt) {
            return new Date(event.completedAt) < thirtyDaysAgo;
          }
          return false;
        }
      );

      for (const event of completedEvents) {
        await lmdb.delete('scheduledEvents', event.id);
      }

      if (completedEvents.length > 0) {
        console.log(`🧹 Cleaned up ${completedEvents.length} old completed events`);
      }

    } catch (error) {
      console.error('❌ Error cleaning up events:', error);
    }
  }

  /**
   * Add a new scheduled event (can be called from anywhere)
   */
  public async addEvent(event: Omit<ScheduledEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduledEvent> {
    try {
      const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const newEvent: ScheduledEvent = {
        ...event,
        id: eventId,
        createdAt: now,
        updatedAt: now,
      };

      await lmdb.create<ScheduledEvent>('scheduledEvents', eventId, newEvent);
      console.log(`✅ New event scheduled: ${newEvent.title} for ${newEvent.scheduledDate}`);

      return newEvent;

    } catch (error) {
      console.error('❌ Error adding event:', error);
      throw error;
    }
  }

  /**
   * Update an existing event
   */
  public async updateEvent(eventId: string, updates: Partial<ScheduledEvent>): Promise<void> {
    try {
      await lmdb.update<ScheduledEvent>('scheduledEvents', eventId, {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      console.log(`✅ Event updated: ${eventId}`);

    } catch (error) {
      console.error('❌ Error updating event:', error);
      throw error;
    }
  }

  /**
   * Delete an event
   */
  public async deleteEvent(eventId: string): Promise<void> {
    try {
      await lmdb.delete('scheduledEvents', eventId);
      console.log(`✅ Event deleted: ${eventId}`);

    } catch (error) {
      console.error('❌ Error deleting event:', error);
      throw error;
    }
  }

  /**
   * Get event by ID
   */
  public async getEvent(eventId: string): Promise<ScheduledEvent | null> {
    try {
      return await lmdb.getById<ScheduledEvent>('scheduledEvents', eventId);
    } catch (error) {
      console.error('❌ Error getting event:', error);
      return null;
    }
  }

  /**
   * Get all events for a user
   */
  public async getUserEvents(userId: string): Promise<ScheduledEvent[]> {
    try {
      return await lmdb.query<ScheduledEvent>('scheduledEvents',
        (event) => event.createdBy === userId || event.assignedTo === userId
      );
    } catch (error) {
      console.error('❌ Error getting user events:', error);
      return [];
    }
  }
}

// Export singleton instance
export const schedulerService = SchedulerService.getInstance();

// Export class for typing
export default SchedulerService;

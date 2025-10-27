import { lmdb } from '../db/lmdb';
import { 
  ScheduledEvent, 
  ScheduledNotification, 
  NotificationMethod,
  SchedulerStatus,
  NotificationType,
  Notification 
} from '../../types/database';

// Notification Checker Service - for running in background
class NotificationChecker {
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly INTERVAL_MS = 60000; // check every minute

  async start() {
    console.log('🔔 Starting Scheduler Notification Checker...');
    
    // immediate execution
    await this.checkAndProcessNotifications();
    
    // setup timer for periodic execution
    this.checkInterval = setInterval(async () => {
      await this.checkAndProcessNotifications();
    }, this.INTERVAL_MS);
    
    console.log(`✅ Notification checker started with ${this.INTERVAL_MS/1000}s interval`);
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🔔 Notification checker stopped');
    }
  }

  private async checkAndProcessNotifications(): Promise<void> {
    try {
      const now = new Date();
      
      console.log(`🔍 Checking for due notifications at ${now.toISOString()}`);
      
      // Get all active scheduled events using LMDB
      const activeEvents = await lmdb.query<ScheduledEvent>('scheduledEvents', 
        (event) => event.status === SchedulerStatus.ACTIVE
      );

      let processedCount = 0;

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
        }
      }

      if (processedCount > 0) {
        console.log(`🎯 Processed ${processedCount} notifications`);
      }

    } catch (error) {
      console.error('❌ Error checking notifications:', error);
    }
  }

  private async createAndSendNotification(
    event: ScheduledEvent, 
    method: NotificationMethod
  ): Promise<void> {
    try {
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const notification: ScheduledNotification = {
        id: notificationId,
        scheduledEventId: event.id,
        userId: event.assignedTo || event.createdBy,
        method,
        title: `📅 ${event.title}`,
        message: this.generateNotificationMessage(event),
        scheduledFor: now,
        isSent: false,
        isDelivered: false,
        retryCount: 0,
        maxRetries: 3,
        createdAt: now,
      };

      // Save scheduled notification using LMDB
      await lmdb.create<ScheduledNotification>('scheduledNotifications', notificationId, notification);

      // Send notification based on method
      await this.sendNotification(event, notification);

    } catch (error) {
      console.error('❌ Error creating notification:', error);
    }
  }

  private async sendNotification(
    event: ScheduledEvent,
    notification: ScheduledNotification
  ): Promise<void> {
    try {
      const now = new Date().toISOString();

      // Create in-app notification (always created)
      const inAppNotificationId = `in_app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const inAppNotification: Notification = {
        id: inAppNotificationId,
        userId: notification.userId,
        type: NotificationType.SCHEDULED_REMINDER,
        title: notification.title,
        message: notification.message,
        link: `/dashboard/scheduler?event=${event.id}`,
        isRead: false,
        createdAt: now,
      };

      // Save in-app notification using LMDB
      await lmdb.create<Notification>('notifications', inAppNotificationId, inAppNotification);

      console.log(`✉️  Created in-app notification for user ${notification.userId}: ${notification.title}`);

      // Handle other notification methods
      switch (notification.method) {
        case NotificationMethod.PUSH:
          // can add push notification in the future
          console.log(`📱 Push notification would be sent: ${notification.title}`);
          break;
        
        case NotificationMethod.EMAIL:
          // can add email in the future
          console.log(`📧 Email notification would be sent: ${notification.title}`);
          break;
        
        case NotificationMethod.SMS:
          // can add SMS in the future
          console.log(`📱 SMS notification would be sent: ${notification.title}`);
          break;
      }

      // Update notification as sent using LMDB
      await lmdb.update<ScheduledNotification>('scheduledNotifications', notification.id, {
        isSent: true,
        sentAt: now,
        isDelivered: true,
        deliveredAt: now
      });

    } catch (error) {
      console.error('❌ Error sending notification:', error);
    }
  }

  private async createNextRecurrenceEvent(event: ScheduledEvent): Promise<void> {
    try {
      if (!event.recurrenceType || !event.recurrenceInterval) return;

      const currentDate = new Date(`${event.scheduledDate}T${event.scheduledTime}`);
      const nextDate = new Date(currentDate);

      switch (event.recurrenceType) {
        case 'DAILY':
          nextDate.setDate(nextDate.getDate() + event.recurrenceInterval);
          break;
        case 'WEEKLY':
          nextDate.setDate(nextDate.getDate() + (event.recurrenceInterval * 7));
          break;
        case 'MONTHLY':
          nextDate.setMonth(nextDate.getMonth() + event.recurrenceInterval);
          break;
        case 'YEARLY':
          nextDate.setFullYear(nextDate.getFullYear() + event.recurrenceInterval);
          break;
      }

      // Check if we haven't exceeded the recurrence end date
      if (event.recurrenceEnd && nextDate > new Date(event.recurrenceEnd)) {
        console.log(`⏰ Recurrence ended for event: ${event.title}`);
        return;
      }

      const nextEventId = `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const nextEvent: ScheduledEvent = {
        ...event,
        id: nextEventId,
        scheduledDate: nextDate.toISOString().split('T')[0],
        scheduledTime: event.scheduledTime,
        status: SchedulerStatus.ACTIVE,
        lastNotifiedAt: undefined,
        completedAt: undefined,
        createdAt: now,
        updatedAt: now,
      };

      // Save next recurrence event using LMDB
      await lmdb.create<ScheduledEvent>('scheduledEvents', nextEventId, nextEvent);

      console.log(`🔄 Created next recurrence event: ${nextEvent.title} for ${nextEvent.scheduledDate}`);

    } catch (error) {
      console.error('❌ Error creating next recurrence event:', error);
    }
  }

  private generateNotificationMessage(event: ScheduledEvent): string {
    const eventDateTime = new Date(`${event.scheduledDate}T${event.scheduledTime}`);
    const timeStr = eventDateTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const dateStr = eventDateTime.toLocaleDateString('en-US');

    let message = `Reminder: ${event.title}`;
    
    if (event.description) {
      message += `\n${event.description}`;
    }
    
    message += `\nTime: ${timeStr} - ${dateStr}`;
    
    return message;
  }
}

// Create and export instance
const notificationChecker = new NotificationChecker();

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, stopping notification checker...');
  notificationChecker.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, stopping notification checker...');
  notificationChecker.stop();
  process.exit(0);
});

// Start the service if this file is run directly
if (require.main === module) {
  console.log('🚀 Starting Scheduler Notification Service...');
  notificationChecker.start().catch((error) => {
    console.error('❌ Failed to start notification checker:', error);
    process.exit(1);
  });
}

export default notificationChecker;
import { NextRequest, NextResponse } from 'next/server';
import { lmdb } from '@/lib/db/lmdb';
import { 
  ScheduledEvent, 
  ScheduledNotification, 
  NotificationMethod,
  SchedulerStatus,
  NotificationType,
  Notification,
  User 
} from '@/types/database';
import { JWTService } from '@/lib/auth/jwt';
import { UserService } from '@/lib/db/user-service';
import { v4 as uuidv4 } from 'uuid';

// Helper function to verify token and get user
async function verifyToken(token: string): Promise<User | null> {
  const payload = JWTService.verifyToken(token);
  if (!payload) return null;
  
  const userService = new UserService();
  return await userService.getUserById(payload.userId);
}

// POST - Process notifications (check and send due notifications)
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const now = new Date();
    
    // Get all active scheduled events using LMDB
    const activeEvents = await lmdb.query<ScheduledEvent>('scheduledEvents',
      (event) => event.status === SchedulerStatus.ACTIVE
    );

    const processedNotifications = [];

    for (const event of activeEvents) {
      const eventDateTime = new Date(`${event.scheduledDate}T${event.scheduledTime}`);
      const notifyDateTime = new Date(eventDateTime.getTime() - (event.notifyBefore || 0) * 60000);
      
      // Check if notification time has passed and event hasn't been notified
      if (now >= notifyDateTime && !event.lastNotifiedAt) {
        // Create and send notifications for each method
        for (const method of event.notificationMethods) {
          const notification = await createScheduledNotification(event, method);
          if (notification) {
            await sendNotification(event, notification);
            processedNotifications.push(notification);
          }
        }

        // Update event's lastNotifiedAt
        await lmdb.update<ScheduledEvent>('scheduledEvents', event.id, {
          lastNotifiedAt: now.toISOString()
        });
      }

      // Check if event is complete (past due date)
      if (now > eventDateTime && event.status === SchedulerStatus.ACTIVE) {
        await lmdb.update<ScheduledEvent>('scheduledEvents', event.id, {
          status: SchedulerStatus.COMPLETED,
          completedAt: now.toISOString()
        });

        // Handle recurring events
        if (event.isRecurring && event.recurrenceType) {
          await createNextRecurrenceEvent(event);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processed: processedNotifications.length,
        notifications: processedNotifications,
      },
      message: `Processed ${processedNotifications.length} notifications`,
    });
  } catch (error) {
    console.error('Error processing notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createScheduledNotification(
  event: ScheduledEvent, 
  method: NotificationMethod
): Promise<ScheduledNotification | null> {
  try {
    const notificationId = uuidv4();
    const now = new Date().toISOString();
    
    const notification: ScheduledNotification = {
      id: notificationId,
      scheduledEventId: event.id,
      userId: event.assignedTo || event.createdBy,
      method,
      title: `📅 ${event.title}`,
      message: generateNotificationMessage(event),
      scheduledFor: now,
      isSent: false,
      isDelivered: false,
      retryCount: 0,
      maxRetries: 3,
      createdAt: now,
    };

    // Save scheduled notification using LMDB
    await lmdb.create<ScheduledNotification>('scheduledNotifications', notificationId, notification);

    return notification;
  } catch (error) {
    console.error('Error creating scheduled notification:', error);
    return null;
  }
}

async function sendNotification(
  event: ScheduledEvent,
  notification: ScheduledNotification
): Promise<void> {
  try {
    const now = new Date().toISOString();

    // Create in-app notification only if method is IN_APP
    if (notification.method === NotificationMethod.IN_APP) {
      const inAppNotificationId = uuidv4();
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
    }

    // Handle other notification methods (placeholder for future implementation)
    switch (notification.method) {
      case NotificationMethod.PUSH:
        console.log(`📱 Push notification would be sent: ${notification.title}`);
        break;
      case NotificationMethod.EMAIL:
        console.log(`📧 Email notification would be sent: ${notification.title}`);
        break;
      case NotificationMethod.SMS:
        console.log(`📱 SMS notification would be sent: ${notification.title}`);
        break;
      case NotificationMethod.IN_APP:
        console.log(`💬 In-app notification created: ${notification.title}`);
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
    console.error('Error sending notification:', error);
  }
}

async function createNextRecurrenceEvent(event: ScheduledEvent): Promise<void> {
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
      return;
    }

    const nextEventId = uuidv4();
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

  } catch (error) {
    console.error('Error creating next recurrence event:', error);
  }
}

function generateNotificationMessage(event: ScheduledEvent): string {
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
  
  message += `\nScheduled: ${timeStr} - ${dateStr}`;
  
  return message;
}
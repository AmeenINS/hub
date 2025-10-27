/**
 * Example: How to use Scheduler Service from anywhere
 * 
 * This file demonstrates various ways to interact with the global scheduler service
 */

import { schedulerService } from '@/scheduler-init';
import { 
  SchedulerType, 
  SchedulerStatus, 
  NotificationMethod,
  RecurrenceType 
} from '@/types/database';

// Example 1: Simple Reminder
export async function createSimpleReminder(userId: string, title: string, dateTime: string) {
  const [date, time] = dateTime.split('T');
  
  const event = await schedulerService.addEvent({
    title,
    type: SchedulerType.REMINDER,
    status: SchedulerStatus.ACTIVE,
    scheduledDate: date,
    scheduledTime: time,
    timezone: 'Asia/Baghdad',
    notificationMethods: [NotificationMethod.IN_APP],
    notifyBefore: 0, // Notify exactly at time
    isRecurring: false,
    createdBy: userId,
    isPrivate: true,
    canBeEditedByAssigned: false
  });
  
  return event;
}

// Example 2: Weekly Meeting
export async function createWeeklyMeeting(
  userId: string, 
  title: string, 
  description: string,
  dayOfWeek: string,
  time: string
) {
  const event = await schedulerService.addEvent({
    title,
    description,
    type: SchedulerType.MEETING,
    status: SchedulerStatus.ACTIVE,
    scheduledDate: dayOfWeek, // e.g., '2025-11-03' (next Monday)
    scheduledTime: time,
    timezone: 'Asia/Baghdad',
    notificationMethods: [NotificationMethod.IN_APP, NotificationMethod.EMAIL],
    notifyBefore: 15, // 15 minutes before
    isRecurring: true,
    recurrenceType: RecurrenceType.WEEKLY,
    recurrenceInterval: 1,
    recurrenceEnd: '2026-12-31',
    createdBy: userId,
    isPrivate: false,
    canBeEditedByAssigned: true
  });
  
  return event;
}

// Example 3: Task Deadline
export async function createTaskDeadline(
  userId: string,
  taskId: string,
  taskTitle: string,
  dueDate: string,
  dueTime: string
) {
  const event = await schedulerService.addEvent({
    title: `Task Deadline: ${taskTitle}`,
    description: `Complete task by ${dueDate} ${dueTime}`,
    type: SchedulerType.TASK_DEADLINE,
    status: SchedulerStatus.ACTIVE,
    scheduledDate: dueDate,
    scheduledTime: dueTime,
    timezone: 'Asia/Baghdad',
    notificationMethods: [NotificationMethod.IN_APP],
    notifyBefore: 60, // 1 hour before
    isRecurring: false,
    relatedTaskId: taskId,
    createdBy: userId,
    assignedTo: userId,
    isPrivate: false,
    canBeEditedByAssigned: false
  });
  
  return event;
}

// Example 4: Daily Stand-up
export async function createDailyStandup(userId: string) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const event = await schedulerService.addEvent({
    title: 'Daily Stand-up Meeting',
    description: 'Daily team sync at 9:00 AM',
    type: SchedulerType.MEETING,
    status: SchedulerStatus.ACTIVE,
    scheduledDate: tomorrow.toISOString().split('T')[0],
    scheduledTime: '09:00',
    timezone: 'Asia/Baghdad',
    notificationMethods: [NotificationMethod.IN_APP],
    notifyBefore: 10,
    isRecurring: true,
    recurrenceType: RecurrenceType.DAILY,
    recurrenceInterval: 1,
    recurrenceEnd: '2026-12-31',
    createdBy: userId,
    isPrivate: false,
    canBeEditedByAssigned: false
  });
  
  return event;
}

// Example 5: Monthly Report Reminder
export async function createMonthlyReport(userId: string) {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1); // First day of next month
  
  const event = await schedulerService.addEvent({
    title: 'Monthly Report Due',
    description: 'Submit monthly performance report',
    type: SchedulerType.REMINDER,
    status: SchedulerStatus.ACTIVE,
    scheduledDate: nextMonth.toISOString().split('T')[0],
    scheduledTime: '10:00',
    timezone: 'Asia/Baghdad',
    notificationMethods: [NotificationMethod.IN_APP, NotificationMethod.EMAIL],
    notifyBefore: 1440, // 1 day before (24 hours)
    isRecurring: true,
    recurrenceType: RecurrenceType.MONTHLY,
    recurrenceInterval: 1,
    createdBy: userId,
    isPrivate: false,
    canBeEditedByAssigned: false
  });
  
  return event;
}

// Example 6: Follow-up After Meeting
export async function createFollowUpReminder(
  userId: string,
  meetingTitle: string,
  daysAfter: number = 3
) {
  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + daysAfter);
  
  const event = await schedulerService.addEvent({
    title: `Follow-up: ${meetingTitle}`,
    description: `Check progress on action items from ${meetingTitle}`,
    type: SchedulerType.FOLLOW_UP,
    status: SchedulerStatus.ACTIVE,
    scheduledDate: followUpDate.toISOString().split('T')[0],
    scheduledTime: '14:00',
    timezone: 'Asia/Baghdad',
    notificationMethods: [NotificationMethod.IN_APP],
    notifyBefore: 30,
    isRecurring: false,
    createdBy: userId,
    isPrivate: true,
    canBeEditedByAssigned: false
  });
  
  return event;
}

// Example 7: Get User's Upcoming Events
export async function getUserUpcomingEvents(userId: string) {
  const allEvents = await schedulerService.getUserEvents(userId);
  
  const now = new Date();
  const upcomingEvents = allEvents
    .filter(event => {
      const eventDateTime = new Date(`${event.scheduledDate}T${event.scheduledTime}`);
      return eventDateTime > now && event.status === SchedulerStatus.ACTIVE;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime}`);
      const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 5); // Top 5 upcoming
  
  return upcomingEvents;
}

// Example 8: Snooze Event (Postpone by 15 minutes)
export async function snoozeEvent(eventId: string) {
  const event = await schedulerService.getEvent(eventId);
  if (!event) throw new Error('Event not found');
  
  const eventDateTime = new Date(`${event.scheduledDate}T${event.scheduledTime}`);
  eventDateTime.setMinutes(eventDateTime.getMinutes() + 15);
  
  await schedulerService.updateEvent(eventId, {
    scheduledDate: eventDateTime.toISOString().split('T')[0],
    scheduledTime: eventDateTime.toTimeString().slice(0, 5),
    status: SchedulerStatus.SNOOZED,
    lastNotifiedAt: undefined // Reset to allow new notification
  });
  
  return eventDateTime;
}

// Example 9: Cancel Event
export async function cancelEvent(eventId: string, userId: string) {
  const event = await schedulerService.getEvent(eventId);
  if (!event) throw new Error('Event not found');
  
  // Check permissions
  if (event.createdBy !== userId) {
    throw new Error('Only event creator can cancel');
  }
  
  await schedulerService.updateEvent(eventId, {
    status: SchedulerStatus.CANCELLED
  });
}

// Example 10: Reschedule Event
export async function rescheduleEvent(
  eventId: string,
  newDate: string,
  newTime: string,
  userId: string
) {
  const event = await schedulerService.getEvent(eventId);
  if (!event) throw new Error('Event not found');
  
  // Check permissions
  const canEdit = event.createdBy === userId || 
                 (event.assignedTo === userId && event.canBeEditedByAssigned);
  
  if (!canEdit) {
    throw new Error('Permission denied');
  }
  
  await schedulerService.updateEvent(eventId, {
    scheduledDate: newDate,
    scheduledTime: newTime,
    lastNotifiedAt: undefined // Reset to allow new notification
  });
}

// Example 11: Check Service Status
export async function checkSchedulerStatus() {
  const status = schedulerService.getStatus();
  console.log('Scheduler Status:', status);
  return status;
}

// Example 12: Integration with Tasks API
export async function onTaskCreated(taskId: string, task: { title: string; dueDate?: string }, userId: string) {
  // Automatically create deadline reminder when task is created
  if (task.dueDate) {
    await createTaskDeadline(
      userId,
      taskId,
      task.title,
      task.dueDate,
      '17:00' // Default due time
    );
  }
}

// Example 13: Integration with CRM
export async function scheduleCRMFollowUp(
  userId: string,
  leadId: string,
  leadName: string,
  followUpDate: string
) {
  const event = await schedulerService.addEvent({
    title: `Follow-up with ${leadName}`,
    description: `CRM Follow-up for lead`,
    type: SchedulerType.FOLLOW_UP,
    status: SchedulerStatus.ACTIVE,
    scheduledDate: followUpDate,
    scheduledTime: '10:00',
    timezone: 'Asia/Baghdad',
    notificationMethods: [NotificationMethod.IN_APP],
    notifyBefore: 30,
    isRecurring: false,
    relatedContactId: leadId,
    createdBy: userId,
    isPrivate: false,
    canBeEditedByAssigned: false
  });
  
  return event;
}

// Example 14: Bulk Create Events
export async function createBulkReminders(
  userId: string,
  reminders: Array<{ title: string; date: string; time: string }>
) {
  const events = await Promise.all(
    reminders.map(reminder =>
      schedulerService.addEvent({
        title: reminder.title,
        type: SchedulerType.REMINDER,
        status: SchedulerStatus.ACTIVE,
        scheduledDate: reminder.date,
        scheduledTime: reminder.time,
        timezone: 'Asia/Baghdad',
        notificationMethods: [NotificationMethod.IN_APP],
        notifyBefore: 0,
        isRecurring: false,
        createdBy: userId,
        isPrivate: true,
        canBeEditedByAssigned: false
      })
    )
  );
  
  return events;
}

// Example 15: Get Today's Events
export async function getTodayEvents(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const allEvents = await schedulerService.getUserEvents(userId);
  
  return allEvents.filter(event => 
    event.scheduledDate === today && 
    event.status === SchedulerStatus.ACTIVE
  );
}

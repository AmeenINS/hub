# Scheduler Service Documentation

## Overview
The Scheduler Service is a professional, enterprise-grade background service that manages scheduled events, notifications, and recurring tasks. It runs as a cron job in the background and is globally accessible throughout the application.

## Features

✅ **Automatic Notification Processing** - Runs every minute to check and send due notifications
✅ **Event Status Management** - Automatically marks events as completed when due
✅ **Recurring Event Handling** - Creates next occurrences for recurring events (daily, weekly, monthly, yearly)
✅ **Real-time SSE Broadcasting** - Broadcasts notifications to users via Server-Sent Events
✅ **Event Cleanup** - Automatically cleans up old completed events (30+ days old) every hour
✅ **Singleton Pattern** - Single global instance accessible from anywhere
✅ **Graceful Error Handling** - Comprehensive error logging and recovery
✅ **Timezone Support** - Configured for Asia/Baghdad timezone

## Architecture

### Cron Jobs
1. **Notification Processor**: `* * * * *` (Every minute)
   - Checks for due notifications
   - Sends notifications via configured methods (IN_APP, EMAIL, SMS)
   - Updates event status
   - Handles recurring events

2. **Event Cleanup**: `0 * * * *` (Every hour)
   - Removes completed events older than 30 days
   - Keeps database clean and performant

### Global Access
The service is initialized once when the application starts and is accessible globally via:
```typescript
import { schedulerService } from '@/scheduler-init';
```

## Usage Examples

### 1. Add a New Scheduled Event

```typescript
import { schedulerService } from '@/scheduler-init';
import { SchedulerType, SchedulerStatus, NotificationMethod } from '@/types/database';

// From anywhere in your application
const newEvent = await schedulerService.addEvent({
  title: 'Team Meeting',
  description: 'Weekly sync with development team',
  type: SchedulerType.MEETING,
  status: SchedulerStatus.ACTIVE,
  scheduledDate: '2025-11-01',
  scheduledTime: '10:00',
  timezone: 'Asia/Baghdad',
  notificationMethods: [NotificationMethod.IN_APP, NotificationMethod.EMAIL],
  notifyBefore: 15, // 15 minutes before
  isRecurring: true,
  recurrenceType: RecurrenceType.WEEKLY,
  recurrenceInterval: 1,
  recurrenceEnd: '2026-01-01',
  createdBy: userId,
  assignedTo: userId,
  isPrivate: false,
  canBeEditedByAssigned: true
});

console.log('Event created:', newEvent.id);
```

### 2. Update an Existing Event

```typescript
import { schedulerService } from '@/scheduler-init';
import { SchedulerStatus } from '@/types/database';

await schedulerService.updateEvent(eventId, {
  title: 'Updated Meeting Title',
  scheduledTime: '11:00',
  status: SchedulerStatus.ACTIVE
});
```

### 3. Delete an Event

```typescript
import { schedulerService } from '@/scheduler-init';

await schedulerService.deleteEvent(eventId);
```

### 4. Get Event Details

```typescript
import { schedulerService } from '@/scheduler-init';

const event = await schedulerService.getEvent(eventId);
if (event) {
  console.log('Event:', event.title);
}
```

### 5. Get All User Events

```typescript
import { schedulerService } from '@/scheduler-init';

const userEvents = await schedulerService.getUserEvents(userId);
console.log(`User has ${userEvents.length} events`);
```

### 6. Check Service Status

```typescript
import { schedulerService } from '@/scheduler-init';

const status = schedulerService.getStatus();
console.log('Service running:', status.running);
console.log('Active tasks:', status.tasksActive);
```

## API Endpoints

### Get Service Status
```
GET /api/scheduler/service
```

**Response:**
```json
{
  "success": true,
  "data": {
    "running": true,
    "tasksActive": 2,
    "message": "Scheduler service is running"
  }
}
```

## Integration with Existing Code

### In API Routes
```typescript
// src/app/api/scheduler/route.ts
import { schedulerService } from '@/scheduler-init';
import { verifyJWT } from '@/lib/auth/jwt';

export async function POST(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await verifyJWT(token);
  
  const body = await request.json();
  
  // Add event using global service
  const event = await schedulerService.addEvent({
    ...body,
    createdBy: user.id
  });
  
  return Response.json({ success: true, data: event });
}
```

### In Server Components
```typescript
// src/app/dashboard/scheduler/page.tsx
import { schedulerService } from '@/scheduler-init';

export default async function SchedulerPage() {
  // Can directly use the service in server components
  const events = await schedulerService.getUserEvents(currentUserId);
  
  return (
    <div>
      <h1>My Events ({events.length})</h1>
      {/* Render events */}
    </div>
  );
}
```

### In Server Actions
```typescript
'use server'
import { schedulerService } from '@/scheduler-init';

export async function createEventAction(formData: FormData) {
  const event = await schedulerService.addEvent({
    title: formData.get('title') as string,
    // ... other fields
  });
  
  return { success: true, eventId: event.id };
}
```

## Event Types

```typescript
enum SchedulerType {
  REMINDER = 'REMINDER',
  MEETING = 'MEETING',
  TASK_DEADLINE = 'TASK_DEADLINE',
  FOLLOW_UP = 'FOLLOW_UP',
  RECURRING = 'RECURRING',
  CUSTOM = 'CUSTOM'
}
```

## Event Status

```typescript
enum SchedulerStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  SNOOZED = 'SNOOZED'
}
```

## Notification Methods

```typescript
enum NotificationMethod {
  IN_APP = 'IN_APP',     // ✅ Implemented
  PUSH = 'PUSH',         // 🚧 TODO
  EMAIL = 'EMAIL',       // 🚧 TODO
  SMS = 'SMS'            // 🚧 TODO
}
```

## Recurrence Types

```typescript
enum RecurrenceType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}
```

## Automatic Features

### 1. Notification Processing
- Checks every minute for due notifications
- Calculates notification time based on `notifyBefore` setting
- Sends notifications via all specified methods
- Updates `lastNotifiedAt` timestamp

### 2. Event Completion
- Automatically marks events as completed when past due date
- Sets `completedAt` timestamp
- Triggers recurring event creation if applicable

### 3. Recurring Events
- Automatically creates next occurrence based on recurrence type
- Respects recurrence interval (e.g., every 2 weeks)
- Stops when `recurrenceEnd` date is reached
- Maintains all original event properties

### 4. Event Cleanup
- Runs every hour
- Removes completed events older than 30 days
- Keeps database performant

## Error Handling

The service includes comprehensive error handling:
- All operations are wrapped in try-catch blocks
- Errors are logged with descriptive messages
- Service continues running even if individual operations fail
- Failed notifications can be retried

## Performance Considerations

- **LMDB Database**: Lightning-fast key-value storage
- **Efficient Queries**: Only processes active events
- **Batch Operations**: Processes multiple events in single cron cycle
- **Memory Efficient**: Automatic cleanup prevents database bloat
- **SSE Broadcasting**: Real-time updates without polling

## Monitoring and Logs

All operations are logged with emoji prefixes for easy monitoring:
- 🚀 Service start
- 📅 Event processing
- ✅ Successful operations
- ❌ Errors
- 🎯 Statistics
- 🔄 Recurring events
- 🧹 Cleanup operations
- 📲 Notifications sent

## Best Practices

1. **Always use the global instance**: Don't create new instances
2. **Handle errors gracefully**: Wrap service calls in try-catch
3. **Validate input data**: Ensure dates and times are valid
4. **Set appropriate timezones**: Configure based on user location
5. **Use appropriate notification methods**: Consider user preferences
6. **Set reasonable `notifyBefore`**: Don't spam users with too-early notifications
7. **Configure recurrence carefully**: Ensure end dates are set for recurring events

## Future Enhancements

- [ ] Email notification implementation
- [ ] SMS notification implementation
- [ ] Push notification implementation
- [ ] Event conflict detection
- [ ] Calendar integration (Google, Outlook)
- [ ] Event templates
- [ ] Bulk operations
- [ ] Advanced filtering and search
- [ ] Event sharing and collaboration
- [ ] Notification preferences per user

## Troubleshooting

### Service not starting
- Check console logs for initialization errors
- Verify LMDB database is accessible
- Ensure node-cron is installed

### Notifications not being sent
- Check event status is ACTIVE
- Verify notification time has arrived
- Check `lastNotifiedAt` is not set
- Confirm notification methods are configured

### Recurring events not created
- Verify recurrence type is set
- Check recurrence end date hasn't passed
- Ensure original event is marked as completed

## Support

For issues or questions, check:
1. Console logs for error messages
2. Service status via `/api/scheduler/service`
3. Database integrity via LMDB tools
4. Event details and timestamps

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-27  
**License**: MIT

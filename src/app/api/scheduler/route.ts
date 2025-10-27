import { NextRequest, NextResponse } from 'next/server';
import { lmdb } from '@/lib/db/lmdb';
import { 
  ScheduledEvent, 
  SchedulerType, 
  SchedulerStatus, 
  NotificationMethod,
  RecurrenceType,
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

// GET - Fetch scheduled events
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as SchedulerStatus;
    const type = searchParams.get('type') as SchedulerType;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get all scheduled events using LMDB
    let events = await lmdb.getAll<ScheduledEvent>('scheduledEvents');
    
    // Filter by user permissions
    events = events.filter(event => 
      event.createdBy === user.id || 
      event.assignedTo === user.id ||
      !event.isPrivate
    );

    // Apply filters
    if (status) {
      events = events.filter(event => event.status === status);
    }
    
    if (type) {
      events = events.filter(event => event.type === type);
    }
    
    if (startDate) {
      events = events.filter(event => event.scheduledDate >= startDate);
    }
    
    if (endDate) {
      events = events.filter(event => event.scheduledDate <= endDate);
    }

    // Sort by scheduled date and time
    events.sort((a, b) => {
      const dateTimeA = new Date(`${a.scheduledDate}T${a.scheduledTime}`);
      const dateTimeB = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
      return dateTimeA.getTime() - dateTimeB.getTime();
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEvents = events.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        events: paginatedEvents,
        total: events.length,
        page,
        limit,
        totalPages: Math.ceil(events.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching scheduled events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new scheduled event
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

    const body = await request.json();
    const {
      title,
      description,
      type,
      scheduledDate,
      scheduledTime,
      timezone = 'UTC',
      notificationMethods,
      notifyBefore,
      isRecurring = false,
      recurrenceType,
      recurrenceInterval,
      recurrenceEnd,
      relatedTaskId,
      relatedContactId,
      relatedDealId,
      assignedTo,
      isPrivate = false,
      canBeEditedByAssigned = true,
    } = body;

    // Validation
    if (!title || !scheduledDate || !scheduledTime || !notificationMethods?.length) {
      return NextResponse.json(
        { error: 'Title, scheduled date, time, and notification methods are required' },
        { status: 400 }
      );
    }

    // Check if user can assign to others (admin permission check)
    if (assignedTo && assignedTo !== user.id) {
      // Add permission check here - for now allow all users to assign
      // TODO: Implement proper permission checking
    }

    const eventId = uuidv4();
    const now = new Date().toISOString();

    const scheduledEvent: ScheduledEvent = {
      id: eventId,
      title,
      description,
      type: type as SchedulerType,
      status: SchedulerStatus.ACTIVE,
      scheduledDate,
      scheduledTime,
      timezone,
      notificationMethods: notificationMethods as NotificationMethod[],
      notifyBefore,
      isRecurring,
      recurrenceType: recurrenceType as RecurrenceType,
      recurrenceInterval,
      recurrenceEnd,
      relatedTaskId,
      relatedContactId,
      relatedDealId,
      createdBy: user.id,
      assignedTo: assignedTo || user.id,
      isPrivate,
      canBeEditedByAssigned,
      createdAt: now,
      updatedAt: now,
    };

    // Save using LMDB
    await lmdb.create<ScheduledEvent>('scheduledEvents', eventId, scheduledEvent);

    return NextResponse.json({
      success: true,
      data: scheduledEvent,
      message: 'Scheduled event created successfully',
    });
  } catch (error) {
    console.error('Error creating scheduled event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
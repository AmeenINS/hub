import { NextRequest, NextResponse } from 'next/server';
import { lmdb } from '@/core/data/lmdb';
import { ScheduledEvent, ScheduledNotification, User } from '@/shared/types/database';
import { JWTService } from '@/core/auth/jwt';
import { UserService } from '@/core/data/user-service';

// Helper function to verify token and get user
async function verifyToken(token: string): Promise<User | null> {
  const payload = JWTService.verifyToken(token);
  if (!payload) return null;
  
  const userService = new UserService();
  return await userService.getUserById(payload.userId);
}

// GET - Fetch single scheduled event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;
    const event = await lmdb.getById<ScheduledEvent>('scheduledEvents', id);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Allow viewing only if user created the event or is assigned to it
    if (event.createdBy !== user.id && event.assignedTo !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Error fetching scheduled event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update scheduled event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userService = new UserService();

    const { id } = await params;
    const existingEvent = await lmdb.getById<ScheduledEvent>('scheduledEvents', id);

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check permissions
    const canEdit = 
      existingEvent.createdBy === user.id || 
      (existingEvent.assignedTo === user.id && existingEvent.canBeEditedByAssigned);

    if (!canEdit) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();

    // Validate new assignee if provided
    let updatedAssignedTo = existingEvent.assignedTo;
    if (Object.prototype.hasOwnProperty.call(body, 'assignedTo')) {
      const requestedAssignee = body.assignedTo;
      if (typeof requestedAssignee === 'string' && requestedAssignee.length > 0) {
        const targetUser = await userService.getUserById(requestedAssignee);
        if (!targetUser) {
          return NextResponse.json({ error: 'Assigned user not found' }, { status: 400 });
        }

        if (requestedAssignee !== user.id) {
          const isSubordinate = await userService.isSubordinate(user.id, requestedAssignee);
          if (!isSubordinate) {
            return NextResponse.json(
              { error: 'You can only assign events to yourself or your subordinates' },
              { status: 403 }
            );
          }
        }

        updatedAssignedTo = requestedAssignee;
      } else {
        // Treat empty value as assigning to self
        updatedAssignedTo = user.id;
      }
    }

    const updatePayload: Partial<ScheduledEvent> = {
      ...body,
    };

    if (Object.prototype.hasOwnProperty.call(body, 'assignedTo')) {
      updatePayload.assignedTo = updatedAssignedTo;
    }

    const updatedEvent = await lmdb.update<ScheduledEvent>('scheduledEvents', id, {
      ...updatePayload,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: updatedEvent,
      message: 'Event updated successfully',
    });
  } catch (error) {
    console.error('Error updating scheduled event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete scheduled event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;
    const existingEvent = await lmdb.getById<ScheduledEvent>('scheduledEvents', id);

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check permissions - only creator can delete
    if (existingEvent.createdBy !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete the event
    await lmdb.delete('scheduledEvents', id);

    // Also delete related notifications
    const relatedNotifications = await lmdb.query<ScheduledNotification>('scheduledNotifications', 
      (notification: ScheduledNotification) => notification.scheduledEventId === id
    );
    
    for (const notification of relatedNotifications) {
      await lmdb.delete('scheduledNotifications', notification.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting scheduled event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

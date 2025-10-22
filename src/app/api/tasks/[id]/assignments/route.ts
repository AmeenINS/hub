import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { JWTService } from '@/lib/auth/jwt';
import { TaskAssignmentService, TaskActivityService } from '@/lib/db/task-service';
import { TaskActivityType } from '@/types/database';

const assignmentService = new TaskAssignmentService();
const activityService = new TaskActivityService();

/**
 * GET /api/tasks/[id]/assignments
 * Get all assignments for a task
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const taskId = params.id;
    const assignments = await assignmentService.getAssignmentsByTask(taskId);

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Failed to fetch assignments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks/[id]/assignments
 * Assign a user to a task
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const assignedBy = payload.userId;
    const taskId = params.id;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if already assigned
    const existing = await assignmentService.getAssignmentByTaskAndUser(taskId, userId);
    if (existing) {
      return NextResponse.json(
        { error: 'User already assigned' },
        { status: 400 }
      );
    }

    // Assign user
    const assignment = await assignmentService.assignTask(taskId, userId, assignedBy);

    // Log activity
    await activityService.logActivity(taskId, assignedBy, TaskActivityType.ASSIGNED, {
      comment: `Assigned to user ${userId}`,
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error('Failed to assign user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { TaskService } from '@/core/data/task-service';
import { TaskAssignmentService } from '@/core/data/task-service';
import { UserService } from '@/core/data/user-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';
import { TaskStatus, TaskPriority } from '@/shared/types/database';

const taskService = new TaskService();
const taskAssignmentService = new TaskAssignmentService();
const userService = new UserService();

/**
 * GET /api/tasks
 * Get all tasks
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = JWTService.verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    // Check permission
    const hasPermission = await checkPermission(userId, 'tasks', 'read');

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if myTasks query parameter is present
    const { searchParams } = new URL(request.url);
    const myTasksOnly = searchParams.get('myTasks') === 'true';

    // Fetch tasks visible to this user:
    // - tasks created by user
    // - tasks assigned to user
    // - tasks assigned to user's subordinates (recursive, entire subtree)
    const allTasks = await taskService.getAllTasks();

    // Get assignments for user
    const myAssignments = await taskAssignmentService.getAssignmentsByUser(userId);
    const myAssignedTaskIds = new Set(myAssignments.map((a) => a.taskId));

    // If myTasks=true, only return tasks assigned to the current user
    if (myTasksOnly) {
      const myTasks = allTasks.filter((t) => myAssignedTaskIds.has(t.id));
      return NextResponse.json({ success: true, data: myTasks });
    }

    // Get ALL subordinates (recursive)
    const subs = await userService.getAllSubordinates(userId);
    const subIds = new Set(subs.map((s) => s.id));

    // Get assignments for all subordinates
    const subAssignedTaskIds = new Set<string>();
    for (const sid of subIds) {
      const asg = await taskAssignmentService.getAssignmentsByUser(sid);
      asg.forEach((a) => subAssignedTaskIds.add(a.taskId));
    }

    const visibleTasks = allTasks.filter((t) => {
      if (t.createdBy === userId) return true;
      if (myAssignedTaskIds.has(t.id)) return true;
      if (subAssignedTaskIds.has(t.id)) return true;
      return false;
    });

    return NextResponse.json({ success: true, data: visibleTasks });
  } catch (error) {
    logError('Get tasks error', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = JWTService.verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    // Check permission
    const hasPermission = await checkPermission(userId, 'tasks', 'create');

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
  const { title, description, priority, dueDate, assignees } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate assignees: must be array of userIds or undefined
    const assigneeIds: string[] = Array.isArray(assignees) ? assignees : [];

    // Ensure requester can assign to each assignee (self or subordinate)
    for (const aId of assigneeIds) {
      if (aId === userId) continue;
      const isSub = await userService.isSubordinate(userId, aId);
      if (!isSub) {
        return NextResponse.json(
          { success: false, error: 'Cannot assign task to users outside your team' },
          { status: 403 }
        );
      }
    }

    const task = await taskService.createTask({
      title,
      description: description || '',
      status: TaskStatus.TODO,
      priority: priority || TaskPriority.MEDIUM,
      dueDate: dueDate || undefined,
      createdBy: userId,
    });

    // Create assignments for assignees
    for (const aId of assigneeIds) {
      await taskAssignmentService.assignTask(task.id, aId, userId);
    }

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    logError('Create task error', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

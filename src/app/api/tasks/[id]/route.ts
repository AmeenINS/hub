import { NextRequest, NextResponse } from 'next/server';
import { TaskService, TaskAssignmentService, TaskActivityService } from '@/lib/db/task-service';
import { UserService } from '@/lib/db/user-service';
import { JWTService } from '@/lib/auth/jwt';
import { checkPermission } from '@/lib/auth/middleware';
import { logError } from '@/lib/logger';
import { TaskActivityType, TaskStatus, TaskPriority, Task } from '@/types/database';

const taskService = new TaskService();
const taskAssignmentService = new TaskAssignmentService();
const activityService = new TaskActivityService();
const userService = new UserService();

/**
 * GET /api/tasks/[id]
 * Get task by ID (with visibility check)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = JWTService.verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;
    const { id } = await params;

    const hasPermission = await checkPermission(userId, 'tasks', 'read');

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    const task = await taskService.getTaskById(id);

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check visibility: creator, assignee, or manager of assignee
    const assignments = await taskAssignmentService.getAssignmentsByTask(id);
    const assigneeIds = assignments.map((a) => a.userId);
    
    const isCreator = task.createdBy === userId;
    const isAssignee = assigneeIds.includes(userId);
    
    // Check if any assignee is subordinate of user
    let isManagerOfAssignee = false;
    for (const aId of assigneeIds) {
      if (await userService.isSubordinate(userId, aId)) {
        isManagerOfAssignee = true;
        break;
      }
    }

    if (!isCreator && !isAssignee && !isManagerOfAssignee) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Cannot access this task' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { ...task, assignments },
    });
  } catch (error) {
    logError('Get task error', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tasks/[id]
 * Update task
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = JWTService.verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;
    const { id } = await params;

    const hasPermission = await checkPermission(userId, 'tasks', 'update');

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    const task = await taskService.getTaskById(id);

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check if user can manage this task (creator or manager of assignees)
    const assignments = await taskAssignmentService.getAssignmentsByTask(id);
    const assigneeIds = assignments.map((a) => a.userId);
    
    const isCreator = task.createdBy === userId;
    
    let isManagerOfAssignee = false;
    for (const aId of assigneeIds) {
      if (await userService.isSubordinate(userId, aId)) {
        isManagerOfAssignee = true;
        break;
      }
    }

    if (!isCreator && !isManagerOfAssignee) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Cannot update this task' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Log activity for specific field changes
    if (body.status && body.status !== task.status) {
      await activityService.logActivity(id, userId, TaskActivityType.STATUS_CHANGED, {
        oldValue: task.status,
        newValue: body.status,
      });
    }
    
    if (body.priority && body.priority !== task.priority) {
      await activityService.logActivity(id, userId, TaskActivityType.PRIORITY_CHANGED, {
        oldValue: task.priority,
        newValue: body.priority,
      });
    }
    
    if (body.dueDate && body.dueDate !== task.dueDate) {
      await activityService.logActivity(id, userId, TaskActivityType.DUE_DATE_CHANGED, {
        oldValue: task.dueDate || 'none',
        newValue: body.dueDate,
      });
    }
    
    // Update task
    const updatedTask = await taskService.updateTask(id, body);

    // Log general update if no specific field was logged
    if (!body.status && !body.priority && !body.dueDate) {
      await activityService.logActivity(id, userId, TaskActivityType.UPDATED);
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
    });
  } catch (error) {
    logError('Update task error', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tasks/[id]
 * Update task (alias for PATCH)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(request, { params });
}

/**
 * DELETE /api/tasks/[id]
 * Delete task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = JWTService.verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;
    const { id } = await params;

    const hasPermission = await checkPermission(userId, 'tasks', 'delete');

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    const task = await taskService.getTaskById(id);

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Only creator can delete
    if (task.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only creator can delete task' },
        { status: 403 }
      );
    }

    await taskService.deleteTask(id);

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    logError('Delete task error', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

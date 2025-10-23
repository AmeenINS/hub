import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/lib/auth/jwt';
import { TaskAssignmentService, TaskActivityService } from '@/lib/db/task-service';
import { TaskActivityType } from '@/types/database';

const assignmentService = new TaskAssignmentService();
const activityService = new TaskActivityService();

/**
 * DELETE /api/tasks/[id]/assignments/[assignmentId]
 * Remove an assignment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const { id, assignmentId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;
    const taskId = id;

    // Get assignment details before deleting
    const assignment = await assignmentService.getAssignmentById(assignmentId);
    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Delete assignment
    await assignmentService.deleteAssignment(assignmentId);

    // Log activity
    await activityService.logActivity(taskId, userId, TaskActivityType.UNASSIGNED, {
      comment: `Unassigned user ${assignment.userId}`,
    });

    return NextResponse.json({ success: true, message: 'User unassigned' });
  } catch (error) {
    console.error('Failed to unassign user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

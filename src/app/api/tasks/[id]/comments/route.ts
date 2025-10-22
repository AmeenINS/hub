import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { JWTService } from '@/lib/auth/jwt';
import { TaskCommentService, TaskActivityService } from '@/lib/db/task-service';
import { TaskActivityType } from '@/types/database';

const commentService = new TaskCommentService();
const activityService = new TaskActivityService();

/**
 * GET /api/tasks/[id]/comments
 * Get all comments for a task
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
    const comments = await commentService.getCommentsByTask(taskId);

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks/[id]/comments
 * Add a comment to a task
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

    const userId = payload.userId;
    const taskId = params.id;
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Add comment
    const comment = await commentService.addComment(taskId, userId, content.trim());

    // Log activity
    await activityService.logActivity(taskId, userId, TaskActivityType.COMMENT_ADDED);

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Failed to add comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

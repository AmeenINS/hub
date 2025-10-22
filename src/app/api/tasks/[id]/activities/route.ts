import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { JWTService } from '@/lib/auth/jwt';
import { TaskActivityService } from '@/lib/db/task-service';

const activityService = new TaskActivityService();

/**
 * GET /api/tasks/[id]/activities
 * Get all activities for a task
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
    const activities = await activityService.getActivitiesByTask(taskId);

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

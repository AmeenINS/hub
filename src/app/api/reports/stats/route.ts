import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/core/auth/jwt';
import { TaskService } from '@/core/data/task-service';
import { UserService } from '@/core/data/user-service';
import { TaskStatus } from '@/shared/types/database';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const taskService = new TaskService();
    const userService = new UserService();

    const allTasks = await taskService.getAllTasks();
    const allUsers = await userService.getAllUsers();

    const activeUsers = allUsers.filter(u => u.isActive);
    
    const stats = {
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter(t => t.status === TaskStatus.DONE).length,
      inProgressTasks: allTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      totalUsers: allUsers.length,
      activeUsers: activeUsers.length,
      tasksByPriority: {
        low: allTasks.filter(t => t.priority === 'LOW').length,
        medium: allTasks.filter(t => t.priority === 'MEDIUM').length,
        high: allTasks.filter(t => t.priority === 'HIGH').length,
        urgent: allTasks.filter(t => t.priority === 'URGENT').length,
      },
      tasksByStatus: {
        todo: allTasks.filter(t => t.status === TaskStatus.TODO).length,
        inProgress: allTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
        done: allTasks.filter(t => t.status === TaskStatus.DONE).length,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching report stats:', error);
    return NextResponse.json({ error: 'Failed to fetch report stats' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/core/data/user-service';
import { RoleService } from '@/core/data/user-service';
import { TaskService } from '@/core/data/task-service';
import { JWTService } from '@/core/auth/jwt';
import { TaskStatus } from '@/shared/types/database';

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const token = request.cookies.get('auth-token')?.value;
    
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

    const userService = new UserService();
    const roleService = new RoleService();
    const taskService = new TaskService();

    // Get all users
    const users = await userService.getAllUsers();
    const activeUsers = users.filter(u => u.isActive);

    // Get all roles
    const roles = await roleService.getAllRoles();

    // Get all tasks
    const tasks = await taskService.getAllTasks();
    const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE);
    const pendingTasks = tasks.filter(t => 
      t.status === TaskStatus.TODO || t.status === TaskStatus.IN_PROGRESS
    );

    const stats = {
      totalUsers: users.length,
      activeUsers: activeUsers.length,
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      totalRoles: roles.length,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/lib/auth/jwt';
import { TaskService } from '@/lib/db/task-service';
import { UserService } from '@/lib/db/user-service';

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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'pdf';
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const taskService = new TaskService();
    const userService = new UserService();

    const allTasks = await taskService.getAllTasks();
    const allUsers = await userService.getAllUsers();

    // Filter by date range if provided
    let filteredTasks = allTasks;
    if (from || to) {
      filteredTasks = allTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        if (from && taskDate < new Date(from)) return false;
        if (to && taskDate > new Date(to)) return false;
        return true;
      });
    }

    // For now, return a simple CSV format
    // In production, you would use libraries like pdfkit or exceljs
    if (format === 'excel') {
      // Simple CSV format
      const csv = [
        'Title,Status,Priority,Created At,Due Date',
        ...filteredTasks.map(task => 
          `"${task.title}","${task.status}","${task.priority}","${task.createdAt}","${task.dueDate || 'N/A'}"`
        )
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${Date.now()}.csv"`,
        },
      });
    }

    // For PDF, return JSON for now (would need pdfkit in production)
    return NextResponse.json({ 
      message: 'PDF export not implemented yet',
      tasks: filteredTasks.length,
      users: allUsers.length,
    });

  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 });
  }
}

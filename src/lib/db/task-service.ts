import { lmdb } from './lmdb';
import {
  Task,
  TaskAssignment,
  TaskComment,
  TaskAttachment,
  TaskActivity,
  TaskActivityType,
  TaskStatus,
  TaskPriority,
} from '@/types/database';
import { nanoid } from 'nanoid';

/**
 * Task Service
 * Handles all task-related database operations
 */
export class TaskService {
  private readonly dbName = 'tasks';

  /**
   * Create a new task
   */
  async createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const id = nanoid();
    
    const task: Task = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await lmdb.create(this.dbName, id, task);
    return task;
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    return lmdb.getById<Task>(this.dbName, id);
  }

  /**
   * Get all tasks
   */
  async getAllTasks(): Promise<Task[]> {
    return lmdb.getAll<Task>(this.dbName);
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    return lmdb.query<Task>(this.dbName, (task) => task.status === status);
  }

  /**
   * Get tasks by priority
   */
  async getTasksByPriority(priority: TaskPriority): Promise<Task[]> {
    return lmdb.query<Task>(this.dbName, (task) => task.priority === priority);
  }

  /**
   * Get tasks created by user
   */
  async getTasksByCreator(userId: string): Promise<Task[]> {
    return lmdb.query<Task>(this.dbName, (task) => task.createdBy === userId);
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(): Promise<Task[]> {
    const now = new Date().toISOString();
    return lmdb.query<Task>(
      this.dbName,
      (task) =>
        task.dueDate !== undefined &&
        task.dueDate < now &&
        task.status !== TaskStatus.DONE &&
        task.status !== TaskStatus.CANCELLED
    );
  }

  /**
   * Update task
   */
  async updateTask(id: string, data: Partial<Task>): Promise<Task | null> {
    return lmdb.update<Task>(this.dbName, id, data);
  }

  /**
   * Delete task
   */
  async deleteTask(id: string): Promise<boolean> {
    return lmdb.delete(this.dbName, id);
  }

  /**
   * Get tasks by department
   */
  async getTasksByDepartment(departmentId: string): Promise<Task[]> {
    return lmdb.query<Task>(this.dbName, (task) => task.departmentId === departmentId);
  }
}

/**
 * TaskAssignment Service
 * Handles task assignment operations
 */
export class TaskAssignmentService {
  private readonly dbName = 'taskAssignments';

  /**
   * Assign task to user
   */
  async assignTask(
    taskId: string,
    userId: string,
    assignedBy: string
  ): Promise<TaskAssignment> {
    const id = nanoid();
    
    const assignment: TaskAssignment = {
      id,
      taskId,
      userId,
      assignedBy,
      assignedAt: new Date().toISOString(),
      completionPercentage: 0,
    };

    await lmdb.create(this.dbName, id, assignment);
    return assignment;
  }

  /**
   * Get assignments by task ID
   */
  async getAssignmentsByTask(taskId: string): Promise<TaskAssignment[]> {
    return lmdb.query<TaskAssignment>(this.dbName, (assignment) => assignment.taskId === taskId);
  }

  /**
   * Get assignments by user ID
   */
  async getAssignmentsByUser(userId: string): Promise<TaskAssignment[]> {
    return lmdb.query<TaskAssignment>(this.dbName, (assignment) => assignment.userId === userId);
  }

  /**
   * Get tasks assigned to user
   */
  async getTasksForUser(userId: string): Promise<Task[]> {
    const taskService = new TaskService();
    const assignments = await this.getAssignmentsByUser(userId);
    
    const tasks: Task[] = [];
    for (const assignment of assignments) {
      const task = await taskService.getTaskById(assignment.taskId);
      if (task) {
        tasks.push(task);
      }
    }
    
    return tasks;
  }

  /**
   * Update completion percentage
   */
  async updateCompletion(assignmentId: string, percentage: number): Promise<TaskAssignment | null> {
    return lmdb.update<TaskAssignment>(this.dbName, assignmentId, {
      completionPercentage: Math.min(100, Math.max(0, percentage)),
    });
  }

  /**
   * Get assignment by ID
   */
  async getAssignmentById(assignmentId: string): Promise<TaskAssignment | null> {
    return lmdb.getById<TaskAssignment>(this.dbName, assignmentId);
  }

  /**
   * Get assignment by task and user
   */
  async getAssignmentByTaskAndUser(taskId: string, userId: string): Promise<TaskAssignment | null> {
    const assignments = await lmdb.query<TaskAssignment>(
      this.dbName,
      (assignment) => assignment.taskId === taskId && assignment.userId === userId
    );
    return assignments.length > 0 ? assignments[0] : null;
  }

  /**
   * Delete assignment
   */
  async deleteAssignment(assignmentId: string): Promise<boolean> {
    return lmdb.delete(this.dbName, assignmentId);
  }

  /**
   * Remove assignment
   */
  async removeAssignment(assignmentId: string): Promise<boolean> {
    return lmdb.delete(this.dbName, assignmentId);
  }
}

/**
 * TaskComment Service
 * Handles task comments
 */
export class TaskCommentService {
  private readonly dbName = 'taskComments';

  /**
   * Add comment to task
   */
  async addComment(taskId: string, userId: string, content: string): Promise<TaskComment> {
    const id = nanoid();
    
    const comment: TaskComment = {
      id,
      taskId,
      userId,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await lmdb.create(this.dbName, id, comment);
    return comment;
  }

  /**
   * Get comments by task ID
   */
  async getCommentsByTask(taskId: string): Promise<TaskComment[]> {
    const comments = await lmdb.query<TaskComment>(
      this.dbName,
      (comment) => comment.taskId === taskId
    );
    
    // Sort by creation date (newest first)
    return comments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Update comment
   */
  async updateComment(id: string, content: string): Promise<TaskComment | null> {
    return lmdb.update<TaskComment>(this.dbName, id, { content });
  }

  /**
   * Delete comment
   */
  async deleteComment(id: string): Promise<boolean> {
    return lmdb.delete(this.dbName, id);
  }
}

/**
 * TaskAttachment Service
 * Handles task attachments
 */
export class TaskAttachmentService {
  private readonly dbName = 'taskAttachments';

  /**
   * Add attachment to task
   */
  async addAttachment(
    taskId: string,
    userId: string,
    fileData: {
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
    }
  ): Promise<TaskAttachment> {
    const id = nanoid();
    
    const attachment: TaskAttachment = {
      id,
      taskId,
      userId,
      ...fileData,
      uploadedAt: new Date().toISOString(),
    };

    await lmdb.create(this.dbName, id, attachment);
    return attachment;
  }

  /**
   * Get attachments by task ID
   */
  async getAttachmentsByTask(taskId: string): Promise<TaskAttachment[]> {
    return lmdb.query<TaskAttachment>(
      this.dbName,
      (attachment) => attachment.taskId === taskId
    );
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(id: string): Promise<boolean> {
    return lmdb.delete(this.dbName, id);
  }
}

/**
 * TaskActivity Service
 * Handles task activity logging and history
 */
export class TaskActivityService {
  private readonly dbName = 'taskActivities';

  /**
   * Log task activity
   */
  async logActivity(
    taskId: string,
    userId: string,
    type: TaskActivityType,
    data?: {
      oldValue?: string;
      newValue?: string;
      comment?: string;
    }
  ): Promise<TaskActivity> {
    const id = nanoid();
    
    const activity: TaskActivity = {
      id,
      taskId,
      userId,
      type,
      oldValue: data?.oldValue,
      newValue: data?.newValue,
      comment: data?.comment,
      createdAt: new Date().toISOString(),
    };

    await lmdb.create(this.dbName, id, activity);
    return activity;
  }

  /**
   * Get activities by task ID
   */
  async getActivitiesByTask(taskId: string): Promise<TaskActivity[]> {
    const activities = await lmdb.query<TaskActivity>(
      this.dbName,
      (activity) => activity.taskId === taskId
    );
    
    // Sort by creation date (newest first)
    return activities.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Get recent activities (across all tasks)
   */
  async getRecentActivities(limit: number = 10): Promise<TaskActivity[]> {
    const activities = await lmdb.getAll<TaskActivity>(this.dbName);
    
    // Sort by creation date (newest first) and limit
    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * Get activities by user
   */
  async getActivitiesByUser(userId: string): Promise<TaskActivity[]> {
    const activities = await lmdb.query<TaskActivity>(
      this.dbName,
      (activity) => activity.userId === userId
    );
    
    return activities.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

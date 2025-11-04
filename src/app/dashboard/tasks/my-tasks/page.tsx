'use client';

// React & Next.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// External libraries
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

// Internal utilities
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { useI18n } from '@/lib/i18n/i18n-context';

// Components
import { Button } from '@/components/ui/button';
import KanbanBoard from '@/components/tasks/kanban-board';
import TaskDetailDialog from '@/components/tasks/task-detail-dialog';

// Types
import { Task, TaskStatus } from '@/types/database';

// Types & Interfaces
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface TaskUpdateResponse {
  success: boolean;
  task?: Task;
}

// Component
export default function MyTasksPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<ApiResponse<Task[]>>('/api/tasks?myTasks=true');

      if (response.success && response.data) {
        // API returns { success: true, data: Task[] } not { success: true, data: { data: Task[] } }
        setTasks(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('messages.errorFetchingData')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await apiClient.patch<TaskUpdateResponse>(
        `/api/tasks/${taskId}`,
        updates
      );

      if (response.success && response.data) {
        await fetchTasks();
        // PATCH API returns { success: true, task: Task }
        // But apiClient wraps it in ApiResponse<T> so it becomes:
        // { success: true, data: { success: true, task: Task } }
        if (response.data.task) {
          setSelectedTask(response.data.task);
        }
        toast.success(t('tasks.taskUpdated'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('tasks.failedUpdate')));
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic update
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    try {
      const response = await apiClient.patch<ApiResponse<Task>>(
        `/api/tasks/${taskId}`,
        { status: newStatus }
      );

      if (response.success) {
        const statusLabels: Record<TaskStatus, string> = {
          TODO: t('tasks.status.todo'),
          IN_PROGRESS: t('tasks.status.inProgress'),
          DONE: t('tasks.status.done'),
          CANCELLED: t('tasks.status.cancelled'),
        };
        toast.success(`${t('tasks.movedTo')} ${statusLabels[newStatus]}`);
      }
    } catch (error) {
      // Revert on error
      await fetchTasks();
      toast.error(getErrorMessage(error, t('tasks.failedUpdate')));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-primary/10"></div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">{t('tasks.loadingTasks')}</p>
            <p className="text-sm text-muted-foreground">{t('tasks.pleasewait')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('tasks.myTasks')}
          </h1>
          <p className="text-muted-foreground">
            {t('tasks.dragAndDrop')} • {tasks.length} {tasks.length === 1 ? t('tasks.task') : t('tasks.tasks')}
          </p>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/tasks/new')}
          size="default"
          className="shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('tasks.newTask')}
        </Button>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        tasks={tasks}
        onTaskClick={handleTaskClick}
        onStatusChange={handleStatusChange}
      />

      {/* Task Detail Dialog */}
      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onUpdate={handleTaskUpdate}
          onRefresh={fetchTasks}
        />
      )}
    </div>
  );
}

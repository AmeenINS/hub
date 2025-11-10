'use client';

// React & Next.js
import * as React from 'react';
import { useRouter } from 'next/navigation';

// External libraries
import { ListTodo, RefreshCw, Plus } from 'lucide-react';
import { toast } from 'sonner';

// Internal utilities
import { apiClient, getErrorMessage } from '@/core/api/client';
import { useI18n } from '@/shared/i18n/i18n-context';

// Components - UI
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';

// Types
import { TaskStatus, TaskPriority } from '@/shared/types/database';

// Types & Interfaces
interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  createdBy: string;
  assignedTo: string | null;
}

// Constants
const statusColors: Record<TaskStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  TODO: 'secondary',
  IN_PROGRESS: 'default',
  DONE: 'outline',
  CANCELLED: 'destructive',
};

const priorityColors: Record<TaskPriority, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  LOW: 'secondary',
  MEDIUM: 'default',
  HIGH: 'default',
  URGENT: 'destructive',
};

// Component
export default function TasksPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchTasks = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Task[]>('/api/tasks');

      if (response.success && response.data) {
        setTasks(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('messages.errorFetchingData')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Fetch tasks on mount
  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getStatusLabel = (status: TaskStatus) => {
    const labels: Record<TaskStatus, string> = {
      TODO: t('tasks.status.todo'),
      IN_PROGRESS: t('tasks.status.inProgress'),
      DONE: t('tasks.status.done'),
      CANCELLED: t('tasks.status.cancelled'),
    };
    return labels[status];
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    const labels: Record<TaskPriority, string> = {
      LOW: t('tasks.priority.low'),
      MEDIUM: t('tasks.priority.medium'),
      HIGH: t('tasks.priority.high'),
      URGENT: t('tasks.priority.urgent'),
    };
    return labels[priority];
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('tasks.title')}</h2>
          <p className="text-muted-foreground">
            {t('dashboard.manageTasks')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchTasks}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => router.push('/dashboard/tasks/new')}>
            <Plus className="mr-2 h-4 w-4" />
            {t('tasks.createTask')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('tasks.status.todo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.status === 'TODO').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('tasks.status.inProgress')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.status === 'IN_PROGRESS').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('tasks.status.done')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.status === 'DONE').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('common.cancel')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.status === 'CANCELLED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('tasks.allTasks')}</CardTitle>
          <CardDescription>
            {loading
              ? t('common.loading')
              : `${tasks.length} ${t('tasks.title').toLowerCase()}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tasks.taskName')}</TableHead>
                    <TableHead>{t('tasks.taskStatus')}</TableHead>
                    <TableHead>{t('tasks.taskPriority')}</TableHead>
                    <TableHead>{t('tasks.dueDate')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {t('tasks.noTasks')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <ListTodo className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div>{task.title}</div>
                              {task.description && (
                                <div className="text-xs text-muted-foreground truncate max-w-md">
                                  {task.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColors[task.status]}>
                            {getStatusLabel(task.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={priorityColors[task.priority]}>
                            {getPriorityLabel(task.priority)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/tasks/${task.id}/edit`)}
                          >
                            {t('common.edit')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Task, TaskStatus } from '@/types/database';
import KanbanBoard from '@/components/tasks/kanban-board';
import TaskDetailDialog from '@/components/tasks/task-detail-dialog';
import { toast } from 'sonner';

const getAuthToken = () => {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('auth-token='))
    ?.split('=')[1];
};

export default function MyTasksPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    fetchTasks();
  }, [isAuthenticated, router]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setTasks(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const token = getAuthToken();

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await fetchTasks();
        const result = await response.json();
        if (result.data) {
          setSelectedTask(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic update - update UI immediately
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus }
          : task
      )
    );

    // Then update on server
    try {
      const token = getAuthToken();

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        // Revert on error
        await fetchTasks();
        toast.error('Failed to update task status');
        throw new Error('Failed to update task');
      } else {
        // Success feedback
        const statusLabels = {
          TODO: 'To Do',
          IN_PROGRESS: 'In Progress',
          DONE: 'Done',
          CANCELLED: 'Cancelled',
        };
        toast.success(`Task moved to ${statusLabels[newStatus]}`);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      // Already reverted by fetchTasks
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
            <p className="text-lg font-medium text-foreground">Loading your tasks...</p>
            <p className="text-sm text-muted-foreground">Please wait a moment</p>
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
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            My Tasks
          </h1>
          <p className="text-muted-foreground">
            Drag and drop tasks to update their status • {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} total
          </p>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/tasks/new')}
          size="default"
          className="shadow-sm"
        >
          <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
          New Task
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

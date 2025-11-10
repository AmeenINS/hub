'use client';

// React & utilities
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

// Internal utilities
import { useI18n } from '@/shared/i18n/i18n-context';

// Components
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Calendar, Clock } from 'lucide-react';

// Types
import { Task, TaskStatus, TaskPriority } from '@/shared/types/database';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

const priorityConfig = {
  [TaskPriority.LOW]: { variant: 'secondary' as const },
  [TaskPriority.MEDIUM]: { variant: 'default' as const },
  [TaskPriority.HIGH]: { variant: 'default' as const },
  [TaskPriority.URGENT]: { variant: 'destructive' as const },
};

export default function KanbanBoard({ tasks, onTaskClick, onStatusChange }: KanbanBoardProps) {
  const { t } = useI18n();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const statusColumns = [
    { 
      status: TaskStatus.TODO, 
      label: t('tasks.status.todo'),
    },
    { 
      status: TaskStatus.IN_PROGRESS, 
      label: t('tasks.status.inProgress'),
    },
    { 
      status: TaskStatus.DONE, 
      label: t('tasks.status.done'),
    },
  ];

  const getTasksByStatus = useMemo(() => {
    return (status: TaskStatus) => {
      return tasks.filter((task) => task.status === status);
    };
  }, [tasks]);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (status: TaskStatus) => {
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== status) {
      onStatusChange(draggedTask.id, status);
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {statusColumns.map((column) => {
        const columnTasks = getTasksByStatus(column.status);
        const isDropTarget = dragOverColumn === column.status && draggedTask?.status !== column.status;
        
        return (
          <Card
            key={column.status}
            className="flex flex-col py-0"
          >
            <motion.div
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter(column.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-full"
            >
              {/* Column Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{column.label}</h3>
                  <Badge variant="secondary">
                    {columnTasks.length}
                  </Badge>
                </div>
              </div>

              {/* Task Cards Container */}
              <div 
                className={`flex-1 p-4 space-y-3 min-h-[400px] transition-colors ${
                  isDropTarget ? 'bg-muted/50' : ''
                }`}
              >
                <AnimatePresence mode="popLayout">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick(task)}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      isDragging={draggedTask?.id === task.id}
                    />
                  ))}
                </AnimatePresence>
                
                {columnTasks.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <p>{t('tasks.noTasks')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </Card>
        );
      })}
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

function TaskCard({ task, onClick, onDragStart, onDragEnd, isDragging }: TaskCardProps) {
  const { t } = useI18n();
  const priorityInfo = priorityConfig[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE;

  const priorityLabels: Record<TaskPriority, string> = {
    LOW: t('tasks.priorityLow'),
    MEDIUM: t('tasks.priorityMedium'),
    HIGH: t('tasks.priorityHigh'),
    URGENT: t('tasks.priorityUrgent'),
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        draggable
        onDragStart={(e) => onDragStart(e, task)}
        onDragEnd={onDragEnd}
        onClick={onClick}
        className={`cursor-grab active:cursor-grabbing transition-shadow py-0 ${
          isDragging ? 'opacity-50' : 'hover:shadow-md'
        }`}
      >
        <div className="p-3 space-y-2">
          {/* Priority & Overdue */}
          <div className="flex items-center justify-between">
            <Badge variant={priorityInfo.variant} className="text-xs">
              {priorityLabels[task.priority]}
            </Badge>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                {t('tasks.overdue')}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h4 className="font-medium text-sm line-clamp-2">
            {task.title}
          </h4>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(task.dueDate), 'MMM dd')}</span>
              </div>
            )}

            {!task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{format(new Date(task.createdAt), 'MMM dd')}</span>
              </div>
            )}

            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {task.createdBy?.slice(0, 2).toUpperCase() || 'UK'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}


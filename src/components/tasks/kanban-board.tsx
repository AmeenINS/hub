'use client';

import { Task, TaskStatus, TaskPriority } from '@/types/database';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

const statusColumns = [
  { status: TaskStatus.TODO, label: 'To Do', color: 'bg-slate-100 dark:bg-slate-800' },
  { status: TaskStatus.IN_PROGRESS, label: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/20' },
  { status: TaskStatus.DONE, label: 'Done', color: 'bg-green-100 dark:bg-green-900/20' },
];

const priorityConfig = {
  [TaskPriority.LOW]: { label: 'Low', color: 'bg-slate-500', emoji: '🟢' },
  [TaskPriority.MEDIUM]: { label: 'Medium', color: 'bg-yellow-500', emoji: '🟡' },
  [TaskPriority.HIGH]: { label: 'High', color: 'bg-orange-500', emoji: '🟠' },
  [TaskPriority.URGENT]: { label: 'Urgent', color: 'bg-red-500', emoji: '🔴' },
};

export default function KanbanBoard({ tasks, onTaskClick, onStatusChange }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== status) {
      onStatusChange(draggedTask.id, status);
    }
    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statusColumns.map((column) => (
        <div
          key={column.status}
          className="flex flex-col"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.status)}
        >
          {/* Column Header */}
          <div className={`p-4 rounded-t-lg ${column.color} border-b-2 border-border`}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{column.label}</h3>
              <Badge variant="secondary" className="ml-2">
                {getTasksByStatus(column.status).length}
              </Badge>
            </div>
          </div>

          {/* Task Cards */}
          <div className="flex-1 p-2 bg-muted/30 rounded-b-lg min-h-[500px] space-y-2">
            {getTasksByStatus(column.status).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                isDragging={draggedTask?.id === task.id}
              />
            ))}
            
            {getTasksByStatus(column.status).length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No tasks
              </div>
            )}
          </div>
        </div>
      ))}
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
  const priorityInfo = priorityConfig[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE;

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
      } ${isOverdue ? 'border-red-500 border-2' : ''}`}
    >
      {/* Priority Badge */}
      <div className="flex items-center justify-between mb-2">
        <Badge variant="outline" className="text-xs">
          <span className="mr-1">{priorityInfo.emoji}</span>
          {priorityInfo.label}
        </Badge>
        {isOverdue && (
          <Badge variant="destructive" className="text-xs">
            Overdue
          </Badge>
        )}
      </div>

      {/* Title */}
      <h4 className="font-medium text-sm mb-2 line-clamp-2">{task.title}</h4>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {/* Due Date */}
        {task.dueDate && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(task.dueDate), 'MMM dd')}</span>
          </div>
        )}

        {/* Created Time */}
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{format(new Date(task.createdAt), 'MMM dd')}</span>
        </div>
      </div>

      {/* Assignees */}
      <div className="flex items-center gap-1 mt-3">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-xs">
            {task.createdBy?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    </Card>
  );
}

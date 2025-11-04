'use client';

// React & utilities
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';

// Internal utilities
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { useI18n } from '@/lib/i18n/i18n-context';
import { getCombinedUserName, getUserInitials } from '@/lib/utils';

// Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, MessageSquare, History, X } from 'lucide-react';
import { toast } from 'sonner';

// Types
import { Task, TaskStatus, TaskPriority, TaskComment, TaskActivity } from '@/types/database';

interface TaskDetailDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export default function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  onUpdate,
  onRefresh,
}: TaskDetailDialogProps) {
  const { t } = useI18n();
  const [description, setDescription] = useState(task.description || '');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; fullNameEn: string; fullNameAr?: string; email: string }>>([]);
  const [assignments, setAssignments] = useState<Array<{ id: string; userId: string; taskId: string }>>([]);
  const [loading, setLoading] = useState(false);

  const priorityConfig = {
    [TaskPriority.LOW]: { emoji: '🟢' },
    [TaskPriority.MEDIUM]: { emoji: '🟡' },
    [TaskPriority.HIGH]: { emoji: '🟠' },
    [TaskPriority.URGENT]: { emoji: '🔴' },
  };

  const statusConfig = {
    [TaskStatus.TODO]: { color: 'bg-slate-500' },
    [TaskStatus.IN_PROGRESS]: { color: 'bg-blue-500' },
    [TaskStatus.DONE]: { color: 'bg-green-500' },
    [TaskStatus.CANCELLED]: { color: 'bg-red-500' },
  };

  const statusLabels: Record<TaskStatus, string> = {
    [TaskStatus.TODO]: t('tasks.status.todo'),
    [TaskStatus.IN_PROGRESS]: t('tasks.status.inProgress'),
    [TaskStatus.DONE]: t('tasks.status.done'),
    [TaskStatus.CANCELLED]: t('tasks.status.cancelled'),
  };

  const priorityLabels: Record<TaskPriority, string> = {
    [TaskPriority.LOW]: t('tasks.priorityLow'),
    [TaskPriority.MEDIUM]: t('tasks.priorityMedium'),
    [TaskPriority.HIGH]: t('tasks.priorityHigh'),
    [TaskPriority.URGENT]: t('tasks.priorityUrgent'),
  };

  const fetchTaskDetails = useCallback(async () => {
    try {
      const [commentsRes, activitiesRes, assignmentsRes] = await Promise.all([
        apiClient.get<TaskComment[]>(`/api/tasks/${task.id}/comments`),
        apiClient.get<TaskActivity[]>(`/api/tasks/${task.id}/activities`),
        apiClient.get<Array<{ id: string; userId: string; taskId: string }>>(`/api/tasks/${task.id}/assignments`),
      ]);

      if (commentsRes.success && commentsRes.data) {
        setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
      }

      if (activitiesRes.success && activitiesRes.data) {
        setActivities(Array.isArray(activitiesRes.data) ? activitiesRes.data : []);
      }

      if (assignmentsRes.success && assignmentsRes.data) {
        setAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch task details:', error);
    }
  }, [task.id]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await apiClient.get<Array<{ id: string; fullNameEn: string; fullNameAr?: string; email: string }>>('/api/users');
      if (response.success && response.data) {
        setUsers(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchTaskDetails();
      fetchUsers();
    }
  }, [open, task.id, fetchTaskDetails, fetchUsers]);

  const handleSaveDescription = async () => {
    if (description === task.description) {
      setIsEditingDescription(false);
      return;
    }

    setLoading(true);
    try {
      await onUpdate(task.id, { description });
      setIsEditingDescription(false);
      toast.success(t('tasks.descriptionUpdated'));
      await onRefresh();
    } catch (error) {
      toast.error(getErrorMessage(error, t('tasks.failedUpdate')));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setLoading(true);
    try {
      await onUpdate(task.id, { status: newStatus });
      toast.success(t('tasks.statusUpdated'));
      await fetchTaskDetails();
    } catch (error) {
      toast.error(getErrorMessage(error, t('tasks.failedUpdate')));
    } finally {
      setLoading(false);
    }
  };

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    setLoading(true);
    try {
      await onUpdate(task.id, { priority: newPriority });
      toast.success(t('tasks.priorityUpdated'));
    } catch (error) {
      toast.error(getErrorMessage(error, t('tasks.failedUpdate')));
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const response = await apiClient.post<TaskComment>(`/api/tasks/${task.id}/comments`, {
        content: newComment,
      });

      if (response.success) {
        setNewComment('');
        await fetchTaskDetails();
        toast.success(t('tasks.commentAdded'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('tasks.failedAddComment')));
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUser = async (userId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post<{ id: string; userId: string; taskId: string }>(`/api/tasks/${task.id}/assignments`, {
        userId,
      });

      if (response.success) {
        await fetchTaskDetails();
        toast.success(t('tasks.userAssigned'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('tasks.failedAssignUser')));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.delete(`/api/tasks/${task.id}/assignments/${assignmentId}`);

      if (response.success) {
        await fetchTaskDetails();
        toast.success(t('tasks.assignmentRemoved'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('tasks.failedRemoveAssignment')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{task.title}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status & Priority Badges */}
          <div className="flex gap-2 items-center flex-wrap">
            <Badge className={statusConfig[task.status].color}>
              {statusLabels[task.status]}
            </Badge>
            <Badge variant="outline">
              <span className="mr-1">{priorityConfig[task.priority].emoji}</span>
              {priorityLabels[task.priority]}
            </Badge>
            {task.dueDate && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.dueDate), 'MMM dd, yyyy')}
              </Badge>
            )}
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">
                <MessageSquare className="h-4 w-4 mr-2" />
                {t('tasks.details')}
              </TabsTrigger>
              <TabsTrigger value="comments">
                <MessageSquare className="h-4 w-4 mr-2" />
                {t('tasks.comments')} ({comments.length})
              </TabsTrigger>
              <TabsTrigger value="activity">
                <History className="h-4 w-4 mr-2" />
                {t('tasks.activity')} ({activities.length})
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{t('tasks.description')}</h3>
                  {!isEditingDescription && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingDescription(true)}
                    >
                      {t('common.edit')}
                    </Button>
                  )}
                </div>

                {isEditingDescription ? (
                  <div className="space-y-2">
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveDescription}
                        disabled={loading}
                      >
                        {t('common.save')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDescription(task.description || '');
                          setIsEditingDescription(false);
                        }}
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {task.description || t('tasks.noDescription')}
                  </p>
                )}
              </div>

              {/* Status & Priority Controls */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('tasks.taskStatus')}</label>
                  <Select
                    value={task.status}
                    onValueChange={(value) => handleStatusChange(value as TaskStatus)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TaskStatus).map((value) => (
                        <SelectItem key={value} value={value}>
                          {statusLabels[value as TaskStatus]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('tasks.taskPriority')}</label>
                  <Select
                    value={task.priority}
                    onValueChange={(value) => handlePriorityChange(value as TaskPriority)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TaskPriority).map((value) => (
                        <SelectItem key={value} value={value}>
                          <span className="mr-2">{priorityConfig[value as TaskPriority].emoji}</span>
                          {priorityLabels[value as TaskPriority]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Assigned Users */}
              <div className="space-y-2">
                <h3 className="font-semibold">{t('tasks.assignedUsers')}</h3>
                <div className="flex flex-wrap gap-2">
                  {assignments.map((assignment) => {
                    const user = users.find((u) => u.id === assignment.userId);
                    return user ? (
                      <Badge key={assignment.id} variant="secondary" className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {getUserInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{getCombinedUserName(user)}</span>
                        <button
                          onClick={() => handleRemoveAssignment(assignment.id)}
                          className="ml-1 hover:text-destructive"
                          title={t('common.remove')}
                          aria-label={t('common.remove')}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>

                {/* Assign User Dropdown */}
                <Select onValueChange={handleAssignUser} disabled={loading}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('tasks.assignUser')} />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((user) => !assignments.some((a) => a.userId === user.id))
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {getCombinedUserName(user)} ({user.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments" className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t('tasks.addComment')}
                  rows={3}
                />
                <Button onClick={handleAddComment} disabled={loading || !newComment.trim()}>
                  {t('tasks.postComment')}
                </Button>
              </div>

              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('tasks.noComments')}
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {comment.userId?.slice(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {comment.userId || t('common.unknown')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-2">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('tasks.noActivity')}
                </p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="border-l-2 border-primary pl-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {activity.userId || t('common.system')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.type} {activity.comment && `- ${activity.comment}`}
                    </p>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

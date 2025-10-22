'use client';

import { Task, TaskStatus, TaskPriority, TaskComment, TaskActivity } from '@/types/database';
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
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface TaskDetailDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const priorityConfig = {
  [TaskPriority.LOW]: { label: 'Low', emoji: '🟢' },
  [TaskPriority.MEDIUM]: { label: 'Medium', emoji: '🟡' },
  [TaskPriority.HIGH]: { label: 'High', emoji: '🟠' },
  [TaskPriority.URGENT]: { label: 'Urgent', emoji: '🔴' },
};

const statusConfig = {
  [TaskStatus.TODO]: { label: 'To Do', color: 'bg-slate-500' },
  [TaskStatus.IN_PROGRESS]: { label: 'In Progress', color: 'bg-blue-500' },
  [TaskStatus.DONE]: { label: 'Done', color: 'bg-green-500' },
  [TaskStatus.CANCELLED]: { label: 'Cancelled', color: 'bg-red-500' },
};

export default function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  onUpdate,
  onRefresh,
}: TaskDetailDialogProps) {
  const [description, setDescription] = useState(task.description || '');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; firstName: string; lastName: string; email: string }>>([]);
  const [assignments, setAssignments] = useState<Array<{ id: string; userId: string; taskId: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTaskDetails();
      fetchUsers();
    }
  }, [open, task.id]);

  const fetchTaskDetails = async () => {
    try {
      // Fetch comments
      const commentsRes = await fetch(`/api/tasks/${task.id}/comments`);
      if (commentsRes.ok) {
        const data = await commentsRes.json();
        setComments(data.comments || []);
      }

      // Fetch activities
      const activitiesRes = await fetch(`/api/tasks/${task.id}/activities`);
      if (activitiesRes.ok) {
        const data = await activitiesRes.json();
        setActivities(data.activities || []);
      }

      // Fetch assignments
      const assignmentsRes = await fetch(`/api/tasks/${task.id}/assignments`);
      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Failed to fetch task details:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSaveDescription = async () => {
    if (description === task.description) {
      setIsEditingDescription(false);
      return;
    }

    setLoading(true);
    try {
      await onUpdate(task.id, { description });
      setIsEditingDescription(false);
      toast.success('Description updated');
      await onRefresh();
    } catch (error) {
      toast.error('Failed to update description');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setLoading(true);
    try {
      await onUpdate(task.id, { status: newStatus });
      toast.success('Status updated');
      await fetchTaskDetails();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    setLoading(true);
    try {
      await onUpdate(task.id, { priority: newPriority });
      toast.success('Priority updated');
      await fetchTaskDetails();
    } catch (error) {
      toast.error('Failed to update priority');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        setNewComment('');
        toast.success('Comment added');
        await fetchTaskDetails();
      } else {
        toast.error('Failed to add comment');
      }
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUser = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        toast.success('User assigned');
        await fetchTaskDetails();
      } else {
        toast.error('Failed to assign user');
      }
    } catch (error) {
      toast.error('Failed to assign user');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignUser = async (assignmentId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/assignments/${assignmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('User unassigned');
        await fetchTaskDetails();
      } else {
        toast.error('Failed to unassign user');
      }
    } catch (error) {
      toast.error('Failed to unassign user');
    } finally {
      setLoading(false);
    }
  };

  const getUserById = (userId: string) => {
    return users.find((u) => u.id === userId);
  };

  const getActivityDescription = (activity: TaskActivity) => {
    const user = getUserById(activity.userId);
    const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown';

    switch (activity.type) {
      case 'CREATED':
        return `${userName} created this task`;
      case 'STATUS_CHANGED':
        return `${userName} changed status from ${activity.oldValue} to ${activity.newValue}`;
      case 'PRIORITY_CHANGED':
        return `${userName} changed priority from ${activity.oldValue} to ${activity.newValue}`;
      case 'ASSIGNED':
        return `${userName} assigned this task`;
      case 'UNASSIGNED':
        return `${userName} unassigned from this task`;
      case 'COMMENT_ADDED':
        return `${userName} added a comment`;
      case 'UPDATED':
        return `${userName} updated this task`;
      case 'DUE_DATE_CHANGED':
        return `${userName} changed due date`;
      default:
        return `${userName} performed an action`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{task.title}</DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={statusConfig[task.status].color}>
                  {statusConfig[task.status].label}
                </Badge>
                <Badge variant="outline">
                  <span className="mr-1">{priorityConfig[task.priority].emoji}</span>
                  {priorityConfig[task.priority].label}
                </Badge>
                {task.dueDate && (
                  <Badge variant="secondary">
                    <Calendar className="h-3 w-3 mr-1" />
                    Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="activity">
              <History className="h-4 w-4 mr-2" />
              Activity ({activities.length})
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              {isEditingDescription ? (
                <div className="space-y-2">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    placeholder="Add a description..."
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveDescription} disabled={loading}>
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDescription(task.description || '');
                        setIsEditingDescription(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="p-4 border rounded-md cursor-pointer hover:bg-muted/50"
                  onClick={() => setIsEditingDescription(true)}
                >
                  {description || (
                    <span className="text-muted-foreground italic">
                      Click to add description...
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={task.status} onValueChange={handleStatusChange} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Select value={task.priority} onValueChange={handlePriorityChange} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        <span className="mr-2">{config.emoji}</span>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assignees */}
            <div>
              <h3 className="font-semibold mb-2">Assignees</h3>
              <div className="space-y-2">
                {assignments.map((assignment) => {
                  const user = getUserById(assignment.userId);
                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-2 border rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {user
                              ? `${user.firstName[0]}${user.lastName[0]}`
                              : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {user ? `${user.firstName} ${user.lastName}` : 'Unknown User'}
                          </p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnassignUser(assignment.id)}
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}

                {/* Add Assignee */}
                <Select onValueChange={handleAssignUser} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add assignee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(
                        (u) => !assignments.some((a) => a.userId === u.id)
                      )
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm">
                  {format(new Date(task.createdAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm">
                  {format(new Date(task.updatedAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="space-y-4">
            {/* Add Comment */}
            <div className="space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddComment} disabled={loading || !newComment.trim()}>
                Add Comment
              </Button>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.map((comment) => {
                const user = getUserById(comment.userId);
                return (
                  <div key={comment.id} className="p-4 border rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {user ? `${user.firstName[0]}${user.lastName[0]}` : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">
                        {user ? `${user.firstName} ${user.lastName}` : 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                );
              })}

              {comments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No comments yet. Be the first to comment!
                </div>
              )}
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-3">
            {activities.map((activity) => {
              const user = getUserById(activity.userId);
              return (
                <div key={activity.id} className="flex gap-3 p-3 border rounded-md">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {user ? `${user.firstName[0]}${user.lastName[0]}` : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm">{getActivityDescription(activity)}</p>
                    {activity.comment && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.comment}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              );
            })}

            {activities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No activity yet
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

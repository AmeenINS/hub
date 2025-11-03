'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Calendar, User, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n/i18n-context';
import { useAuthStore } from '@/store/auth-store';
import { RTLChevron } from '@/components/ui/rtl-icon';
import { getCombinedUserName } from '@/lib/utils';

interface User {
  id: string;
  fullNameEn: string;
  fullNameAr?: string;
  email: string;
}

export default function EditTaskPage() {
  const { t } = useI18n();
  const { token } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const taskSchema = z.object({
    title: z.string().min(1, t('validation.titleRequired')),
    description: z.string().min(1, t('validation.descriptionRequired')),
    status: z.enum(['todo', 'in-progress', 'completed']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    assigneeId: z.string().optional(),
    dueDate: z.string().optional(),
  });
  
  const [loading, setLoading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [users, setUsers] = React.useState<User[]>([]);
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    status: 'todo' as 'todo' | 'in-progress' | 'completed',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    assigneeId: '',
    dueDate: '',
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch task details
        const taskResponse = await fetch(`/api/tasks/${taskId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        // Fetch users for assignee selection
        const usersResponse = await fetch('/api/users', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (taskResponse.ok && usersResponse.ok) {
          const taskData = await taskResponse.json();
          const usersData = await usersResponse.json();

          if (taskData.success) {
            const task = taskData.data;
            // Convert status and priority from uppercase to lowercase for form
            const statusMap: Record<string, 'todo' | 'in-progress' | 'completed'> = {
              'TODO': 'todo',
              'IN_PROGRESS': 'in-progress',
              'DONE': 'completed',
              'COMPLETED': 'completed',
            };
            const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'urgent'> = {
              'LOW': 'low',
              'MEDIUM': 'medium',
              'HIGH': 'high',
              'URGENT': 'urgent',
            };
            
            setFormData({
              title: task.title,
              description: task.description,
              status: statusMap[task.status] || 'todo',
              priority: priorityMap[task.priority] || 'medium',
              assigneeId: task.assigneeId || '',
              dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
            });
          } else {
            toast.error(t('tasks.fetchError'));
            router.push('/dashboard/tasks');
          }

          if (usersData.success) {
            setUsers(usersData.data || []);
          }
        } else {
          toast.error(t('tasks.fetchError'));
          router.push('/dashboard/tasks');
        }
      } catch (error) {
        console.error('Failed to fetch task:', error);
        toast.error(t('tasks.fetchError'));
        router.push('/dashboard/tasks');
      } finally {
        setInitialLoading(false);
      }
    };

    if (taskId) {
      fetchData();
    }
  }, [taskId, token, t, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = taskSchema.parse(formData);
      setErrors({});
      setLoading(true);

      // Convert status and priority to uppercase for API
      const statusMap: Record<string, string> = {
        'todo': 'TODO',
        'in-progress': 'IN_PROGRESS',
        'completed': 'DONE',
      };
      const priorityMap: Record<string, string> = {
        'low': 'LOW',
        'medium': 'MEDIUM',
        'high': 'HIGH',
        'urgent': 'URGENT',
      };

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: validatedData.title,
          description: validatedData.description,
          status: statusMap[validatedData.status],
          priority: priorityMap[validatedData.priority],
          assigneeId: validatedData.assigneeId || null,
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate).toISOString() : null,
        }),
      });

      if (response.ok) {
        toast.success(t('tasks.updateSuccess'));
        router.push('/dashboard/tasks');
      } else {
        let errorMessage = t('tasks.updateError');
        try {
          const data = await response.json();
          errorMessage = data.message || errorMessage;
        } catch {
          // Response has no JSON body, use default error message
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        console.error('Failed to update task:', error);
        toast.error(t('tasks.updateError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('messages.deleteConfirm') + ' ' + formData.title + '?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        toast.success(t('messages.deleteSuccess'));
        router.push('/dashboard/tasks');
      } else {
        let errorMessage = t('messages.deleteError');
        try {
          const data = await response.json();
          errorMessage = data.message || errorMessage;
        } catch {
          // Response has no JSON body, use default error message
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error(t('messages.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'todo':
        return <Badge variant="secondary">{t('tasks.status.todo')}</Badge>;
      case 'in-progress':
        return <Badge variant="default">{t('tasks.status.inProgress')}</Badge>;
      case 'completed':
        return <Badge variant="outline">{t('tasks.status.completed')}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge variant="secondary">{t('tasks.priority.low')}</Badge>;
      case 'medium':
        return <Badge variant="default">{t('tasks.priority.medium')}</Badge>;
      case 'high':
        return <Badge variant="destructive">{t('tasks.priority.high')}</Badge>;
      case 'urgent':
        return <Badge variant="destructive">{t('tasks.priority.urgent')}</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.back()}
          >
            <RTLChevron>
              <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            </RTLChevron>
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight ltr:text-left rtl:text-right">
              {t('tasks.edit')}
            </h1>
            <p className="text-muted-foreground mt-2 ltr:text-left rtl:text-right">
              {t('tasks.editDescription')}
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
          {deleting ? t('common.loading') : t('common.delete')}
        </Button>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {t('tasks.currentStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium ltr:text-left rtl:text-right">{t('tasks.taskStatus')}:</span>
              {getStatusBadge(formData.status)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium ltr:text-left rtl:text-right">{t('tasks.taskPriority')}:</span>
              {getPriorityBadge(formData.priority)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('tasks.details')}</CardTitle>
          <CardDescription>
            {t('tasks.formDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="ltr:text-left rtl:text-right">{t('tasks.taskTitle')}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder={t('tasks.titlePlaceholder')}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500 ltr:text-left rtl:text-right">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="ltr:text-left rtl:text-right">{t('tasks.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t('tasks.descriptionPlaceholder')}
                className={errors.description ? 'border-red-500' : ''}
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-red-500 ltr:text-left rtl:text-right">{errors.description}</p>
              )}
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="ltr:text-left rtl:text-right">{t('tasks.taskStatus')}</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'todo' | 'in-progress' | 'completed') => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">{t('tasks.status.todo')}</SelectItem>
                    <SelectItem value="in-progress">{t('tasks.status.inProgress')}</SelectItem>
                    <SelectItem value="completed">{t('tasks.status.done')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="ltr:text-left rtl:text-right">{t('tasks.taskPriority')}</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => handleInputChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('tasks.priority.low')}</SelectItem>
                    <SelectItem value="medium">{t('tasks.priority.medium')}</SelectItem>
                    <SelectItem value="high">{t('tasks.priority.high')}</SelectItem>
                    <SelectItem value="urgent">{t('tasks.priority.urgent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assignee and Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assigneeId" className="ltr:text-left rtl:text-right">
                  <User className="h-4 w-4 inline ltr:mr-2 rtl:ml-2" />
                  {t('tasks.assignee')}
                </Label>
                <Select 
                  value={formData.assigneeId || 'unassigned'} 
                  onValueChange={(value) => handleInputChange('assigneeId', value === 'unassigned' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('tasks.selectAssignee')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">{t('tasks.unassigned')}</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {getCombinedUserName(user)} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate" className="ltr:text-left rtl:text-right">
                  <Calendar className="h-4 w-4 inline ltr:mr-2 rtl:ml-2" />
                  {t('tasks.dueDate')}
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {loading ? t('common.loading') : t('common.save')}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.back()}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

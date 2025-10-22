'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/store/auth-store';
import { useI18n } from '@/lib/i18n/i18n-context';
import { TaskPriority } from '@/types/database';

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.string().optional(),
  assignees: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export default function NewTaskPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { token } = useAuthStore();
  const [loading, setLoading] = React.useState(false);
  const [users, setUsers] = React.useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(true);
  const [selectedAssignees, setSelectedAssignees] = React.useState<string[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      dueDate: '',
      assignees: [],
    },
  });

  // Fetch users (self + subordinates) on mount
  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setUsers(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (token) {
      fetchUsers();
    }
  }, [token]);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      
      const payload = {
        title: data.title,
        description: data.description || '',
        priority: data.priority,
        dueDate: data.dueDate || undefined,
        assignees: selectedAssignees,
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create task');
      }

      toast.success(t('messages.createSuccess'));
      router.push('/dashboard/tasks');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error instanceof Error ? error.message : t('messages.createError'));
    } finally {
      setLoading(false);
    }
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/tasks')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t('tasks.createTask')}
          </h2>
          <p className="text-muted-foreground">
            Create a new task and assign to team members
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('tasks.createTask')}</CardTitle>
          <CardDescription>
            Fill in the details to create a new task
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tasks.taskTitle')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Task title..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tasks.description')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Task description..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tasks.taskPriority')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TaskPriority.LOW}>
                            🟢 Low
                          </SelectItem>
                          <SelectItem value={TaskPriority.MEDIUM}>
                            🟡 Medium
                          </SelectItem>
                          <SelectItem value={TaskPriority.HIGH}>
                            🟠 High
                          </SelectItem>
                          <SelectItem value={TaskPriority.URGENT}>
                            🔴 Urgent
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tasks.dueDate')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <FormLabel>Assign to Team Members</FormLabel>
                  <FormDescription>
                    Select team members to assign this task (optional)
                  </FormDescription>
                </div>

                {loadingUsers ? (
                  <div className="text-sm text-muted-foreground">
                    Loading team members...
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No team members available
                  </div>
                ) : (
                  <div className="space-y-2 border rounded-lg p-4 max-h-64 overflow-y-auto">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                        onClick={() => toggleAssignee(user.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAssignees.includes(user.id)}
                          onChange={() => toggleAssignee(user.id)}
                          className="h-4 w-4 rounded border-gray-300"
                          aria-label={`Assign task to ${user.firstName} ${user.lastName}`}
                        />
                        <label className="flex-1 cursor-pointer">
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {selectedAssignees.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {selectedAssignees.length} team member(s)
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/tasks')}
                  disabled={loading}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {t('common.create')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

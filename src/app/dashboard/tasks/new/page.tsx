'use client';

// React & Next.js
import * as React from 'react';
import { useRouter } from 'next/navigation';

// External libraries
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Internal utilities
import { apiClient, getErrorMessage } from '@/core/api/client';
import { useI18n } from '@/shared/i18n/i18n-context';
import { getCombinedUserName } from '@/core/utils';

// Components
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { RTLChevron } from '@/shared/components/ui/rtl-icon';

// Types
import { TaskPriority } from '@/shared/types/database';

// Types & Interfaces
interface User {
  id: string;
  email: string;
  fullNameEn: string;
  fullNameAr?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Component
export default function NewTaskPage() {
  const router = useRouter();
  const { t } = useI18n();

  const formSchema = z.object({
    title: z.string().min(3, t('validation.titleMinLength')),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    dueDate: z.string().optional(),
    assignees: z.array(z.string()).optional(),
  });

  type FormData = z.infer<typeof formSchema>;

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

  // Fetch users on mount
  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiClient.get<ApiResponse<User[]>>('/api/users');

        if (response.success && response.data) {
          setUsers(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

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

      const response = await apiClient.post<ApiResponse<unknown>>('/api/tasks', payload);

      if (response.success) {
        toast.success(t('messages.createSuccess'));
        router.push('/dashboard/tasks');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('messages.createError')));
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
          <RTLChevron>
            <ArrowLeft className="h-4 w-4" />
          </RTLChevron>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight ltr:text-left rtl:text-right">
            {t('tasks.createTask')}
          </h2>
          <p className="text-muted-foreground ltr:text-left rtl:text-right">
            {t('tasks.createDescription')}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('tasks.createTask')}</CardTitle>
          <CardDescription>
            {t('tasks.fillDetails')}
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
                    <FormLabel className="ltr:text-left rtl:text-right">{t('tasks.taskTitle')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('tasks.titleLabel')} {...field} />
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
                    <FormLabel className="ltr:text-left rtl:text-right">{t('tasks.description')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('tasks.descriptionLabel')}
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
                      <FormLabel className="ltr:text-left rtl:text-right">{t('tasks.taskPriority')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('tasks.selectPriority')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TaskPriority.LOW}>
                            🟢 {t('tasks.priorityLow')}
                          </SelectItem>
                          <SelectItem value={TaskPriority.MEDIUM}>
                            🟡 {t('tasks.priorityMedium')}
                          </SelectItem>
                          <SelectItem value={TaskPriority.HIGH}>
                            🟠 {t('tasks.priorityHigh')}
                          </SelectItem>
                          <SelectItem value={TaskPriority.URGENT}>
                            🔴 {t('tasks.priorityUrgent')}
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
                      <FormLabel className="ltr:text-left rtl:text-right">{t('tasks.dueDate')}</FormLabel>
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
                  <FormLabel className="ltr:text-left rtl:text-right">{t('tasks.assignToMembers')}</FormLabel>
                  <FormDescription className="ltr:text-left rtl:text-right">
                    {t('tasks.assignDescription')}
                  </FormDescription>
                </div>

                {loadingUsers ? (
                  <div className="text-sm text-muted-foreground ltr:text-left rtl:text-right">
                    {t('tasks.loadingMembers')}
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-sm text-muted-foreground ltr:text-left rtl:text-right">
                    {t('tasks.noMembers')}
                  </div>
                ) : (
                  <div className="space-y-2 border rounded-lg p-4 max-h-64 overflow-y-auto">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                        onClick={() => toggleAssignee(user.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAssignees.includes(user.id)}
                          onChange={() => toggleAssignee(user.id)}
                          className="h-4 w-4 rounded border-gray-300 ltr:mr-2 rtl:ml-2"
                          aria-label={getCombinedUserName(user)}
                        />
                        <label className="flex-1 cursor-pointer">
                          <div className="font-medium ltr:text-left rtl:text-right">
                            {getCombinedUserName(user)}
                          </div>
                          <div className="text-sm text-muted-foreground ltr:text-left rtl:text-right">
                            {user.email}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {selectedAssignees.length > 0 && (
                  <div className="text-sm text-muted-foreground ltr:text-left rtl:text-right">
                    {t('tasks.selected')}: {selectedAssignees.length} {t('tasks.teamMembers')}
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
                      <span className="animate-spin ltr:mr-2 rtl:ml-2">⏳</span>
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <Save className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
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

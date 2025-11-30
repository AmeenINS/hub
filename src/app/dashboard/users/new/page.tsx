'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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
import { Switch } from '@/shared/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useI18n } from '@/shared/i18n/i18n-context';
import { RTLChevron } from '@/shared/components/ui/rtl-icon';
import { ImageUpload } from '@/shared/components/ui/image-upload';
import { apiClient, getErrorMessage } from '@/core/api/client';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullNameEn: z.string().min(2, 'Full name must be at least 2 characters'),
  fullNameAr: z.string().optional(),
  phoneNumber: z.string().optional(),
  roleId: z.string().min(1, 'Please select a role'),
  position: z.string().optional(),
  department: z.string().optional(),
  managerId: z.string().optional(),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface Role {
  id: string;
  name: string;
  description: string;
}

interface Position {
  id: string;
  name: string;
  nameAr?: string;
}

interface User {
  id: string;
  email: string;
  fullNameEn: string;
  fullNameAr?: string;
}

export default function NewUserPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = React.useState(false);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = React.useState(true);
  const [positions, setPositions] = React.useState<Position[]>([]);
  const [loadingPositions, setLoadingPositions] = React.useState(true);
  const [users, setUsers] = React.useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(true);
  const [avatarUrl, setAvatarUrl] = React.useState<string>('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      fullNameEn: '',
      fullNameAr: '',
      phoneNumber: '',
      roleId: '',
      position: '',
      department: '',
      managerId: undefined,
      isActive: true,
    },
  });

  // Fetch roles, positions and users on mount
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel
        const [rolesResponse, positionsResponse, usersResponse] = await Promise.all([
          apiClient.get<Role[]>('/api/roles'),
          apiClient.get<Position[]>('/api/positions'),
          apiClient.get<User[]>('/api/users'),
        ]);

        // Set roles
        if (rolesResponse.success && rolesResponse.data) {
          setRoles(Array.isArray(rolesResponse.data) ? rolesResponse.data : []);
        }
        setLoadingRoles(false);

        // Set positions
        if (positionsResponse.success && positionsResponse.data) {
          setPositions(Array.isArray(positionsResponse.data) ? positionsResponse.data : []);
        }
        setLoadingPositions(false);

        // Set users
        if (usersResponse.success && usersResponse.data) {
          setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
        }
        setLoadingUsers(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(getErrorMessage(error, t('messages.errorFetchingData')));
        setLoadingRoles(false);
        setLoadingPositions(false);
        setLoadingUsers(false);
      }
    };

    fetchData();
  }, [t]);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      
      // Include avatarUrl if uploaded
      const userData = {
        ...data,
        ...(avatarUrl && { avatarUrl }),
      };
      
      const response = await apiClient.post('/api/users', userData);

      if (response.success) {
        toast.success(response.message || t('messages.createSuccess'));
        router.push('/dashboard/users');
      } else {
        toast.error(response.message || t('messages.createError'));
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(getErrorMessage(error, t('messages.createError')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t('users.createUser')}
          </h2>
          <p className="text-muted-foreground">
            {t('users.userDetails')}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('users.createUser')}</CardTitle>
          <CardDescription>
            Fill in the details to create a new user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Avatar Upload Section */}
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-base">Profile Picture</CardTitle>
                  <CardDescription>
                    Upload a profile picture for the new user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    onUploadComplete={(file) => {
                      setAvatarUrl(file.fileUrl);
                      toast.success('Avatar uploaded successfully');
                    }}
                    onUploadError={(error) => {
                      toast.error(error);
                    }}
                    variant="card"
                    size="sm"
                    maxSize={5 * 1024 * 1024} // 5MB
                    currentImageUrl={avatarUrl}
                  />
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fullNameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users.fullNameEn') || 'Full Name (English)'}</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormDescription>
                        {t('users.fullNameEnDescription') || 'Enter the full name in English'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fullNameAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users.fullNameAr') || 'Full Name (Arabic)'}</FormLabel>
                      <FormControl>
                        <Input placeholder="محمد أحمد" dir="rtl" {...field} />
                      </FormControl>
                      <FormDescription>
                        {t('users.fullNameArDescription') || 'Optional: enter the full name in Arabic'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.email')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john.doe@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.password')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormDescription>
                      Password must be at least 6 characters long
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users.phoneNumber')}</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users.position')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loadingPositions}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingPositions ? 'Loading...' : t('users.selectPosition')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">{t('users.noPosition')}</SelectItem>
                          {positions.map((position) => (
                            <SelectItem key={position.id} value={position.id}>
                              {[position.name, position.nameAr].filter(Boolean).join(' / ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t('users.positionDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users.department')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('users.departmentPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users.role')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={loadingRoles}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingRoles ? 'Loading...' : 'Select a role'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {roles.find(r => r.id === field.value)?.description || 'Select a role for this user'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manager (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value || undefined)}
                      value={field.value}
                      disabled={loadingUsers}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingUsers ? 'Loading...' : 'No Manager (Optional)'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {[user.fullNameEn, user.fullNameAr].filter(Boolean).join(' / ') || user.email} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select a manager for this user (defines reporting hierarchy)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t('users.active')}
                      </FormLabel>
                      <FormDescription>
                        Enable or disable this user account
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch dir="ltr"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/users')}
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

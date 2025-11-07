'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
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
import { UserAvatarUpload } from '@/features/dashboard/components/user-avatar-upload';
import { apiClient, getErrorMessage } from '@/core/api/client';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
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
  phoneNumber?: string;
  position?: string;
  department?: string;
  managerId?: string;
  isActive: boolean;
  avatarUrl?: string;
}

interface UserRole {
  userId: string;
  roleId: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { t } = useI18n();
  
  const [loading, setLoading] = React.useState(false);
  const [loadingData, setLoadingData] = React.useState(true);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [positions, setPositions] = React.useState<Position[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [userData, setUserData] = React.useState<User | null>(null);
  const [userRoles, setUserRoles] = React.useState<UserRole[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
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

  // Fetch all data on mount
  React.useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoadingData(true);

        // Fetch all data in parallel
        const [rolesResponse, positionsResponse, usersResponse, userResponse, userRolesResponse] = 
          await Promise.all([
            apiClient.get<Role[]>('/api/roles'),
            apiClient.get<Position[]>('/api/positions'),
            apiClient.get<User[]>('/api/users'),
            apiClient.get<User>(`/api/users/${userId}`),
            apiClient.get<UserRole[]>(`/api/users/${userId}/roles`),
          ]);

        // Set roles
        if (rolesResponse.success && rolesResponse.data) {
          setRoles(Array.isArray(rolesResponse.data) ? rolesResponse.data : []);
        }

        // Set positions
        if (positionsResponse.success && positionsResponse.data) {
          setPositions(Array.isArray(positionsResponse.data) ? positionsResponse.data : []);
        }

        // Set users
        if (usersResponse.success && usersResponse.data) {
          const usersArray = Array.isArray(usersResponse.data) ? usersResponse.data : [];
          setUsers(usersArray.filter((u: User) => u.id !== userId));
        }

        // Set user data
        if (userResponse.success && userResponse.data) {
          setUserData(userResponse.data as User);
        }

        // Set user roles
        if (userRolesResponse.success && userRolesResponse.data) {
          const rolesArray = Array.isArray(userRolesResponse.data) ? userRolesResponse.data : [];
          console.log('📋 Fetched user roles:', rolesArray);
          setUserRoles(rolesArray);
        } else {
          console.warn('⚠️ No user roles data in response:', userRolesResponse);
          setUserRoles([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(getErrorMessage(error, t('users.fetchError')));
        router.push('/dashboard/users');
      } finally {
        setLoadingData(false);
      }
    };

    if (userId) {
      fetchAllData();
    }
  }, [userId, router, t]);

  // Populate form when data is ready
  React.useEffect(() => {
    if (!userData || positions.length === 0) return;

    console.log('📝 Populating form with user data...');
    console.log('User roles:', userRoles);

    let currentRoleId = '';
    if (userRoles.length > 0) {
      currentRoleId = userRoles[0].roleId;
      console.log('Current role ID:', currentRoleId);
    } else {
      console.warn('⚠️ No role assigned to user');
    }

    // Convert position name to ID if needed
    let positionValue = 'none';
    if (userData.position) {
      // Check if position is already an ID
      const positionExists = positions.find(p => p.id === userData.position);
      if (positionExists) {
        positionValue = userData.position;
      } else {
        // Try to find by name
        const positionByName = positions.find(p => p.name === userData.position);
        if (positionByName) {
          positionValue = positionByName.id;
        }
      }
    }

    // Populate form with user data
    const formData = {
      email: userData.email || '',
      fullNameEn: userData.fullNameEn || '',
      fullNameAr: userData.fullNameAr || '',
      phoneNumber: userData.phoneNumber || '',
      roleId: currentRoleId,
      position: positionValue,
      department: userData.department || '',
      managerId: userData.managerId || 'none',
      isActive: userData.isActive !== false,
    };
    
    form.reset(formData);
  }, [userData, userRoles, positions, form]);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      console.log('=== Submitting User Update ===');
      console.log('User ID:', userId);
      console.log('Current Role ID:', userRoles.length > 0 ? userRoles[0].roleId : 'none');
      console.log('New Role ID:', data.roleId);

      // Update user basic info
      const userUpdatePayload = {
        email: data.email,
        fullNameEn: data.fullNameEn,
        fullNameAr: data.fullNameAr || null,
        phoneNumber: data.phoneNumber || null,
        position: data.position && data.position !== 'none' ? data.position : null,
        department: data.department || null,
        managerId: data.managerId && data.managerId !== 'none' ? data.managerId : null,
        isActive: data.isActive,
      };

      const userResponse = await apiClient.patch(`/api/users/${userId}`, userUpdatePayload);

      if (!userResponse.success) {
        throw new Error(userResponse.message || 'Failed to update user');
      }

      console.log('✅ User info updated');

      // Update user role if changed
      const currentRoleId = userRoles.length > 0 ? userRoles[0].roleId : '';
      if (data.roleId !== currentRoleId) {
        console.log('🔄 Updating role...');
        const roleResponse = await apiClient.put(`/api/users/${userId}/roles`, {
          roleId: data.roleId,
        });

        if (!roleResponse.success) {
          throw new Error(roleResponse.message || 'Failed to update role');
        }
        console.log('✅ Role updated');
      } else {
        console.log('⏭️  Role unchanged');
      }

      toast.success(t('messages.updateSuccess'));
      
      // Refetch data to show updated role
      const [updatedRolesResponse] = await Promise.all([
        apiClient.get<UserRole[]>(`/api/users/${userId}/roles`),
      ]);
      
      if (updatedRolesResponse.success && updatedRolesResponse.data) {
        setUserRoles(Array.isArray(updatedRolesResponse.data) ? updatedRolesResponse.data : []);
      }
      
      router.push('/dashboard/users');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(getErrorMessage(error, t('messages.updateError')));
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('users.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/users')}
        >
          <RTLChevron>
            <ArrowLeft className="h-4 w-4" />
          </RTLChevron>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t('users.editUser')}
          </h2>
          <p className="text-muted-foreground">
            {t('users.userDetails')}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('users.editUser')}</CardTitle>
          <CardDescription>
            Update user information and settings
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
                    Update the user&apos;s profile picture
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserAvatarUpload
                    userId={userId}
                    currentAvatarUrl={userData.avatarUrl}
                    userFullName={userData.fullNameEn}
                    onAvatarUpdated={(newUrl: string) => {
                      setUserData(prev => prev ? { ...prev, avatarUrl: newUrl } : null);
                    }}
                    variant="card"
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
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('users.selectPosition')} />
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
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
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
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="No Manager (Optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Manager</SelectItem>
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {t('common.save')}
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

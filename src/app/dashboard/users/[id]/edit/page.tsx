'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/store/auth-store';
import { useI18n } from '@/lib/i18n/i18n-context';
import { RTLChevron } from '@/components/ui/rtl-icon';

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
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { t } = useI18n();
  const { token } = useAuthStore();
  const [loading, setLoading] = React.useState(false);
  const [loadingData, setLoadingData] = React.useState(true);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [positions, setPositions] = React.useState<Position[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [userData, setUserData] = React.useState<User | null>(null);
  const [userRoles, setUserRoles] = React.useState<{ id: string; roleId: string }[]>([]);

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

  // Fetch initial data (roles, positions, users) - only once
  React.useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch roles
        const rolesResponse = await fetch('/api/roles', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (rolesResponse.ok) {
          const rolesResult = await rolesResponse.json();
          if (rolesResult.success) {
            setRoles(rolesResult.data);
          }
        }

        // Fetch positions
        const positionsResponse = await fetch('/api/positions');
        if (positionsResponse.ok) {
          const positionsData = await positionsResponse.json();
          setPositions(positionsData);
        }

        // Fetch users for manager selection
        const usersResponse = await fetch('/api/users', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (usersResponse.ok) {
          const usersResult = await usersResponse.json();
          if (usersResult.success) {
            setUsers(usersResult.data.filter((u: User) => u.id !== userId));
          }
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    if (token) {
      fetchInitialData();
    }
  }, [token, userId]);

  // Fetch user data and populate form
  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoadingData(true);

        // Fetch user data
        const userResponse = await fetch(`/api/users/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user');
        }

        const userResult = await userResponse.json();
        const fetchedUserData = userResult.success ? userResult.data : userResult;
        
        setUserData(fetchedUserData);

        // Get user's current role
        const userRolesResponse = await fetch(`/api/users/${userId}/roles`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (userRolesResponse.ok) {
          const fetchedUserRoles = await userRolesResponse.json();
          setUserRoles(fetchedUserRoles);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error(t('users.fetchError'));
        router.push('/dashboard/users');
      } finally {
        setLoadingData(false);
      }
    };

    if (userId && token) {
      fetchUserData();
    }
  }, [userId, token, router, t]);

  // Populate form when data is ready
  React.useEffect(() => {
    if (!userData || positions.length === 0) return;

    let currentRoleId = '';
    if (userRoles.length > 0) {
      currentRoleId = userRoles[0].roleId;
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
    
    console.log('Form data to populate:', formData);
    
    form.reset(formData);
  }, [userData, userRoles, positions, form]);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      // Update user basic info
      const userResponse = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: data.email,
          fullNameEn: data.fullNameEn,
          fullNameAr: data.fullNameAr || undefined,
          phoneNumber: data.phoneNumber,
          position: data.position && data.position !== 'none' ? data.position : undefined,
          department: data.department,
          managerId: data.managerId && data.managerId !== 'none' ? data.managerId : undefined,
          isActive: data.isActive,
        }),
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        console.error('Failed to update user:', errorData);
        throw new Error(errorData.error || 'Failed to update user');
      }

      // Update user role
      if (data.roleId) {
        const roleResponse = await fetch(`/api/users/${userId}/roles`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ roleId: data.roleId }),
        });

        if (!roleResponse.ok) {
          console.error('Failed to update role');
        }
      }

      toast.success(t('users.updateSuccess'));
      router.push('/dashboard/users');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(t('users.updateError'));
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <RTLChevron>
            <ArrowLeft className="h-5 w-5" />
          </RTLChevron>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('users.editUser')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('users.editUserDescription')}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('users.basicInformation')}</CardTitle>
              <CardDescription>
                {t('users.basicInformationDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullNameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users.fullNameEn') || 'Full Name (English)'}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Doe" />
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
                        <Input {...field} dir="rtl" placeholder="محمد أحمد" />
                      </FormControl>
                      <FormDescription>
                        {t('users.fullNameArDescription') || 'Optional: enter the full name in Arabic'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users.email')}</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
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
                        <Input {...field} type="tel" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('users.organizationInformation')}</CardTitle>
              <CardDescription>
                {t('users.organizationInformationDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Input {...field} placeholder={t('users.departmentPlaceholder')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="managerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users.manager')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('users.selectManager')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">{t('users.noManager')}</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {[user.fullNameEn, user.fullNameAr].filter(Boolean).join(' / ') || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t('users.managerDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('users.roleAndAccess')}</CardTitle>
              <CardDescription>
                {t('users.roleAndAccessDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users.role')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('users.selectRole')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <div>
                              <div className="font-medium">{role.name}</div>
                              {role.description && (
                                <div className="text-xs text-muted-foreground">
                                  {role.description}
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t('users.roleAccessDescription')}
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
                        {t('users.activeStatus')}
                      </FormLabel>
                      <FormDescription>
                        {t('users.activeStatusDescription')}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="mr-2">{t('common.saving')}</span>
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
    </div>
  );
}

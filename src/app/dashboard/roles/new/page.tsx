'use client';

import { useI18n } from '@/lib/i18n/i18n-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { RTLChevron } from '@/components/ui/rtl-icon';

interface Permission {
  id: string;
  module: string;
  action: string;
  resource?: string;
  description?: string;
}

export default function CreateRolePage() {
  const { t } = useI18n();
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissionIds: [] as string[],
  });

  useEffect(() => {
    fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const response = await fetch('/api/permissions', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAllPermissions(data.data || []);
        } else {
          toast.error(t('permissions.fetchError'));
        }
      } else {
        toast.error(t('permissions.fetchError'));
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      toast.error(t('permissions.fetchError'));
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create role
      const roleResponse = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
        }),
      });

      if (!roleResponse.ok) {
        let errorMessage = t('roles.createError');
        try {
          const data = await roleResponse.json();
          errorMessage = data.message || errorMessage;
        } catch {
          // Response has no JSON body, use default error message
        }
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      const roleData = await roleResponse.json();
      const newRoleId = roleData.data.id;

      // Assign permissions to role if any selected
      if (formData.permissionIds.length > 0) {
        const permsResponse = await fetch(`/api/roles/${newRoleId}/permissions`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            permissionIds: formData.permissionIds,
          }),
        });

        if (!permsResponse.ok) {
          toast.warning(t('roles.createSuccess') + ' ' + t('roles.permissionsWarning'));
          setLoading(false);
          router.push('/dashboard/roles');
          return;
        }
      }

      toast.success(t('roles.createSuccess'));
      router.push('/dashboard/roles');
    } catch (error) {
      console.error('Failed to create role:', error);
      toast.error(t('roles.createError'));
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    if (formData.permissionIds.includes(permissionId)) {
      setFormData({
        ...formData,
        permissionIds: formData.permissionIds.filter((id) => id !== permissionId),
      });
    } else {
      setFormData({
        ...formData,
        permissionIds: [...formData.permissionIds, permissionId],
      });
    }
  };

  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    const moduleName = perm.module || 'other';
    if (!acc[moduleName]) acc[moduleName] = [];
    acc[moduleName].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/roles">
          <Button variant="ghost" size="sm" className="gap-2">
            <RTLChevron>
              <ArrowLeft className="h-4 w-4" />
            </RTLChevron>
            {t('common.back')}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('roles.createRole')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('roles.createDescription')}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>{t('roles.details')}</CardTitle>
          <CardDescription>{t('roles.formDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('roles.name')}</Label>
              <Input
                id="name"
                placeholder={t('roles.namePlaceholder')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t('roles.description')}</Label>
              <Textarea
                id="description"
                placeholder={t('roles.descriptionPlaceholder')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t('roles.permissions')}
              </Label>
              {permissionsLoading ? (
                <div className="border rounded-lg p-8 text-center text-gray-500">
                  {t('common.loading')}...
                </div>
              ) : (
                <div className="border rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
                  {Object.entries(groupedPermissions).length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      {t('permissions.noData')}
                    </div>
                  ) : (
                    Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                      <div key={moduleName} className="space-y-2">
                        <h4 className="font-semibold text-sm capitalize flex items-center gap-2">
                          <Shield className="h-3 w-3 text-blue-600" />
                          {moduleName}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-5">
                          {perms.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={permission.id}
                                checked={formData.permissionIds.includes(permission.id)}
                                onCheckedChange={() => togglePermission(permission.id)}
                              />
                              <label
                                htmlFor={permission.id}
                                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {permission.action}
                                {permission.description && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    ({permission.description})
                                  </span>
                                )}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading || permissionsLoading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? t('common.loading') : t('common.create')}
              </Button>
              <Link href="/dashboard/roles">
                <Button type="button" variant="outline">
                  {t('common.cancel')}
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

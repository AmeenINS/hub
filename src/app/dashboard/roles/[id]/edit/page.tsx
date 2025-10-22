'use client';

import { useI18n } from '@/lib/i18n/i18n-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Trash2, Save, Shield } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  description: string;
  permissionIds: string[];
}

interface Permission {
  id: string;
  module: string;
  action: string;
  resource?: string;
  description?: string;
}

export default function EditRolePage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [formData, setFormData] = useState<Role>({
    id: '',
    name: '',
    description: '',
    permissionIds: [],
  });

  const fetchRole = async () => {
    try {
      setFetchLoading(true);
      
      // Fetch role and permissions in parallel
      const [roleResponse, permissionsResponse] = await Promise.all([
        fetch(`/api/roles/${params.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch('/api/permissions', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ]);

      if (roleResponse.ok && permissionsResponse.ok) {
        const roleData = await roleResponse.json();
        const permissionsData = await permissionsResponse.json();
        
        if (roleData.success && roleData.data) {
          // Fetch role permissions
          const rolePermsResponse = await fetch(`/api/roles/${params.id}/permissions`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          
          let permissionIds: string[] = [];
          if (rolePermsResponse.ok) {
            const rolePermsData = await rolePermsResponse.json();
            if (rolePermsData.success) {
              permissionIds = rolePermsData.data.map((rp: { permissionId: string }) => rp.permissionId);
            }
          }
          
          setFormData({
            id: roleData.data.id,
            name: roleData.data.name,
            description: roleData.data.description || '',
            permissionIds,
          });
        }
        
        if (permissionsData.success) {
          setAllPermissions(permissionsData.data || []);
        }
      } else {
        toast.error(t('roles.fetchError'));
        router.push('/dashboard/roles');
      }
    } catch (error) {
      console.error('Failed to fetch role:', error);
      toast.error(t('roles.fetchError'));
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update role basic info
      const roleResponse = await fetch(`/api/roles/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
        }),
      });

      // Update role permissions
      const permsResponse = await fetch(`/api/roles/${params.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          permissionIds: formData.permissionIds,
        }),
      });

      if (roleResponse.ok && permsResponse.ok) {
        toast.success(t('roles.updateSuccess'));
        router.push('/dashboard/roles');
      } else {
        let errorMessage = t('roles.updateError');
        try {
          const data = await roleResponse.json();
          errorMessage = data.message || errorMessage;
        } catch {
          // Response has no JSON body, use default error message
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error(t('roles.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('messages.deleteConfirm') + ' ' + formData.name + '?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/roles/${params.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        toast.success(t('messages.deleteSuccess'));
        router.push('/dashboard/roles');
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
      console.error('Failed to delete role:', error);
      toast.error(t('messages.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="p-6 space-y-6">
        <Card className="max-w-2xl animate-pulse">
          <CardHeader>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mt-2"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/roles">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('roles.edit')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('roles.editDescription')}
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleting}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? t('common.loading') : t('common.delete')}
        </Button>
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
              <div className="border rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(
                  allPermissions.reduce((acc, perm) => {
                    const moduleName = perm.module || 'other';
                    if (!acc[moduleName]) acc[moduleName] = [];
                    acc[moduleName].push(perm);
                    return acc;
                  }, {} as Record<string, Permission[]>)
                ).map(([moduleName, perms]) => (
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
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  permissionIds: [...formData.permissionIds, permission.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  permissionIds: formData.permissionIds.filter((id) => id !== permission.id),
                                });
                              }
                            }}
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
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? t('common.loading') : t('common.save')}
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

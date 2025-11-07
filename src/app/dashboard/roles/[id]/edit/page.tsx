'use client';

import { useI18n } from '@/shared/i18n/i18n-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { ArrowLeft, Trash2, Save, Shield } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/shared/state/auth-store';
import { toast } from 'sonner';
import { RTLChevron } from '@/shared/components/ui/rtl-icon';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState<Role>({
    id: '',
    name: '',
    description: '',
    permissionIds: [],
  });

  // Filter permissions based on search and category
  const filteredPermissions = allPermissions.filter(perm => {
    const matchesSearch = searchTerm === '' || 
      perm.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || perm.module === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Helper function to get category name with fallback
  const getCategoryName = (module: string): string => {
    const translated = t(`permissions.categories.${module}`);
    // If translation key is returned as-is, it means translation doesn't exist
    if (translated.startsWith('permissions.categories.')) {
      // Fallback: capitalize first letter and replace underscores with spaces
      return module
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return translated;
  };

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
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mt-2"></div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
            <h2 className="text-3xl font-bold tracking-tight">
              {t('roles.edit')}
            </h2>
            <p className="text-muted-foreground">
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
      <Card>
        <CardHeader>
          <CardTitle>{t('roles.details')}</CardTitle>
          <CardDescription>{t('roles.formDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name and Description */}
            <div className="grid gap-4">
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
                  rows={3}
                />
              </div>
            </div>

            {/* Permissions - Enhanced UI */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Label className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5" />
                  {t('roles.permissions')}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({formData.permissionIds.length} {t('permissions.selected')})
                  </span>
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({
                      ...formData,
                      permissionIds: allPermissions.map(p => p.id)
                    })}
                  >
                    {t('permissions.selectAll')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({
                      ...formData,
                      permissionIds: []
                    })}
                  >
                    {t('permissions.deselectAll')}
                  </Button>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-3">
                <Input
                  placeholder={t('permissions.searchPermissions')}
                  className="md:flex-1"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  className="px-3 py-2 border rounded-md bg-background text-sm"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  aria-label={t('permissions.filterByCategory')}
                >
                  <option value="">{t('permissions.allCategories')}</option>
                  {Array.from(new Set(allPermissions.map(p => p.module))).sort().map(module => (
                    <option key={module} value={module}>
                      {getCategoryName(module)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Permissions Grid */}
              <div className="border rounded-lg">
                {filteredPermissions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{t('permissions.noResults')}</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {Object.entries(
                      filteredPermissions.reduce((acc, perm) => {
                        const moduleName = perm.module || 'other';
                        if (!acc[moduleName]) acc[moduleName] = [];
                        acc[moduleName].push(perm);
                        return acc;
                      }, {} as Record<string, Permission[]>)
                    ).map(([moduleName, perms]) => (
                      <div key={moduleName} className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                          <h4 className="font-semibold text-base capitalize flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            {getCategoryName(moduleName)}
                            <span className="text-xs font-normal text-muted-foreground">
                              ({perms.filter(p => formData.permissionIds.includes(p.id)).length}/{perms.length})
                            </span>
                          </h4>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                const modulePermIds = perms.map(p => p.id);
                                setFormData({
                                  ...formData,
                                  permissionIds: Array.from(new Set([...formData.permissionIds, ...modulePermIds]))
                                });
                              }}
                            >
                              {t('permissions.selectAll')}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                const modulePermIds = perms.map(p => p.id);
                                setFormData({
                                  ...formData,
                                  permissionIds: formData.permissionIds.filter(id => !modulePermIds.includes(id))
                                });
                              }}
                            >
                              {t('permissions.deselectAll')}
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                          {perms.map((permission) => (
                            <div
                              key={permission.id}
                              className="flex items-start space-x-2 rtl:space-x-reverse p-2 rounded-md hover:bg-accent/50 transition-colors"
                            >
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
                                className="text-sm leading-tight cursor-pointer flex-1"
                              >
                                <span className="font-medium">{permission.action}</span>
                                {permission.description && (
                                  <span className="block text-xs text-muted-foreground mt-0.5">
                                    {permission.description}
                                  </span>
                                )}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

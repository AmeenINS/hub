'use client';

import { useI18n } from '@/shared/i18n/i18n-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Plus, Shield, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/shared/state/auth-store';
import { toast } from 'sonner';

interface Permission {
  id: string;
  module: string;
  action: string;
  resource?: string;
  description?: string;
  createdAt: string;
}

export default function PermissionsPage() {
  const { t } = useI18n();
  const { token } = useAuthStore();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/permissions', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPermissions(data.data || []);
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
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('permissions.deleteConfirm'))) {
      try {
        // API call would go here
        setPermissions(permissions.filter(p => p.id !== id));
        toast.success(t('messages.deleteSuccess'));
      } catch (error) {
        console.error('Failed to delete permission:', error);
        toast.error(t('messages.deleteError'));
      }
    }
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = permission.module || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('permissions.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('permissions.listDescription')}
          </p>
        </div>
        <Link href="/dashboard/roles/permissions/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t('permissions.create')}
          </Button>
        </Link>
      </div>

      {/* Permissions by Category */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : Object.keys(groupedPermissions).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-center">
              {t('permissions.noData')}
            </p>
            <Link href="/dashboard/roles/permissions/create">
              <Button className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                {t('permissions.create')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(groupedPermissions).map(([category, perms]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  {t(`permissions.categories.${category}` as keyof typeof t) || category}
                </CardTitle>
                <CardDescription>
                  {perms.length} {perms.length === 1 ? 'permission' : 'permissions'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {perms.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {permission.module}:{permission.action}
                          {permission.resource && ` (${permission.resource})`}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {permission.description || `${permission.action} on ${permission.module}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Link href={`/dashboard/roles/permissions/${permission.id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(permission.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

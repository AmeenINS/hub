'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Shield, RefreshCw, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n/i18n-context';
import { useAuthStore } from '@/store/auth-store';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export default function PermissionsPage() {
  const { t } = useI18n();
  const { token } = useAuthStore();
  const router = useRouter();
  const [permissions, setPermissions] = React.useState<Permission[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchPermissions = React.useCallback(async () => {
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
  }, [token, t]);

  React.useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handleDelete = async (permissionId: string) => {
    if (!confirm(t('permissions.deleteConfirm'))) return;

    try {
      const response = await fetch(`/api/permissions/${permissionId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        toast.success(t('permissions.deleteSuccess'));
        fetchPermissions();
      } else {
        toast.error(t('permissions.deleteError'));
      }
    } catch (error) {
      console.error('Failed to delete permission:', error);
      toast.error(t('permissions.deleteError'));
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category.toLowerCase()) {
      case 'users':
        return 'default';
      case 'tasks':
        return 'secondary';
      case 'roles':
        return 'outline';
      case 'system':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('nav.permissions')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('permissions.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchPermissions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
          <Button onClick={() => router.push('/dashboard/permissions/new')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('permissions.create')}
          </Button>
        </div>
      </div>

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('permissions.list')}
          </CardTitle>
          <CardDescription>
            {t('permissions.listDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">{t('permissions.name')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('permissions.description')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('permissions.category')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('common.createdAt')}</TableHead>
                    <TableHead className="w-[100px] whitespace-nowrap">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {permissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Shield className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">{t('permissions.noData')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell className="font-medium">
                        {permission.name}
                      </TableCell>
                      <TableCell>
                        {permission.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getCategoryBadgeVariant(permission.category)}>
                          {permission.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(permission.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/dashboard/permissions/${permission.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(permission.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Shield, RefreshCw, Plus } from 'lucide-react';
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
import { useAuthStore } from '@/store/auth-store';
import { useI18n } from '@/lib/i18n/i18n-context';

interface Role {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  createdAt: string;
}

export default function RolesPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { token, isLoading: authLoading } = useAuthStore();
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  // Wait for auth store to hydrate
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const fetchRoles = React.useCallback(async () => {
    if (!mounted || authLoading) return;

    try {
      setLoading(true);
      const response = await fetch('/api/roles', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error(t('auth.loginError'));
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch roles');
      }

      const result = await response.json();
      if (result.success) {
        setRoles(result.data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error(t('messages.errorFetchingData'));
    } finally {
      setLoading(false);
    }
  }, [token, t, router, mounted, authLoading]);

  React.useEffect(() => {
    if (mounted && !authLoading) {
      fetchRoles();
    }
  }, [mounted, authLoading, fetchRoles]);

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('roles.title')}</h2>
          <p className="text-muted-foreground">
            {t('dashboard.manageRoles')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchRoles}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => router.push('/dashboard/roles/new')}>
            <Plus className="mr-2 h-4 w-4" />
            {t('roles.createRole')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('roles.title')}</CardTitle>
          <CardDescription>
            {loading
              ? t('common.loading')
              : `${roles.length} ${t('roles.title').toLowerCase()}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">{t('roles.roleName')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('roles.roleDescription')}</TableHead>
                      <TableHead className="whitespace-nowrap">Type</TableHead>
                      <TableHead className="whitespace-nowrap">{t('users.createdAt')}</TableHead>
                      <TableHead className="text-right whitespace-nowrap">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {roles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {t('roles.noRoles')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            {role.name}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {role.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant={role.isSystemRole ? 'default' : 'secondary'}>
                            {role.isSystemRole ? 'System' : 'Custom'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(role.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/roles/${role.id}/edit`)}
                          >
                            {t('common.edit')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

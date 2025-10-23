'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, RefreshCw } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UsersDataTable, User } from '@/components/dashboard/users-data-table';
import { useAuthStore } from '@/store/auth-store';
import { useI18n } from '@/lib/i18n/i18n-context';

export default function UsersPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { token, isLoading: authLoading } = useAuthStore();
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);
  const [deleteDialog, setDeleteDialog] = React.useState<{
    open: boolean;
    user: User | null;
  }>({ open: false, user: null });

  // Wait for auth store to hydrate
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const fetchUsers = React.useCallback(async () => {
    if (!mounted || authLoading) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error(t('auth.loginError'));
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(t('messages.errorFetchingData'));
    } finally {
      setLoading(false);
    }
  }, [token, t, router, mounted, authLoading]);

  React.useEffect(() => {
    if (mounted && !authLoading) {
      fetchUsers();
    }
  }, [mounted, authLoading, fetchUsers]);

  const handleEdit = (user: User) => {
    router.push(`/dashboard/users/${user.id}/edit`);
  };

  const handleDelete = (user: User) => {
    setDeleteDialog({ open: true, user });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.user) return;

    try {
      const response = await fetch(`/api/users/${deleteDialog.user.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      toast.success(t('messages.deleteSuccess'));
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(t('messages.deleteError'));
    } finally {
      setDeleteDialog({ open: false, user: null });
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      toast.success(t('messages.updateSuccess'));
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(t('messages.updateError'));
    }
  };

  return (
    <>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{t('users.title')}</h2>
            <p className="text-muted-foreground">
              {t('dashboard.manageUsers')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchUsers}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => router.push('/dashboard/users/new')}>
              <UserPlus className="mr-2 h-4 w-4" />
              {t('users.createUser')}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('users.title')}</CardTitle>
            <CardDescription>
              {loading
                ? t('common.loading')
                : `${users.length} ${t('users.title').toLowerCase()}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <UsersDataTable
                data={users}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, user: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.deleteUser')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('messages.deleteConfirm')}
              {deleteDialog.user && (
                <span className="font-semibold">
                  {' '}
                  {deleteDialog.user.firstName} {deleteDialog.user.lastName}
                </span>
              )}
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

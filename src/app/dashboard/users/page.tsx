'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, RefreshCw, Loader2 } from 'lucide-react';
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
import { useI18n } from '@/lib/i18n/i18n-context';
import { getCombinedUserName } from '@/lib/utils';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { useModulePermissions } from '@/hooks/use-permissions';

export default function UsersPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { permissions, isLoading: permissionsLoading } = useModulePermissions('users');
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleteDialog, setDeleteDialog] = React.useState<{
    open: boolean;
    user: User | null;
  }>({ open: false, user: null });

  const fetchUsers = React.useCallback(async () => {
    if (!permissions.canView) return;
    
    try {
      setLoading(true);
      const response = await apiClient.get<User[]>('/api/users');

      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        toast.error(response.message || t('messages.errorFetchingData'));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(getErrorMessage(error, t('messages.errorFetchingData')));
    } finally {
      setLoading(false);
    }
  }, [permissions.canView, t]);

  React.useEffect(() => {
    if (permissions.canView) {
      fetchUsers();
    }
  }, [permissions.canView, fetchUsers]);

  const handleEdit = (user: User) => {
    if (!permissions.canEdit) {
      toast.error(t('messages.noPermission'));
      return;
    }
    router.push(`/dashboard/users/${user.id}/edit`);
  };

  const handleDelete = (user: User) => {
    if (!permissions.canDelete) {
      toast.error(t('messages.noPermission'));
      return;
    }
    setDeleteDialog({ open: true, user });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.user || !permissions.canDelete) return;

    try {
      const response = await apiClient.delete(`/api/users/${deleteDialog.user.id}`);

      if (response.success) {
        toast.success(response.message || t('messages.deleteSuccess'));
        fetchUsers();
      } else {
        toast.error(response.message || t('messages.deleteError'));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(getErrorMessage(error, t('messages.deleteError')));
    } finally {
      setDeleteDialog({ open: false, user: null });
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (!permissions.canEdit) {
      toast.error(t('messages.noPermission'));
      return;
    }

    try {
      const response = await apiClient.patch(`/api/users/${user.id}`, {
        isActive: !user.isActive
      });

      if (response.success) {
        toast.success(response.message || t('messages.updateSuccess'));
        fetchUsers();
      } else {
        toast.error(response.message || t('messages.updateError'));
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(getErrorMessage(error, t('messages.updateError')));
    }
  };

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!permissions.canView) {
    return null;
  }

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
            {permissions.canCreate && (
              <Button onClick={() => router.push('/dashboard/users/new')}>
                <UserPlus className="mr-2 h-4 w-4" />
                {t('users.createUser')}
              </Button>
            )}
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
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                  {getCombinedUserName(deleteDialog.user)}
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

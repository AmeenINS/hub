'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { apiClient, getErrorMessage } from '@/core/api/client';
import { useI18n } from '@/shared/i18n/i18n-context';
import { Contact } from '@/shared/types/database';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Badge } from '@/shared/components/ui/badge';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
}

export default function ContactsTrashPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [deletedContacts, setDeletedContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    fetchDeletedContacts();
  }, []);

  const fetchDeletedContacts = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<ApiResponse<Contact[]>>(
        '/api/crm/contacts/trash'
      );

      if (response.success && response.data?.data) {
        setDeletedContacts(response.data.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load trash'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (contactId: string) => {
    try {
      setIsRestoring(true);
      const response = await apiClient.post(
        `/api/crm/contacts/${contactId}/restore`
      );

      if (response.success) {
        toast.success(t('crm.restoredFromTrash'));
        setDeletedContacts((prev) =>
          prev.filter((contact) => contact.id !== contactId)
        );
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to restore contact'));
    } finally {
      setIsRestoring(false);
      setRestoreId(null);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getContactTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      LEAD: 'default',
      CUSTOMER: 'secondary',
      SUPPLIER: 'outline',
      PARTNER: 'outline',
    };

    return (
      <Badge variant={variants[type] || 'default'}>
        {type}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('crm.trash')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('crm.trashDescription')}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          {t('common.back')}
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/10">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">
                {t('crm.trash')} - {deletedContacts.length} {t('crm.deletedContacts')}
              </CardTitle>
              <CardDescription className="text-amber-700 dark:text-amber-200">
                Deleted contacts can be restored at any time. They will be permanently removed after 30 days.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Empty State */}
      {deletedContacts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Trash2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t('crm.trashEmpty')}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              All your deleted contacts will appear here and can be restored anytime.
            </p>
            <Button variant="outline" onClick={() => router.push('/dashboard/crm/contacts')}>
              {t('crm.backToContacts')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Contacts List */
        <div className="grid gap-4">
          {deletedContacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Contact Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">
                        {contact.fullNameEn}
                      </h3>
                      {getContactTypeBadge(contact.type)}
                    </div>

                    {contact.fullNameAr && (
                      <p className="text-sm text-muted-foreground">
                        {contact.fullNameAr}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {contact.email && (
                        <div className="flex items-center gap-1">
                          <span>📧</span>
                          <span>{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-1">
                          <span>📱</span>
                          <span>{contact.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Trash2 className="h-3 w-3" />
                      <span>
                        Deleted on {formatDate(contact.deletedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRestoreId(contact.id)}
                      disabled={isRestoring}
                      className="gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {t('crm.restore')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={!!restoreId} onOpenChange={() => setRestoreId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('crm.restore')}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore this contact? It will be moved back to your active contacts list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreId && handleRestore(restoreId)}
              disabled={isRestoring}
              className="gap-2"
            >
              {isRestoring && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('crm.restore')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Progress } from '@/shared/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog';
import { useI18n } from '@/shared/i18n/i18n-context';
import { Download, RotateCcw, DatabaseBackup } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { BackupFileInfo } from './types';
import { useAuthStore } from '@/shared/state/auth-store';
import { Spinner } from '@/shared/components/ui/spinner';

interface BackupManagerCardProps {
  canView: boolean;
  canManageBackups: boolean;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  const rounded = value > 10 || i === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${sizes[i]}`;
};

export function BackupManagerCard({ canView, canManageBackups }: BackupManagerCardProps) {
  const { t } = useI18n();
  const { token } = useAuthStore();

  const [backups, setBackups] = useState<BackupFileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [selectedRestoreFile, setSelectedRestoreFile] = useState<File | null>(null);

  const sortedBackups = useMemo(
    () =>
      backups
        .slice()
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [backups]
  );

  const fetchBackups = useCallback(async () => {
    if (!canView) {
      setBackups([]);
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.get<{ backups: BackupFileInfo[] }>('/api/settings/backup');
      if (response.success && response.data?.backups) {
        setBackups(response.data.backups);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('settings.loadBackupsError')));
    } finally {
      setLoading(false);
    }
  }, [canView, t]);

  useEffect(() => {
    void fetchBackups();
  }, [fetchBackups]);

  const runBackup = useCallback(async () => {
    if (!canManageBackups) {
      toast.error(t('settings.permissionDenied'));
      return;
    }

    setBackupDialogOpen(false);
    setBackupInProgress(true);
    setBackupProgress(10);

    const progressTimer = window.setInterval(() => {
      setBackupProgress((prev) => (prev < 90 ? prev + 5 : prev));
    }, 400);

    try {
      const response = await apiClient.post<{ backup: BackupFileInfo }>('/api/settings/backup');
      const createdBackup = response.data?.backup;

      if (response.success && createdBackup) {
        setBackups((prev) => [createdBackup, ...prev]);
        toast.success(t('settings.backupCreated'));
      } else {
        toast.error(response.message || t('settings.backupFailed'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('settings.backupFailed')));
    } finally {
      window.clearInterval(progressTimer);
      setBackupProgress(100);
      setTimeout(() => {
        setBackupInProgress(false);
        setBackupProgress(0);
      }, 500);
    }
  }, [canManageBackups, t]);

  const runRestore = useCallback(async () => {
    if (!canManageBackups) {
      toast.error(t('settings.permissionDenied'));
      return;
    }

    if (!selectedRestoreFile) {
      toast.error(t('settings.restoreFileRequired'));
      return;
    }

    setRestoreDialogOpen(false);
    setRestoreInProgress(true);
    setRestoreProgress(10);

    const progressTimer = window.setInterval(() => {
      setRestoreProgress((prev) => (prev < 85 ? prev + 7 : prev));
    }, 400);

    try {
      const formData = new FormData();
      formData.append('file', selectedRestoreFile);

      const response = await apiClient.upload<{ success: boolean }>(
        '/api/settings/backup/restore',
        formData
      );

      if (response.success) {
        toast.success(t('settings.restoreCompleted'));
        setSelectedRestoreFile(null);
        await fetchBackups();
      } else {
        toast.error(response.message || t('settings.restoreFailed'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('settings.restoreFailed')));
    } finally {
      window.clearInterval(progressTimer);
      setRestoreProgress(100);
      setTimeout(() => {
        setRestoreInProgress(false);
        setRestoreProgress(0);
      }, 500);
    }
  }, [canManageBackups, fetchBackups, selectedRestoreFile, t]);

  const handleDownload = async (backup: BackupFileInfo) => {
    if (!canView) {
      toast.error(t('settings.permissionDenied'));
      return;
    }

    if (!token) {
      toast.error(t('settings.loginRequired'));
      return;
    }

    try {
      const response = await fetch(backup.downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backup.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(t('settings.backupDownloadStarted'));
    } catch (error) {
      toast.error(getErrorMessage(error, t('settings.backupDownloadFailed')));
    }
  };

  if (!canView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.backupTabLabel')}</CardTitle>
          <CardDescription>{t('settings.createBackupDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('settings.permissionDenied')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.createBackup')}</CardTitle>
            <CardDescription>{t('settings.createBackupDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <p>{t('settings.backupIncludes')}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>{t('settings.backupDatabase')}</li>
                <li>{t('settings.backupUploads')}</li>
              </ul>
            </div>
            <Button
              onClick={() => setBackupDialogOpen(true)}
              disabled={backupInProgress || !canManageBackups}
              className="w-full justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              {backupInProgress ? t('settings.backupInProgress') : t('settings.startBackup')}
            </Button>
            {backupInProgress && (
              <div className="space-y-2">
                <Progress value={backupProgress} />
                <p className="text-xs text-muted-foreground">
                  {t('settings.backupProgressLabel')} ({backupProgress}%)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.restoreSystem')}</CardTitle>
            <CardDescription>{t('settings.restoreSystemDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restore-file">{t('settings.selectBackupFile')}</Label>
              <Input
                id="restore-file"
                type="file"
                accept=".tar.gz,.tgz"
                disabled={restoreInProgress || !canManageBackups}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setSelectedRestoreFile(file || null);
                }}
              />
              <p className="text-xs text-muted-foreground">{t('settings.restoreFileHint')}</p>
            </div>
            {selectedRestoreFile && (
              <div className="rounded-md border bg-muted p-3 text-xs">
                <p className="font-medium">{selectedRestoreFile.name}</p>
                <p className="text-muted-foreground">{formatBytes(selectedRestoreFile.size)}</p>
              </div>
            )}
            <Button
              onClick={() => setRestoreDialogOpen(true)}
              disabled={!selectedRestoreFile || restoreInProgress || !canManageBackups}
              variant="secondary"
              className="w-full justify-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {restoreInProgress ? t('settings.restoreInProgress') : t('settings.startRestore')}
            </Button>
            {restoreInProgress && (
              <div className="space-y-2">
                <Progress value={restoreProgress} />
                <p className="text-xs text-muted-foreground">
                  {t('settings.restoreProgressLabel')} ({restoreProgress}%)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('settings.backupHistory')}</CardTitle>
          <CardDescription>{t('settings.backupHistoryDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : sortedBackups.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-sm text-muted-foreground">
              <DatabaseBackup className="h-12 w-12" />
              <p>{t('settings.noBackups')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.fileName')}</TableHead>
                  <TableHead>{t('common.size')}</TableHead>
                  <TableHead>{t('common.createdAt')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBackups.map((backup) => (
                  <TableRow key={backup.fileName}>
                    <TableCell className="font-medium">{backup.fileName}</TableCell>
                    <TableCell>{backup.sizeLabel}</TableCell>
                    <TableCell>{new Date(backup.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(backup)}
                        disabled={!canView}
                      >
                        <Download className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                        {t('common.download')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={backupDialogOpen}
        onOpenChange={setBackupDialogOpen}
        onConfirm={runBackup}
        title={t('settings.confirmBackupTitle')}
        description={t('settings.confirmBackupDescription')}
        confirmText={t('settings.startBackup')}
        cancelText={t('common.cancel')}
        variant="info"
        isLoading={backupInProgress}
      />

      <ConfirmDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        onConfirm={runRestore}
        title={t('settings.confirmRestoreTitle')}
        description={t('settings.confirmRestoreDescription')}
        confirmText={t('settings.startRestore')}
        cancelText={t('common.cancel')}
        variant="warning"
        isLoading={restoreInProgress}
      />
    </>
  );
}

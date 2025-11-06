'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Globe,
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  DatabaseBackup,
  Download,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { OverlayScrollbar } from '@/components/ui/overlay-scrollbar';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { UserAvatarUpload } from '@/components/dashboard/user-avatar-upload';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { Progress } from '@/components/ui/progress';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface UserData {
  id: string;
  fullNameEn: string;
  fullNameAr: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  taskNotifications?: boolean;
}

interface UserSettings {
  fullNameEn: string;
  fullNameAr: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskNotifications: boolean;
}

interface Position {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  level: number;
  isActive: boolean;
}

interface BackupFileInfo {
  fileName: string;
  size: number;
  sizeLabel: string;
  createdAt: string;
  downloadUrl: string;
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

export default function SettingsPage() {
  const { t, dir } = useI18n();
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [settings, setSettings] = useState<UserSettings>({
    fullNameEn: '',
    fullNameAr: '',
    email: '',
    phoneNumber: '',
    avatarUrl: '',
    emailNotifications: true,
    pushNotifications: true,
    taskNotifications: true,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Position Management States
  const [positions, setPositions] = useState<Position[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
const [positionForm, setPositionForm] = useState({
  name: '',
  nameAr: '',
  description: '',
  level: 1,
  isActive: true,
});

  // Backup & Restore States
  const [backups, setBackups] = useState<BackupFileInfo[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [backupConfirmOpen, setBackupConfirmOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [selectedRestoreFile, setSelectedRestoreFile] = useState<File | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!token || !isAuthenticated) {
        toast.error('Please login to continue');
        router.push('/login');
        return;
      }

      const response = await apiClient.get<UserData>('/api/users/me');

      if (!response.success) {
        if (response.message?.includes('Unauthorized') || response.message?.includes('token')) {
          toast.error('Session expired. Please login again');
          router.push('/login');
        }
        return;
      }

      if (response.data) {
        const data = response.data;
        setUserId(data.id);
        setSettings({
          fullNameEn: data.fullNameEn || '',
          fullNameAr: data.fullNameAr || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          avatarUrl: data.avatarUrl || '',
          emailNotifications: data.emailNotifications ?? true,
          pushNotifications: data.pushNotifications ?? true,
          taskNotifications: data.taskNotifications ?? true,
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error(getErrorMessage(error, 'Failed to load settings'));
    } finally {
      setLoading(false);
    }
  }, [router, token, isAuthenticated]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (token) {
      fetchPositions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleUpdateProfile = async () => {
    if (!token) return;
    
    try {
      setSaving(true);
      const response = await apiClient.put('/api/users/me', {
        fullNameEn: settings.fullNameEn,
        fullNameAr: settings.fullNameAr,
        phoneNumber: settings.phoneNumber,
      });

      if (response.success) {
        toast.success(t('messages.updateSuccess'));
      } else {
        toast.error(response.message || t('messages.updateError'));
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(getErrorMessage(error, t('messages.updateError')));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNotifications = async () => {
    if (!token) return;
    
    try {
      setSaving(true);
      const response = await apiClient.put('/api/users/me/settings', {
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        taskNotifications: settings.taskNotifications,
      });

      if (response.success) {
        toast.success(t('messages.updateSuccess'));
      } else {
        toast.error(response.message || t('messages.updateError'));
      }
    } catch (error) {
      console.error('Failed to update notifications:', error);
      toast.error(getErrorMessage(error, t('messages.updateError')));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('settings.passwordMismatch'));
      return;
    }

    if (!token) return;

    try {
      setSaving(true);
      const response = await apiClient.put('/api/users/me/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.success) {
        toast.success(t('settings.passwordChanged'));
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        toast.error(response.message || t('messages.updateError'));
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error(getErrorMessage(error, t('messages.updateError')));
    } finally {
      setSaving(false);
    }
  };

  const fetchBackups = useCallback(async () => {
    try {
      setLoadingBackups(true);
      const response = await apiClient.get<{ backups: BackupFileInfo[] }>('/api/settings/backup');
      const backupList = response.data?.backups;

      if (response.success && backupList) {
        setBackups(backupList);
      }
    } catch (error) {
      console.error('Failed to fetch backups:', error);
      toast.error(getErrorMessage(error, t('settings.loadBackupsError')));
    } finally {
      setLoadingBackups(false);
    }
  }, [t]);

  const runBackup = useCallback(async () => {
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
      console.error('Backup creation failed:', error);
      toast.error(getErrorMessage(error, t('settings.backupFailed')));
    } finally {
      window.clearInterval(progressTimer);
      setBackupProgress(100);
      setTimeout(() => {
        setBackupInProgress(false);
        setBackupProgress(0);
      }, 500);
    }
  }, [t]);

  const handleDownloadBackup = async (backup: BackupFileInfo) => {
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
      console.error('Backup download failed:', error);
      toast.error(getErrorMessage(error, t('settings.backupDownloadFailed')));
    }
  };

  const runRestore = useCallback(async () => {
    if (!selectedRestoreFile) {
      toast.error(t('settings.restoreFileRequired'));
      return;
    }

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
      console.error('Restore failed:', error);
      toast.error(getErrorMessage(error, t('settings.restoreFailed')));
    } finally {
      window.clearInterval(progressTimer);
      setRestoreProgress(100);
      setTimeout(() => {
        setRestoreInProgress(false);
        setRestoreProgress(0);
      }, 500);
    }
  }, [fetchBackups, selectedRestoreFile, t]);

  const handleConfirmBackup = async () => {
    setBackupConfirmOpen(false);
    void runBackup();
  };

  const handleConfirmRestore = async () => {
    setRestoreConfirmOpen(false);
    void runRestore();
  };

  useEffect(() => {
    if (token) {
      fetchBackups();
    }
  }, [token, fetchBackups]);

  // Position Management Functions
  const fetchPositions = async () => {
    try {
      setLoadingPositions(true);
      const response = await apiClient.get<Position[]>('/api/positions');

      if (response.success && response.data) {
        setPositions(response.data.sort((a, b) => a.level - b.level));
      }
    } catch (error) {
      console.error('Failed to fetch positions:', error);
      toast.error(t('messages.fetchError'));
    } finally {
      setLoadingPositions(false);
    }
  };

  const handleOpenPositionDialog = (position?: Position) => {
    if (position) {
      setEditingPosition(position);
      setPositionForm({
        name: position.name,
        nameAr: position.nameAr || '',
        description: position.description || '',
        level: position.level,
        isActive: position.isActive,
      });
    } else {
      setEditingPosition(null);
      setPositionForm({
        name: '',
        nameAr: '',
        description: '',
        level: 1,
        isActive: true,
      });
    }
    setIsPositionDialogOpen(true);
  };

  const handleClosePositionDialog = () => {
    setIsPositionDialogOpen(false);
    setEditingPosition(null);
    setPositionForm({
      name: '',
      nameAr: '',
      description: '',
      level: 1,
      isActive: true,
    });
  };

  const handleSavePosition = async () => {
    if (!positionForm.name.trim()) {
      toast.error(t('settings.positionNameRequired'));
      return;
    }
    if (!positionForm.nameAr.trim()) {
      toast.error(t('settings.positionNameRequired'));
      return;
    }

    if (!token) return;

    try {
      setSaving(true);
      
      const url = editingPosition 
        ? `/api/positions/${editingPosition.id}`
        : '/api/positions';
      
      const response = editingPosition
        ? await apiClient.put(url, positionForm)
        : await apiClient.post(url, positionForm);

      if (response.success) {
        toast.success(editingPosition ? t('settings.positionUpdated') : t('settings.positionCreated'));
        handleClosePositionDialog();
        fetchPositions();
      } else {
        toast.error(response.message || t('messages.updateError'));
      }
    } catch (error) {
      console.error('Failed to save position:', error);
      toast.error(getErrorMessage(error, t('messages.updateError')));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePosition = async (id: string) => {
    if (!token) return;
    
    if (!confirm(t('settings.deletePositionConfirm'))) {
      return;
    }

    try {
      setSaving(true);
      const response = await apiClient.delete(`/api/positions/${id}`);

      if (response.success) {
        toast.success(t('settings.positionDeleted'));
        fetchPositions();
      } else {
        toast.error(response.message || t('messages.deleteError'));
      }
    } catch (error) {
      console.error('Failed to delete position:', error);
      toast.error(getErrorMessage(error, t('messages.deleteError')));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          {t('settings.title')}
        </h1>
        <p className="text-muted-foreground mt-2">{t('settings.description')}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4" dir={dir}>
        <OverlayScrollbar>
          <TabsList className="w-full md:w-auto flex h-12 flex-wrap md:flex-nowrap">
            <TabsTrigger value="profile" className="gap-2 whitespace-nowrap px-4">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.profile')}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 whitespace-nowrap px-4">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.notifications')}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 whitespace-nowrap px-4">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.security')}</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2 whitespace-nowrap px-4">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.appearance')}</span>
            </TabsTrigger>
            <TabsTrigger value="positions" className="gap-2 whitespace-nowrap px-4">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.positions')}</span>
            </TabsTrigger>
            <TabsTrigger value="backup" className="gap-2 whitespace-nowrap px-4">
              <DatabaseBackup className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.backupTabLabel')}</span>
            </TabsTrigger>
          </TabsList>
        </OverlayScrollbar>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="space-y-6">
            {/* Avatar Upload */}
            {userId && (
              <UserAvatarUpload
                userId={userId}
                currentAvatarUrl={settings.avatarUrl}
                userFullName={settings.fullNameEn}
                onAvatarUpdated={(avatarUrl) => setSettings({ ...settings, avatarUrl })}
                variant="card"
              />
            )}

            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.profile')}</CardTitle>
                <CardDescription>{t('settings.updateProfile')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullNameEn">{t('users.fullNameEn') || 'Full Name (English)'}</Label>
                  <Input
                    id="fullNameEn"
                    value={settings.fullNameEn}
                    onChange={(e) => setSettings({ ...settings, fullNameEn: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullNameAr">{t('users.fullNameAr') || 'Full Name (Arabic)'}</Label>
                  <Input
                    id="fullNameAr"
                    dir="rtl"
                    value={settings.fullNameAr}
                    onChange={(e) => setSettings({ ...settings, fullNameAr: e.target.value })}
                    placeholder="محمد أحمد"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('users.email')}</Label>
                <Input id="email" value={settings.email} disabled />
                <p className="text-sm text-muted-foreground ltr:text-left rtl:text-right">
                  {t('settings.emailCannotChange')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('users.phone')}</Label>
                <Input
                  id="phone"
                  value={settings.phoneNumber || ''}
                  onChange={(e) => setSettings({ ...settings, phoneNumber: e.target.value })}
                />
              </div>

              <Button onClick={handleUpdateProfile} disabled={saving}>
                {saving ? t('common.loading') : t('settings.saveChanges')}
              </Button>
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.notifications')}</CardTitle>
              <CardDescription>{t('settings.manageNotifications')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 ltr:text-left rtl:text-right">
                  <Label>{t('settings.emailNotifications')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.receiveEmailNotifications')}
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, emailNotifications: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 ltr:text-left rtl:text-right">
                  <Label>{t('settings.pushNotifications')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.receivePushNotifications')}
                  </p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, pushNotifications: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 ltr:text-left rtl:text-right">
                  <Label>{t('settings.taskNotifications')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.notifyTaskAssigned')}
                  </p>
                </div>
                <Switch
                  checked={settings.taskNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, taskNotifications: checked })
                  }
                />
              </div>

              <Button onClick={handleUpdateNotifications} disabled={saving}>
                {saving ? t('common.loading') : t('settings.saveChanges')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.changePassword')}</CardTitle>
              <CardDescription>{t('settings.updatePasswordDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t('settings.currentPassword')}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('settings.newPassword')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('settings.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                />
              </div>

              <Button onClick={handleChangePassword} disabled={saving}>
                {saving ? t('common.loading') : t('settings.changePassword')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.appearance')}</CardTitle>
              <CardDescription>{t('settings.customizeAppearance')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 ltr:text-left rtl:text-right">
                  <Label>{t('common.theme')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.selectTheme')}
                  </p>
                </div>
                <ThemeToggle />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 ltr:text-left rtl:text-right">
                  <Label>{t('common.language')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.selectLanguage')}
                  </p>
                </div>
                <LanguageToggle />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('settings.positions')}</CardTitle>
                  <CardDescription>{t('settings.positionsManagement')}</CardDescription>
                </div>
                <Button onClick={() => handleOpenPositionDialog()}>
                  <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('settings.addPosition')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPositions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                  </div>
                </div>
              ) : positions.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('settings.noPositions')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('settings.positionName')}</TableHead>
                      <TableHead>{t('settings.positionDescription')}</TableHead>
                      <TableHead>{t('settings.positionLevel')}</TableHead>
                      <TableHead>{t('common.status')}</TableHead>
                      <TableHead className="text-right">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((position) => (
                      <TableRow key={position.id}>
                        <TableCell className="font-medium">
                          <div>{position.name}</div>
                          {position.nameAr && (
                            <div className="text-xs text-muted-foreground">{position.nameAr}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {position.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {t('settings.level')} {position.level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={position.isActive ? 'default' : 'secondary'}>
                            {position.isActive ? t('common.active') : t('common.inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenPositionDialog(position)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePosition(position.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup & Restore Tab */}
        <TabsContent value="backup">
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
                  onClick={() => setBackupConfirmOpen(true)}
                  disabled={backupInProgress}
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
                    disabled={restoreInProgress}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      setSelectedRestoreFile(file || null);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('settings.restoreFileHint')}
                  </p>
                </div>
                {selectedRestoreFile && (
                  <div className="rounded-md border bg-muted p-3 text-xs">
                    <p className="font-medium">{selectedRestoreFile.name}</p>
                    <p className="text-muted-foreground">
                      {formatBytes(selectedRestoreFile.size)}
                    </p>
                  </div>
                )}
                <Button
                  onClick={() => setRestoreConfirmOpen(true)}
                  disabled={!selectedRestoreFile || restoreInProgress}
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
              {loadingBackups ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                  </div>
                </div>
              ) : backups.length === 0 ? (
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
                    {backups.map((backup) => (
                      <TableRow key={backup.fileName}>
                        <TableCell className="font-medium">{backup.fileName}</TableCell>
                        <TableCell>{backup.sizeLabel}</TableCell>
                        <TableCell>
                          {new Date(backup.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadBackup(backup)}
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
        </TabsContent>
      </Tabs>

      {/* Position Dialog */}
      <Dialog open={isPositionDialogOpen} onOpenChange={setIsPositionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPosition ? t('settings.editPosition') : t('settings.addPosition')}
            </DialogTitle>
            <DialogDescription>
              {editingPosition ? t('settings.editPositionDescription') : t('settings.addPositionDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="position-name">{t('settings.positionName')}</Label>
              <Input
                id="position-name"
                value={positionForm.name}
                onChange={(e) => setPositionForm({ ...positionForm, name: e.target.value })}
                placeholder={t('settings.positionNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position-name-ar">{t('settings.positionNameAr') || 'Position Name (Arabic)'}</Label>
              <Input
                id="position-name-ar"
                dir="rtl"
                value={positionForm.nameAr}
                onChange={(e) => setPositionForm({ ...positionForm, nameAr: e.target.value })}
                placeholder={t('settings.positionNameArPlaceholder') || 'مثال: المدير التنفيذي'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position-description">{t('settings.positionDescription')}</Label>
              <Textarea
                id="position-description"
                value={positionForm.description}
                onChange={(e) => setPositionForm({ ...positionForm, description: e.target.value })}
                placeholder={t('settings.positionDescriptionPlaceholder')}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position-level">{t('settings.positionLevel')}</Label>
              <Input
                id="position-level"
                type="number"
                min="1"
                value={positionForm.level}
                onChange={(e) => setPositionForm({ ...positionForm, level: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="position-active">{t('common.active')}</Label>
              <Switch
                id="position-active"
                checked={positionForm.isActive}
                onCheckedChange={(checked) => setPositionForm({ ...positionForm, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClosePositionDialog}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSavePosition} disabled={saving}>
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
      </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={backupConfirmOpen}
        onOpenChange={setBackupConfirmOpen}
        onConfirm={handleConfirmBackup}
        title={t('settings.confirmBackupTitle')}
        description={t('settings.confirmBackupDescription')}
        confirmText={t('settings.startBackup')}
        cancelText={t('common.cancel')}
        variant="info"
        isLoading={backupInProgress}
      />

      <ConfirmDialog
        open={restoreConfirmOpen}
        onOpenChange={setRestoreConfirmOpen}
        onConfirm={handleConfirmRestore}
        title={t('settings.confirmRestoreTitle')}
        description={t('settings.confirmRestoreDescription')}
        confirmText={t('settings.startRestore')}
        cancelText={t('common.cancel')}
        variant="warning"
        isLoading={restoreInProgress}
      />
    </div>
  );
}

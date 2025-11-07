'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Globe,
  Briefcase,
  DatabaseBackup,
} from 'lucide-react';
import { toast } from 'sonner';

import { useI18n } from '@/shared/i18n/i18n-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { OverlayScrollbar } from '@/shared/components/ui/overlay-scrollbar';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { useAuthStore } from '@/shared/state/auth-store';
import { useModulePermissions } from '@/shared/hooks/use-permissions';
import { Spinner } from '@/shared/components/ui/spinner';
import {
  AppearanceSettingsCard,
  BackupManagerCard,
  NotificationPreferencesCard,
  PositionsManager,
  ProfileSettingsCard,
  SecuritySettingsCard,
} from '@/features/dashboard/components/settings';
import type {
  PasswordChangePayload,
  UserData,
  UserSettings,
} from '@/features/dashboard/components/settings';

const defaultSettings: UserSettings = {
  fullNameEn: '',
  fullNameAr: '',
  email: '',
  phoneNumber: '',
  avatarUrl: '',
  emailNotifications: true,
  pushNotifications: true,
  taskNotifications: true,
};

export default function SettingsPage() {
  const { t, dir } = useI18n();
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const {
    permissions: settingsPermissions,
    isLoading: permissionsLoading,
  } = useModulePermissions('settings');

  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const canViewSettings = useMemo(
    () =>
      settingsPermissions.canView ||
      settingsPermissions.canCreate ||
      settingsPermissions.canEdit ||
      settingsPermissions.canDelete,
    [settingsPermissions]
  );

  const canManageSettings = useMemo(
    () =>
      settingsPermissions.canCreate ||
      settingsPermissions.canEdit ||
      settingsPermissions.canDelete,
    [settingsPermissions]
  );

  const canManageBackups = canManageSettings;

  const handleSettingsChange = (partial: Partial<UserSettings>) => {
    setSettings((previous) => ({ ...previous, ...partial }));
  };

  const fetchSettings = useCallback(async () => {
    if (!canViewSettings) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      if (!token || !isAuthenticated) {
        toast.error(t('settings.loginRequired'));
        router.push('/login');
        return;
      }

      const response = await apiClient.get<UserData>('/api/users/me');

      if (!response.success) {
        if (response.message?.includes('Unauthorized')) {
          toast.error(t('settings.loginRequired'));
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
      toast.error(getErrorMessage(error, 'Failed to load settings'));
    } finally {
      setLoading(false);
    }
  }, [canViewSettings, isAuthenticated, router, t, token]);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const handleUpdateProfile = async () => {
    if (!canManageSettings) {
      toast.error(t('settings.permissionDenied'));
      return;
    }

    try {
      setProfileSaving(true);
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
      toast.error(getErrorMessage(error, t('messages.updateError')));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdateNotifications = async () => {
    if (!canManageSettings) {
      toast.error(t('settings.permissionDenied'));
      return;
    }

    try {
      setNotificationSaving(true);
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
      toast.error(getErrorMessage(error, t('messages.updateError')));
    } finally {
      setNotificationSaving(false);
    }
  };

  const handleChangePassword = async (payload: PasswordChangePayload): Promise<boolean> => {
    if (!canManageSettings) {
      toast.error(t('settings.permissionDenied'));
      return false;
    }

    if (payload.newPassword !== payload.confirmPassword) {
      toast.error(t('settings.passwordMismatch'));
      return false;
    }

    try {
      setPasswordSaving(true);
      const response = await apiClient.put('/api/users/me/password', {
        currentPassword: payload.currentPassword,
        newPassword: payload.newPassword,
      });

      if (response.success) {
        toast.success(t('settings.passwordChanged'));
        return true;
      }

      toast.error(response.message || t('messages.updateError'));
      return false;
    } catch (error) {
      toast.error(getErrorMessage(error, t('messages.updateError')));
      return false;
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading || permissionsLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Spinner className="h-12 w-12" />
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (!canViewSettings) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 text-center">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{t('settings.permissionDenied')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <SettingsIcon className="h-8 w-8" />
          {t('settings.title')}
        </h1>
        <p className="mt-2 text-muted-foreground">{t('settings.description')}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4" dir={dir}>
        <OverlayScrollbar>
          <TabsList className="flex h-12 w-full flex-wrap gap-2 md:w-auto md:flex-nowrap">
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

        <TabsContent value="profile">
          <ProfileSettingsCard
            settings={settings}
            userId={userId}
            isSaving={profileSaving}
            canManage={canManageSettings}
            onSettingsChange={handleSettingsChange}
            onSave={handleUpdateProfile}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationPreferencesCard
            settings={settings}
            isSaving={notificationSaving}
            canManage={canManageSettings}
            onSettingsChange={handleSettingsChange}
            onSave={handleUpdateNotifications}
          />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettingsCard
            canManage={canManageSettings}
            isSaving={passwordSaving}
            onChangePassword={handleChangePassword}
          />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceSettingsCard />
        </TabsContent>

        <TabsContent value="positions">
          <PositionsManager canView={canViewSettings} canManage={canManageSettings} />
        </TabsContent>

        <TabsContent value="backup">
          <BackupManagerCard canView={canViewSettings} canManageBackups={canManageBackups} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

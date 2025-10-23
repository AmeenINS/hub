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
import { Settings as SettingsIcon, User, Bell, Shield, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

interface UserSettings {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskNotifications: boolean;
}

export default function SettingsPage() {
  const { t, dir } = useI18n();
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    emailNotifications: true,
    pushNotifications: true,
    taskNotifications: true,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!token || !isAuthenticated) {
        toast.error('Please login to continue');
        router.push('/login');
        return;
      }

      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        toast.error('Session expired. Please login again');
        router.push('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setSettings({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          emailNotifications: data.emailNotifications ?? true,
          pushNotifications: data.pushNotifications ?? true,
          taskNotifications: data.taskNotifications ?? true,
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }, [router, token, isAuthenticated]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleUpdateProfile = async () => {
    if (!token) return;
    
    try {
      setSaving(true);
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: settings.firstName,
          lastName: settings.lastName,
          phoneNumber: settings.phoneNumber,
        }),
      });

      if (response.ok) {
        toast.success(t('messages.updateSuccess'));
      } else {
        toast.error(t('messages.updateError'));
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(t('messages.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNotifications = async () => {
    if (!token) return;
    
    try {
      setSaving(true);
      const response = await fetch('/api/users/me/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailNotifications: settings.emailNotifications,
          pushNotifications: settings.pushNotifications,
          taskNotifications: settings.taskNotifications,
        }),
      });

      if (response.ok) {
        toast.success(t('messages.updateSuccess'));
      } else {
        toast.error(t('messages.updateError'));
      }
    } catch (error) {
      console.error('Failed to update notifications:', error);
      toast.error(t('messages.updateError'));
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
      const response = await fetch('/api/users/me/password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        toast.success(t('settings.passwordChanged'));
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        const error = await response.json();
        toast.error(error.message || t('messages.updateError'));
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error(t('messages.updateError'));
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
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            {t('settings.profile')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            {t('settings.notifications')}
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            {t('settings.security')}
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Globe className="h-4 w-4" />
            {t('settings.appearance')}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.profile')}</CardTitle>
              <CardDescription>{t('settings.updateProfile')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('users.firstName')}</Label>
                  <Input
                    id="firstName"
                    value={settings.firstName}
                    onChange={(e) => setSettings({ ...settings, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('users.lastName')}</Label>
                  <Input
                    id="lastName"
                    value={settings.lastName}
                    onChange={(e) => setSettings({ ...settings, lastName: e.target.value })}
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
      </Tabs>
    </div>
  );
}

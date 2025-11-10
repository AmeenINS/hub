'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Separator } from '@/shared/components/ui/separator';
import { Switch } from '@/shared/components/ui/switch';
import { useI18n } from '@/shared/i18n/i18n-context';
import { UserSettings } from './types';

interface NotificationPreferencesCardProps {
  settings: UserSettings;
  isSaving: boolean;
  canManage: boolean;
  onSettingsChange: (partial: Partial<UserSettings>) => void;
  onSave: () => void;
}

export function NotificationPreferencesCard({
  settings,
  isSaving,
  canManage,
  onSettingsChange,
  onSave,
}: NotificationPreferencesCardProps) {
  const { t } = useI18n();

  const handleToggle = (field: keyof Pick<UserSettings, 'emailNotifications' | 'pushNotifications' | 'taskNotifications'>, value: boolean) => {
    onSettingsChange({ [field]: value });
  };

  return (
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
            disabled={!canManage}
            onCheckedChange={(checked) => handleToggle('emailNotifications', checked)}
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
            disabled={!canManage}
            onCheckedChange={(checked) => handleToggle('pushNotifications', checked)}
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
            disabled={!canManage}
            onCheckedChange={(checked) => handleToggle('taskNotifications', checked)}
          />
        </div>

        <Button onClick={onSave} disabled={isSaving || !canManage} className="w-full sm:w-auto">
          {isSaving ? t('common.loading') : t('settings.saveChanges')}
        </Button>
      </CardContent>
    </Card>
  );
}

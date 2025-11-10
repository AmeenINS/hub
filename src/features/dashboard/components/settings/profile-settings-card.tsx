'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useI18n } from '@/shared/i18n/i18n-context';
import { UserAvatarUpload } from '@/features/dashboard/components/user-avatar-upload';
import { UserSettings } from './types';

interface ProfileSettingsCardProps {
  settings: UserSettings;
  userId?: string;
  isSaving: boolean;
  canManage: boolean;
  onSettingsChange: (partial: Partial<UserSettings>) => void;
  onSave: () => void;
}

export function ProfileSettingsCard({
  settings,
  userId,
  isSaving,
  canManage,
  onSettingsChange,
  onSave,
}: ProfileSettingsCardProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      {userId && (
        <UserAvatarUpload
          userId={userId}
          currentAvatarUrl={settings.avatarUrl}
          userFullName={settings.fullNameEn}
          onAvatarUpdated={(avatarUrl) => onSettingsChange({ avatarUrl })}
          variant="card"
          showPreview
        />
      )}

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
                disabled={!canManage}
                onChange={(event) => onSettingsChange({ fullNameEn: event.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullNameAr">{t('users.fullNameAr') || 'Full Name (Arabic)'}</Label>
              <Input
                id="fullNameAr"
                dir="rtl"
                value={settings.fullNameAr}
                disabled={!canManage}
                onChange={(event) => onSettingsChange({ fullNameAr: event.target.value })}
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
              disabled={!canManage}
              onChange={(event) => onSettingsChange({ phoneNumber: event.target.value })}
            />
          </div>

          <Button onClick={onSave} disabled={isSaving || !canManage} className="w-full sm:w-auto">
            {isSaving ? t('common.loading') : t('settings.saveChanges')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

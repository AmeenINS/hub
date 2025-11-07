'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { useI18n } from '@/shared/i18n/i18n-context';
import { toast } from 'sonner';
import { PasswordChangePayload } from './types';

interface SecuritySettingsCardProps {
  canManage: boolean;
  isSaving: boolean;
  onChangePassword: (payload: PasswordChangePayload) => Promise<boolean>;
}

export function SecuritySettingsCard({
  canManage,
  isSaving,
  onChangePassword,
}: SecuritySettingsCardProps) {
  const { t } = useI18n();
  const [passwords, setPasswords] = useState<PasswordChangePayload>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async () => {
    if (!canManage) {
      toast.error(t('settings.permissionDenied'));
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error(t('settings.passwordMismatch'));
      return;
    }

    const success = await onChangePassword(passwords);
    if (success) {
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  };

  return (
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
            disabled={!canManage}
            value={passwords.currentPassword}
            onChange={(event) =>
              setPasswords({ ...passwords, currentPassword: event.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">{t('settings.newPassword')}</Label>
          <Input
            id="newPassword"
            type="password"
            disabled={!canManage}
            value={passwords.newPassword}
            onChange={(event) =>
              setPasswords({ ...passwords, newPassword: event.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t('settings.confirmPassword')}</Label>
          <Input
            id="confirmPassword"
            type="password"
            disabled={!canManage}
            value={passwords.confirmPassword}
            onChange={(event) =>
              setPasswords({ ...passwords, confirmPassword: event.target.value })
            }
          />
        </div>

        <Button onClick={handleSubmit} disabled={isSaving || !canManage} className="w-full sm:w-auto">
          {isSaving ? t('common.loading') : t('settings.changePassword')}
        </Button>
      </CardContent>
    </Card>
  );
}

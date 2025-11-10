'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Separator } from '@/shared/components/ui/separator';
import { ThemeToggle } from '@/shared/components/theme/theme-toggle';
import { LanguageToggle } from '@/shared/components/theme/language-toggle';
import { useI18n } from '@/shared/i18n/i18n-context';

export function AppearanceSettingsCard() {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.appearance')}</CardTitle>
        <CardDescription>{t('settings.customizeAppearance')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 ltr:text-left rtl:text-right">
            <Label>{t('common.theme')}</Label>
            <p className="text-sm text-muted-foreground">{t('settings.selectTheme')}</p>
          </div>
          <ThemeToggle />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5 ltr:text-left rtl:text-right">
            <Label>{t('common.language')}</Label>
            <p className="text-sm text-muted-foreground">{t('settings.selectLanguage')}</p>
          </div>
          <LanguageToggle />
        </div>
      </CardContent>
    </Card>
  );
}

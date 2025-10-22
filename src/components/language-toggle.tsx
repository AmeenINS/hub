'use client';

import * as React from 'react';
import { GlobeIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/lib/i18n/i18n-context';
import { cn } from '@/lib/utils';

export function LanguageToggle() {
  const { locale, setLocale, t, dir, isChanging } = useI18n();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <GlobeIcon className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" disabled={isChanging}>
          <GlobeIcon className={cn(
            "h-[1.2rem] w-[1.2rem] transition-transform",
            isChanging && "animate-spin"
          )} />
          <span className="sr-only">{t('common.language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => setLocale('en')}
          className={cn(locale === 'en' && 'bg-accent')}
          disabled={isChanging}
        >
          <span className={cn(dir === 'rtl' ? 'ml-2' : 'mr-2')}>🇬🇧</span>
          <span>English</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLocale('ar')}
          className={cn(locale === 'ar' && 'bg-accent')}
          disabled={isChanging}
        >
          <span className={cn(dir === 'rtl' ? 'ml-2' : 'mr-2')}>🇸🇦</span>
          <span>العربية</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

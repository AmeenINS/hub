'use client';

import * as React from 'react';
import { GlobeIcon } from '@radix-ui/react-icons';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { useI18n } from '@/shared/i18n/i18n-context';
import { cn } from '@/core/utils';

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
        <Button 
          variant="outline" 
          size="icon" 
          disabled={isChanging}
          className="relative overflow-hidden transition-colors"
        >
          <GlobeIcon className={cn(
            "h-[1.2rem] w-[1.2rem] transition-transform duration-300",
            isChanging && "animate-spin"
          )} />
          <span className="sr-only">{t('common.language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <DropdownMenuItem 
          onClick={() => setLocale('en')}
          disabled={isChanging}
          className={cn(
            "cursor-pointer my-0.5",
            locale === 'en' && 'bg-accent'
          )}
        >
          <span className={cn(dir === 'rtl' ? 'ml-2' : 'mr-2')}>🇬🇧</span>
          <span>English</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLocale('ar')}
          disabled={isChanging}
          className={cn(
            "cursor-pointer my-0.5",
            locale === 'ar' && 'bg-accent'
          )}
        >
          <span className={cn(dir === 'rtl' ? 'ml-2' : 'mr-2')}>🇴🇲</span>
          <span>العربية</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

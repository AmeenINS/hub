'use client';

import * as React from 'react';
import { MoonIcon, SunIcon, DesktopIcon } from '@radix-ui/react-icons';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/lib/i18n/i18n-context';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const { t, dir } = useI18n();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <SunIcon className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t('common.theme')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className={cn(theme === 'light' && 'bg-accent')}
        >
          <SunIcon className={cn("h-4 w-4", dir === 'rtl' ? 'ml-2' : 'mr-2')} />
          <span>{t('common.light')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className={cn(theme === 'dark' && 'bg-accent')}
        >
          <MoonIcon className={cn("h-4 w-4", dir === 'rtl' ? 'ml-2' : 'mr-2')} />
          <span>{t('common.dark')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className={cn(theme === 'system' && 'bg-accent')}
        >
          <DesktopIcon className={cn("h-4 w-4", dir === 'rtl' ? 'ml-2' : 'mr-2')} />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

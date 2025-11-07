'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  ClipboardList, 
  Settings,
  Lightbulb,
  Users2,
} from 'lucide-react';
import { cn } from '@/core/utils';
import { useI18n } from '@/shared/i18n/i18n-context';
import { useModuleVisibility } from '@/shared/hooks/use-module-visibility';

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { hasAccess: canAccessModule, isLoading: permissionsLoading } = useModuleVisibility();

  const navItems = [
    {
      title: t('dashboard.dashboard'),
      href: '/dashboard',
      icon: Home,
      module: 'dashboard',
    },
    {
      title: t('modules.crm'),
      href: '/dashboard/crm/contacts',
      icon: Users2,
      module: 'crm',
    },
    {
      title: t('nav.notes'),
      href: '/dashboard/notes',
      icon: Lightbulb,
      module: 'notes',
    },
    {
      title: t('tasks.tasks'),
      href: '/dashboard/tasks',
      icon: ClipboardList,
      module: 'tasks',
    },
    {
      title: t('settings.settings'),
      href: '/dashboard/settings',
      icon: Settings,
      module: 'settings',
    },
  ];

  if (permissionsLoading) {
    return null;
  }

  const visibleItems = navItems.filter((item) => canAccessModule(item.module));

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-around h-16 px-2">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors',
                isActive
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
              <span className="truncate max-w-[60px]">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

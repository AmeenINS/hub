'use client';

import { useI18n } from '@/lib/i18n/i18n-context';
import { cn } from '@/lib/utils';
import React from 'react';

export function RTLSidebarWrapper({ children }: { children: React.ReactNode }) {
  const { dir } = useI18n();
  
  const rtlClasses = React.useMemo(() => cn(
    dir === 'rtl' && "[&_[data-sidebar-menu-sub]]:border-l-0 [&_[data-sidebar-menu-sub]]:border-r [&_[data-sidebar-menu-sub]]:-translate-x-px",
    dir === 'rtl' && "[&_.sidebar-rail]:left-auto [&_.sidebar-rail]:right-full",
    dir === 'rtl' && "[&_.ml-auto]:ml-0 [&_.ml-auto]:mr-auto",
    dir === 'rtl' && "[&_.mr-2]:mr-0 [&_.mr-2]:ml-2",
    dir === 'rtl' && "[&_.mr-4]:mr-0 [&_.mr-4]:ml-4",
    dir === 'rtl' && "[&_.ml-2]:ml-0 [&_.ml-2]:mr-2",
    dir === 'rtl' && "[&_.pl-4]:pl-0 [&_.pl-4]:pr-4",
    dir === 'rtl' && "[&_.pr-4]:pr-0 [&_.pr-4]:pl-4",
    dir === 'rtl' && "[&_.pl-2]:pl-0 [&_.pl-2]:pr-2",
    dir === 'rtl' && "[&_.pr-2]:pr-0 [&_.pr-2]:pl-2",
    dir === 'rtl' && "[&_svg.lucide-chevron-right]:rotate-180",
    dir === 'rtl' && "[&_svg.lucide-chevron-left]:rotate-180",
    dir === 'rtl' && "[&_[data-sidebar-trigger]]:left-auto [&_[data-sidebar-trigger]]:right-0"
  ), [dir]);

  return (
    <div className={rtlClasses}>
      {children}
    </div>
  );
}

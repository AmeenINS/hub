'use client';

import { useI18n } from '@/shared/i18n/i18n-context';
import { cn } from '@/core/utils';
import React from 'react';

interface RTLIconProps {
  children: React.ReactNode;
  flip?: boolean;
  className?: string;
}

export function RTLIcon({ children, flip = false, className }: RTLIconProps) {
  const { dir } = useI18n();
  
  return (
    <span className={cn(
      "inline-flex",
      dir === 'rtl' && flip && "transform scale-x-[-1]",
      className
    )}>
      {children}
    </span>
  );
}

// For chevrons and arrows that should rotate in RTL
export function RTLChevron({ children, className }: RTLIconProps) {
  const { dir } = useI18n();
  
  return (
    <span className={cn(
      "inline-flex transition-transform",
      dir === 'rtl' && "rotate-180",
      className
    )}>
      {children}
    </span>
  );
}

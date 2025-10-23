'use client';

import * as React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

interface OverlayScrollbarProps {
  children: React.ReactNode;
  className?: string;
  defer?: boolean;
}

export function OverlayScrollbar({ 
  children, 
  className,
  defer = true 
}: OverlayScrollbarProps) {
  return (
    <OverlayScrollbarsComponent
      defer={defer}
      options={{
        scrollbars: {
          autoHide: 'leave',
          autoHideDelay: 800,
          theme: 'os-theme-dark',
        },
        overflow: {
          x: 'scroll',
          y: 'hidden',
        },
      }}
      className={className}
    >
      {children}
    </OverlayScrollbarsComponent>
  );
}

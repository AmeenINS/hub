'use client';

import React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

interface CustomScrollbarProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function CustomScrollbar({ children, className, style }: CustomScrollbarProps) {
  return (
    <OverlayScrollbarsComponent
      element="div"
      options={{
        scrollbars: {
          autoHide: 'move',
          autoHideDelay: 800,
          theme: 'os-theme-dark',
        },
        overflow: {
          x: 'hidden',
          y: 'scroll',
        },
      }}
      defer
      className={className}
      style={style}
    >
      {children}
    </OverlayScrollbarsComponent>
  );
}

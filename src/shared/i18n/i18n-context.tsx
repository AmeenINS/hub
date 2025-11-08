'use client';

import React, { createContext, useContext, useState, useEffect, useRef, startTransition } from 'react';
import Cookies from 'js-cookie';
import { translations, Locale } from './translations';
import { usePreventPointerEventsDisable } from '@/shared/hooks/use-prevent-pointer-events-disable';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
  isChanging: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Get initial locale from HTML lang attribute (set by server)
function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const htmlLang = document.documentElement.lang as Locale;
  if (htmlLang === 'en' || htmlLang === 'ar') {
    return htmlLang;
  }
  return 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale());
  const [isChanging, setIsChanging] = useState(false);
  const initialized = useRef(false);
  
  // Prevent pointer events from being disabled
  usePreventPointerEventsDisable();

  useEffect(() => {
    // Sync with any external changes to locale (from other tabs, etc.)
    if (!initialized.current) {
      initialized.current = true;
      const currentLocale = getInitialLocale();
      const savedLocale = (Cookies.get('locale') || localStorage.getItem('locale')) as Locale;
      
      // If cookie/localStorage differs from server-rendered value, sync them
      if (savedLocale && (savedLocale === 'en' || savedLocale === 'ar') && savedLocale !== currentLocale) {
        startTransition(() => {
          setLocaleState(savedLocale);
        });
      }
    }
  }, []);

  useEffect(() => {
    // Set HTML attributes
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    
    if (isChanging) {
      const timer = setTimeout(() => {
        setIsChanging(false);
        // Ensure pointer events are re-enabled
        document.body.style.pointerEvents = '';
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [locale, isChanging]);



  const setLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;
    
    setIsChanging(true);
    setLocaleState(newLocale);
    Cookies.set('locale', newLocale, { expires: 365 });
    localStorage.setItem('locale', newLocale);
  };

  const t = (key: string, vars?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: unknown = translations[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    if (typeof value === 'string') {
      if (vars) {
        return value.replace(/\{\{(\w+)\}\}/g, (_, key) => 
          vars[key]?.toString() ?? `{{${key}}}`
        );
      }
      return value;
    }
    return key;
  };

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir, isChanging }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

'use client';

import React, { createContext, useContext, useState, useEffect, useRef, startTransition } from 'react';
import Cookies from 'js-cookie';
import { translations, Locale } from './translations';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
  isChanging: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [isChanging, setIsChanging] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    // Initialize locale from cookie after mount to avoid hydration mismatch
    if (!initialized.current) {
      initialized.current = true;
      const savedLocale = Cookies.get('locale') as Locale;
      if (savedLocale === 'en' || savedLocale === 'ar') {
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
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [locale, isChanging]);

  const setLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;
    
    setIsChanging(true);
    setLocaleState(newLocale);
    Cookies.set('locale', newLocale, { expires: 365 });
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: unknown = translations[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
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

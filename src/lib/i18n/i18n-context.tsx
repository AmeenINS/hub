'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Initialize from cookie
    if (typeof window !== 'undefined') {
      const savedLocale = Cookies.get('locale') as Locale;
      return (savedLocale === 'en' || savedLocale === 'ar') ? savedLocale : 'en';
    }
    return 'en';
  });
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    // Set HTML attributes
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    
    // Add transition class
    document.documentElement.classList.add('transitioning');
    
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('transitioning');
      setIsChanging(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;
    
    setIsChanging(true);
    
    // Use requestAnimationFrame to ensure smooth transition
    requestAnimationFrame(() => {
      setLocaleState(newLocale);
      Cookies.set('locale', newLocale, { expires: 365 });
      document.documentElement.lang = newLocale;
      document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
    });
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

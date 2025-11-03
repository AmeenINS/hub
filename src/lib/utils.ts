import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// RTL utilities
export function rtl(ltrClass: string, rtlClass: string, dir: 'ltr' | 'rtl' = 'ltr') {
  return dir === 'rtl' ? rtlClass : ltrClass;
}

export function rtlMargin(value: string, dir: 'ltr' | 'rtl' = 'ltr') {
  const side = value.split('-')[0]; // ml, mr, etc
  const size = value.split('-').slice(1).join('-'); // 2, 4, auto, etc
  
  if (dir === 'rtl') {
    if (side === 'ml') return `mr-${size}`;
    if (side === 'mr') return `ml-${size}`;
    if (side === 'pl') return `pr-${size}`;
    if (side === 'pr') return `pl-${size}`;
  }
  
  return value;
}

export function rtlPadding(value: string, dir: 'ltr' | 'rtl' = 'ltr') {
  return rtlMargin(value, dir);
}

interface UserNameLike {
  fullNameEn?: string;
  fullNameAr?: string;
  email?: string;
}

export function getLocalizedUserName(
  user: UserNameLike,
  locale: 'en' | 'ar' | string = 'en'
): string {
  if (locale === 'ar' && user.fullNameAr) {
    return user.fullNameAr;
  }
  if (locale !== 'ar' && user.fullNameEn) {
    return user.fullNameEn;
  }
  return user.fullNameEn || user.fullNameAr || user.email || 'User';
}

export function getCombinedUserName(user: UserNameLike): string {
  return [user.fullNameEn, user.fullNameAr].filter(Boolean).join(' / ') || user.email || 'User';
}

export function getUserInitials(user: UserNameLike): string {
  const source = user.fullNameEn || user.fullNameAr || '';
  if (!source.trim()) return '?';
  const words = source.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

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

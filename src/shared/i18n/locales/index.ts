/**
 * Main locales export
 * Combines all language translations
 */

import { en } from './en';
import { ar } from './ar';

export const translations = {
  en,
  ar,
};

export type TranslationKeys = typeof en;

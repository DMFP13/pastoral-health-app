import { en } from './en';
import { ha } from './ha';
import type { Language } from '../types';

export type { Strings } from './en';

const STRINGS = { en, ha };

export function getStrings(lang: Language) {
  return STRINGS[lang as keyof typeof STRINGS] ?? en;
}

/** Persisted language preference */
const LANG_KEY = 'pastoral_lang';

export function getStoredLang(): Language {
  return (localStorage.getItem(LANG_KEY) as Language) || 'en';
}

export function setStoredLang(lang: Language) {
  localStorage.setItem(LANG_KEY, lang);
}

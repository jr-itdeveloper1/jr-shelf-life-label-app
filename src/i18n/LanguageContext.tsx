import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { chineseTranslations } from './chineseTranslations';
import { englishTranslations, interpolateTranslation, type TranslationKey } from './translations';

export type AppLanguage = 'en' | 'zh-CN';
type LanguageContextValue = { language: AppLanguage; setLanguage: (language: AppLanguage) => void; t: (key: TranslationKey, values?: Record<string, string | number>) => string };
const languageStorageKey = 'jr-shelf-life-language-v1';
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');
  useEffect(() => { void SecureStore.getItemAsync(languageStorageKey).then((stored) => { if (stored === 'en' || stored === 'zh-CN') setLanguageState(stored); }).catch(() => undefined); }, []);
  const setLanguage = useCallback((next: AppLanguage) => { setLanguageState(next); void SecureStore.setItemAsync(languageStorageKey, next).catch(() => undefined); }, []);
  const value = useMemo<LanguageContextValue>(() => ({ language, setLanguage, t: (key, values) => interpolateTranslation(language === 'zh-CN' ? chineseTranslations[key] : englishTranslations[key], values) }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}

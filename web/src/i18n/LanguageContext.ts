import { createContext, useContext } from 'react';
import type { Language, TranslationKey } from './translations';

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  // Devolve o texto no idioma atual; {nome} é trocado pelo valor passado
  t: (key: TranslationKey, values?: Record<string, string>) => string;
};

export const LanguageContext = createContext<LanguageContextValue | null>(null);

// Atalho para usar o idioma dentro de um componente
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return context;
}

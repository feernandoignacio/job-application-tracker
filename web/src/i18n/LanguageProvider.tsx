import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { LanguageContext } from './LanguageContext';
import { translations } from './translations';
import type { Language, TranslationKey } from './translations';

const STORAGE_KEY = 'language';

// Idioma inicial: o que a pessoa escolheu antes, ou o do navegador
function getInitialLanguage(): Language {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'en' || saved === 'pt') {
    return saved;
  }
  return navigator.language.startsWith('pt') ? 'pt' : 'en';
}

// Envolve o app e deixa o idioma disponível para todos os componentes
function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  // Guarda a escolha e avisa o navegador do idioma da página
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === 'pt' ? 'pt-BR' : 'en';
  }, [language]);

  function t(key: TranslationKey, values: Record<string, string> = {}) {
    let text: string = translations[language][key];
    for (const [name, value] of Object.entries(values)) {
      text = text.replace(`{${name}}`, value);
    }
    return text;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export default LanguageProvider;

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import type { Language } from '../i18n/translations';
import './LanguageSelect.css';

// Idiomas disponíveis, cada um escrito na própria língua
const languages: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
];

type LanguageSelectProps = {
  // Para onde a lista abre: para cima (embaixo do cartão) ou para baixo (no topo)
  direction?: 'up' | 'down';
};

// Botão "Português ▾" que abre uma listinha para trocar o idioma
function LanguageSelect({ direction = 'up' }: LanguageSelectProps) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha a lista ao clicar fora dela ou apertar Esc
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    // Limpa os "ouvintes" quando a lista fecha
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  function choose(value: Language) {
    setLanguage(value);
    setIsOpen(false);
  }

  const currentLabel = languages.find((item) => item.value === language)?.label;

  return (
    <div className="language-select" ref={containerRef}>
      <button
        type="button"
        className="language-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Language / Idioma"
      >
        {currentLabel}
        <span
          className={isOpen ? 'language-arrow open' : 'language-arrow'}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <ul className={`language-menu ${direction}`} role="listbox">
          {languages.map((item) => (
            <li
              key={item.value}
              role="option"
              aria-selected={item.value === language}
            >
              <button
                type="button"
                className={
                  item.value === language
                    ? 'language-option selected'
                    : 'language-option'
                }
                onClick={() => choose(item.value)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default LanguageSelect;

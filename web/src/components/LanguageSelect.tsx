import { useLanguage } from '../i18n/LanguageContext';
import type { Language } from '../i18n/translations';
import './LanguageSelect.css';

// Caixinha para trocar o idioma do app (English / Português)
function LanguageSelect() {
  const { language, setLanguage } = useLanguage();

  return (
    <select
      className="language-select"
      value={language}
      onChange={(event) => setLanguage(event.target.value as Language)}
      aria-label="Language / Idioma"
    >
      <option value="en">English</option>
      <option value="pt">Português</option>
    </select>
  );
}

export default LanguageSelect;

import type { Language } from '../i18n/translations';

// Transforma '2026-11-03' em 'Nov 3, 2026' (ou '3 de nov. de 2026' em português)
export function formatDate(date: string, language: Language = 'en'): string {
  // Separa ano, mês e dia para criar a data no fuso do usuário
  const [year, month, day] = date.split('-').map(Number);

  // No JavaScript, os meses começam em 0 (janeiro = 0)
  return new Date(year, month - 1, day).toLocaleDateString(
    language === 'pt' ? 'pt-BR' : 'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },
  );
}

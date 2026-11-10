// Transforma '2026-11-03' em 'Nov 3, 2026'
export function formatDate(date: string): string {
  // Separa ano, mês e dia para criar a data no fuso do usuário
  const [year, month, day] = date.split('-').map(Number);

  // No JavaScript, os meses começam em 0 (janeiro = 0)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

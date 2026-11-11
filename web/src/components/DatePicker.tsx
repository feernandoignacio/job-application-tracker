import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import './DatePicker.css';

type DatePickerProps = {
  // Data escolhida, no formato AAAA-MM-DD
  value?: string;
  onSelect: (date: string) => void;
};

// Junta ano, mês e dia no formato AAAA-MM-DD (mês começa em 0 no JavaScript)
function toISODate(year: number, month: number, day: number) {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

// Calendário de um mês, com setas para ir e voltar
function DatePicker({ value, onSelect }: DatePickerProps) {
  const { language, t } = useLanguage();
  const locale = language === 'pt' ? 'pt-BR' : 'en-US';

  // "Hoje" é lido uma vez, quando o calendário abre
  const [today] = useState(() => new Date());
  const todayISO = toISODate(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  // Mês que está aparecendo: o da data escolhida, ou o mês atual
  const [shownMonth, setShownMonth] = useState(() => {
    if (value) {
      const [year, month] = value.split('-').map(Number);
      return new Date(year, month - 1, 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const year = shownMonth.getFullYear();
  const month = shownMonth.getMonth();

  // Nome do mês ("novembro de 2026") e das letras dos dias da semana
  const monthName = shownMonth.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
  // Só a primeira letra maiúscula: "Novembro de 2026"
  const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const weekDays = Array.from({ length: 7 }, (_, index) =>
    // 2026-11-01 é um domingo: dali em diante, um dia da semana por vez
    new Date(2026, 10, 1 + index).toLocaleDateString(locale, {
      weekday: 'narrow',
    }),
  );

  // Espaços vazios antes do dia 1 e quantos dias o mês tem
  const blanks = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);

  function changeMonth(step: number) {
    setShownMonth(new Date(year, month + step, 1));
  }

  return (
    <div className="date-picker">
      <div className="date-picker-header">
        <button
          type="button"
          className="date-picker-arrow"
          onClick={() => changeMonth(-1)}
          aria-label={t('previousMonth')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <span className="date-picker-month">{monthLabel}</span>
        <button
          type="button"
          className="date-picker-arrow"
          onClick={() => changeMonth(1)}
          aria-label={t('nextMonth')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <div className="date-picker-grid">
        {weekDays.map((weekDay, index) => (
          <span key={index} className="date-picker-weekday" aria-hidden="true">
            {weekDay}
          </span>
        ))}

        {Array.from({ length: blanks }, (_, index) => (
          <span key={`blank-${index}`} />
        ))}

        {days.map((day) => {
          const iso = toISODate(year, month, day);
          const classes = ['date-picker-day'];
          if (iso === value) {
            classes.push('selected');
          }
          if (iso === todayISO) {
            classes.push('today');
          }

          return (
            <button
              key={iso}
              type="button"
              className={classes.join(' ')}
              onClick={() => onSelect(iso)}
              aria-label={new Date(year, month, day).toLocaleDateString(
                locale,
                { day: 'numeric', month: 'long', year: 'numeric' },
              )}
              aria-pressed={iso === value}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default DatePicker;

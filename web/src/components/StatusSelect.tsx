import { useRef, useState } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import { useLanguage } from '../i18n/LanguageContext';
import type { ApplicationStatus } from '../types/application';
import DatePicker from './DatePicker';
import './StatusSelect.css';

const statuses: ApplicationStatus[] = [
  'applied',
  'interview',
  'offer',
  'rejected',
];

type StatusChanges = {
  status: ApplicationStatus;
  interviewAt?: string;
};

type StatusSelectProps = {
  value: ApplicationStatus;
  interviewAt?: string;
  onChange: (changes: StatusChanges) => void;
  label: string;
};

// Etiqueta do status que abre uma listinha; em "Entrevista" abre um calendário
function StatusSelect({
  value,
  interviewAt,
  onChange,
  label,
}: StatusSelectProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  // O que aparece na janelinha: a lista de status ou o calendário
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const containerRef = useRef<HTMLDivElement>(null);

  function close() {
    setIsOpen(false);
    setView('list');
  }

  useClickOutside(containerRef, isOpen, close);

  function choose(status: ApplicationStatus) {
    // Entrevista: antes de salvar, pergunta o dia
    if (status === 'interview') {
      setView('calendar');
      return;
    }
    onChange({ status });
    close();
  }

  function chooseDate(date: string) {
    onChange({ status: 'interview', interviewAt: date });
    close();
  }

  // "Pular": vira entrevista sem mudar a data
  function skipDate() {
    onChange({ status: 'interview' });
    close();
  }

  return (
    <div className="status-select" ref={containerRef}>
      <button
        type="button"
        className={`status-trigger status-${value}`}
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={label}
      >
        {t(value)}
        <span
          className={isOpen ? 'status-arrow open' : 'status-arrow'}
          aria-hidden="true"
        />
      </button>

      {isOpen && view === 'list' && (
        <ul className="status-menu" role="listbox" aria-label={label}>
          {statuses.map((status) => (
            <li key={status} role="option" aria-selected={status === value}>
              <button
                type="button"
                className={
                  status === value ? 'status-option selected' : 'status-option'
                }
                onClick={() => choose(status)}
              >
                <span className={`status-dot dot-${status}`} />
                {t(status)}
                {status === value && (
                  <svg
                    className="status-check"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M5 12l5 5 9-10" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && view === 'calendar' && (
        <div className="status-menu status-calendar">
          <div className="status-calendar-header">
            <button
              type="button"
              className="status-back"
              onClick={() => setView('list')}
              aria-label={t('back')}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <strong>{t('whenInterview')}</strong>
          </div>

          <DatePicker value={interviewAt} onSelect={chooseDate} />

          <button type="button" className="status-skip" onClick={skipDate}>
            {t('skipDate')}
          </button>
        </div>
      )}
    </div>
  );
}

export default StatusSelect;

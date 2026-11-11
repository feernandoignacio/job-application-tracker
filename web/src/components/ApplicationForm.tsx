import { useState } from 'react';
import type { FormEvent } from 'react';
import type { NewApplication } from '../api';
import type { ApplicationStatus } from '../types/application';
import './ApplicationForm.css';
import { useLanguage } from '../i18n/LanguageContext';

type ApplicationFormProps = {
  // Devolve true se salvou, para o formulário saber se pode limpar
  onAdd: (application: NewApplication) => Promise<boolean>;
};

function ApplicationForm({ onAdd }: ApplicationFormProps) {
  const { t } = useLanguage();

  // Um estado para cada campo do formulário
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('applied');
  const [jobUrl, setJobUrl] = useState('');
  const [notes, setNotes] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Impede a página de recarregar (igual ao seu e.preventDefault())
    event.preventDefault();

    // O id e a data agora quem cria é a API
    const saved = await onAdd({
      company: company.trim(),
      position: position.trim(),
      status,
      // Se o campo ficou vazio, não manda link nenhum
      jobUrl: jobUrl.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    // Só limpa o formulário se salvou; se deu erro, o texto fica lá
    if (saved) {
      setCompany('');
      setPosition('');
      setStatus('applied');
      setJobUrl('');
      setNotes('');
    }
  }

  return (
    <form className="application-form" onSubmit={handleSubmit}>
      <label>
        {t('company')}
        <input
          type="text"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          required
        />
      </label>

      <label>
        {t('position')}
        <input
          type="text"
          value={position}
          onChange={(event) => setPosition(event.target.value)}
          required
        />
      </label>

      <label>
        {t('status')}
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as ApplicationStatus)
          }
        >
          <option value="applied">{t('applied')}</option>
          <option value="interview">{t('interview')}</option>
          <option value="offer">{t('offer')}</option>
          <option value="rejected">{t('rejected')}</option>
        </select>
      </label>

      <label className="full-width">
        {t('jobUrlOptional')}
        <input
          type="url"
          value={jobUrl}
          onChange={(event) => setJobUrl(event.target.value)}
          placeholder="https://"
        />
      </label>

      <label className="full-width">
        {t('notesOptional')}
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={t('notesPlaceholder')}
          rows={2}
        />
      </label>

      <button type="submit">{t('addApplication')}</button>
    </form>
  );
}

export default ApplicationForm;

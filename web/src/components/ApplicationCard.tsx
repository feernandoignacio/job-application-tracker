import { useState } from 'react';
import type { FormEvent } from 'react';
import type { NewApplication } from '../api';
import type { Application, ApplicationStatus } from '../types/application';
import { formatDate } from '../utils/formatDate';
import './ApplicationCard.css';
import { useLanguage } from '../i18n/LanguageContext';

// O que este componente recebe de fora (as "props")
type ApplicationCardProps = {
  application: Application;
  onDelete: (id: string) => void;
  // Devolve true se salvou, para o card saber se pode sair do modo edição
  onUpdate: (id: string, changes: Partial<NewApplication>) => Promise<boolean>;
};

function ApplicationCard({
  application,
  onDelete,
  onUpdate,
}: ApplicationCardProps) {
  const { language, t } = useLanguage();

  // O card tem dois modos: mostrando os dados ou editando
  const [isEditing, setIsEditing] = useState(false);
  const [company, setCompany] = useState(application.company);
  const [position, setPosition] = useState(application.position);
  const [jobUrl, setJobUrl] = useState(application.jobUrl ?? '');
  const [notes, setNotes] = useState(application.notes ?? '');

  // Abre a edição já com os dados atuais nos campos
  function startEditing() {
    setCompany(application.company);
    setPosition(application.position);
    setJobUrl(application.jobUrl ?? '');
    setNotes(application.notes ?? '');
    setIsEditing(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Campo vazio vai como texto vazio, e a API entende como "apagar"
    const saved = await onUpdate(application.id, {
      company: company.trim(),
      position: position.trim(),
      jobUrl: jobUrl.trim(),
      notes: notes.trim(),
    });

    if (saved) {
      setIsEditing(false);
    }
  }

  // Pergunta antes de apagar, para evitar clique sem querer
  function handleDelete() {
    const confirmed = window.confirm(
      t('confirmDelete', { company: application.company }),
    );

    if (confirmed) {
      onDelete(application.id);
    }
  }

  if (isEditing) {
    return (
      <li className="application-card">
        <form className="edit-form" onSubmit={handleSave}>
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
            {t('jobUrl')}
            <input
              type="url"
              value={jobUrl}
              onChange={(event) => setJobUrl(event.target.value)}
              placeholder="https://"
            />
          </label>

          <label>
            {t('notes')}
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
            />
          </label>

          <div className="edit-actions">
            <button type="submit" className="save-button">
              {t('save')}
            </button>
            <button
              type="button"
              className="card-button"
              onClick={() => setIsEditing(false)}
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="application-card">
      <strong className="application-company">{application.company}</strong>
      <span className="application-position">{application.position}</span>

      <span className="application-date">
        {t('appliedOn', {
          date: formatDate(application.appliedAt, language),
        })}
      </span>

      {application.jobUrl && (
        <a
          className="application-link"
          href={application.jobUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('viewJob')}
        </a>
      )}

      {application.notes && (
        <p className="application-notes">{application.notes}</p>
      )}

      <select
        className={`status status-${application.status}`}
        value={application.status}
        onChange={(event) =>
          onUpdate(application.id, {
            status: event.target.value as ApplicationStatus,
          })
        }
        aria-label={t('statusOf', { company: application.company })}
      >
        <option value="applied">{t('applied')}</option>
        <option value="interview">{t('interview')}</option>
        <option value="offer">{t('offer')}</option>
        <option value="rejected">{t('rejected')}</option>
      </select>

      <div className="card-actions">
        <button type="button" className="card-button" onClick={startEditing}>
          {t('edit')}
        </button>
        <button
          type="button"
          className="card-button delete-button"
          onClick={handleDelete}
        >
          {t('delete')}
        </button>
      </div>
    </li>
  );
}

export default ApplicationCard;

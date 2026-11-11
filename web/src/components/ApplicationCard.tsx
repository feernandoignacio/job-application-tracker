import { useState } from 'react';
import type { FormEvent } from 'react';
import type { NewApplication } from '../api';
import type { Application } from '../types/application';
import { formatDate } from '../utils/formatDate';
import StatusSelect from './StatusSelect';
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
    <li className={`application-card card-${application.status}`}>
      {/* Topo: inicial da empresa, nome, cargo e os botões de editar e apagar */}
      <div className="card-header">
        <span className="company-initial" aria-hidden="true">
          {application.company.charAt(0).toUpperCase()}
        </span>

        <div className="card-title">
          <strong className="application-company">{application.company}</strong>
          <span className="application-position">{application.position}</span>
        </div>

        <div className="card-actions">
          <button
            type="button"
            className="icon-button"
            onClick={startEditing}
            aria-label={t('edit')}
            title={t('edit')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 20h4L19 9l-4-4L4 16v4z" />
              <path d="M14 6l4 4" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-button delete-button"
            onClick={handleDelete}
            aria-label={t('delete')}
            title={t('delete')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16" />
              <path d="M10 11v6M14 11v6" />
              <path d="M6 7l1 13h10l1-13" />
              <path d="M9 7V4h6v3" />
            </svg>
          </button>
        </div>
      </div>

      {application.notes && (
        <p className="application-notes">{application.notes}</p>
      )}

      {/* Embaixo: status, link da vaga e data */}
      <div className="card-footer">
        <StatusSelect
          value={application.status}
          interviewAt={application.interviewAt}
          onChange={(changes) => onUpdate(application.id, changes)}
          label={t('statusOf', { company: application.company })}
        />

        <div className="card-meta">
          {application.jobUrl && (
            <a
              className="application-link"
              href={application.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('viewJob')}
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 4h6v6" />
                <path d="M20 4l-9 9" />
                <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
              </svg>
            </a>
          )}

          {/* Em entrevista com dia marcado, mostra o dia; senão, quando enviou */}
          <span className="application-date">
            {application.status === 'interview' && application.interviewAt
              ? t('interviewOn', {
                  date: formatDate(application.interviewAt, language),
                })
              : t('appliedOn', {
                  date: formatDate(application.appliedAt, language),
                })}
          </span>
        </div>
      </div>
    </li>
  );
}

export default ApplicationCard;

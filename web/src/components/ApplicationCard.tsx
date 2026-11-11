import { useState } from 'react';
import type { FormEvent } from 'react';
import type { NewApplication } from '../api';
import type { Application, ApplicationStatus } from '../types/application';
import { formatDate } from '../utils/formatDate';
import './ApplicationCard.css';

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
      `Delete the application to ${application.company}?`,
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
            Company
            <input
              type="text"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              required
            />
          </label>

          <label>
            Position
            <input
              type="text"
              value={position}
              onChange={(event) => setPosition(event.target.value)}
              required
            />
          </label>

          <label>
            Job URL
            <input
              type="url"
              value={jobUrl}
              onChange={(event) => setJobUrl(event.target.value)}
              placeholder="https://"
            />
          </label>

          <label>
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
            />
          </label>

          <div className="edit-actions">
            <button type="submit" className="save-button">
              Save
            </button>
            <button
              type="button"
              className="card-button"
              onClick={() => setIsEditing(false)}
            >
              Cancel
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
        Applied on {formatDate(application.appliedAt)}
      </span>

      {application.jobUrl && (
        <a
          className="application-link"
          href={application.jobUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          View job
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
        aria-label={`Status of ${application.company} application`}
      >
        <option value="applied">Applied</option>
        <option value="interview">Interview</option>
        <option value="offer">Offer</option>
        <option value="rejected">Rejected</option>
      </select>

      <div className="card-actions">
        <button type="button" className="card-button" onClick={startEditing}>
          Edit
        </button>
        <button
          type="button"
          className="card-button delete-button"
          onClick={handleDelete}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export default ApplicationCard;

import type { Application, ApplicationStatus } from '../types/application';
import { formatDate } from '../utils/formatDate';
import './ApplicationCard.css';

// O que este componente recebe de fora (as "props")
type ApplicationCardProps = {
  application: Application;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
};

function ApplicationCard({
  application,
  onDelete,
  onStatusChange,
}: ApplicationCardProps) {
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

      <select
        className={`status status-${application.status}`}
        value={application.status}
        onChange={(event) =>
          onStatusChange(
            application.id,
            event.target.value as ApplicationStatus,
          )
        }
        aria-label={`Status of ${application.company} application`}
      >
        <option value="applied">Applied</option>
        <option value="interview">Interview</option>
        <option value="offer">Offer</option>
        <option value="rejected">Rejected</option>
      </select>

      <button
        type="button"
        className="delete-button"
        onClick={() => onDelete(application.id)}
      >
        Delete
      </button>
    </li>
  );
}

export default ApplicationCard;

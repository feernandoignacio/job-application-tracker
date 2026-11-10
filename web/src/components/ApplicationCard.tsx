import type { Application } from '../types/application';
import './ApplicationCard.css';

// O que este componente recebe de fora (as "props")
type ApplicationCardProps = {
  application: Application;
};

function ApplicationCard({ application }: ApplicationCardProps) {
  return (
    <li className="application-card">
      <strong className="application-company">{application.company}</strong>
      <span className="application-position">{application.position}</span>
      <span className={`status status-${application.status}`}>
        {application.status}
      </span>
    </li>
  );
}

export default ApplicationCard;

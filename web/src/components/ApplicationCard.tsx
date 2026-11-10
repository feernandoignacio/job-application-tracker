import type { Application } from '../types/application';

// O que este componente recebe de fora (as "props")
type ApplicationCardProps = {
  application: Application;
};

function ApplicationCard({ application }: ApplicationCardProps) {
  return (
    <li>
      <strong>{application.company}</strong>
      <span>{application.position}</span>
      <span>{application.status}</span>
    </li>
  );
}

export default ApplicationCard;

import { useState } from 'react';
import ApplicationCard from './components/ApplicationCard';
import { sampleApplications } from './data/sampleApplications';
import type { ApplicationStatus } from './types/application';
import './App.css';

// O filtro pode ser "todos" ou um dos status
type StatusFilter = 'all' | ApplicationStatus;

const filters: StatusFilter[] = [
  'all',
  'applied',
  'interview',
  'offer',
  'rejected',
];

function App() {
  // Filtro escolhido no momento (começa em "todos")
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');

  // Candidaturas que aparecem na tela, de acordo com o filtro
  const visibleApplications =
    selectedStatus === 'all'
      ? sampleApplications
      : sampleApplications.filter(
          (application) => application.status === selectedStatus,
        );

  return (
    <main className="app">
      <header className="app-header">
        <h1>Job Application Tracker</h1>
        <p>Track every job application in one place.</p>
      </header>

      <nav className="status-filter" aria-label="Filter by status">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            className={
              filter === selectedStatus
                ? 'filter-button active'
                : 'filter-button'
            }
            onClick={() => setSelectedStatus(filter)}
          >
            {filter}
          </button>
        ))}
      </nav>

      {visibleApplications.length === 0 ? (
        <p className="empty-message">No applications with this status.</p>
      ) : (
        <ul className="application-list">
          {visibleApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </ul>
      )}
    </main>
  );
}

export default App;

import { useEffect, useState } from 'react';
import ApplicationCard from './components/ApplicationCard';
import ApplicationForm from './components/ApplicationForm';
import { sampleApplications } from './data/sampleApplications';
import type { Application, ApplicationStatus } from './types/application';
import './App.css';

// O filtro pode ser "todos" ou um dos status
type StatusFilter = 'all' | ApplicationStatus;

// Nome da "gaveta" onde a lista fica guardada no navegador
const STORAGE_KEY = 'job-applications';

// Lê a lista salva; se não tiver nada, usa os exemplos
function loadApplications(): Application[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : sampleApplications;
}

const filters: StatusFilter[] = [
  'all',
  'applied',
  'interview',
  'offer',
  'rejected',
];

function App() {
  // Lista de candidaturas (começa com o que estiver salvo)
  const [applications, setApplications] =
    useState<Application[]>(loadApplications);

  // Sempre que a lista mudar, salva no navegador
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  }, [applications]);

  // Filtro escolhido no momento (começa em "todos")
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');

  // Candidaturas que aparecem na tela, de acordo com o filtro
  const visibleApplications =
    selectedStatus === 'all'
      ? applications
      : applications.filter(
          (application) => application.status === selectedStatus,
        );

  // Remove a candidatura que tem este id
  function handleDelete(id: string) {
    setApplications(
      applications.filter((application) => application.id !== id),
    );
  }

  // Troca o status da candidatura que tem este id
  function handleStatusChange(id: string, status: ApplicationStatus) {
    setApplications(
      applications.map((application) =>
        application.id === id ? { ...application, status } : application,
      ),
    );
  }

  // Adiciona a nova candidatura no começo da lista
  function handleAdd(newApplication: Application) {
    setApplications([newApplication, ...applications]);
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>Job Application Tracker</h1>
        <p>Track every job application in one place.</p>
      </header>

      <ApplicationForm onAdd={handleAdd} />

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
            <ApplicationCard
              key={application.id}
              application={application}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </ul>
      )}
    </main>
  );
}

export default App;

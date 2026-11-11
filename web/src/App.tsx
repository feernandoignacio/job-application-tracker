import { useEffect, useState } from 'react';
import ApplicationCard from './components/ApplicationCard';
import ApplicationForm from './components/ApplicationForm';
import { ApiError, getApplications } from './api';
import type { Application, ApplicationStatus } from './types/application';
import AuthForm from './components/AuthForm';
import './App.css';

// O filtro pode ser "todos" ou um dos status
type StatusFilter = 'all' | ApplicationStatus;

// Gaveta onde fica o token de login
const TOKEN_KEY = 'auth-token';

const filters: StatusFilter[] = [
  'all',
  'applied',
  'interview',
  'offer',
  'rejected',
];

function App() {
  // Token do usuário logado (vazio = ninguém logado)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  // Lista de candidaturas (começa vazia e é preenchida pela API)
  const [applications, setApplications] = useState<Application[]>([]);
  // Começa "carregando" porque a busca na API sai logo de cara
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Quando tiver um token, busca as candidaturas na API
  useEffect(() => {
    if (!token) {
      return;
    }

    getApplications(token)
      .then(setApplications)
      .catch((caught) => {
        // Token vencido ou inválido: volta para o login
        if (caught instanceof ApiError && caught.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          return;
        }
        setError('Could not load your applications.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Filtro escolhido no momento (começa em "todos")
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');

  // Devolve as candidaturas que combinam com um filtro
  function filterApplications(filter: StatusFilter) {
    if (filter === 'all') {
      return applications;
    }
    return applications.filter((application) => application.status === filter);
  }

  // Candidaturas que aparecem na tela, de acordo com o filtro escolhido
  const visibleApplications = filterApplications(selectedStatus);

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

  // Guarda o token quando o login dá certo
  function handleLogin(newToken: string) {
    localStorage.setItem(TOKEN_KEY, newToken);
    setLoading(true);
    setError('');
    setToken(newToken);
  }

  // Ninguém logado: mostra só a tela de login
  if (!token) {
    return (
      <main className="app">
        <header className="app-header">
          <h1>Job Application Tracker</h1>
          <p>Track every job application in one place.</p>
        </header>

        <AuthForm onLogin={handleLogin} />
      </main>
    );
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
            <span className="filter-count">
              {filterApplications(filter).length}
            </span>
          </button>
        ))}
      </nav>

      {loading ? (
        <p className="empty-message">Loading...</p>
      ) : error ? (
        <p className="empty-message">{error}</p>
      ) : visibleApplications.length === 0 ? (
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

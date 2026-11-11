import { useEffect, useState } from 'react';
import ApplicationCard from './components/ApplicationCard';
import ApplicationForm from './components/ApplicationForm';
import {
  ApiError,
  createApplication,
  deleteApplication,
  getApplications,
  updateApplicationStatus,
} from './api';
import type { NewApplication } from './api';
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
  // Erro ao salvar (criar, mudar status ou apagar)
  const [actionError, setActionError] = useState('');

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

  // Erro numa ação: 401 volta para o login, o resto mostra uma mensagem
  function handleActionError(caught: unknown) {
    if (caught instanceof ApiError && caught.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      return;
    }
    setActionError('Something went wrong. Please try again.');
  }

  // Apaga na API e, se der certo, tira da tela
  async function handleDelete(id: string) {
    if (!token) {
      return;
    }

    try {
      await deleteApplication(token, id);
      setActionError('');
      setApplications((current) =>
        current.filter((application) => application.id !== id),
      );
    } catch (caught) {
      handleActionError(caught);
    }
  }

  // Muda o status na API e, se der certo, atualiza na tela
  async function handleStatusChange(id: string, status: ApplicationStatus) {
    if (!token) {
      return;
    }

    try {
      const updated = await updateApplicationStatus(token, id, status);
      setActionError('');
      setApplications((current) =>
        current.map((application) =>
          application.id === id ? updated : application,
        ),
      );
    } catch (caught) {
      handleActionError(caught);
    }
  }

  // Cria na API e coloca a candidatura nova no começo da lista
  async function handleAdd(newApplication: NewApplication) {
    if (!token) {
      return false;
    }

    try {
      const created = await createApplication(token, newApplication);
      setActionError('');
      setApplications((current) => [created, ...current]);
      return true;
    } catch (caught) {
      handleActionError(caught);
      return false;
    }
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

      {actionError && <p className="action-error">{actionError}</p>}

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

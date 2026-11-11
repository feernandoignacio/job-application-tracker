import { useEffect, useState } from 'react';
import ApplicationCard from './components/ApplicationCard';
import ApplicationForm from './components/ApplicationForm';
import DashboardStats from './components/DashboardStats';
import {
  ApiError,
  createApplication,
  deleteApplication,
  getApplications,
  getMe,
  logout,
  updateApplication,
} from './api';
import type { AuthUser, NewApplication } from './api';
import type { Application, ApplicationStatus } from './types/application';
import AuthForm from './components/AuthForm';
import AuthHero from './components/AuthHero';
import LanguageSelect from './components/LanguageSelect';
import { useLanguage } from './i18n/LanguageContext';
import type { TranslationKey } from './i18n/translations';
import './App.css';

// O filtro pode ser "todos" ou um dos status
type StatusFilter = 'all' | ApplicationStatus;

// Gaveta onde fica o token de login
const TOKEN_KEY = 'auth-token';

// Bom dia, boa tarde ou boa noite, de acordo com a hora do computador
function getGreetingKey(): TranslationKey {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'goodMorning';
  }
  if (hour < 18) {
    return 'goodAfternoon';
  }
  return 'goodEvening';
}

const filters: StatusFilter[] = [
  'all',
  'applied',
  'interview',
  'offer',
  'rejected',
];

function App() {
  const { t } = useLanguage();

  // Token do usuário logado (vazio = ninguém logado)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  // Quem está logado (para mostrar o nome no topo)
  const [user, setUser] = useState<AuthUser | null>(null);

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

    // Busca o nome de quem está logado (se falhar, só não mostra o nome)
    getMe(token)
      .then(setUser)
      .catch(() => setUser(null));

    getApplications(token)
      .then(setApplications)
      .catch((caught) => {
        // Token vencido ou inválido: volta para o login
        if (caught instanceof ApiError && caught.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          return;
        }
        setError('loadError');
      })
      .finally(() => setLoading(false));
  }, [token]);

  // No celular o formulário fica fechado e abre pelo botão "Nova candidatura"
  const [showForm, setShowForm] = useState(false);

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
    setActionError('actionError');
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

  // Muda campos na API e, se der certo, atualiza na tela
  async function handleUpdate(id: string, changes: Partial<NewApplication>) {
    if (!token) {
      return false;
    }

    try {
      const updated = await updateApplication(token, id, changes);
      setActionError('');
      setApplications((current) =>
        current.map((application) =>
          application.id === id ? updated : application,
        ),
      );
      return true;
    } catch (caught) {
      handleActionError(caught);
      return false;
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

  // Sai da conta: avisa a API e limpa tudo no navegador
  async function handleLogout() {
    if (token) {
      // Se a API falhar, sai do mesmo jeito
      await logout(token).catch(() => {});
    }

    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setApplications([]);
    setActionError('');
  }

  // Ninguém logado: mostra só a tela de login
  if (!token) {
    return (
      <div className="auth-page">
        <AuthHero />

        {/* Lado direito: o cartão de login */}
        <main className="auth-panel">
          {/* No celular, a coluna da esquerda some e este título aparece */}
          <header className="auth-mobile-header">
            <h1>{t('appTitle')}</h1>
            <p>{t('appSubtitle')}</p>
          </header>

          <AuthForm onLogin={handleLogin} />
        </main>
      </div>
    );
  }

  // Nome para mostrar: o nome, ou o começo do email se não tiver nome
  const displayName = user ? (user.name ?? user.email.split('@')[0]) : '';
  // Na saudação grande usa só o primeiro nome
  const firstName = displayName.split(' ')[0];

  // Frase de resumo embaixo da saudação
  const summary =
    applications.length === 0
      ? t('summaryEmpty')
      : t('summary', {
          interviews: String(filterApplications('interview').length),
          offers: String(filterApplications('offer').length),
        });

  // Adiciona e, no celular, fecha o formulário se deu certo
  async function handleAddFromForm(newApplication: NewApplication) {
    const saved = await handleAdd(newApplication);
    if (saved) {
      setShowForm(false);
    }
    return saved;
  }

  return (
    <>
      {/* Barra do topo, na largura toda: logo à esquerda, usuário e sair à direita */}
      <header className="top-bar">
        <div className="brand">
          <span className="brand-logo" aria-hidden="true">
            JT
          </span>
          <span className="brand-name">{t('appTitle')}</span>
        </div>

        <div className="top-bar-actions">
          <LanguageSelect direction="down" />

          {user && (
            <div className="user-info">
              <span className="user-avatar" aria-hidden="true">
                {displayName.charAt(0).toUpperCase()}
              </span>
              <div className="user-text">
                <span className="user-name">{displayName}</span>
                {/* A saudação aqui só aparece no celular */}
                <span className="user-greeting">{t(getGreetingKey())}</span>
              </div>
            </div>
          )}

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            aria-label={t('logOut')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
              <path d="M10 17l-5-5 5-5" />
              <path d="M5 12h11" />
            </svg>
            <span className="logout-label">{t('logOut')}</span>
          </button>
        </div>
      </header>

      <main className="dashboard">
        <header className="dashboard-header">
          <h1>
            {t('greetingName', {
              greeting: t(getGreetingKey()),
              name: firstName,
            })}
          </h1>
          {!loading && !error && <p>{summary}</p>}
        </header>

        <DashboardStats applications={applications} />

        {actionError && (
          <p className="action-error">{t(actionError as TranslationKey)}</p>
        )}

        {/* Só aparece no celular: abre e fecha o formulário */}
        <button
          type="button"
          className="new-application-toggle"
          onClick={() => setShowForm(!showForm)}
          aria-expanded={showForm}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d={showForm ? 'M5 12h14' : 'M12 5v14M5 12h14'} />
          </svg>
          {t('newApplication')}
        </button>

        <div className="dashboard-columns">
          {/* Esquerda: filtros e lista de candidaturas */}
          <section className="dashboard-list">
            <nav className="status-filter" aria-label={t('filterByStatus')}>
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
                  {t(filter)}
                  <span className="filter-count">
                    {filterApplications(filter).length}
                  </span>
                </button>
              ))}
            </nav>

            {loading ? (
              <p className="empty-message">{t('loading')}</p>
            ) : error ? (
              <p className="empty-message">{t(error as TranslationKey)}</p>
            ) : visibleApplications.length === 0 ? (
              <p className="empty-message">{t('noApplications')}</p>
            ) : (
              <ul className="application-list">
                {visibleApplications.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                  />
                ))}
              </ul>
            )}
          </section>

          {/* Direita: formulário de nova candidatura */}
          <aside
            className={showForm ? 'dashboard-form open' : 'dashboard-form'}
          >
            <ApplicationForm onAdd={handleAddFromForm} />
          </aside>
        </div>
      </main>
    </>
  );
}

export default App;

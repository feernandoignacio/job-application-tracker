import type { Application, ApplicationStatus } from './types/application';

// Endereço base da API (o Vite repassa /api para a porta 3333)
const API_URL = '/api';

// Erro da API que também guarda o código HTTP (401, 404...)
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type AuthUser = {
  id: string;
  email: string;
};

// Dados que o formulário manda para criar uma candidatura
export type NewApplication = {
  company: string;
  position: string;
  status: ApplicationStatus;
  jobUrl?: string;
};

type LoginResponse = {
  token: string;
  user: AuthUser;
};

// Faz um pedido para a API e devolve o JSON da resposta
async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
) {
  const response = await fetch(API_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Se tiver token, manda junto para a API saber quem é
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // 204 = deu certo, mas a resposta vem sem corpo (ex.: ao apagar)
  const data = response.status === 204 ? undefined : await response.json();

  // Se a API respondeu com erro, joga a mensagem dela
  if (!response.ok) {
    throw new ApiError(data.error ?? 'something went wrong', response.status);
  }

  return data as T;
}

export function register(email: string, password: string) {
  return request<AuthUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getApplications(token: string) {
  return request<Application[]>('/applications', {}, token);
}

export function createApplication(token: string, application: NewApplication) {
  return request<Application>(
    '/applications',
    { method: 'POST', body: JSON.stringify(application) },
    token,
  );
}

export function updateApplicationStatus(
  token: string,
  id: string,
  status: ApplicationStatus,
) {
  return request<Application>(
    `/applications/${id}`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    token,
  );
}

export function deleteApplication(token: string, id: string) {
  return request<void>(`/applications/${id}`, { method: 'DELETE' }, token);
}

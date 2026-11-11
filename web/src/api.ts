// Endereço base da API (o Vite repassa /api para a porta 3333)
const API_URL = '/api';

export type AuthUser = {
  id: string;
  email: string;
};

type LoginResponse = {
  token: string;
  user: AuthUser;
};

// Faz um pedido para a API e devolve o JSON da resposta
async function request<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(API_URL + path, {
    ...options,
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();

  // Se a API respondeu com erro, joga a mensagem dela
  if (!response.ok) {
    throw new Error(data.error ?? 'something went wrong');
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

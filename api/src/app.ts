import { randomUUID } from 'node:crypto';
import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import type { NextFunction, Request, Response } from 'express';
import { db } from './database.ts';
import {
  createToken,
  hashPassword,
  hashToken,
  verifyPassword,
} from './password.ts';
import type { Application, ApplicationStatus } from './types/application.ts';

const app = express();

// Permite ler o corpo dos pedidos em JSON
app.use(express.json());

const validStatuses: ApplicationStatus[] = [
  'applied',
  'interview',
  'offer',
  'rejected',
];

// Formato de uma linha da tabela, como vem do banco
type ApplicationRow = {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  applied_at: string;
  job_url: string | null;
  notes: string | null;
};

// Converte uma linha do banco para o formato usado na API
function toApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    company: row.company,
    position: row.position,
    status: row.status,
    appliedAt: row.applied_at,
    jobUrl: row.job_url ?? undefined,
    notes: row.notes ?? undefined,
  };
}

// Texto opcional: devolve o texto sem espaços, ou undefined se vier vazio
function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== ''
    ? value.trim()
    : undefined;
}

// Campo opcional válido: não veio, veio vazio (null) ou veio como texto
function isOptionalText(value: unknown) {
  return value === undefined || value === null || typeof value === 'string';
}

// Busca uma candidatura, mas só se ela for deste usuário
async function findApplication(
  id: string,
  userId: string,
): Promise<Application | undefined> {
  const result = await db.query<ApplicationRow>(
    'SELECT * FROM applications WHERE id = $1 AND user_id = $2',
    [id, userId],
  );
  const row = result.rows[0];
  return row ? toApplication(row) : undefined;
}

// Cria uma sessão de 30 dias e devolve o token (usado no login normal e no Google)
async function createSession(userId: string) {
  const token = createToken();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + thirtyDays).toISOString();

  await db.query(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [hashToken(token), userId, expiresAt],
  );

  return token;
}

// "Porteiro": só deixa passar quem mandar um token válido
async function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const header = request.headers.authorization ?? '';
  const [type, token] = header.split(' ');

  if (type !== 'Bearer' || !token) {
    response.status(401).json({ error: 'authentication required' });
    return;
  }

  const tokenHash = hashToken(token);

  const result = await db.query<{ user_id: string }>(
    'SELECT user_id FROM sessions WHERE token_hash = $1 AND expires_at > $2',
    [tokenHash, new Date().toISOString()],
  );
  const session = result.rows[0];

  if (!session) {
    response.status(401).json({ error: 'invalid or expired token' });
    return;
  }

  // Guarda quem é o usuário para as rotas usarem
  response.locals.userId = session.user_id;
  response.locals.tokenHash = tokenHash;
  next();
}

// Rota de teste: responde se a API está no ar
app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

// Cadastra um usuário novo
app.post('/auth/register', async (request, response) => {
  const { email, password } = request.body ?? {};

  if (typeof email !== 'string' || !email.includes('@')) {
    response.status(400).json({ error: 'email is invalid' });
    return;
  }

  if (typeof password !== 'string' || password.length < 8) {
    response
      .status(400)
      .json({ error: 'password must have at least 8 characters' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [
    normalizedEmail,
  ]);

  if (existingUser.rows.length > 0) {
    response.status(409).json({ error: 'email already registered' });
    return;
  }

  const id = randomUUID();

  await db.query(
    'INSERT INTO users (id, email, password_hash, created_at) VALUES ($1, $2, $3, $4)',
    [id, normalizedEmail, hashPassword(password), new Date().toISOString()],
  );

  response.status(201).json({ id, email: normalizedEmail });
});

// Limite de tentativas de login: 5 erros em 15 minutos bloqueiam o email
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MINUTES = 15;

// Faz login e devolve um token
app.post('/auth/login', async (request, response) => {
  const { email, password } = request.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    response.status(400).json({ error: 'email and password are required' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const windowStart = new Date(
    Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000,
  ).toISOString();

  // Conta quantas vezes erraram a senha deste email nos últimos 15 minutos
  const attempts = await db.query<{ total: number }>(
    'SELECT COUNT(*)::int AS total FROM login_attempts WHERE email = $1 AND attempted_at > $2',
    [normalizedEmail, windowStart],
  );

  if (attempts.rows[0].total >= MAX_LOGIN_ATTEMPTS) {
    response.status(429).json({
      error: `too many login attempts, try again in ${LOGIN_WINDOW_MINUTES} minutes`,
    });
    return;
  }

  const result = await db.query<{
    id: string;
    email: string;
    password_hash: string | null;
  }>('SELECT id, email, password_hash FROM users WHERE email = $1', [
    normalizedEmail,
  ]);
  const user = result.rows[0];

  // Conta criada pelo Google não tem senha, então não entra por aqui
  if (
    !user ||
    !user.password_hash ||
    !verifyPassword(password, user.password_hash)
  ) {
    // Registra o erro e apaga os registros antigos deste email
    await db.query(
      'DELETE FROM login_attempts WHERE email = $1 AND attempted_at <= $2',
      [normalizedEmail, windowStart],
    );
    await db.query(
      'INSERT INTO login_attempts (email, attempted_at) VALUES ($1, $2)',
      [normalizedEmail, new Date().toISOString()],
    );

    response.status(401).json({ error: 'invalid email or password' });
    return;
  }

  // Acertou: zera as tentativas deste email
  await db.query('DELETE FROM login_attempts WHERE email = $1', [
    normalizedEmail,
  ]);

  const token = await createSession(user.id);

  response.json({ token, user: { id: user.id, email: user.email } });
});

// Confere os tokens que o Google entrega
const googleClient = new OAuth2Client();

// Login com Google: o front manda o "credential" que o Google gerou
app.post('/auth/google', async (request, response) => {
  const { credential } = request.body ?? {};

  if (typeof credential !== 'string' || credential === '') {
    response.status(400).json({ error: 'credential is required' });
    return;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    response.status(503).json({ error: 'google login is not configured' });
    return;
  }

  // Pergunta ao Google se o token é verdadeiro e foi feito para este app
  let email: string | undefined;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();

    if (payload?.email && payload.email_verified) {
      email = payload.email.toLowerCase();
    }
  } catch {
    email = undefined;
  }

  if (!email) {
    response.status(401).json({ error: 'invalid google account' });
    return;
  }

  // Se o email ainda não tem conta, cria uma (sem senha)
  const existing = await db.query<{ id: string }>(
    'SELECT id FROM users WHERE email = $1',
    [email],
  );
  let userId = existing.rows[0]?.id;

  if (!userId) {
    userId = randomUUID();
    await db.query(
      'INSERT INTO users (id, email, password_hash, created_at) VALUES ($1, $2, NULL, $3)',
      [userId, email, new Date().toISOString()],
    );
  }

  const token = await createSession(userId);

  response.json({ token, user: { id: userId, email } });
});

// Faz logout: apaga a sessão, e o token para de funcionar
app.post('/auth/logout', requireAuth, async (_request, response) => {
  await db.query('DELETE FROM sessions WHERE token_hash = $1', [
    response.locals.tokenHash,
  ]);
  response.status(204).send();
});

// Lista as candidaturas do usuário logado
app.get('/applications', requireAuth, async (_request, response) => {
  const result = await db.query<ApplicationRow>(
    'SELECT * FROM applications WHERE user_id = $1 ORDER BY applied_at DESC, created_at DESC',
    [response.locals.userId],
  );
  response.json(result.rows.map(toApplication));
});

// Cria uma candidatura nova
app.post('/applications', requireAuth, async (request, response) => {
  const { company, position, status, jobUrl, notes } = request.body ?? {};

  if (typeof company !== 'string' || company.trim() === '') {
    response.status(400).json({ error: 'company is required' });
    return;
  }

  if (typeof position !== 'string' || position.trim() === '') {
    response.status(400).json({ error: 'position is required' });
    return;
  }

  if (!validStatuses.includes(status)) {
    response.status(400).json({ error: 'status is invalid' });
    return;
  }

  if (!isOptionalText(jobUrl) || !isOptionalText(notes)) {
    response.status(400).json({ error: 'jobUrl and notes must be text' });
    return;
  }

  const newApplication: Application = {
    id: randomUUID(),
    company: company.trim(),
    position: position.trim(),
    status,
    appliedAt: new Date().toLocaleDateString('en-CA'),
    jobUrl: optionalText(jobUrl),
    notes: optionalText(notes),
  };

  await db.query(
    `INSERT INTO applications (id, user_id, company, position, status, applied_at, job_url, notes, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      newApplication.id,
      response.locals.userId,
      newApplication.company,
      newApplication.position,
      newApplication.status,
      newApplication.appliedAt,
      newApplication.jobUrl ?? null,
      newApplication.notes ?? null,
      new Date().toISOString(),
    ],
  );

  response.status(201).json(newApplication);
});

// Edita uma candidatura (só os campos enviados mudam)
app.patch(
  '/applications/:id',
  requireAuth,
  async (request: Request<{ id: string }>, response) => {
    const application = await findApplication(
      request.params.id,
      response.locals.userId,
    );

    if (!application) {
      response.status(404).json({ error: 'application not found' });
      return;
    }

    const { company, position, status, jobUrl, notes } = request.body ?? {};

    // Se o campo veio, ele precisa ser válido
    if (
      company !== undefined &&
      (typeof company !== 'string' || company.trim() === '')
    ) {
      response.status(400).json({ error: 'company is invalid' });
      return;
    }

    if (
      position !== undefined &&
      (typeof position !== 'string' || position.trim() === '')
    ) {
      response.status(400).json({ error: 'position is invalid' });
      return;
    }

    if (status !== undefined && !validStatuses.includes(status)) {
      response.status(400).json({ error: 'status is invalid' });
      return;
    }

    if (!isOptionalText(jobUrl) || !isOptionalText(notes)) {
      response.status(400).json({ error: 'jobUrl and notes must be text' });
      return;
    }

    // Junta o que já existia com o que mudou
    const updated: Application = {
      ...application,
      company: company?.trim() ?? application.company,
      position: position?.trim() ?? application.position,
      status: status ?? application.status,
      jobUrl: jobUrl === undefined ? application.jobUrl : optionalText(jobUrl),
      notes: notes === undefined ? application.notes : optionalText(notes),
    };

    await db.query(
      `UPDATE applications
       SET company = $1, position = $2, status = $3, job_url = $4, notes = $5
       WHERE id = $6`,
      [
        updated.company,
        updated.position,
        updated.status,
        updated.jobUrl ?? null,
        updated.notes ?? null,
        updated.id,
      ],
    );

    response.json(updated);
  },
);

// Apaga uma candidatura
app.delete(
  '/applications/:id',
  requireAuth,
  async (request: Request<{ id: string }>, response) => {
    const result = await db.query(
      'DELETE FROM applications WHERE id = $1 AND user_id = $2',
      [request.params.id, response.locals.userId],
    );

    if (result.rowCount === 0) {
      response.status(404).json({ error: 'application not found' });
      return;
    }

    response.status(204).send();
  },
);

// Se alguma rota der erro inesperado, responde 500 em JSON
app.use(
  (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    console.error(error);
    response.status(500).json({ error: 'internal server error' });
  },
);

export default app;

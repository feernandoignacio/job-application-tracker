import { randomUUID } from 'node:crypto';
import express from 'express';
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
// Na hospedagem a porta vem do ambiente; no seu computador usa 3333
const PORT = process.env.PORT ?? 3333;

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

// Faz login e devolve um token
app.post('/auth/login', async (request, response) => {
  const { email, password } = request.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    response.status(400).json({ error: 'email and password are required' });
    return;
  }

  const result = await db.query<{
    id: string;
    email: string;
    password_hash: string;
  }>('SELECT id, email, password_hash FROM users WHERE email = $1', [
    email.trim().toLowerCase(),
  ]);
  const user = result.rows[0];

  if (!user || !verifyPassword(password, user.password_hash)) {
    response.status(401).json({ error: 'invalid email or password' });
    return;
  }

  const token = createToken();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + thirtyDays).toISOString();

  await db.query(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [hashToken(token), user.id, expiresAt],
  );

  response.json({ token, user: { id: user.id, email: user.email } });
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
  const { company, position, status, jobUrl } = request.body ?? {};

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

  const newApplication: Application = {
    id: randomUUID(),
    company: company.trim(),
    position: position.trim(),
    status,
    appliedAt: new Date().toLocaleDateString('en-CA'),
    jobUrl:
      typeof jobUrl === 'string' && jobUrl.trim() !== ''
        ? jobUrl.trim()
        : undefined,
  };

  await db.query(
    `INSERT INTO applications (id, user_id, company, position, status, applied_at, job_url, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      newApplication.id,
      response.locals.userId,
      newApplication.company,
      newApplication.position,
      newApplication.status,
      newApplication.appliedAt,
      newApplication.jobUrl ?? null,
      new Date().toISOString(),
    ],
  );

  response.status(201).json(newApplication);
});

// Muda o status de uma candidatura
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

    const { status } = request.body ?? {};

    if (!validStatuses.includes(status)) {
      response.status(400).json({ error: 'status is invalid' });
      return;
    }

    await db.query('UPDATE applications SET status = $1 WHERE id = $2', [
      status,
      application.id,
    ]);

    response.json({ ...application, status });
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

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});

// A Vercel usa este export para rodar a API
export default app;

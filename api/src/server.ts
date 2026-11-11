import { randomUUID } from 'node:crypto';
import express from 'express';
import { db } from './database.ts';
import {
  createToken,
  hashPassword,
  hashToken,
  verifyPassword,
} from './password.ts';
import type { Application, ApplicationStatus } from './types/application.ts';

const app = express();
const PORT = 3333;

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

function findApplication(id: string): Application | undefined {
  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as
    ApplicationRow | undefined;
  return row ? toApplication(row) : undefined;
}

// Rota de teste: responde se a API está no ar
app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

// Cadastra um usuário novo
app.post('/auth/register', (request, response) => {
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

  const existingUser = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(normalizedEmail);

  if (existingUser) {
    response.status(409).json({ error: 'email already registered' });
    return;
  }

  const id = randomUUID();

  db.prepare(
    'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
  ).run(id, normalizedEmail, hashPassword(password), new Date().toISOString());

  response.status(201).json({ id, email: normalizedEmail });
});

// Faz login e devolve um token
app.post('/auth/login', (request, response) => {
  const { email, password } = request.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    response.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = db
    .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
    .get(email.trim().toLowerCase()) as
    { id: string; email: string; password_hash: string } | undefined;

  if (!user || !verifyPassword(password, user.password_hash)) {
    response.status(401).json({ error: 'invalid email or password' });
    return;
  }

  const token = createToken();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + thirtyDays).toISOString();

  db.prepare(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
  ).run(hashToken(token), user.id, expiresAt);

  response.json({ token, user: { id: user.id, email: user.email } });
});

// Lista todas as candidaturas
app.get('/applications', (_request, response) => {
  const rows = db
    .prepare('SELECT * FROM applications ORDER BY applied_at DESC, rowid DESC')
    .all() as ApplicationRow[];
  response.json(rows.map(toApplication));
});

// Cria uma candidatura nova
app.post('/applications', (request, response) => {
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

  db.prepare(
    `INSERT INTO applications (id, company, position, status, applied_at, job_url)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    newApplication.id,
    newApplication.company,
    newApplication.position,
    newApplication.status,
    newApplication.appliedAt,
    newApplication.jobUrl ?? null,
  );

  response.status(201).json(newApplication);
});

// Muda o status de uma candidatura
app.patch('/applications/:id', (request, response) => {
  const application = findApplication(request.params.id);

  if (!application) {
    response.status(404).json({ error: 'application not found' });
    return;
  }

  const { status } = request.body ?? {};

  if (!validStatuses.includes(status)) {
    response.status(400).json({ error: 'status is invalid' });
    return;
  }

  db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(
    status,
    application.id,
  );

  response.json({ ...application, status });
});

// Apaga uma candidatura
app.delete('/applications/:id', (request, response) => {
  const result = db
    .prepare('DELETE FROM applications WHERE id = ?')
    .run(request.params.id);

  if (result.changes === 0) {
    response.status(404).json({ error: 'application not found' });
    return;
  }

  response.status(204).send();
});

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});

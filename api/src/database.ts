import pg from 'pg';

// O endereço do banco vem do arquivo .env (nunca fica no código)
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing. Create the api/.env file.');
}

// Pool = um grupo de conexões abertas que as rotas vão reaproveitando
export const db = new pg.Pool({ connectionString });

// Cria as tabelas na primeira vez que a API roda
await db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`);

// Quem entra pelo Google não tem senha, então a senha pode ficar vazia
await db.query(`
  ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL
`);

// Nome para mostrar no topo da tela (vem do cadastro ou do Google)
await db.query(`
  ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT
`);

await db.query(`
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    expires_at TEXT NOT NULL
  )
`);

await db.query(`
  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    status TEXT NOT NULL,
    applied_at TEXT NOT NULL,
    job_url TEXT,
    notes TEXT,
    created_at TEXT NOT NULL
  )
`);

// Guarda as tentativas de login que erraram a senha, para limitar abusos
await db.query(`
  CREATE TABLE IF NOT EXISTS login_attempts (
    email TEXT NOT NULL,
    attempted_at TEXT NOT NULL
  )
`);

await db.query(`
  CREATE INDEX IF NOT EXISTS login_attempts_email_idx
  ON login_attempts (email, attempted_at)
`);

// Dia marcado para a entrevista (coluna nova, por isso o ADD COLUMN)
await db.query(`
  ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_at TEXT
`);

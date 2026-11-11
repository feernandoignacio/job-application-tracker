import { DatabaseSync } from 'node:sqlite';

// Abre (ou cria, se não existir) o arquivo do banco
export const db = new DatabaseSync('data.db');

// Cria as tabelas na primeira vez que a API roda
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    status TEXT NOT NULL,
    applied_at TEXT NOT NULL,
    job_url TEXT,
    notes TEXT
  )
`);

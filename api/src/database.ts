import { DatabaseSync } from 'node:sqlite';

// Abre (ou cria, se não existir) o arquivo do banco
export const db = new DatabaseSync('data.db');

// Cria a tabela na primeira vez que a API roda
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

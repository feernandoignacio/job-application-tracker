import { randomUUID } from 'node:crypto';
import express from 'express';
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

// Por enquanto, as candidaturas ficam na memória do servidor
const applications: Application[] = [];

// Rota de teste: responde se a API está no ar
app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

// Lista todas as candidaturas
app.get('/applications', (_request, response) => {
  response.json(applications);
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

  applications.unshift(newApplication);
  response.status(201).json(newApplication);
});

// Muda o status de uma candidatura
app.patch('/applications/:id', (request, response) => {
  const application = applications.find(
    (item) => item.id === request.params.id,
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

  application.status = status;
  response.json(application);
});

// Apaga uma candidatura
app.delete('/applications/:id', (request, response) => {
  const index = applications.findIndex((item) => item.id === request.params.id);

  if (index === -1) {
    response.status(404).json({ error: 'application not found' });
    return;
  }

  applications.splice(index, 1);
  response.status(204).send();
});

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});

import type { Application } from '../types/application';

export const sampleApplications: Application[] = [
  {
    id: '1',
    company: 'Acme Tech',
    position: 'Front-end Developer',
    status: 'applied',
    appliedAt: '2026-11-03',
    jobUrl: 'https://example.com/jobs/1',
  },
  {
    id: '2',
    company: 'Blue Labs',
    position: 'Junior React Developer',
    status: 'interview',
    appliedAt: '2026-10-28',
    notes: 'Technical interview scheduled.',
  },
  {
    id: '3',
    company: 'Nova Systems',
    position: 'Front-end Engineer',
    status: 'rejected',
    appliedAt: '2026-10-15',
  },
];

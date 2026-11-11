export type ApplicationStatus = 'applied' | 'interview' | 'offer' | 'rejected';

export type Application = {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  appliedAt: string;
  jobUrl?: string;
  notes?: string;
  // Dia da entrevista, no formato AAAA-MM-DD
  interviewAt?: string;
};

export type ApplicationStatus = 'applied' | 'interview' | 'offer' | 'rejected';

export type Application = {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  appliedAt: string;
  jobUrl?: string;
  notes?: string;
};

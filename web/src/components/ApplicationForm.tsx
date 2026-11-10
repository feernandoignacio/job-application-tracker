import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Application, ApplicationStatus } from '../types/application';
import './ApplicationForm.css';

type ApplicationFormProps = {
  onAdd: (application: Application) => void;
};

function ApplicationForm({ onAdd }: ApplicationFormProps) {
  // Um estado para cada campo do formulário
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('applied');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Impede a página de recarregar (igual ao seu e.preventDefault())
    event.preventDefault();

    const newApplication: Application = {
      id: crypto.randomUUID(),
      company: company.trim(),
      position: position.trim(),
      status,
      // Data de hoje no formato AAAA-MM-DD
      appliedAt: new Date().toLocaleDateString('en-CA'),
    };

    onAdd(newApplication);

    // Limpa o formulário
    setCompany('');
    setPosition('');
    setStatus('applied');
  }

  return (
    <form className="application-form" onSubmit={handleSubmit}>
      <label>
        Company
        <input
          type="text"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          required
        />
      </label>

      <label>
        Position
        <input
          type="text"
          value={position}
          onChange={(event) => setPosition(event.target.value)}
          required
        />
      </label>

      <label>
        Status
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as ApplicationStatus)
          }
        >
          <option value="applied">Applied</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
        </select>
      </label>

      <button type="submit">Add application</button>
    </form>
  );
}

export default ApplicationForm;

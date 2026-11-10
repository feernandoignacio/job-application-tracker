import type { Application } from './types/application';

const test: Application = {
  id: '1',
  company: 'Nubank',
  position: 'Front-end Developer',
  status: 'applied',
  appliedAt: '2026-11-10',
};

function App() {
  return (
    <main>
      <h1>Job Application Tracker</h1>
      <p>Track every job application in o ne place.</p>
    </main>
  );
}

export default App;

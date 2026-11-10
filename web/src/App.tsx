import { sampleApplications } from './data/sampleApplications';

function App() {
  return (
    <main>
      <h1>Job Application Tracker</h1>
      <p>Track every job application in one place.</p>

      <ul>
        {sampleApplications.map((application) => (
          <li key={application.id}>
            <strong>{application.company}</strong>
            <span>{application.position}</span>
            <span>{application.status}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;

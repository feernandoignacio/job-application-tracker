import ApplicationCard from './components/ApplicationCard';
import { sampleApplications } from './data/sampleApplications';
import './App.css';

function App() {
  return (
    <main className="app">
      <header className="app-header">
        <h1>Job Application Tracker</h1>
        <p>Track every job application in one place.</p>
      </header>

      <ul className="application-list">
        {sampleApplications.map((application) => (
          <ApplicationCard key={application.id} application={application} />
        ))}
      </ul>
    </main>
  );
}

export default App;

import ApplicationCard from './components/ApplicationCard';
import { sampleApplications } from './data/sampleApplications';

function App() {
  return (
    <main>
      <h1>Job Application Tracker</h1>
      <p>Track every job application in one place.</p>

      <ul>
        {sampleApplications.map((application) => (
          <ApplicationCard key={application.id} application={application} />
        ))}
      </ul>
    </main>
  );
}

export default App;

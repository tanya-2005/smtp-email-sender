import { useEmailComposer } from '../../hooks/useEmailComposer';
import Sidebar from './Sidebar';
import SummaryPanel from './SummaryPanel';
import EmailForm from '../EmailForm';

function Dashboard() {
  const composer = useEmailComposer();

  return (
    <div className="dashboard">
      <Sidebar
        mode={composer.mode}
        onModeChange={composer.handleModeChange}
        senderEmail={composer.senderEmail}
        senderStatus={composer.senderStatus}
      />
      <main className="dashboard__compose">
        <EmailForm composer={composer} />
      </main>
      <SummaryPanel composer={composer} />
    </div>
  );
}

export default Dashboard;

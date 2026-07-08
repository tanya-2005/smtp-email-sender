import { useState } from 'react';
import { useEmailComposer } from '../../hooks/useEmailComposer';
import Sidebar from './Sidebar';
import SummaryPanel from './SummaryPanel';
import EmailForm from '../EmailForm';
import SettingsPage from '../SettingsPage';
import WebhookPage from '../WebhookPage';
import WebhookLogsPage from '../WebhookLogsPage';

const STANDALONE_VIEWS = ['settings', 'webhook', 'webhookLogs'];

function Dashboard() {
  const composer = useEmailComposer();
  const [view, setView] = useState('compose');

  function handleNavChange(next) {
    if (STANDALONE_VIEWS.includes(next)) {
      setView(next);
    } else {
      setView('compose');
      composer.handleModeChange(next);
    }
  }

  const activeNav = STANDALONE_VIEWS.includes(view) ? view : composer.mode;

  return (
    <div className="dashboard">
      <Sidebar
        activeNav={activeNav}
        onNavChange={handleNavChange}
        senderEmail={composer.senderEmail}
        senderStatus={composer.senderStatus}
      />
      <main className="dashboard__compose">
        {view === 'settings' && <SettingsPage onSaved={composer.refreshSender} />}
        {view === 'webhook' && (
          <WebhookPage senderEmail={composer.senderEmail} senderStatus={composer.senderStatus} />
        )}
        {view === 'webhookLogs' && <WebhookLogsPage />}
        {view === 'compose' && <EmailForm composer={composer} />}
      </main>
      {view === 'compose' && <SummaryPanel composer={composer} />}
    </div>
  );
}

export default Dashboard;

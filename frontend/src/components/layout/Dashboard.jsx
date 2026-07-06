import { useState } from 'react';
import { useEmailComposer } from '../../hooks/useEmailComposer';
import Sidebar from './Sidebar';
import SummaryPanel from './SummaryPanel';
import EmailForm from '../EmailForm';
import SettingsPage from '../SettingsPage';

function Dashboard() {
  const composer = useEmailComposer();
  const [view, setView] = useState('compose');

  function handleNavChange(next) {
    if (next === 'settings') {
      setView('settings');
    } else {
      setView('compose');
      composer.handleModeChange(next);
    }
  }

  const activeNav = view === 'settings' ? 'settings' : composer.mode;

  return (
    <div className="dashboard">
      <Sidebar
        activeNav={activeNav}
        onNavChange={handleNavChange}
        senderEmail={composer.senderEmail}
        senderStatus={composer.senderStatus}
      />
      <main className="dashboard__compose">
        {view === 'settings' ? (
          <SettingsPage onSaved={composer.refreshSender} />
        ) : (
          <EmailForm composer={composer} />
        )}
      </main>
      {view === 'compose' && <SummaryPanel composer={composer} />}
    </div>
  );
}

export default Dashboard;

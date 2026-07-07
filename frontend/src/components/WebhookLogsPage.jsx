import { ScrollText } from 'lucide-react';
import Section from './ui/Section';
import EmptyState from './ui/EmptyState';

function WebhookLogsPage() {
  return (
    <div className="panel">
      <Section icon={ScrollText} title="Webhook Logs">
        <EmptyState icon={ScrollText} title="No webhook requests received yet." />
      </Section>
    </div>
  );
}

export default WebhookLogsPage;

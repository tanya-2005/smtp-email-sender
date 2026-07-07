import { Webhook } from 'lucide-react';
import Section from './ui/Section';
import EmptyState from './ui/EmptyState';

function WebhookPage() {
  return (
    <div className="panel">
      <Section icon={Webhook} title="Webhook">
        <p className="section__description">
          Send emails programmatically by posting to a webhook endpoint, as an alternative to the
          manual composer. This integration is coming soon.
        </p>
        <EmptyState icon={Webhook} title="Webhook endpoint will be available here." />
      </Section>
    </div>
  );
}

export default WebhookPage;

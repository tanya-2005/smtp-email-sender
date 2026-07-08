import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  Loader2,
  Server,
  Settings as SettingsIcon,
  XCircle,
} from 'lucide-react';
import { getSettings, saveSettings, testSettingsConnection } from '../api/settingsApi';
import { extractErrorMessage } from '../utils/extractErrorMessage';
import { isValidEmail } from '../utils/isValidEmail';
import { useToast } from '../hooks/useToast';
import Section from './ui/Section';
import Skeleton from './ui/Skeleton';

const PROVIDER = 'resend';

const PASSWORD_HINT = 'This is your Resend API key, not an email password.';

const RESEND_HELP = {
  steps: [
    'Sign up for a free account at resend.com (no credit card required).',
    'Go to API Keys and create a new key - the default "Sending access" scope is fine.',
    'Paste the key here.',
  ],
  link: 'https://resend.com/api-keys',
  linkLabel: 'Open Resend API Keys',
};

const INITIAL_FORM = {
  provider: PROVIDER,
  senderName: '',
  senderEmail: '',
  password: '',
};

function SettingsPage({ onSaved }) {
  const showToast = useToast();
  const [form, setForm] = useState(INITIAL_FORM);
  const [hasPassword, setHasPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionResult, setConnectionResult] = useState(null);

  useEffect(() => {
    getSettings()
      .then((data) => {
        setForm({
          provider: PROVIDER,
          senderName: data.senderName || '',
          senderEmail: data.senderEmail || '',
          password: '',
        });
        setHasPassword(data.hasPassword);
      })
      .catch(() => showToast({ type: 'error', message: 'Could not load Sender Account settings.' }))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setConnectionResult(null);
  }

  const canSubmit = isValidEmail(form.senderEmail.trim());

  async function handleTest() {
    setIsTesting(true);
    setConnectionResult(null);
    try {
      const result = await testSettingsConnection(form);
      setConnectionResult(result);
    } catch (error) {
      setConnectionResult({ success: false, message: extractErrorMessage(error) });
    } finally {
      setIsTesting(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const saved = await saveSettings(form);
      setHasPassword(saved.hasPassword);
      setForm((prev) => ({ ...prev, password: '' }));
      setConnectionResult(saved.connection);
      showToast({
        type: saved.connection.success ? 'success' : 'error',
        message: saved.connection.success ? 'Sender account saved and connected.' : 'Saved, but connection failed.',
      });
      onSaved?.();
    } catch (error) {
      showToast({ type: 'error', message: extractErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="panel">
        <Section icon={SettingsIcon} title="Sender Account">
          <Skeleton rows={4} />
        </Section>
      </div>
    );
  }

  return (
    <div className="panel">
      <form onSubmit={handleSave}>
        <Section icon={SettingsIcon} title="Sender Account">
          <p className="section__description">
            This application uses Resend as its email delivery service. Configure your sender email address
            and Resend API key below. During Resend's free sandbox mode (before verifying a sending
            domain), emails can only be delivered to the email address associated with your own Resend
            account. After verifying a sending domain in Resend, emails can be sent to any recipient.
          </p>

          <div className="settings-grid">
            <div className="form-field">
              <label htmlFor="senderName">Sender Name</label>
              <input
                id="senderName"
                name="senderName"
                type="text"
                placeholder="Your Name or Company"
                value={form.senderName}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="senderEmail">Email Address</label>
              <input
                id="senderEmail"
                name="senderEmail"
                type="email"
                placeholder="you@example.com"
                value={form.senderEmail}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field form-field--full">
              <label htmlFor="password">Resend API Key</label>
              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={hasPassword ? 'Leave blank to keep current key' : 'Enter API key'}
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-field__toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <span className="form-field__hint">{PASSWORD_HINT}</span>
            </div>
          </div>

          <button type="button" className="help-toggle" onClick={() => setShowHelp((prev) => !prev)}>
            <HelpCircle size={13} />
            Need a Resend API Key? Click here.
          </button>

          {showHelp && (
            <div className="help-box">
              <ol>
                {RESEND_HELP.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <a href={RESEND_HELP.link} target="_blank" rel="noreferrer">
                {RESEND_HELP.linkLabel} →
              </a>
            </div>
          )}

          {connectionResult && (
            <div className={`settings-test-result${connectionResult.success ? ' settings-test-result--success' : ' settings-test-result--error'}`}>
              {connectionResult.success ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
              {connectionResult.success ? `✓ ${connectionResult.message}` : connectionResult.message}
            </div>
          )}
        </Section>

        <div className="panel__footer panel__footer--split">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleTest}
            disabled={!canSubmit || isTesting}
          >
            {isTesting ? <Loader2 size={15} className="spinner" /> : <Server size={15} />}
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>
          <button type="submit" className="btn btn--primary" disabled={!canSubmit || isSaving}>
            {isSaving ? <Loader2 size={15} className="spinner" /> : <CheckCircle2 size={15} />}
            {isSaving ? 'Connecting...' : 'Save & Connect'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SettingsPage;

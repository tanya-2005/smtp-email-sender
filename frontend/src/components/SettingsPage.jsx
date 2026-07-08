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

const PROVIDERS = [
  { value: 'gmail', label: 'Gmail' },
  { value: 'outlook', label: 'Outlook' },
  { value: 'yahoo', label: 'Yahoo' },
  { value: 'zoho', label: 'Zoho' },
  { value: 'custom', label: 'Custom SMTP' },
];

const PASSWORD_HINTS = {
  gmail: 'Use your Google App Password',
  outlook: 'Use your Outlook Password (or App Password if required)',
  yahoo: 'Use your Yahoo App Password',
  zoho: 'Use your Zoho Password',
  custom: 'Use the password for your SMTP account',
};

const APP_PASSWORD_HELP = {
  gmail: {
    steps: [
      'Turn on 2-Step Verification on your Google Account.',
      'Go to Google Account → Security → App Passwords.',
      'Generate a new App Password and paste it here.',
    ],
    link: 'https://myaccount.google.com/apppasswords',
  },
  outlook: {
    steps: [
      'Try your regular Outlook / Microsoft 365 password first.',
      'If it is rejected, your organization may require an App Password - generate one from Microsoft Account → Security → Advanced security options.',
    ],
  },
  yahoo: {
    steps: [
      'Turn on 2-Step Verification on your Yahoo Account.',
      'Go to Account Security → Generate app password.',
      'Paste the generated password here.',
    ],
  },
  zoho: {
    steps: [
      'Try your regular Zoho Mail password first.',
      'If your account has two-factor authentication enabled, generate an Application-Specific Password from Zoho Account → Security instead.',
    ],
  },
  custom: {
    steps: ['Use the credentials provided by your SMTP server administrator.'],
  },
};

const INITIAL_FORM = {
  provider: 'gmail',
  senderName: '',
  senderEmail: '',
  password: '',
  host: '',
  port: '',
  secure: false,
  username: '',
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
          provider: data.provider || 'gmail',
          senderName: data.senderName || '',
          senderEmail: data.senderEmail || '',
          password: '',
          host: data.host || '',
          port: data.port || '',
          secure: Boolean(data.secure),
          username: data.username || '',
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

  function handleProviderChange(event) {
    setForm((prev) => ({ ...prev, provider: event.target.value }));
    setConnectionResult(null);
    setShowHelp(false);
  }

  function handleSecureToggle(event) {
    setForm((prev) => ({ ...prev, secure: event.target.checked }));
    setConnectionResult(null);
  }

  const isCustom = form.provider === 'custom';
  const canSubmit =
    isValidEmail(form.senderEmail.trim()) &&
    (!isCustom || (form.host.trim() && form.port));
  const help = APP_PASSWORD_HELP[form.provider];

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
          <div className="settings-grid">
            <div className="form-field">
              <label htmlFor="provider">Email Provider</label>
              <select id="provider" name="provider" value={form.provider} onChange={handleProviderChange}>
                {PROVIDERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

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

            <div className="form-field">
              <label htmlFor="password">Password / App Password</label>
              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={hasPassword ? 'Leave blank to keep current password' : 'Enter password'}
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
              <span className="form-field__hint">{PASSWORD_HINTS[form.provider]}</span>
            </div>

            {isCustom && (
              <>
                <div className="form-field">
                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Defaults to Email Address if left blank"
                    value={form.username}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="host">SMTP Host</label>
                  <input
                    id="host"
                    name="host"
                    type="text"
                    placeholder="smtp.example.com"
                    value={form.host}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="port">SMTP Port</label>
                  <input
                    id="port"
                    name="port"
                    type="number"
                    placeholder="587"
                    value={form.port}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-field form-field--checkbox">
                  <label htmlFor="secure">
                    <input id="secure" name="secure" type="checkbox" checked={form.secure} onChange={handleSecureToggle} />
                    Secure (SSL/TLS)
                  </label>
                </div>
              </>
            )}
          </div>

          <button type="button" className="help-toggle" onClick={() => setShowHelp((prev) => !prev)}>
            <HelpCircle size={13} />
            Need an App Password? Click here.
          </button>

          {showHelp && help && (
            <div className="help-box">
              <ol>
                {help.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              {help.link && (
                <a href={help.link} target="_blank" rel="noreferrer">
                  Open Google App Passwords →
                </a>
              )}
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

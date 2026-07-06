import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Server,
  Settings as SettingsIcon,
  XCircle,
} from 'lucide-react';
import { getSettings, saveSettings, testSettingsConnection } from '../api/settingsApi';
import { extractErrorMessage } from '../utils/extractErrorMessage';
import { isValidEmail } from '../utils/isValidEmail';
import { useToast } from './ui/ToastProvider';
import Section from './ui/Section';
import Skeleton from './ui/Skeleton';

const PROVIDERS = [
  { value: 'gmail', label: 'Gmail' },
  { value: 'outlook', label: 'Outlook / Microsoft 365' },
  { value: 'yahoo', label: 'Yahoo' },
  { value: 'zoho', label: 'Zoho' },
  { value: 'custom', label: 'Custom SMTP' },
];

const INITIAL_FORM = {
  provider: 'gmail',
  senderName: '',
  senderEmail: '',
  password: '',
  host: '',
  port: '',
  secure: false,
};

function SettingsPage({ onSaved }) {
  const showToast = useToast();
  const [form, setForm] = useState(INITIAL_FORM);
  const [hasPassword, setHasPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

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
        });
        setHasPassword(data.hasPassword);
      })
      .catch(() => showToast({ type: 'error', message: 'Could not load SMTP settings.' }))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setTestResult(null);
  }

  function handleSecureToggle(event) {
    setForm((prev) => ({ ...prev, secure: event.target.checked }));
    setTestResult(null);
  }

  const isCustom = form.provider === 'custom';
  const canSubmit =
    isValidEmail(form.senderEmail.trim()) &&
    (!isCustom || (form.host.trim() && form.port));

  async function handleTest() {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testSettingsConnection(form);
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, message: extractErrorMessage(error) });
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
      showToast({ type: 'success', message: 'SMTP settings saved.' });
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
        <Section icon={SettingsIcon} title="SMTP Settings">
          <Skeleton rows={4} />
        </Section>
      </div>
    );
  }

  return (
    <div className="panel">
      <form onSubmit={handleSave}>
        <Section icon={SettingsIcon} title="SMTP Settings">
          <div className="settings-grid">
            <div className="form-field">
              <label htmlFor="provider">Provider</label>
              <select id="provider" name="provider" value={form.provider} onChange={handleChange}>
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
              <label htmlFor="senderEmail">Sender Email</label>
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
            </div>

            {isCustom && (
              <>
                <div className="form-field">
                  <label htmlFor="host">Host</label>
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
                  <label htmlFor="port">Port</label>
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
                    Use secure connection (SSL/TLS)
                  </label>
                </div>
              </>
            )}
          </div>

          {testResult && (
            <div className={`settings-test-result${testResult.success ? ' settings-test-result--success' : ' settings-test-result--error'}`}>
              {testResult.success ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
              {testResult.message}
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
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SettingsPage;

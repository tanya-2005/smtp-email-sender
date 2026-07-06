import { Send } from 'lucide-react';
import EmailForm from './components/EmailForm';
import './App.css';

function App() {
  return (
    <div className="page">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__logo">
            <Send size={16} />
          </span>
          <span>Mailer</span>
        </div>
        <p className="app-header__tagline">Send single, bulk, and personalized email campaigns.</p>
      </header>
      <EmailForm />
    </div>
  );
}

export default App;

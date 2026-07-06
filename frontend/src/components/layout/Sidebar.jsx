import { FileSpreadsheet, List, Mail, Send, Settings } from 'lucide-react';
import SenderCard from './SenderCard';

const NAV_ITEMS = [
  { value: 'single', label: 'Single Email', icon: Mail },
  { value: 'bulk', label: 'Bulk Email', icon: List },
  { value: 'csv', label: 'CSV Personalization', icon: FileSpreadsheet },
  { value: 'settings', label: 'Sender Account', icon: Settings },
];

function Sidebar({ activeNav, onNavChange, senderEmail, senderStatus }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo">
          <Send size={16} />
        </span>
        <span className="sidebar__brand-name">Mailer</span>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeNav === item.value;
          return (
            <button
              key={item.value}
              type="button"
              className={`sidebar__nav-item${active ? ' active' : ''}`}
              onClick={() => onNavChange(item.value)}
              title={item.label}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <SenderCard email={senderEmail} status={senderStatus} />
      </div>
    </aside>
  );
}

export default Sidebar;

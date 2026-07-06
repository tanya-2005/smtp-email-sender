import {
  FileSpreadsheet,
  History,
  Layers,
  List,
  Mail,
  Send,
  Settings,
} from 'lucide-react';

const COMPOSE_ITEMS = [
  { value: 'single', label: 'Single Email', icon: Mail },
  { value: 'bulk', label: 'Bulk Email', icon: List },
  { value: 'csv', label: 'CSV Campaign', icon: FileSpreadsheet },
];

const SOON_ITEMS = [
  { label: 'Templates', icon: Layers },
  { label: 'History', icon: History },
  { label: 'Settings', icon: Settings },
];

function Sidebar({ mode, onModeChange }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo">
          <Send size={16} />
        </span>
        <span className="sidebar__brand-name">Mailer</span>
      </div>

      <div className="sidebar__section">
        <span className="sidebar__section-label">Compose</span>
        <nav className="sidebar__nav">
          {COMPOSE_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = mode === item.value;
            return (
              <button
                key={item.value}
                type="button"
                className={`sidebar__nav-item${active ? ' active' : ''}`}
                onClick={() => onModeChange(item.value)}
                title={item.label}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar__section">
        <span className="sidebar__section-label">More</span>
        <nav className="sidebar__nav">
          {SOON_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.label} type="button" className="sidebar__nav-item" disabled title={item.label}>
                <Icon size={16} />
                <span>{item.label}</span>
                <span className="sidebar__soon-badge">Soon</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;

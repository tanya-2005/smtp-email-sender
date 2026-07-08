import { useState } from 'react';
import { ChevronDown, FileSpreadsheet, List, Mail, ScrollText, Send, Settings, Webhook } from 'lucide-react';
import SenderCard from './SenderCard';

const COMPOSE_ITEMS = [
  { value: 'single', label: 'Manual Email', icon: Mail },
  { value: 'bulk', label: 'Bulk Email', icon: List },
  { value: 'csv', label: 'CSV Personalization', icon: FileSpreadsheet },
];

const NAV_ITEMS = [
  { value: 'webhook', label: 'Webhook', icon: Webhook },
  { group: 'compose', label: 'Compose', icon: Mail, children: COMPOSE_ITEMS },
  { value: 'webhookLogs', label: 'Webhook Logs', icon: ScrollText },
  { value: 'settings', label: 'Sender Account', icon: Settings },
];

function Sidebar({ activeNav, onNavChange, senderEmail, senderStatus }) {
  const [isComposeOpen, setIsComposeOpen] = useState(true);

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
          if (item.children) {
            const Icon = item.icon;
            const groupActive = item.children.some((child) => child.value === activeNav);

            return (
              <div className="sidebar__group" key={item.group}>
                <button
                  type="button"
                  className={`sidebar__nav-item sidebar__nav-item--group${groupActive ? ' active' : ''}`}
                  onClick={() => setIsComposeOpen((prev) => !prev)}
                  aria-expanded={isComposeOpen}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  <ChevronDown
                    size={14}
                    className={`sidebar__chevron${isComposeOpen ? ' sidebar__chevron--open' : ''}`}
                  />
                </button>

                {isComposeOpen && (
                  <div className="sidebar__subnav">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const active = activeNav === child.value;
                      return (
                        <button
                          key={child.value}
                          type="button"
                          className={`sidebar__nav-item sidebar__nav-item--sub${active ? ' active' : ''}`}
                          onClick={() => onNavChange(child.value)}
                          title={child.label}
                        >
                          <ChildIcon size={15} />
                          <span>{child.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

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

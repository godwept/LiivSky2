/**
 * BottomNav — Tab bar for primary app navigation.
 * Matches the app sections defined in AI_AGENT_REFERENCE.md.
 */
import './BottomNav.css';
import type { NavTab } from '../types';

interface BottomNavProps {
  tabs: NavTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

/** Inline SVG icons for navigation tabs */
function NavIcon({ icon, active }: { icon: string; active: boolean }) {
  const fill = active ? '#00e5ff' : 'rgba(255,255,255,0.45)';
  const icons: Record<string, JSX.Element> = {
    today: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill={fill}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
    ),
    map: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill={fill}>
        <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
      </svg>
    ),
    models: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill={fill}>
        <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
        <path d="M3 17h2v-2H3v2zm0-4h2v-2H3v2zm0-4h2V7H3v2z" opacity="0.5" />
      </svg>
    ),
    favorites: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill={fill}>
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    ),
    darksky: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill={fill}>
        <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
      </svg>
    ),
  };

  return icons[icon] ?? icons['today']!;
}

export default function BottomNav({ tabs, activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" role="tablist" aria-label="Main navigation">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            className={`nav-tab ${isActive ? 'nav-tab--active' : ''}`}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
          >
            <NavIcon icon={tab.icon} active={isActive} />
            <span className="nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

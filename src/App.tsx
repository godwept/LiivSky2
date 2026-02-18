/**
 * App root component.
 * Composes the dashboard page with bottom navigation.
 */
import { useState } from 'react';
import DashboardPage from './pages/DashboardPage';
import BottomNav from './components/BottomNav';
import AppErrorBoundary from './components/AppErrorBoundary';
import type { NavTab } from './types';
import './styles/global.css';

/** Navigation tabs matching AI_AGENT_REFERENCE.md app sections */
const NAV_TABS: NavTab[] = [
  { id: 'today', label: 'Today', icon: 'today' },
  { id: 'map', label: 'Map', icon: 'map' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'favorites', label: 'Favorites', icon: 'favorites' },
  { id: 'darksky', label: 'Dark Sky', icon: 'darksky' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('today');

  return (
    <AppErrorBoundary>
      {/* For now, only the dashboard page is implemented */}
      {activeTab === 'today' && <DashboardPage />}
      {activeTab !== 'today' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '1.1rem',
        }}>
          {NAV_TABS.find(t => t.id === activeTab)?.label ?? 'Page'} — Coming Soon
        </div>
      )}
      <BottomNav tabs={NAV_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
    </AppErrorBoundary>
  );
}

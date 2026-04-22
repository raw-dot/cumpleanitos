import React, { useState } from 'react';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';
import InicioPage from './InicioPage';
import { COLORS } from '../../utils/constants';

export default function AppLayout() {
  const [activeTab, setActiveTab] = useState('inicio');

  // Interceptar cambios de tab para usar window.history
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.history.pushState({ page: 'new-ui', tab }, '', `/new-ui?tab=${tab}`);
  };

  // Cargar tab desde URL si existe
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') || 'inicio';
    setActiveTab(tab);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: COLORS.bg,
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* TopBar */}
      <TopBar />

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingBottom: 80,
      }}>
        {activeTab === 'inicio' && <InicioPage />}
        {activeTab === 'amigos' && <div style={{ padding: '20px', fontSize: 18, color: COLORS.ink }}>📋 Amigos (próximamente)</div>}
        {activeTab === 'micumple' && <div style={{ padding: '20px', fontSize: 18, color: COLORS.ink }}>🎂 Mi cumple (próximamente)</div>}
        {activeTab === 'calendario' && <div style={{ padding: '20px', fontSize: 18, color: COLORS.ink }}>📅 Calendario (próximamente)</div>}
        {activeTab === 'organizador' && <div style={{ padding: '20px', fontSize: 18, color: COLORS.ink }}>🎁 Organizador (próximamente)</div>}
      </div>

      {/* BottomNav */}
      <BottomNav active={activeTab} onChange={handleTabChange} />
    </div>
  );
}

import React, { useState } from 'react';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';
import InicioPage from './InicioPage';
import { COLORS } from '../../utils/constants';

export default function AppLayout() {
  const [activeTab, setActiveTab] = useState('inicio');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: COLORS.bg,
      overflow: 'hidden',
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
        {activeTab === 'amigos' && <div style={{ padding: '20px' }}>Amigos (próximamente)</div>}
        {activeTab === 'micumple' && <div style={{ padding: '20px' }}>Mi cumple (próximamente)</div>}
        {activeTab === 'calendario' && <div style={{ padding: '20px' }}>Calendario (próximamente)</div>}
        {activeTab === 'organizador' && <div style={{ padding: '20px' }}>Organizador (próximamente)</div>}
      </div>

      {/* BottomNav */}
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

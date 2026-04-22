import React, { useState } from 'react';
import { Bell, Menu } from 'lucide-react';
import { COLORS } from '../../utils/constants';
import ProfileDrawer from './ProfileDrawer';
import NotificationsDrawer from './NotificationsDrawer';

export default function TopBar({ onMenuClick }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div
      style={{
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'white',
        borderBottom: `1px solid ${COLORS.borderSoft}`,
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}
        >
          🎉
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.ink, letterSpacing: -0.3 }}>
          Cumpleanitos
        </div>
      </div>

      {/* Right side: Notificaciones + Avatar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={() => setNotifOpen(true)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            border: `1px solid ${COLORS.border}`,
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
          }}
        >
          <Bell size={18} color={COLORS.ink} />
          <span
            style={{
              position: 'absolute',
              top: 8,
              right: 10,
              width: 8,
              height: 8,
              borderRadius: 4,
              background: COLORS.accent,
              border: '2px solid white',
            }}
          />
        </button>

        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 40,
            padding: '0 6px 0 12px',
            borderRadius: 20,
            border: `1px solid ${COLORS.border}`,
            background: 'white',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,.04)',
          }}
        >
          <Menu size={14} color={COLORS.ink} />
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              background: `linear-gradient(135deg, ${COLORS.primary}, #6D28D9)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </button>
      </div>

      {/* Drawers */}
      {drawerOpen && <ProfileDrawer onClose={() => setDrawerOpen(false)} />}
      {notifOpen && <NotificationsDrawer onClose={() => setNotifOpen(false)} />}
    </div>
  );
}

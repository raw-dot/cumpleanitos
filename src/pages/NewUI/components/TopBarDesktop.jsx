import React from 'react';
import { Bell, Menu } from 'lucide-react';
import { C, getInitial } from '../theme';

export default function TopBarDesktop({ profile, activeTab, onTabChange, onMenuClick, onNotifClick }) {
  const tabs = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'amigos', label: 'Amigos' },
    { id: 'micumple', label: 'Mi cumple' },
    { id: 'calendario', label: 'Calendario' },
    { id: 'organizador', label: 'Organizador' },
  ];

  return (
    <div style={{
      borderBottom: `1px solid ${C.border}`,
      padding: '16px 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'white',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>🎉</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, letterSpacing: -0.4 }}>
          Cumpleanitos
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {tabs.map(t => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              style={{
                padding: '8px 16px', borderRadius: 10, border: 'none',
                background: 'transparent', cursor: 'pointer',
                fontSize: 14, fontWeight: active ? 700 : 500,
                color: active ? C.ink : C.inkSoft, position: 'relative',
              }}
            >
              {t.label}
              {active && <div style={{
                position: 'absolute', bottom: -17, left: 16, right: 16, height: 2,
                background: C.ink, borderRadius: 2,
              }} />}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{
          padding: '8px 14px', background: 'transparent', border: 'none',
          fontSize: 13, fontWeight: 600, color: C.ink, cursor: 'pointer', borderRadius: 999,
        }}>Organizar cumple</button>
        <button onClick={onNotifClick} style={{
          width: 40, height: 40, borderRadius: 20, border: 'none',
          background: 'transparent', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', position: 'relative',
        }}>
          <Bell size={18} color={C.ink} />
          <span style={{
            position: 'absolute', top: 8, right: 10, width: 8, height: 8,
            borderRadius: 4, background: C.accent, border: '2px solid white',
          }} />
        </button>
        <button onClick={onMenuClick} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          height: 42, padding: '0 8px 0 12px', borderRadius: 21,
          border: `1px solid ${C.border}`, background: 'white', cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,.06)',
        }}>
          <Menu size={15} color={C.ink} />
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" style={{
              width: 30, height: 30, borderRadius: 15, objectFit: 'cover',
            }} />
          ) : (
            <div style={{
              width: 30, height: 30, borderRadius: 15,
              background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 12,
            }}>{getInitial(profile?.name)}</div>
          )}
        </button>
      </div>
    </div>
  );
}

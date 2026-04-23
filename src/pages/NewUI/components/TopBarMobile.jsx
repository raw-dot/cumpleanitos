import React from 'react';
import { Bell, Menu } from 'lucide-react';
import { C, getInitial } from '../theme';

export default function TopBarMobile({ profile, onMenuClick, onNotifClick }) {
  return (
    <div style={{
      padding: '16px 20px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'white',
      borderBottom: `1px solid ${C.borderSoft}`,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>🎉</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.ink, letterSpacing: -0.3 }}>
          Cumpleanitos
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={onNotifClick} style={{
          width: 40, height: 40, borderRadius: 20,
          border: 'none', background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        }}>
          <Bell size={18} color={C.ink} />
          <span style={{
            position: 'absolute', top: 8, right: 10, width: 8, height: 8,
            borderRadius: 4, background: C.accent, border: '2px solid white',
          }} />
        </button>
        <button onClick={onMenuClick} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          height: 40, padding: '0 6px 0 12px', borderRadius: 20,
          border: `1px solid ${C.border}`, background: 'white', cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0,0,0,.04)',
        }}>
          <Menu size={14} color={C.ink} />
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" style={{
              width: 28, height: 28, borderRadius: 14, objectFit: 'cover',
            }} />
          ) : (
            <div style={{
              width: 28, height: 28, borderRadius: 14,
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

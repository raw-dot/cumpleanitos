import React from 'react';
import { X } from 'lucide-react';
import { C } from '../theme';

export default function NotificationsDrawer({ isMobile, onClose }) {
  const notifications = [
    { i: '🎁', t: 'Bienvenido a Cumpleanitos', s: 'Explora la nueva experiencia', n: true },
  ];

  const overlayStyle = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 40,
  };

  const drawerStyle = isMobile ? {
    position: 'fixed', top: 0, right: 0, bottom: 0, width: '86%',
    background: 'white', zIndex: 41, overflowY: 'auto',
    borderTopLeftRadius: 28, borderBottomLeftRadius: 28,
  } : {
    position: 'fixed', top: 70, right: 110, width: 380,
    background: 'white', borderRadius: 20, zIndex: 41,
    boxShadow: '0 20px 60px rgba(0,0,0,.18)', overflow: 'hidden',
    border: `1px solid ${C.border}`,
  };

  return (
    <>
      <div onClick={onClose} style={overlayStyle} />
      <div style={drawerStyle}>
        <div style={{
          padding: isMobile ? '20px 24px 12px' : '18px 20px',
          borderBottom: !isMobile ? `1px solid ${C.borderSoft}` : 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: isMobile ? 22 : 16, fontWeight: 800, color: C.ink }}>
            Notificaciones
          </div>
          {isMobile ? (
            <button onClick={onClose} style={{
              width: 36, height: 36, borderRadius: 18, border: `1px solid ${C.border}`,
              background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><X size={18} /></button>
          ) : (
            <button style={{
              background: 'none', border: 'none', color: C.primary,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>Marcar leídas</button>
          )}
        </div>
        <div style={{ padding: isMobile ? '0 16px 20px' : 10, display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 2 }}>
          {notifications.map((n, i) => (
            <div key={i} style={{
              padding: isMobile ? 14 : 12,
              borderRadius: isMobile ? 14 : 12,
              display: 'flex', gap: 12, alignItems: 'flex-start',
              background: n.n ? C.primaryLight : 'white',
              border: isMobile ? `1px solid ${n.n ? 'transparent' : C.border}` : 'none',
            }}>
              <div style={{ fontSize: isMobile ? 22 : 20 }}>{n.i}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: isMobile ? 13 : 13, fontWeight: 700, color: C.ink }}>{n.t}</div>
                <div style={{ fontSize: 11, color: C.inkMuted, marginTop: 2 }}>{n.s}</div>
              </div>
              {n.n && <div style={{ width: 8, height: 8, borderRadius: 4, background: C.primary, marginTop: 6 }} />}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

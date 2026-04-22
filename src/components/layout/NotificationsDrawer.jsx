import React from 'react';
import { X } from 'lucide-react';
import { COLORS } from '../../utils/constants';

export default function NotificationsDrawer({ onClose }) {
  const notifications = [
    { i: '🎁', t: 'Mariano te regaló $5.000', s: 'Campaña de Martina · hace 2h', n: true },
    { i: '🎉', t: 'Tu campaña llegó al 50%', s: 'Cumple de Federico · hace 5h', n: true },
    { i: '👥', t: 'Valentina se sumó a la agenda', s: 'Ayer' },
    { i: '🎂', t: 'El cumple de Sofía es en 21 días', s: 'Ayer' },
  ];

  return (
    <>
      <div onClick={onClose} style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,.35)',
        zIndex: 20,
      }} />
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: '86%',
        background: 'white',
        zIndex: 21,
        overflowY: 'auto',
        borderTopLeftRadius: 28,
        borderBottomLeftRadius: 28,
      }}>
        <div style={{ padding: '20px 24px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.ink }}>Notificaciones</div>
          <button onClick={onClose} style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            border: `1px solid ${COLORS.border}`,
            background: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '0 16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map((n, i) => (
            <div key={i} style={{
              padding: 14,
              borderRadius: 14,
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              background: n.n ? COLORS.primaryLight : 'white',
              border: `1px solid ${n.n ? 'transparent' : COLORS.border}`,
            }}>
              <div style={{ fontSize: 22 }}>{n.i}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink }}>{n.t}</div>
                <div style={{ fontSize: 11, color: COLORS.inkMuted, marginTop: 2 }}>{n.s}</div>
              </div>
              {n.n && <div style={{ width: 8, height: 8, borderRadius: 4, background: COLORS.primary, marginTop: 6 }} />}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

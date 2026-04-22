import React, { useState } from 'react';
import { X, Bell, Settings, Gift, CreditCard, Shield, Globe, HelpCircle, LogOut, Cake } from 'lucide-react';
import { COLORS } from '../../utils/constants';

export default function ProfileDrawer({ onClose }) {
  const [mode, setMode] = useState('organizador');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

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
        animation: 'slideIn 0.25s ease-out',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.ink, letterSpacing: -0.5 }}>
            Menú
          </div>
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
            <X size={18} color={COLORS.ink} />
          </button>
        </div>

        {/* Perfil card */}
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{
            background: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, ${COLORS.accentLight} 100%)`,
            borderRadius: 20,
            padding: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              background: `linear-gradient(135deg, ${COLORS.primary}, #6D28D9)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: 22,
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.ink }}>
                {user?.name || 'Usuario'}
              </div>
              <div style={{ fontSize: 12, color: COLORS.inkSoft }}>
                @{user?.username || 'usuario'}
              </div>
            </div>
          </div>

          {/* Toggle modo */}
          <div style={{
            marginTop: 14,
            background: COLORS.bg,
            borderRadius: 14,
            padding: 4,
            display: 'flex',
            border: `1px solid ${COLORS.border}`,
          }}>
            {[
              { id: 'organizador', label: 'Organizador', icon: Gift },
              { id: 'cumpleaniero', label: 'Cumpleañero', icon: Cake },
            ].map(m => {
              const active = mode === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 10,
                    border: 'none',
                    background: active ? 'white' : 'transparent',
                    color: active ? COLORS.ink : COLORS.inkMuted,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                  }}
                >
                  <Icon size={14} /> {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ height: 1, background: COLORS.borderSoft, margin: '0 20px 8px' }} />

        {/* Items */}
        <div style={{ padding: '0 8px 20px' }}>
          {[
            { i: Bell, l: 'Notificaciones', b: 3 },
            { i: Settings, l: 'Configuración de la cuenta' },
            { i: Gift, l: 'Mis regalos recibidos' },
            { i: CreditCard, l: 'Cuenta de MercadoPago' },
            { i: Shield, l: 'Privacidad y seguridad' },
            { i: Globe, l: 'Idioma y región' },
            { i: HelpCircle, l: 'Centro de ayuda' },
            { i: LogOut, l: 'Cerrar sesión', danger: true },
          ].map((it, i) => {
            const Icon = it.i;
            return (
              <button key={i} style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                textAlign: 'left',
                color: it.danger ? COLORS.danger : COLORS.ink,
              }}>
                <Icon size={19} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{it.l}</span>
                {it.b && <span style={{
                  background: COLORS.accent,
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 10,
                }}>{it.b}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

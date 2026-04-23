import React, { useState } from 'react';
import { X, Settings, Gift, CreditCard, Shield, Globe, HelpCircle, LogOut, Cake, Bell } from 'lucide-react';
import { C, getInitial } from '../theme';
import { supabase } from '../../../supabaseClient';

export default function ProfileDrawer({ profile, session, isMobile, onClose }) {
  const [mode, setMode] = useState('organizador');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const overlayStyle = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 40,
  };

  const drawerStyle = isMobile ? {
    position: 'fixed', top: 0, right: 0, bottom: 0, width: '86%',
    background: 'white', zIndex: 41, overflowY: 'auto',
    borderTopLeftRadius: 28, borderBottomLeftRadius: 28,
  } : {
    position: 'fixed', top: 70, right: 40, width: 340,
    background: 'white', borderRadius: 20, zIndex: 41,
    boxShadow: '0 20px 60px rgba(0,0,0,.18)', overflow: 'hidden',
    border: `1px solid ${C.border}`,
  };

  return (
    <>
      <div onClick={onClose} style={overlayStyle} />
      <div style={drawerStyle}>
        {isMobile && (
          <div style={{ padding: '20px 24px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: -0.5 }}>Menú</div>
            <button onClick={onClose} style={{
              width: 36, height: 36, borderRadius: 18, border: `1px solid ${C.border}`,
              background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><X size={18} color={C.ink} /></button>
          </div>
        )}

        <div style={{ padding: isMobile ? '0 20px 20px' : 20 }}>
          <div style={{
            background: `linear-gradient(135deg, ${C.primaryLight} 0%, ${C.accentLight} 100%)`,
            borderRadius: isMobile ? 20 : 16, padding: isMobile ? 18 : 14,
            display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 12,
          }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" style={{
                width: isMobile ? 56 : 46, height: isMobile ? 56 : 46, borderRadius: '50%', objectFit: 'cover',
              }} />
            ) : (
              <div style={{
                width: isMobile ? 56 : 46, height: isMobile ? 56 : 46, borderRadius: '50%',
                background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: isMobile ? 22 : 18,
              }}>{getInitial(profile?.name)}</div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: isMobile ? 16 : 14, fontWeight: 800, color: C.ink }}>
                {profile?.name || 'Usuario'}
              </div>
              <div style={{ fontSize: isMobile ? 12 : 11, color: C.inkSoft }}>
                @{profile?.username || 'usuario'}
              </div>
            </div>
          </div>

          <div style={{
            marginTop: isMobile ? 14 : 12,
            background: C.bg, borderRadius: isMobile ? 14 : 12,
            padding: isMobile ? 4 : 3,
            display: 'flex', border: `1px solid ${C.border}`,
          }}>
            {[
              { id: 'organizador', label: 'Organizador', icon: Gift },
              { id: 'cumpleaniero', label: 'Cumpleañero', icon: Cake },
            ].map(m => {
              const active = mode === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id} onClick={() => setMode(m.id)}
                  style={{
                    flex: 1, padding: isMobile ? 10 : 8,
                    borderRadius: isMobile ? 10 : 9, border: 'none',
                    background: active ? 'white' : 'transparent',
                    color: active ? C.ink : C.inkMuted,
                    fontSize: isMobile ? 12 : 11, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: isMobile ? 6 : 5,
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                  }}
                ><Icon size={isMobile ? 14 : 12} /> {m.label}</button>
              );
            })}
          </div>
        </div>

        <div style={{ height: 1, background: C.borderSoft, margin: isMobile ? '0 20px 8px' : 0 }} />

        <div style={{ padding: isMobile ? '0 8px 20px' : 8 }}>
          {[
            ...(isMobile ? [{ i: Bell, l: 'Notificaciones' }] : []),
            { i: Settings, l: 'Configuración de la cuenta' },
            { i: Gift, l: 'Mis regalos recibidos' },
            { i: CreditCard, l: 'Cuenta de MercadoPago' },
            { i: Shield, l: 'Privacidad' },
            { i: Globe, l: 'Idioma y región' },
            { i: HelpCircle, l: 'Centro de ayuda' },
          ].map((it, i) => {
            const Icon = it.i;
            return (
              <button key={i} style={{
                width: '100%', padding: isMobile ? '14px 16px' : '10px 14px',
                borderRadius: isMobile ? 12 : 10,
                border: 'none', background: 'transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 12,
                textAlign: 'left', color: C.ink,
              }}>
                <Icon size={isMobile ? 19 : 16} />
                <span style={{ flex: 1, fontSize: isMobile ? 14 : 13, fontWeight: 500 }}>{it.l}</span>
              </button>
            );
          })}
        </div>

        <div style={{ height: 1, background: C.borderSoft, margin: isMobile ? '0 20px 8px' : 0 }} />

        <div style={{ padding: isMobile ? '0 8px 20px' : 8 }}>
          <button onClick={handleLogout} style={{
            width: '100%', padding: isMobile ? '14px 16px' : '10px 14px',
            borderRadius: isMobile ? 12 : 10,
            border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 12,
            textAlign: 'left', color: C.danger,
          }}>
            <LogOut size={isMobile ? 19 : 16} />
            <span style={{ flex: 1, fontSize: isMobile ? 14 : 13, fontWeight: 500 }}>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </>
  );
}

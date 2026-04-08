// src/components/ui/MPConnectButton.jsx
// Muestra el estado de conexión de Mercado Pago del usuario
// y permite conectar/desconectar.

import { useState } from 'react';
import { supabase } from '../../supabaseClient';

const C = {
  primary:   '#7C3AED',
  mpBlue:    '#009EE3',
  success:   '#16a34a',
  successBg: '#f0fdf4',
  successBorder: '#86efac',
  warnBg:    '#fffbeb',
  warnBorder:'#fde68a',
  warnText:  '#92400e',
  errorBg:   '#fef2f2',
  errorBorder:'#fca5a5',
  errorText: '#991b1b',
  border:    '#E5E7EB',
  text:      '#111827',
  textLight: '#6B7280',
  white:     '#fff',
};

export default function MPConnectButton({ userId, connection, loading, onConnected, onDisconnected }) {
  const [disconnecting, setDisconnecting] = useState(false);

  // URL de OAuth de MP (en test mode)
  const MP_CLIENT_ID   = import.meta.env.VITE_MP_CLIENT_ID;
  const REDIRECT_URI   = import.meta.env.VITE_MP_REDIRECT_URI || `${window.location.origin}/oauth/mp/callback`;

  function handleConnect() {
    // Guardar userId en sessionStorage para recuperarlo en el callback
    sessionStorage.setItem('mp_oauth_user_id', userId);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     MP_CLIENT_ID,
      redirect_uri:  REDIRECT_URI,
      state:         userId,
    });

    window.location.href = `https://auth.mercadopago.com/authorization?${params.toString()}`;
  }

  async function handleDisconnect() {
    if (!confirm('¿Desconectar tu cuenta de Mercado Pago? Tu cumpleaños dejará de recibir aportes hasta que vuelvas a conectar.')) return;
    setDisconnecting(true);
    try {
      const { error } = await supabase
        .from('mp_connections')
        .update({ status: 'revoked', updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (!error && onDisconnected) onDisconnected();
    } catch (e) {
      console.error('Error desconectando MP:', e);
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '16px', background: C.border, borderRadius: 12, height: 80, opacity: 0.5 }} />
    );
  }

  // Estado: conectado
  if (connection) {
    return (
      <div style={{
        background: C.successBg,
        border: `1px solid ${C.successBorder}`,
        borderRadius: 12,
        padding: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: C.mpBlue, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13,
          }}>MP</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.success }}>Mercado Pago conectado ✓</div>
            <div style={{ fontSize: 12, color: C.textLight }}>
              {connection.mp_email || connection.mp_nickname || 'Cuenta vinculada'}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: C.textLight, marginBottom: 10 }}>
          Tu cumpleaños está listo para recibir aportes.
          {connection.connected_at && (
            <> Conectado el {new Date(connection.connected_at).toLocaleDateString('es-AR')}.</>
          )}
        </div>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          style={{
            width: '100%', padding: '9px', borderRadius: 8,
            background: 'transparent', border: `1px solid ${C.errorBorder}`,
            color: C.errorText, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {disconnecting ? 'Desconectando...' : 'Desconectar cuenta'}
        </button>
        <p style={{ fontSize: 11, color: C.textLight, textAlign: 'center', marginTop: 6 }}>
          *Si querés enlazar otra cuenta, desconectá esta primero
        </p>
      </div>
    );
  }

  // Estado: no conectado
  return (
    <div style={{
      background: C.warnBg,
      border: `1px solid ${C.warnBorder}`,
      borderRadius: 12,
      padding: 16,
    }}>
      <div style={{ fontSize: 13, color: C.warnText, marginBottom: 12, lineHeight: 1.5 }}>
        <strong>Sin método de cobro configurado.</strong><br />
        Conectá tu cuenta de Mercado Pago para empezar a recibir aportes.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {[
          ['Cobrás directamente en tu cuenta', '✓'],
          ['Sin intermediarios manuales', '✓'],
          [`Comisión de la plataforma: ${import.meta.env.VITE_MP_PLATFORM_FEE_PCT || '5'}%`, 'ℹ️'],
        ].map(([label, icon]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.warnText }}>
            <span>{label}</span><span>{icon}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleConnect}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', padding: '13px', borderRadius: 10,
          background: C.mpBlue, color: '#fff',
          fontSize: 14, fontWeight: 600, border: 'none',
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <span style={{
          width: 22, height: 22, borderRadius: '50%',
          background: '#fff', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: C.mpBlue, fontWeight: 800, fontSize: 11,
        }}>MP</span>
        Conectar con Mercado Pago
      </button>
      <p style={{ fontSize: 11, color: C.textLight, textAlign: 'center', marginTop: 8 }}>
        Se abrirá la página de autorización de Mercado Pago de forma segura
      </p>
    </div>
  );
}

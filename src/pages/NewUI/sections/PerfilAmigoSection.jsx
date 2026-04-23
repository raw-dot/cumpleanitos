import React, { useState, useEffect } from 'react';
import { C, formatCurrency, calcDaysUntil, formatDay } from '../theme';
import { supabase } from '../../../supabaseClient';
import { Gift, Share2 } from 'lucide-react';

export default function PerfilAmigoSection({ profile, session, isMobile, handleTabChange }) {
  const [friend, setFriend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');

  useEffect(() => {
    // TODO: Obtener username de URL params o props
    // Por ahora es un stub
    setLoading(false);
  }, []);

  const containerStyle = {
    padding: isMobile ? '16px 20px 20px' : 0,
  };

  const titleStyle = {
    fontSize: isMobile ? 28 : 36,
    fontWeight: 800,
    color: C.ink,
    margin: '0 0 8px',
    letterSpacing: isMobile ? -0.8 : -1,
  };

  const subtitleStyle = {
    fontSize: isMobile ? 13 : 15,
    color: C.inkMuted,
    margin: '0 0 20px',
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Perfil del amigo</h1>
      <p style={subtitleStyle}>
        Seleccioná un amigo para ver su perfil
      </p>

      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 32,
        textAlign: 'center',
        border: `1px solid ${C.border}`,
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 4 }}>
          Busca un amigo en "Explorar"
        </p>
        <p style={{ fontSize: 12, color: C.inkMuted }}>
          Clickeá en su tarjeta para ver más detalles y regalarle
        </p>
        <button
          onClick={() => handleTabChange('explorar')}
          style={{
            marginTop: 16,
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: C.primary,
            color: 'white',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Ir a Explorar
        </button>
      </div>
    </div>
  );
}

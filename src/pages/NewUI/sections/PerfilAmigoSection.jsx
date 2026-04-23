import React, { useState, useEffect } from 'react';
import { C, formatCurrency, calcDaysUntil, formatDay } from '../theme';
import { supabase } from '../../../supabaseClient';
import { Gift, Share2 } from 'lucide-react';

export default function PerfilAmigoSection({ profile, session, isMobile, handleTabChange, friendUsername }) {
  const [friend, setFriend] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (friendUsername) {
      loadFriend(friendUsername);
    }
  }, [friendUsername]);

  const loadFriend = async (username) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, birthday, avatar_emoji')
        .eq('username', username)
        .maybeSingle();
      setFriend(data);
    } catch (err) {
      console.error('Error loading friend:', err);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return <div style={containerStyle}><p style={{ color: C.inkMuted }}>Cargando...</p></div>;
  }

  if (!friendUsername || !friend) {
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

  const days = calcDaysUntil(friend.birthday);
  const daysLabel = days === 0
    ? '¡Hoy es su cumple!'
    : days === 1
    ? 'Mañana'
    : `En ${days} días`;

  return (
    <div style={containerStyle}>
      <button
        onClick={() => handleTabChange('explorar')}
        style={{
          background: 'none',
          border: 'none',
          color: C.primary,
          fontWeight: 600,
          fontSize: 13,
          cursor: 'pointer',
          padding: '0 0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        ← Volver a Explorar
      </button>

      <div style={{
        background: 'white',
        borderRadius: 18,
        padding: isMobile ? 24 : 32,
        border: `1px solid ${C.border}`,
        textAlign: 'center',
        marginBottom: 20,
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: C.primary,
          color: 'white',
          fontSize: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontWeight: 800,
        }}>
          {friend.avatar_emoji || friend.full_name?.[0]?.toUpperCase() || '?'}
        </div>

        <h1 style={{ ...titleStyle, marginBottom: 4 }}>
          {friend.full_name || friend.username}
        </h1>
        <p style={{ fontSize: 13, color: C.inkMuted, margin: '0 0 8px' }}>
          @{friend.username}
        </p>

        {friend.birthday && (
          <div style={{
            display: 'inline-block',
            background: days === 0 ? C.primary : C.bg,
            color: days === 0 ? 'white' : C.ink,
            borderRadius: 20,
            padding: '6px 14px',
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 20,
          }}>
            🎂 {daysLabel} — {formatDay(friend.birthday)}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleTabChange('wizard')}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: C.primary,
              color: 'white',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Gift size={16} /> Organizar regalo
          </button>
        </div>
      </div>
    </div>
  );
}

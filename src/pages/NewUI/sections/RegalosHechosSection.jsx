import React, { useState, useEffect } from 'react';
import { C, formatCurrency } from '../theme';
import { supabase } from '../../../supabaseClient';

export default function RegalosHechosSection({ profile, session, isMobile }) {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, count: 0 });

  useEffect(() => {
    if (session?.user?.id) loadData();
  }, [session]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Obtener contributions que hizo el usuario (donde user_id = session.user.id)
      const { data: contribs } = await supabase
        .from('contributions')
        .select(`
          id, amount, created_at, message,
          recipient_user_id,
          profiles:recipient_user_id(username, full_name, avatar_emoji)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (contribs) {
        setContributions(contribs);
        const total = contribs.reduce((sum, c) => sum + (c.amount || 0), 0);
        setStats({ total, count: contribs.length });
      }
    } catch (err) {
      console.error('Error loading contributions:', err);
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
    margin: '0 0 24px',
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
    gap: 10,
    marginBottom: 20,
  };

  const statStyle = {
    background: 'white',
    borderRadius: 12,
    padding: 12,
    border: `1px solid ${C.border}`,
    textAlign: 'center',
  };

  const statValueStyle = {
    fontSize: isMobile ? 22 : 28,
    fontWeight: 800,
    color: C.ink,
    letterSpacing: -0.6,
  };

  const statLabelStyle = {
    fontSize: 11,
    color: C.inkMuted,
    fontWeight: 600,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  };

  const cardStyle = {
    background: 'white',
    borderRadius: 16,
    padding: 14,
    border: `1px solid ${C.border}`,
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  };

  const avatarStyle = {
    width: 48,
    height: 48,
    borderRadius: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 800,
    fontSize: 16,
    flexShrink: 0,
  };

  const nameStyle = {
    fontSize: 14,
    fontWeight: 700,
    color: C.ink,
    marginBottom: 2,
  };

  const metaStyle = {
    fontSize: 11,
    color: C.inkMuted,
  };

  const amountStyle = {
    fontSize: 14,
    fontWeight: 800,
    color: '#10B981',
  };

  const messageBoxStyle = {
    background: C.bg,
    borderRadius: 10,
    padding: 8,
    marginTop: 8,
    fontSize: 12,
    fontStyle: 'italic',
    color: C.inkSoft,
  };

  const getAvatarColor = (emoji, index) => {
    const colors = ['#EC4899', '#10B981', '#3B82F6', '#7C3AED', '#F59E0B'];
    return colors[index % colors.length];
  };

  if (loading) {
    return <div style={containerStyle}><p style={subtitleStyle}>Cargando...</p></div>;
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Mis regalos</h1>
      <p style={subtitleStyle}>
        {stats.count} regalo{stats.count !== 1 ? 's' : ''} realizado{stats.count !== 1 ? 's' : ''} · {formatCurrency(stats.total)} total
      </p>

      {/* Stats */}
      {!isMobile && (
        <div style={statsGridStyle}>
          <div style={statStyle}>
            <div style={statValueStyle}>{formatCurrency(stats.total)}</div>
            <div style={statLabelStyle}>Total regalado</div>
          </div>
          <div style={statStyle}>
            <div style={statValueStyle}>{stats.count}</div>
            <div style={statLabelStyle}>Regalos hechos</div>
          </div>
          <div style={statStyle}>
            <div style={statValueStyle}>
              {Math.floor(stats.total / Math.max(stats.count, 1))}
            </div>
            <div style={statLabelStyle}>Promedio por regalo</div>
          </div>
          <div style={statStyle}>
            <div style={statValueStyle}>❤️</div>
            <div style={statLabelStyle}>Generosidad 2026</div>
          </div>
        </div>
      )}

      {/* Contributions list */}
      {contributions.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 32,
          textAlign: 'center',
          border: `1px solid ${C.border}`,
        }}>
          <p style={subtitleStyle}>Aún no hiciste regalos</p>
          <p style={{ fontSize: 12, color: C.inkMuted, marginTop: 8 }}>
            Explorá amigos con cumples próximos y sumáte a las colectas 🎁
          </p>
        </div>
      ) : (
        contributions.map((contrib, idx) => (
          <div key={contrib.id} style={cardStyle}>
            <div
              style={{
                ...avatarStyle,
                background: getAvatarColor(contrib.profiles?.avatar_emoji, idx),
              }}
            >
              {contrib.profiles?.avatar_emoji || '🎁'}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={nameStyle}>
                {contrib.profiles?.full_name}
              </div>
              <div style={metaStyle}>
                {contrib.profiles?.username && `@${contrib.profiles.username} · `}
                {new Date(contrib.created_at).toLocaleDateString('es-AR')}
              </div>

              {contrib.message && (
                <div style={messageBoxStyle}>
                  "{contrib.message}"
                </div>
              )}
            </div>

            <div style={amountStyle}>
              {formatCurrency(contrib.amount)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

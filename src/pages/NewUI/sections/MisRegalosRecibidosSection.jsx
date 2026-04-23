import React, { useState, useEffect } from 'react';
import { C, formatCurrency } from '../theme';
import { supabase } from '../../../supabaseClient';
import MenuMiCumple from '../components/MenuMiCumple';

export default function MisRegalosRecibidosSection({ profile, session, isMobile, handleTabChange }) {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, count: 0, withMessage: 0 });

  useEffect(() => {
    if (session?.user?.id) loadData();
  }, [session]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Obtener contributions donde el user_id es el cumpleañero (el que recibe regalos)
      const { data: contribs } = await supabase
        .from('contributions')
        .select(`
          id, user_id, amount, created_at, 
          message, emotional_foto_url, emotional_video_url,
          profiles:user_id(username, avatar_emoji)
        `)
        .eq('recipient_user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (contribs) {
        setContributions(contribs);
        
        // Calcular stats
        const total = contribs.reduce((sum, c) => sum + (c.amount || 0), 0);
        const withMsg = contribs.filter(c => c.message && c.message.trim()).length;
        
        setStats({
          total,
          count: contribs.length,
          withMessage: withMsg,
        });
      }
    } catch (err) {
      console.error('Error loading contributions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (username) => {
    if (!username) return '?';
    return username.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (id, index) => {
    const colors = ['#EC4899', '#10B981', '#3B82F6', '#7C3AED', '#F59E0B'];
    return colors[index % colors.length];
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

  const cardStyle = {
    background: 'white',
    borderRadius: 16,
    padding: 16,
    border: `1px solid ${C.border}`,
    marginBottom: 12,
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
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

  const bodyStyle = {
    flex: 1,
    minWidth: 0,
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

  const messageBoxStyle = {
    background: C.bg,
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    fontSize: 12,
    fontStyle: 'italic',
    color: C.inkSoft,
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

  const amountStyle = {
    fontSize: 14,
    fontWeight: 800,
    color: '#10B981',
  };

  if (loading) {
    return <div style={containerStyle}><p style={subtitleStyle}>Cargando...</p></div>;
  }

  return (
    <div style={containerStyle}>
      <MenuMiCumple 
        activeTab="misregalos" 
        onNavigate={handleTabChange} 
        isMobile={isMobile} 
      />
      <h1 style={titleStyle}>Mis regalos</h1>
      <p style={subtitleStyle}>
        {stats.count} aportes recibidos · {formatCurrency(stats.total)} total
      </p>

      {/* Stats */}
      {!isMobile && (
        <div style={statsGridStyle}>
          <div style={statStyle}>
            <div style={statValueStyle}>{formatCurrency(stats.total)}</div>
            <div style={statLabelStyle}>Total recibido</div>
          </div>
          <div style={statStyle}>
            <div style={statValueStyle}>{stats.count}</div>
            <div style={statLabelStyle}>Aportes</div>
          </div>
          <div style={statStyle}>
            <div style={statValueStyle}>{stats.withMessage}</div>
            <div style={statLabelStyle}>Con mensaje</div>
          </div>
          <div style={statStyle}>
            <div style={statValueStyle}>{stats.count - stats.withMessage}</div>
            <div style={statLabelStyle}>Sin mensaje</div>
          </div>
        </div>
      )}

      {/* Contributions list */}
      <div>
        {contributions.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 32,
            textAlign: 'center',
            border: `1px solid ${C.border}`,
          }}>
            <p style={subtitleStyle}>Aún no has recibido regalos</p>
          </div>
        ) : (
          contributions.map((contrib, idx) => (
            <div key={contrib.id} style={{ ...cardStyle, flexDirection: isMobile ? 'column' : 'row' }}>
              {!isMobile && (
                <div
                  style={{
                    ...avatarStyle,
                    background: getAvatarColor(contrib.user_id, idx),
                  }}
                >
                  {getInitials(contrib.profiles?.username)}
                </div>
              )}
              
              <div style={bodyStyle}>
                <div style={nameStyle}>
                  {contrib.profiles?.username || 'Anónimo'}
                </div>
                <div style={metaStyle}>
                  {new Date(contrib.created_at).toLocaleDateString('es-AR')}
                </div>
                
                {contrib.message && (
                  <div style={messageBoxStyle}>
                    "{contrib.message}"
                  </div>
                )}

                {!isMobile && contrib.emotional_foto_url && (
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={contrib.emotional_foto_url}
                      alt="Foto del regalo"
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: 8,
                        maxHeight: 100,
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div style={{ ...amountStyle, flexShrink: 0 }}>
                {formatCurrency(contrib.amount)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

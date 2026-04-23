import React, { useState, useEffect } from 'react';
import { C, formatCurrency } from '../theme';
import { supabase } from '../../../supabaseClient';
import MenuMiCumple from '../components/MenuMiCumple';

export default function GestionarRegalosSection({ profile, session, isMobile, handleTabChange }) {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos'); // todos | conmensaje | anonimos | foto

  useEffect(() => {
    if (session?.user?.id) loadData();
  }, [session]);

  const loadData = async () => {
    try {
      setLoading(true);
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
      }
    } catch (err) {
      console.error('Error loading contributions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredContributions = () => {
    switch (filter) {
      case 'conmensaje':
        return contributions.filter(c => c.message && c.message.trim());
      case 'anonimos':
        return contributions.filter(c => !c.user_id);
      case 'foto':
        return contributions.filter(c => c.emotional_foto_url || c.emotional_video_url);
      default:
        return contributions;
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

  const stats = {
    total: contributions.reduce((sum, c) => sum + (c.amount || 0), 0),
    count: contributions.length,
    conMensaje: contributions.filter(c => c.message && c.message.trim()).length,
    conFoto: contributions.filter(c => c.emotional_foto_url || c.emotional_video_url).length,
  };

  const filtered = getFilteredContributions();

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

  const tabStyle = (isActive) => ({
    padding: '10px 14px',
    borderRadius: 8,
    border: 'none',
    background: isActive ? C.ink : 'white',
    color: isActive ? 'white' : C.ink,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    borderBottom: isActive ? `2px solid ${C.ink}` : `1px solid ${C.border}`,
  });

  const cardStyle = {
    background: 'white',
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    marginBottom: 12,
    overflow: 'hidden',
  };

  const cardHeaderStyle = {
    padding: 16,
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    borderBottom: `1px solid ${C.borderSoft}`,
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
    fontSize: 16,
    fontWeight: 800,
    color: '#10B981',
  };

  const messageBoxStyle = {
    background: C.bg,
    padding: 14,
    fontSize: 13,
    fontStyle: 'italic',
    color: C.ink,
    lineHeight: 1.5,
  };

  const mediaStyle = {
    padding: 14,
    background: C.borderSoft,
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  };

  if (loading) {
    return <div style={containerStyle}><p style={subtitleStyle}>Cargando...</p></div>;
  }

  return (
    <div style={containerStyle}>
      <MenuMiCumple 
        activeTab="gestionar" 
        onNavigate={handleTabChange} 
        isMobile={isMobile} 
      />
      <h1 style={titleStyle}>Gestionar regalos</h1>
      <p style={subtitleStyle}>
        {filtered.length} regalo{filtered.length !== 1 ? 's' : ''} · {formatCurrency(stats.total)} total
      </p>

      {/* Stats */}
      {!isMobile && (
        <div style={statsGridStyle}>
          <div style={statStyle}>
            <div style={statValueStyle}>{formatCurrency(stats.total)}</div>
            <div style={statLabelStyle}>Total</div>
          </div>
          <div style={statStyle}>
            <div style={statValueStyle}>{stats.count}</div>
            <div style={statLabelStyle}>Regalos</div>
          </div>
          <div style={statStyle}>
            <div style={statValueStyle}>{stats.conMensaje}</div>
            <div style={statLabelStyle}>Con mensaje</div>
          </div>
          <div style={statStyle}>
            <div style={statValueStyle}>{stats.conFoto}</div>
            <div style={statLabelStyle}>Con foto</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ marginBottom: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button style={tabStyle(filter === 'todos')} onClick={() => setFilter('todos')}>
          Todos · {stats.count}
        </button>
        <button style={tabStyle(filter === 'conmensaje')} onClick={() => setFilter('conmensaje')}>
          Con mensaje · {stats.conMensaje}
        </button>
        <button style={tabStyle(filter === 'foto')} onClick={() => setFilter('foto')}>
          Con foto · {stats.conFoto}
        </button>
        <button style={tabStyle(filter === 'anonimos')} onClick={() => setFilter('anonimos')}>
          Anónimos
        </button>
      </div>

      {/* Contributions list */}
      {filtered.length === 0 ? (
        <div style={{ ...cardStyle, padding: 32, textAlign: 'center' }}>
          <p style={subtitleStyle}>No hay regalos en esta categoría</p>
        </div>
      ) : (
        filtered.map((contrib, idx) => (
          <div key={contrib.id} style={cardStyle}>
            {/* Header con info básica */}
            <div style={cardHeaderStyle}>
              <div
                style={{
                  ...avatarStyle,
                  background: getAvatarColor(contrib.user_id, idx),
                }}
              >
                {getInitials(contrib.profiles?.username)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={nameStyle}>
                  {contrib.profiles?.username || 'Anónimo'}
                </div>
                <div style={metaStyle}>
                  {new Date(contrib.created_at).toLocaleDateString('es-AR')}
                </div>
              </div>

              <div style={amountStyle}>
                {formatCurrency(contrib.amount)}
              </div>
            </div>

            {/* Message */}
            {contrib.message && (
              <div style={messageBoxStyle}>
                "{contrib.message}"
              </div>
            )}

            {/* Media */}
            {(contrib.emotional_foto_url || contrib.emotional_video_url) && (
              <div style={mediaStyle}>
                {contrib.emotional_foto_url && (
                  <img
                    src={contrib.emotional_foto_url}
                    alt="Foto del regalo"
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                      borderRadius: 8,
                      maxHeight: 150,
                    }}
                  />
                )}
                {contrib.emotional_video_url && (
                  <video
                    src={contrib.emotional_video_url}
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                      borderRadius: 8,
                      maxHeight: 150,
                    }}
                    controls
                  />
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

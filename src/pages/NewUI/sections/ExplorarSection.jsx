import React, { useState, useEffect } from 'react';
import { Search, Calendar } from 'lucide-react';
import { C, calcDaysUntil, formatDay } from '../theme';
import { supabase } from '../../../supabaseClient';

export default function ExplorarSection({ profile, session, isMobile, handleTabChange, navigateToFriendProfile }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('semana'); // semana | mes | todos

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      // Cargar todos los perfiles con cumpleaños
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, birthday, avatar_emoji')
        .not('birthday', 'is', null)
        .order('birthday', { ascending: true });

      if (profiles) {
        // Filtrar por proximidad de cumpleaños
        const withDays = profiles.map(p => ({
          ...p,
          days: calcDaysUntil(p.birthday),
        })).filter(p => p.days !== null && p.days <= 365);

        setFriends(withDays);
      }
    } catch (err) {
      console.error('Error loading friends:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFiltered = () => {
    let filtered = friends;

    // Filtrar por días
    switch (filter) {
      case 'semana':
        filtered = filtered.filter(f => f.days >= 0 && f.days <= 7);
        break;
      case 'mes':
        filtered = filtered.filter(f => f.days >= 0 && f.days <= 30);
        break;
      default:
        filtered = filtered.filter(f => f.days >= 0);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(f =>
        f.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getAvatarColor = (emoji) => {
    const colors = ['#EC4899', '#10B981', '#3B82F6', '#7C3AED', '#F59E0B', '#EF4444'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getDaysLabel = (days) => {
    if (days === 0) return 'hoy';
    if (days === 1) return 'mañana';
    if (days <= 7) return `en ${days}d`;
    if (days <= 30) return `en ${Math.floor(days / 7)}sem`;
    return `en ${Math.floor(days / 30)}mes`;
  };

  const getDaysUrgency = (days) => {
    if (days <= 3) return { color: C.accent, bg: C.accentLight };
    if (days <= 7) return { color: C.primary, bg: C.primaryLight };
    return { color: C.inkMuted, bg: C.borderSoft };
  };

  const filtered = getFiltered();

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

  const searchBoxStyle = {
    width: '100%',
    padding: '12px 14px 12px 38px',
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    fontSize: 14,
    color: C.ink,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    marginBottom: 16,
    background: 'white',
  };

  const filterButtonStyle = (isActive) => ({
    padding: '8px 14px',
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
    padding: 14,
    border: `1px solid ${C.border}`,
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
  };

  const avatarStyle = {
    width: 48,
    height: 48,
    borderRadius: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    flexShrink: 0,
  };

  const nameStyle = {
    fontSize: 14,
    fontWeight: 700,
    color: C.ink,
    marginBottom: 2,
  };

  const usernameStyle = {
    fontSize: 11,
    color: C.inkMuted,
  };

  if (loading) {
    return <div style={containerStyle}><p style={subtitleStyle}>Cargando amigos...</p></div>;
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Explorar cumples</h1>
      <p style={subtitleStyle}>
        {filtered.length} cumpleaños próximos
      </p>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={16} color={C.inkMuted} style={{ position: 'absolute', left: 14, top: 14 }} />
        <input
          type="text"
          placeholder="Buscar amigo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={searchBoxStyle}
        />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button style={filterButtonStyle(filter === 'semana')} onClick={() => setFilter('semana')}>
          Esta semana
        </button>
        <button style={filterButtonStyle(filter === 'mes')} onClick={() => setFilter('mes')}>
          Este mes
        </button>
        <button style={filterButtonStyle(filter === 'todos')} onClick={() => setFilter('todos')}>
          Todos
        </button>
      </div>

      {/* Friends list */}
      {filtered.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 32,
          textAlign: 'center',
          border: `1px solid ${C.border}`,
        }}>
          <p style={subtitleStyle}>No hay cumples en esta categoría</p>
        </div>
      ) : (
        filtered.map((friend, idx) => {
          const urgency = getDaysUrgency(friend.days);
          const daysLabel = getDaysLabel(friend.days);
          
          return (
            <button
              key={friend.id}
              onClick={() => navigateToFriendProfile(friend.username)}
              style={{
                ...cardStyle,
                flexDirection: isMobile ? 'row' : 'row',
              }}
            >
              <div
                style={{
                  ...avatarStyle,
                  background: getAvatarColor(friend.avatar_emoji),
                  color: 'white',
                  fontWeight: 800,
                }}
              >
                {friend.avatar_emoji || '🎂'}
              </div>

              <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                <div style={nameStyle}>
                  {friend.full_name}
                </div>
                <div style={usernameStyle}>
                  @{friend.username} · {formatDay(friend.birthday)}
                </div>
              </div>

              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: urgency.bg,
                  color: urgency.color,
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {daysLabel}
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}

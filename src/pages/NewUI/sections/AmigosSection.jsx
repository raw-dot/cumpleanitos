import React, { useState, useEffect } from 'react';
import { Plus, Filter, Share2, UserPlus, ChevronRight } from 'lucide-react';
import { C, getInitial, calcDaysUntil, formatDay } from '../theme';
import { supabase } from '../../../supabaseClient';

export default function AmigosSection({ session, profile, isMobile }) {
  const [subtab, setSubtab] = useState('agenda');

  return (
    <div style={{ padding: isMobile ? '16px 20px 20px' : 0 }}>
      <h1 style={{
        fontSize: isMobile ? 28 : 36, fontWeight: 800, color: C.ink,
        margin: '0 0 8px', letterSpacing: isMobile ? -0.8 : -1,
      }}>Amigos</h1>
      <p style={{
        fontSize: isMobile ? 13 : 15, color: C.inkMuted, margin: '0 0 20px',
      }}>
        Agenda, invitaciones y listas
      </p>

      <div style={{
        display: 'flex', gap: 8,
        marginBottom: isMobile ? 20 : 28,
        borderBottom: isMobile ? 'none' : `1px solid ${C.border}`,
      }}>
        {[
          { id: 'agenda', label: 'Agenda' },
          { id: 'invitar', label: 'Invitar' },
          { id: 'listas', label: 'Listas' },
        ].map(t => {
          const active = subtab === t.id;
          if (isMobile) {
            return (
              <button key={t.id} onClick={() => setSubtab(t.id)} style={{
                padding: '8px 16px', borderRadius: 999,
                border: active ? 'none' : `1px solid ${C.border}`,
                background: active ? C.ink : 'white',
                color: active ? 'white' : C.ink,
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}>{t.label}</button>
            );
          }
          return (
            <button key={t.id} onClick={() => setSubtab(t.id)} style={{
              padding: '12px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 15, fontWeight: active ? 700 : 500,
              color: active ? C.ink : C.inkSoft,
              borderBottom: active ? `2px solid ${C.ink}` : '2px solid transparent',
              marginBottom: -1,
            }}>{t.label}</button>
          );
        })}
      </div>

      {subtab === 'agenda' && <AgendaList session={session} isMobile={isMobile} />}
      {subtab === 'invitar' && <InvitarView profile={profile} isMobile={isMobile} />}
      {subtab === 'listas' && <ListasView isMobile={isMobile} />}
    </div>
  );
}

function AgendaList({ session, isMobile }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) loadFriends();
  }, [session]);

  const loadFriends = async () => {
    const { data } = await supabase
      .from('friends')
      .select('friend_id, profiles!friends_friend_id_fkey(id, name, username, avatar_url, birthday)')
      .eq('user_id', session.user.id);

    if (data) {
      const mapped = data
        .map(f => ({
          id: f.profiles?.id,
          name: f.profiles?.name,
          username: f.profiles?.username,
          avatar_url: f.profiles?.avatar_url,
          birthday: f.profiles?.birthday,
          days: calcDaysUntil(f.profiles?.birthday),
        }))
        .filter(f => f.id)
        .sort((a, b) => (a.days ?? 999) - (b.days ?? 999));
      setFriends(mapped);
    }
    setLoading(false);
  };

  if (loading) return <div style={{ color: C.inkMuted, textAlign: 'center', padding: 40 }}>Cargando...</div>;

  if (friends.length === 0) {
    return (
      <div style={{
        background: 'white', borderRadius: 16, padding: 40, textAlign: 'center',
        border: `1px dashed ${C.border}`,
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
          No tenés amigos en tu agenda
        </div>
        <div style={{ fontSize: 13, color: C.inkMuted, marginBottom: 16 }}>
          Agregá a tus amigos para nunca olvidarte de su cumple
        </div>
        <button style={{
          padding: '10px 20px', borderRadius: 12, border: 'none',
          background: C.primary, color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer',
        }}>Agregar amigo</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 13, color: C.inkMuted, marginBottom: 14 }}>
        {friends.length} amigo{friends.length !== 1 ? 's' : ''} en tu agenda
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? 8 : 14,
      }}>
        {friends.map(f => (
          <FriendCard key={f.id} friend={f} isMobile={isMobile} />
        ))}
      </div>
    </div>
  );
}

function FriendCard({ friend, isMobile }) {
  return (
    <div style={{
      background: 'white', borderRadius: isMobile ? 16 : 18,
      padding: isMobile ? 14 : 18,
      display: 'flex', alignItems: 'center', gap: 14,
      border: `1px solid ${C.border}`,
    }}>
      {friend.avatar_url ? (
        <img src={friend.avatar_url} alt={friend.name} style={{
          width: isMobile ? 48 : 56, height: isMobile ? 48 : 56,
          borderRadius: '50%', objectFit: 'cover',
        }} />
      ) : (
        <div style={{
          width: isMobile ? 48 : 56, height: isMobile ? 48 : 56,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 800, fontSize: isMobile ? 20 : 22,
        }}>{getInitial(friend.name)}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: isMobile ? 15 : 15, fontWeight: 700, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {friend.name}
        </div>
        <div style={{ fontSize: 12, color: C.inkMuted }}>
          {friend.birthday ? formatDay(friend.birthday) : 'Sin cumple'}
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button style={{
              padding: '6px 12px', borderRadius: 8, border: 'none',
              background: C.primary, color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}>Regalar</button>
          </div>
        )}
      </div>
      {friend.days !== null && (
        <div style={{
          padding: '4px 10px', borderRadius: 999,
          fontSize: 11, fontWeight: 700,
          background: friend.days < 7 ? C.accentLight : C.borderSoft,
          color: friend.days < 7 ? C.accent : C.inkSoft,
          flexShrink: 0,
        }}>{friend.days}d</div>
      )}
    </div>
  );
}

function InvitarView({ profile, isMobile }) {
  const link = `${window.location.origin}/u/${profile?.username || 'tu-usuario'}`;
  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.accentLight} 0%, #FFF 100%)`,
      borderRadius: 20, padding: isMobile ? 20 : 28,
      border: `1px solid ${C.border}`,
    }}>
      <div style={{ fontSize: isMobile ? 42 : 54, marginBottom: 12 }}>🎁</div>
      <h2 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: C.ink, margin: '0 0 8px', letterSpacing: -0.5 }}>
        Tu link personal
      </h2>
      <p style={{ fontSize: isMobile ? 13 : 14, color: C.inkSoft, margin: '0 0 18px' }}>
        Compartilo con tus amigos para que puedan regalar en tu cumple.
      </p>
      <div style={{
        background: 'white', borderRadius: 12, padding: '14px 18px',
        border: `1px solid ${C.border}`, fontSize: isMobile ? 13 : 14,
        fontWeight: 600, color: C.ink, marginBottom: 14,
        overflowX: 'auto',
      }}>{link}</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => { navigator.clipboard.writeText(link); alert('Link copiado!'); }}
          style={{
            flex: 1, padding: 14, borderRadius: 12, border: 'none',
            background: C.primary, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          <Share2 size={15} /> Copiar link
        </button>
      </div>
    </div>
  );
}

function ListasView({ isMobile }) {
  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: 40, textAlign: 'center',
      border: `1px dashed ${C.border}`,
    }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
        Listas próximamente
      </div>
      <div style={{ fontSize: 13, color: C.inkMuted }}>
        Agrupá a tus amigos en listas para invitar más rápido
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { C, getInitial, calcDaysUntil, formatDay } from '../theme';
import { supabase } from '../../../supabaseClient';

export default function CalendarioSection({ session, isMobile }) {
  const [subtab, setSubtab] = useState('calendario');
  const [friends, setFriends] = useState([]);

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
          avatar_url: f.profiles?.avatar_url,
          birthday: f.profiles?.birthday,
          days: calcDaysUntil(f.profiles?.birthday),
        }))
        .filter(f => f.id && f.birthday);
      setFriends(mapped);
    }
  };

  return (
    <div style={{ padding: isMobile ? '16px 20px 20px' : 0 }}>
      <h1 style={{
        fontSize: isMobile ? 28 : 36, fontWeight: 800, color: C.ink,
        margin: '0 0 8px', letterSpacing: isMobile ? -0.8 : -1,
      }}>Calendario</h1>
      <p style={{ fontSize: isMobile ? 13 : 15, color: C.inkMuted, margin: '0 0 20px' }}>
        Todos los cumples que tenés a la vista
      </p>

      <div style={{
        display: 'flex', gap: 8,
        marginBottom: isMobile ? 20 : 28,
        borderBottom: isMobile ? 'none' : `1px solid ${C.border}`,
      }}>
        {[
          { id: 'calendario', label: 'Calendario' },
          { id: 'proximos', label: 'Próximos' },
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

      {subtab === 'calendario' && <CalendarView friends={friends} isMobile={isMobile} />}
      {subtab === 'proximos' && <ProximosView friends={friends} isMobile={isMobile} />}
    </div>
  );
}

function CalendarView({ friends, isMobile }) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const monthName = today.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  // Mapear amigos a días del mes actual
  const friendsByDay = {};
  friends.forEach(f => {
    if (f.birthday) {
      const bday = new Date(f.birthday);
      if (bday.getMonth() === currentMonth) {
        const day = bday.getDate();
        if (!friendsByDay[day]) friendsByDay[day] = [];
        friendsByDay[day].push(f);
      }
    }
  });

  return (
    <div style={{
      background: 'white', borderRadius: 20, padding: isMobile ? 16 : 24,
      border: `1px solid ${C.border}`,
    }}>
      <h3 style={{
        fontSize: isMobile ? 18 : 22, fontWeight: 800, color: C.ink,
        margin: '0 0 20px', letterSpacing: -0.4, textTransform: 'capitalize',
      }}>
        {monthName}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: isMobile ? 4 : 6, marginBottom: 8 }}>
        {['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'].map((d,i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: isMobile ? 10 : 11, fontWeight: 700, color: C.inkMuted, letterSpacing: 0.5 }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: isMobile ? 4 : 6 }}>
        {Array.from({ length: firstDay }).map((_,i) => <div key={'e'+i} />)}
        {Array.from({ length: daysInMonth }).map((_,i) => {
          const day = i + 1;
          const isToday = day === today.getDate();
          const dayFriends = friendsByDay[day] || [];
          return (
            <div key={day} style={{
              minHeight: isMobile ? 48 : 70,
              borderRadius: isMobile ? 8 : 10,
              padding: isMobile ? 4 : 8,
              background: isToday ? C.primary : dayFriends.length > 0 ? C.primaryLight : 'white',
              color: isToday ? 'white' : C.ink,
              border: isToday ? 'none' : `1px solid ${C.borderSoft}`,
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: isToday ? 700 : 500 }}>{day}</div>
              {dayFriends.length > 0 && (
                <div style={{
                  marginTop: 'auto', fontSize: isMobile ? 9 : 10, fontWeight: 600,
                  color: isToday ? 'white' : C.primary,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  🎂 {dayFriends[0].name?.split(' ')[0]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProximosView({ friends, isMobile }) {
  const sorted = [...friends]
    .filter(f => f.days !== null)
    .sort((a, b) => a.days - b.days);

  if (sorted.length === 0) {
    return (
      <div style={{
        background: 'white', borderRadius: 16, padding: 40, textAlign: 'center',
        border: `1px dashed ${C.border}`,
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>
          No hay próximos eventos
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sorted.map(f => (
        <div key={f.id} style={{
          background: 'white', borderRadius: 14, padding: 14,
          border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {f.avatar_url ? (
            <img src={f.avatar_url} alt={f.name} style={{ width: 44, height: 44, borderRadius: 22, objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 44, height: 44, borderRadius: 22,
              background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: 18,
            }}>{getInitial(f.name)}</div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{f.name}</div>
            <div style={{ fontSize: 11, color: C.inkMuted }}>{formatDay(f.birthday)}</div>
          </div>
          <div style={{
            padding: '4px 10px', borderRadius: 999,
            fontSize: 11, fontWeight: 700,
            background: f.days < 7 ? C.accentLight : C.borderSoft,
            color: f.days < 7 ? C.accent : C.inkSoft,
          }}>en {f.days}d</div>
        </div>
      ))}
    </div>
  );
}

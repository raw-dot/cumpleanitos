import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, CreditCard, Users, Star } from 'lucide-react';
import { C, formatCurrency } from '../theme';
import { supabase } from '../../../supabaseClient';

export default function OrganizadorSection({ session, isMobile }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) loadEvents();
  }, [session]);

  const loadEvents = async () => {
    // Cargar eventos que organiza el usuario desde gift_events
    const { data } = await supabase
      .from('event_organizers')
      .select('gift_event_id, role, gift_events(*)')
      .eq('profile_id', session.user.id);

    if (data) setEvents(data.map(e => ({ ...e.gift_events, role: e.role })));
    setLoading(false);
  };

  return (
    <div style={{ padding: isMobile ? '16px 20px 20px' : 0 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'flex-end',
        marginBottom: 24, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 0,
      }}>
        <div>
          <h1 style={{
            fontSize: isMobile ? 28 : 36, fontWeight: 800, color: C.ink,
            margin: '0 0 8px', letterSpacing: isMobile ? -0.8 : -1,
          }}>Organizador</h1>
          <p style={{ fontSize: isMobile ? 13 : 15, color: C.inkMuted, margin: 0 }}>
            Cumples que organizás para otros
          </p>
        </div>
        <button style={{
          padding: isMobile ? '10px 16px' : '12px 20px',
          borderRadius: 12, border: 'none',
          background: C.primary, color: 'white',
          fontWeight: 700, fontSize: isMobile ? 13 : 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Plus size={isMobile ? 14 : 16} /> Organizar cumple
        </button>
      </div>

      {/* Stats desktop */}
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
          {[
            { l: 'Campañas activas', v: events.filter(e => e.status === 'active').length, c: C.primary, i: TrendingUp },
            { l: 'Total juntado', v: '$0', c: C.success, i: CreditCard },
            { l: 'Amigos sumados', v: '0', c: C.accent, i: Users },
            { l: 'Campañas cerradas', v: events.filter(e => e.status === 'completed').length, c: C.ink, i: Star },
          ].map(s => {
            const Icon = s.i;
            return (
              <div key={s.l} style={{
                background: 'white', borderRadius: 16, padding: 20,
                border: `1px solid ${C.border}`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: `${s.c}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                }}>
                  <Icon size={18} color={s.c} />
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: C.ink, letterSpacing: -0.5 }}>{s.v}</div>
                <div style={{ fontSize: 12, color: C.inkMuted, fontWeight: 500 }}>{s.l}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lista de eventos */}
      <h2 style={{ fontSize: isMobile ? 16 : 22, fontWeight: 800, color: C.ink, margin: '0 0 16px' }}>
        Campañas
      </h2>

      {loading ? (
        <div style={{ color: C.inkMuted, textAlign: 'center', padding: 40 }}>Cargando...</div>
      ) : events.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: 18, padding: 40, textAlign: 'center',
          border: `1px dashed ${C.border}`,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
            No estás organizando ningún cumple
          </div>
          <div style={{ fontSize: 13, color: C.inkMuted, marginBottom: 16 }}>
            Creá un cumple para un amigo y sumá a otros a colaborar
          </div>
          <button style={{
            padding: '10px 20px', borderRadius: 12, border: 'none',
            background: C.primary, color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>Organizar primer cumple</button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 16,
        }}>
          {events.map(e => (
            <EventCard key={e.id} event={e} isMobile={isMobile} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, isMobile }) {
  return (
    <div style={{
      background: 'white', borderRadius: isMobile ? 18 : 20,
      padding: isMobile ? 16 : 24,
      border: `1px solid ${C.border}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{
            fontSize: isMobile ? 16 : 20, fontWeight: 800, color: C.ink,
            letterSpacing: isMobile ? -0.3 : -0.4,
          }}>{event.title}</div>
          <div style={{ fontSize: isMobile ? 12 : 13, color: C.inkMuted, marginTop: 2 }}>
            Status: {event.status}
          </div>
        </div>
        <span style={{
          padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
          background: C.primaryLight, color: C.primary, textTransform: 'uppercase',
        }}>{event.status}</span>
      </div>

      {event.estimated_budget && (
        <>
          <div style={{ height: 10, background: C.borderSoft, borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ width: '0%', height: '100%', background: `linear-gradient(90deg, ${C.primary}, ${C.accent})` }} />
          </div>
          <div style={{ fontSize: 13, color: C.ink, marginTop: 8, fontWeight: 600 }}>
            Meta: {formatCurrency(event.estimated_budget)}
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button style={{
          flex: 1, padding: 12, borderRadius: 12, border: 'none',
          background: C.ink, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>Compartir</button>
        <button style={{
          padding: '12px 18px', borderRadius: 12, border: `1px solid ${C.border}`,
          background: 'white', color: C.ink, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>Ver detalle</button>
      </div>
    </div>
  );
}

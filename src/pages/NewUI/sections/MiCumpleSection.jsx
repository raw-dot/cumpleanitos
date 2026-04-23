import React, { useState, useEffect } from 'react';
import { Gamepad2, ChevronRight } from 'lucide-react';
import { C, calcDaysUntil, formatCurrency, formatDay } from '../theme';
import { supabase } from '../../../supabaseClient';

export default function MiCumpleSection({ profile, session, isMobile }) {
  const [campaign, setCampaign] = useState(null);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    if (session?.user?.id) loadData();
  }, [session]);

  const loadData = async () => {
    const { data: c } = await supabase
      .from('gift_campaigns')
      .select('*')
      .eq('user_id', session.user.id)
      .limit(1)
      .maybeSingle();
    if (c) setCampaign(c);

    const { data: items } = await supabase
      .from('gift_items')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (items) setWishlist(items);
  };

  const days = calcDaysUntil(profile?.birthday);

  return (
    <div style={{ padding: isMobile ? '16px 20px 20px' : 0 }}>
      <h1 style={{
        fontSize: isMobile ? 28 : 36, fontWeight: 800, color: C.ink,
        margin: '0 0 8px', letterSpacing: isMobile ? -0.8 : -1,
      }}>Mi cumple</h1>
      <p style={{ fontSize: isMobile ? 13 : 15, color: C.inkMuted, margin: '0 0 20px' }}>
        {days !== null ? `Faltan ${days} días · ${formatDay(profile?.birthday)}` : 'Configurá tu fecha de cumpleaños'}
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1fr',
        gap: isMobile ? 20 : 20,
        marginBottom: isMobile ? 20 : 32,
      }}>
        {/* Hero countdown */}
        <div style={{
          background: `linear-gradient(135deg, ${C.accent} 0%, #EC4899 100%)`,
          borderRadius: isMobile ? 20 : 24,
          padding: isMobile ? 22 : 32,
          color: 'white', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: -30, top: -40,
            fontSize: isMobile ? 160 : 220, opacity: 0.15,
          }}>🎂</div>
          <div style={{
            fontSize: isMobile ? 11 : 12, fontWeight: 700,
            opacity: 0.9, textTransform: 'uppercase', letterSpacing: 0.6,
          }}>
            {days !== null ? 'Faltan' : 'Configurá'}
          </div>
          <div style={{
            fontSize: isMobile ? 56 : 96, fontWeight: 900,
            letterSpacing: isMobile ? -2 : -3,
            lineHeight: 1, marginTop: isMobile ? 8 : 12,
          }}>{days !== null ? days : '?'}</div>
          <div style={{ fontSize: isMobile ? 15 : 20, fontWeight: 700 }}>
            {days !== null ? `día${days !== 1 ? 's' : ''} para la fiesta` : 'tu fecha de cumpleaños'}
          </div>
          <button style={{
            marginTop: isMobile ? 16 : 22,
            padding: isMobile ? '10px 16px' : '12px 22px',
            borderRadius: 12, border: 'none',
            background: 'white', color: '#EC4899',
            fontWeight: 700, fontSize: isMobile ? 13 : 14, cursor: 'pointer',
          }}>
            {campaign ? 'Ver mi campaña →' : 'Crear campaña →'}
          </button>
        </div>

        {/* Stats desktop */}
        {!isMobile && campaign && (
          <div style={{
            background: 'white', borderRadius: 24, padding: 24,
            border: `1px solid ${C.border}`,
          }}>
            <div style={{ fontSize: 12, color: C.inkMuted, fontWeight: 700, textTransform: 'uppercase' }}>
              Tu colecta
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: C.ink, margin: '4px 0', letterSpacing: -1 }}>
              {formatCurrency(campaign.total_raised || 0)}
            </div>
            <div style={{ fontSize: 13, color: C.inkMuted }}>
              de {formatCurrency(campaign.goal_amount || 0)}
            </div>
            <div style={{
              height: 10, background: C.borderSoft, borderRadius: 5,
              marginTop: 14, overflow: 'hidden',
            }}>
              <div style={{
                width: `${Math.min(100, ((campaign.total_raised || 0) / (campaign.goal_amount || 1)) * 100)}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`,
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Lista de deseos */}
      <h2 style={{ fontSize: isMobile ? 16 : 22, fontWeight: 800, color: C.ink, margin: '0 0 16px' }}>
        Lista de deseos
      </h2>
      {wishlist.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 8 : 14,
          marginBottom: isMobile ? 20 : 32,
        }}>
          {wishlist.map(item => (
            <WishCard key={item.id} item={item} isMobile={isMobile} />
          ))}
        </div>
      ) : (
        <div style={{
          background: 'white', borderRadius: 16, padding: 24, textAlign: 'center',
          border: `1px dashed ${C.border}`, marginBottom: isMobile ? 20 : 32,
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🎁</div>
          <div style={{ fontSize: 14, color: C.inkMuted, marginBottom: 12 }}>
            Tu lista de deseos está vacía
          </div>
          <button style={{
            padding: '10px 20px', borderRadius: 12, border: 'none',
            background: C.primary, color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>Agregar deseo</button>
        </div>
      )}

      {/* Jugar */}
      <div style={{
        background: `linear-gradient(135deg, #10B981 0%, #059669 100%)`,
        borderRadius: isMobile ? 20 : 24,
        padding: isMobile ? 20 : 28, color: 'white',
        display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 20,
      }}>
        <div style={{
          width: isMobile ? 52 : 72, height: isMobile ? 52 : 72,
          borderRadius: isMobile ? 16 : 20,
          background: 'rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Gamepad2 size={isMobile ? 26 : 34} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 800, letterSpacing: -0.4 }}>
            Juegos de cumpleaños
          </div>
          <div style={{ fontSize: isMobile ? 12 : 14, opacity: 0.9, marginTop: 2 }}>
            Sumale diversión a tu fiesta
          </div>
        </div>
        {!isMobile && (
          <button style={{
            padding: '12px 22px', borderRadius: 12, border: 'none',
            background: 'white', color: '#059669',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>Explorar →</button>
        )}
        {isMobile && <ChevronRight size={20} color="white" />}
      </div>
    </div>
  );
}

function WishCard({ item, isMobile }) {
  return (
    <div style={{
      background: 'white', borderRadius: isMobile ? 16 : 18,
      padding: isMobile ? 14 : 20,
      border: `1px solid ${C.border}`,
      display: isMobile ? 'flex' : 'block',
      alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: isMobile ? 56 : '100%',
        height: isMobile ? 56 : 100,
        borderRadius: 14, background: C.borderSoft,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isMobile ? 28 : 54,
        marginBottom: isMobile ? 0 : 14,
        flexShrink: 0,
      }}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
        ) : '🎁'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: C.ink }}>
          {item.title}
        </div>
        {item.price && (
          <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 2 }}>
            {formatCurrency(item.price)}
          </div>
        )}
      </div>
    </div>
  );
}

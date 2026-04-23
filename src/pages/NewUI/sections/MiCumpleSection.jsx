import React, { useState, useEffect } from 'react';
import { Users, Briefcase, GraduationCap, Heart, UserPlus, Plus, Gamepad2, ChevronRight } from 'lucide-react';
import { C, calcDaysUntil, formatCurrency, formatDay } from '../theme';
import { supabase } from '../../../supabaseClient';

export default function MiCumpleSection({ profile, session, isMobile, handleTabChange }) {
  const [campaign, setCampaign] = useState(null);
  const [items, setItems] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) loadData();
  }, [session]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: camp } = await supabase
        .from('gift_campaigns')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (camp) {
        setCampaign(camp);

        const [{ data: itemsData }, { data: contribData }] = await Promise.all([
          supabase.from('gift_items').select('*').eq('campaign_id', camp.id).order('created_at'),
          supabase.from('contributions').select('*').eq('campaign_id', camp.id).order('created_at', { ascending: false }),
        ]);

        if (itemsData) setItems(itemsData);
        if (contribData) setContributions(contribData);
      }
    } catch (err) {
      console.error('Error loading mi cumple:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalRaised = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const goalAmount = campaign?.goal_amount || items.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0) || 0;
  const progressPct = goalAmount > 0 ? Math.min(100, (totalRaised / goalAmount) * 100) : 0;
  const uniqueContributors = new Set(contributions.map(c => c.user_id).filter(Boolean)).size;

  const days = calcDaysUntil(profile?.birthday);
  const hasRegalos = items.length > 0;

  return (
    <div style={{ padding: isMobile ? '16px 20px 20px' : 0 }}>
      <h1 style={{
        fontSize: isMobile ? 28 : 36, fontWeight: 800, color: C.ink,
        margin: '0 0 8px', letterSpacing: isMobile ? -0.8 : -1,
      }}>Mi cumple</h1>
      <p style={{ fontSize: isMobile ? 13 : 15, color: C.inkMuted, margin: '0 0 20px' }}>
        {days !== null ? `Faltan ${days} días · ${formatDay(profile?.birthday)}` : 'Configurá tu fecha de cumpleaños'}
      </p>

      {/* HERO + MI REGALO - siempre aparece */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1fr',
        gap: 20,
        marginBottom: isMobile ? 24 : 32,
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
            position: 'relative', zIndex: 1,
          }}>
            {days !== null ? 'Faltan' : 'Configurá'}
          </div>
          <div style={{
            fontSize: isMobile ? 56 : 96, fontWeight: 900,
            letterSpacing: isMobile ? -2 : -3,
            lineHeight: 1, marginTop: isMobile ? 8 : 12,
            position: 'relative', zIndex: 1,
          }}>{days !== null ? days : '?'}</div>
          <div style={{ fontSize: isMobile ? 15 : 20, fontWeight: 700, position: 'relative', zIndex: 1 }}>
            {days !== null ? `día${days !== 1 ? 's' : ''} para tu fiesta` : 'tu fecha de cumpleaños'}
          </div>
          <button
            onClick={() => handleTabChange && handleTabChange('compartir')}
            style={{
              marginTop: isMobile ? 16 : 22,
              padding: isMobile ? '10px 16px' : '12px 22px',
              borderRadius: 12, border: 'none',
              background: 'white', color: '#EC4899',
              fontWeight: 700, fontSize: isMobile ? 13 : 14, cursor: 'pointer',
              position: 'relative', zIndex: 1,
            }}>
            Compartir mi regalo →
          </button>
        </div>

        {/* MI REGALO DE CUMPLEAÑOS - siempre aparece */}
        <MiRegaloCard
          hasRegalos={hasRegalos}
          items={items}
          contributions={contributions}
          totalRaised={totalRaised}
          goalAmount={goalAmount}
          progressPct={progressPct}
          uniqueContributors={uniqueContributors}
          isMobile={isMobile}
          handleTabChange={handleTabChange}
        />
      </div>

      {/* MIS REGALOS (lista de gift_items con progress individual) */}
      <h2 style={{ fontSize: isMobile ? 16 : 22, fontWeight: 800, color: C.ink, margin: '0 0 16px' }}>
        Mis regalos
      </h2>
      {hasRegalos ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 8 : 14,
          marginBottom: isMobile ? 24 : 32,
        }}>
          {items.map(item => (
            <RegaloCard key={item.id} item={item} contributions={contributions.filter(c => c.gift_item_id === item.id)} isMobile={isMobile} />
          ))}
        </div>
      ) : (
        <div style={{
          background: 'white', borderRadius: 16, padding: 24, textAlign: 'center',
          border: `1px dashed ${C.border}`, marginBottom: isMobile ? 24 : 32,
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🎁</div>
          <div style={{ fontSize: 14, color: C.inkMuted, marginBottom: 12 }}>
            Aún no tenés regalos cargados
          </div>
          <button style={{
            padding: '10px 20px', borderRadius: 12, border: 'none',
            background: C.primary, color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>Agregar regalo</button>
        </div>
      )}

      {/* JUEGOS DE CUMPLEAÑOS - siempre aparece al final */}
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

function MiRegaloCard({ hasRegalos, items, contributions, totalRaised, goalAmount, progressPct, uniqueContributors, isMobile, handleTabChange }) {
  if (!hasRegalos) {
    // Sin regalo cargado
    return (
      <div style={{
        background: 'white', borderRadius: isMobile ? 20 : 24, padding: isMobile ? 22 : 28,
        border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: isMobile ? 'auto' : 260, textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>📦</div>
        <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700, color: C.ink, marginBottom: 6 }}>
          Aún no cargaste tu regalo
        </div>
        <div style={{ fontSize: 13, color: C.inkMuted, marginBottom: 16 }}>
          ¿Querés cargarlo y empezar a juntar?
        </div>
        <button
          onClick={() => handleTabChange('miregalo')}
          style={{
            padding: '10px 20px', borderRadius: 12, border: 'none',
            background: C.primary, color: 'white',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>
          Cargalo acá →
        </button>
      </div>
    );
  }

  // Con regalo cargado
  return (
    <div style={{
      background: 'white', borderRadius: isMobile ? 20 : 24, padding: isMobile ? 22 : 28,
      border: `1px solid ${C.border}`,
    }}>
      <div style={{
        fontSize: 12, color: C.inkMuted, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12,
      }}>
        Mi regalo de cumpleaños
      </div>
      <div style={{
        fontSize: isMobile ? 32 : 40, fontWeight: 800,
        color: C.ink, margin: '0 0 4px', letterSpacing: -1.2,
      }}>
        {formatCurrency(totalRaised)}
      </div>
      <div style={{ fontSize: 13, color: C.inkMuted, marginBottom: 14 }}>
        de {formatCurrency(goalAmount)} · {Math.round(progressPct)}% juntado
      </div>
      <div style={{
        height: 10, background: C.borderSoft, borderRadius: 5,
        marginBottom: 6, overflow: 'hidden',
      }}>
        <div style={{
          width: `${progressPct}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`,
          transition: 'width 0.5s',
        }} />
      </div>

      {/* Stats + Ver button */}
      <div style={{
        display: 'flex', gap: 12, marginTop: 16, alignItems: 'center',
        paddingTop: 14, borderTop: `1px solid ${C.borderSoft}`,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 800, color: C.ink, letterSpacing: -0.5 }}>
            {uniqueContributors}
          </div>
          <div style={{ fontSize: 11, color: C.inkMuted, fontWeight: 600, marginTop: 2 }}>
            amigos regalaron
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 800, color: C.ink, letterSpacing: -0.5 }}>
            {items.length}
          </div>
          <div style={{ fontSize: 11, color: C.inkMuted, fontWeight: 600, marginTop: 2 }}>
            regalos cargados
          </div>
        </div>
        <button
          onClick={() => handleTabChange('miregalo')}
          style={{
            padding: '8px 12px', borderRadius: 8, border: 'none',
            background: C.primary, color: 'white',
            fontWeight: 700, fontSize: 12, cursor: 'pointer',
          }}
        >
          Ver
        </button>
      </div>
    </div>
  );
}

function RegaloCard({ item, contributions, isMobile }) {
  const raised = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const price = parseFloat(item.price) || 0;
  const pct = price > 0 ? Math.min(100, (raised / price) * 100) : 0;

  return (
    <div style={{
      background: 'white', borderRadius: isMobile ? 16 : 18,
      padding: isMobile ? 14 : 16,
      border: `1px solid ${C.border}`,
      display: isMobile ? 'flex' : 'block',
      alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: isMobile ? 64 : '100%',
        height: isMobile ? 64 : 130,
        borderRadius: 12, background: C.borderSoft,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isMobile ? 30 : 50,
        marginBottom: isMobile ? 0 : 14,
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.name || item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : '🎁'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: isMobile ? 14 : 15, fontWeight: 700, color: C.ink,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.name || item.title || 'Regalo'}
        </div>
        {price > 0 && (
          <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 2 }}>
            {formatCurrency(price)}
          </div>
        )}
        <div style={{
          height: 4, background: C.borderSoft, borderRadius: 2,
          marginTop: 8, overflow: 'hidden',
        }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: C.primary, borderRadius: 2,
          }} />
        </div>
        <div style={{ fontSize: 10, color: C.inkMuted, marginTop: 4, fontWeight: 600 }}>
          {Math.round(pct)}% juntado
        </div>
      </div>
    </div>
  );
}

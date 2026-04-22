import React from 'react';
import { Plus, UserPlus, Gift, Gamepad2, ChevronRight, Sparkles } from 'lucide-react';
import { COLORS } from '../../utils/constants';

export default function InicioPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div style={{ padding: '8px 20px 20px' }}>
      {/* Saludo hero */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: COLORS.inkMuted, fontWeight: 500 }}>
          Hola, {user?.name?.split(' ')[0] || 'Cumpleañero'} 👋
        </div>
        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          color: COLORS.ink,
          margin: '4px 0 0',
          letterSpacing: -0.8,
          lineHeight: 1.15,
        }}>
          Tu próximo cumple<br/>está cerca
        </h1>
      </div>

      {/* Hero card: próximo cumple de amigo */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
        borderRadius: 20,
        padding: 20,
        color: 'white',
        marginBottom: 20,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, fontSize: 140, opacity: 0.15 }}>🎂</div>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          opacity: 0.85,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}>
          En 3 días · Organizás vos
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, letterSpacing: -0.4 }}>
          Cumple de Martina
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
          8 amigos confirmados · $45.000 juntados de $80.000
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.25)',
          height: 6,
          borderRadius: 4,
          marginTop: 12,
          overflow: 'hidden',
        }}>
          <div style={{ width: '56%', height: '100%', background: COLORS.accent, borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 12,
            border: 'none',
            background: 'white',
            color: COLORS.primary,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}>
            Compartir link
          </button>
          <button style={{
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.4)',
            background: 'transparent',
            color: 'white',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}>
            Ver detalle
          </button>
        </div>
      </div>

      {/* Acciones rápidas */}
      <h3 style={{
        fontSize: 16,
        fontWeight: 800,
        color: COLORS.ink,
        margin: '0 0 12px',
        letterSpacing: -0.3,
      }}>
        Acciones rápidas
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        <QuickAction icon={Plus} label="Organizar cumple" color={COLORS.primary} />
        <QuickAction icon={UserPlus} label="Invitar amigos" color={COLORS.accent} />
        <QuickAction icon={Gift} label="Regalar" color="#EC4899" />
        <QuickAction icon={Gamepad2} label="Jugar" color="#10B981" />
      </div>

      {/* Próximos cumples */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: COLORS.ink, margin: 0 }}>
          Próximos cumples
        </h3>
        <button style={{
          background: 'none',
          border: 'none',
          color: COLORS.primary,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}>
          Ver agenda
        </button>
      </div>
      <div style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        margin: '0 -20px',
        padding: '0 20px 8px',
        scrollbarWidth: 'none',
      }}>
        {[
          { n: 'Martina', d: '3 días', avatar: '🧁', color: '#FFE4E6' },
          { n: 'Federico', d: '12 días', avatar: '🎸', color: '#DBEAFE' },
          { n: 'Sofía', d: '21 días', avatar: '✨', color: '#FEF3C7' },
          { n: 'Lucas', d: '1 mes', avatar: '🚀', color: '#DCFCE7' },
        ].map(p => (
          <div key={p.n} style={{
            minWidth: 140,
            background: 'white',
            borderRadius: 16,
            padding: 14,
            border: `1px solid ${COLORS.border}`,
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              background: p.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
            }}>
              {p.avatar}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, marginTop: 10 }}>
              {p.n}
            </div>
            <div style={{ fontSize: 11, color: COLORS.inkMuted, marginTop: 2 }}>en {p.d}</div>
          </div>
        ))}
      </div>

      {/* Novedades */}
      <div style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: COLORS.ink, margin: '0 0 12px' }}>
          Novedades
        </h3>
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 16,
          border: `1px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: COLORS.accentLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles size={22} color={COLORS.accent} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>
              Nuevo: listas de regalo
            </div>
            <div style={{ fontSize: 12, color: COLORS.inkMuted, marginTop: 2 }}>
              Armá tu lista y compartila en un link
            </div>
          </div>
          <ChevronRight size={18} color={COLORS.inkMuted} />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, color }) {
  return (
    <button style={{
      background: 'white',
      border: `1px solid ${COLORS.border}`,
      borderRadius: 16,
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 10,
      cursor: 'pointer',
      textAlign: 'left',
    }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={18} color={color} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{label}</div>
    </button>
  );
}

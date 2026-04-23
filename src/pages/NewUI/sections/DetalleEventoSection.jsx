import React, { useState, useEffect } from 'react';
import { Share2, Copy, Users, TrendingUp } from 'lucide-react';
import { C, formatCurrency } from '../theme';
import { supabase } from '../../../supabaseClient';

export default function DetalleEventoSection({ profile, session, isMobile, handleTabChange }) {
  const [event, setEvent] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadEventData();
  }, [session]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      // TODO: Obtener event_id de URL o props
      // Por ahora cargamos un evento de ejemplo
      const eventData = {
        id: 'evt_123',
        title: 'Cumple de Sofia',
        recipient_full_name: 'Sofia Martinez',
        target_amount: 60000,
        mode: 'sorpresa',
        created_at: new Date().toISOString(),
        gift_type: 'plata',
      };
      setEvent(eventData);

      // Simular contributions
      const mockContribs = [
        { id: '1', user: 'Lucas', amount: 5000, message: 'Que lo disfrutes' },
        { id: '2', user: 'Martina', amount: 10000, message: null },
        { id: '3', user: 'Federico', amount: 8000, message: 'Felicidades!' },
      ];
      setContributions(mockContribs);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalCollected = contributions.reduce((sum, c) => sum + c.amount, 0);
  const progressPercent = (totalCollected / event?.target_amount) * 100;

  const handleCopyLink = () => {
    navigator.clipboard.writeText('cumpleanitos.com/event/xyz123');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const heroStyle = {
    background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
    borderRadius: 18,
    padding: isMobile ? 20 : 28,
    color: 'white',
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  };

  const cardStyle = {
    background: 'white',
    borderRadius: 16,
    padding: 16,
    border: `1px solid ${C.border}`,
    marginBottom: 12,
  };

  const statStyle = {
    background: 'white',
    borderRadius: 12,
    padding: 12,
    border: `1px solid ${C.border}`,
    textAlign: 'center',
  };

  if (loading) {
    return <div style={containerStyle}><p style={{ color: C.inkMuted }}>Cargando...</p></div>;
  }

  if (!event) {
    return (
      <div style={containerStyle}>
        <h1 style={titleStyle}>Evento no encontrado</h1>
        <button
          onClick={() => handleTabChange('organizador')}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: C.primary,
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>{event.title}</h1>
      <p style={{ fontSize: isMobile ? 13 : 15, color: C.inkMuted, marginBottom: 20 }}>
        Para {event.recipient_full_name}
      </p>

      {/* Hero con progreso */}
      <div style={heroStyle}>
        <div style={{ position: 'absolute', right: -30, top: -30, fontSize: 160, opacity: 0.15 }}>
          🎁
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, textTransform: 'uppercase' }}>
          Recaudado
        </div>
        <div style={{
          fontSize: isMobile ? 32 : 48,
          fontWeight: 900,
          marginTop: 6,
          letterSpacing: -1,
        }}>
          {formatCurrency(totalCollected)}
        </div>
        <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>
          de {formatCurrency(event.target_amount)} meta
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.25)',
          height: 8,
          borderRadius: 4,
          marginTop: 14,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${Math.min(progressPercent, 100)}%`,
            height: '100%',
            background: 'white',
            borderRadius: 4,
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.9, marginTop: 6 }}>
          <span>{Math.round(progressPercent)}% completo</span>
          <span>{contributions.length} amigos</span>
        </div>

        <button
          onClick={handleCopyLink}
          style={{
            marginTop: 14,
            width: '100%',
            padding: '11px 16px',
            borderRadius: 10,
            border: 'none',
            background: 'white',
            color: C.primary,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {copied ? '✓ Link copiado' : '📋 Copiar link'}
        </button>
      </div>

      {/* Stats */}
      {!isMobile && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
          marginBottom: 20,
        }}>
          <div style={statStyle}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.ink }}>
              {contributions.length}
            </div>
            <div style={{ fontSize: 10, color: C.inkMuted, fontWeight: 600, marginTop: 4 }}>
              APORTES
            </div>
          </div>
          <div style={statStyle}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.primary }}>
              {Math.round(progressPercent)}%
            </div>
            <div style={{ fontSize: 10, color: C.inkMuted, fontWeight: 600, marginTop: 4 }}>
              COMPLETADO
            </div>
          </div>
          <div style={statStyle}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>
              {formatCurrency(event.target_amount - totalCollected)}
            </div>
            <div style={{ fontSize: 10, color: C.inkMuted, fontWeight: 600, marginTop: 4 }}>
              FALTA
            </div>
          </div>
          <div style={statStyle}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.ink }}>
              {Math.round(totalCollected / Math.max(contributions.length, 1))}
            </div>
            <div style={{ fontSize: 10, color: C.inkMuted, fontWeight: 600, marginTop: 4 }}>
              PROMEDIO
            </div>
          </div>
        </div>
      )}

      {/* Aportes */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontSize: isMobile ? 15 : 18,
          fontWeight: 800,
          color: C.ink,
          marginBottom: 12,
        }}>
          Aportes recibidos
        </div>

        {contributions.length === 0 ? (
          <div style={cardStyle}>
            <p style={{ color: C.inkMuted, fontSize: 13 }}>Aún no hay aportes</p>
          </div>
        ) : (
          contributions.map(contrib => (
            <div key={contrib.id} style={cardStyle}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: contrib.message ? 10 : 0,
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>
                    {contrib.user}
                  </div>
                </div>
                <div style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: C.success,
                }}>
                  {formatCurrency(contrib.amount)}
                </div>
              </div>

              {contrib.message && (
                <div style={{
                  background: C.bg,
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 12,
                  fontStyle: 'italic',
                  color: C.inkSoft,
                }}>
                  "{contrib.message}"
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Detalles */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 16,
        border: `1px solid ${C.border}`,
      }}>
        <div style={{
          fontSize: isMobile ? 15 : 18,
          fontWeight: 800,
          color: C.ink,
          marginBottom: 12,
        }}>
          Detalles del evento
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 14,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.inkMuted, textTransform: 'uppercase' }}>
              Tipo de regalo
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginTop: 4 }}>
              {event.gift_type === 'plata' ? '💰 Plata' : '🎁 Producto'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.inkMuted, textTransform: 'uppercase' }}>
              Modo
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginTop: 4 }}>
              {event.mode === 'sorpresa' ? '🎉 Sorpresa' : '💬 Consultado'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

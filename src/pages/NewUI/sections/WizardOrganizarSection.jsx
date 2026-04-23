import React, { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { C } from '../theme';
import { supabase } from '../../../supabaseClient';

export default function WizardOrganizarSection({ profile, session, isMobile, handleTabChange }) {
  const [step, setStep] = useState(1); // 1-4
  const [loading, setLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    celebrantUsername: '', // Paso 1
    giftTitle: '', // Paso 2
    giftType: 'plata', // plata | producto
    targetAmount: '60000',
    giftMode: 'sorpresa', // sorpresa | consultado
    message: '', // Paso 3
  });

  const [celebrant, setCelebrant] = useState(null);
  const [daysUntil, setDaysUntil] = useState(null);

  const steps = [
    { num: 1, label: 'Elegir cumpleañero' },
    { num: 2, label: 'Definir regalo' },
    { num: 3, label: 'Resumen' },
    { num: 4, label: '¡Listo!' },
  ];

  // Paso 1: Buscar cumpleañero
  const handleSearchCelebrant = async () => {
    if (!formData.celebrantUsername.trim()) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username, birthday, avatar_emoji')
        .eq('username', formData.celebrantUsername)
        .maybeSingle();

      if (data) {
        setCelebrant(data);
        // Calcular días hasta cumpleaños
        const today = new Date();
        const birthday = new Date(data.birthday);
        const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        if (nextBirthday < today) {
          nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
        }
        const diff = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
        setDaysUntil(diff);
      } else {
        alert('Usuario no encontrado');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error al buscar usuario');
    }
  };

  const handleCreateEvent = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);

      // Crear gift_event (tabla que probablemente existe)
      const { data, error } = await supabase
        .from('gift_events')
        .insert({
          recipient_user_id: celebrant.id,
          creator_user_id: session.user.id,
          title: formData.giftTitle,
          gift_type: formData.giftType,
          target_amount: parseInt(formData.targetAmount),
          mode: formData.giftMode,
          message: formData.message,
          created_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;

      // Ir al paso 4 (confirmación)
      setStep(4);
    } catch (err) {
      console.error('Error creating event:', err);
      alert('Error al crear el evento: ' + err.message);
    } finally {
      setLoading(false);
    }
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

  const progressStyle = {
    display: 'flex',
    gap: 6,
    marginBottom: 24,
  };

  const progressBarStyle = (isActive, isDone) => ({
    flex: 1,
    height: 4,
    borderRadius: 2,
    background: isDone ? C.success : (isActive ? C.primary : C.border),
  });

  const stepLabelStyle = {
    fontSize: 12,
    fontWeight: 700,
    color: C.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  };

  const cardStyle = {
    background: 'white',
    borderRadius: 16,
    padding: isMobile ? 18 : 24,
    border: `1px solid ${C.border}`,
    marginBottom: 20,
  };

  const fieldStyle = {
    marginBottom: 16,
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 700,
    color: C.inkSoft,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    fontSize: 14,
    color: C.ink,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    background: 'white',
  };

  const buttonStyle = (variant) => ({
    padding: '12px 20px',
    borderRadius: 10,
    border: 'none',
    background: variant === 'primary' ? C.primary : (variant === 'secondary' ? 'white' : C.danger),
    color: variant === 'primary' ? 'white' : (variant === 'secondary' ? C.ink : 'white'),
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    borderBottom: variant === 'secondary' ? `1px solid ${C.border}` : 'none',
  });

  const optionStyle = (isActive) => ({
    padding: 16,
    borderRadius: 12,
    border: isActive ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
    background: isActive ? C.primaryLight : 'white',
    cursor: 'pointer',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  });

  // PASO 1: Elegir cumpleañero
  if (step === 1) {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => handleTabChange('inicio')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ArrowLeft size={18} color={C.ink} />
          </button>
          <h1 style={{ ...titleStyle, margin: 0 }}>Organizar cumpleaños</h1>
        </div>

        {/* Progress */}
        <div style={progressStyle}>
          {steps.map((s) => (
            <div
              key={s.num}
              style={progressBarStyle(s.num === step, s.num < step)}
            />
          ))}
        </div>

        <div style={stepLabelStyle}>Paso {step} de 4 · {steps[step - 1].label}</div>

        <div style={cardStyle}>
          <label style={labelStyle}>¿A quién le regalamos?</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              placeholder="Buscar por username"
              value={formData.celebrantUsername}
              onChange={(e) => setFormData(prev => ({ ...prev, celebrantUsername: e.target.value }))}
              style={inputStyle}
            />
            <button
              onClick={handleSearchCelebrant}
              style={{
                ...buttonStyle('primary'),
                padding: '12px 16px',
                whiteSpace: 'nowrap',
              }}
            >
              Buscar
            </button>
          </div>

          {celebrant && (
            <div style={{
              background: C.primaryLight,
              borderRadius: 12,
              padding: 14,
              marginTop: 14,
              border: `1px solid ${C.primary}`,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>
                ✓ {celebrant.full_name}
              </div>
              <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 2 }}>
                @{celebrant.username} · Cumple en {daysUntil} días
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={() => handleTabChange('inicio')}
            style={{ ...buttonStyle('secondary') }}
          >
            Cancelar
          </button>
          <button
            onClick={() => setStep(2)}
            disabled={!celebrant}
            style={{
              ...buttonStyle('primary'),
              opacity: !celebrant ? 0.5 : 1,
              cursor: !celebrant ? 'not-allowed' : 'pointer',
            }}
          >
            Siguiente →
          </button>
        </div>
      </div>
    );
  }

  // PASO 2: Definir regalo
  if (step === 2) {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setStep(1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ArrowLeft size={18} color={C.ink} />
          </button>
          <h1 style={{ ...titleStyle, margin: 0 }}>Organizar cumpleaños</h1>
        </div>

        <div style={progressStyle}>
          {steps.map((s) => (
            <div
              key={s.num}
              style={progressBarStyle(s.num === step, s.num < step)}
            />
          ))}
        </div>

        <div style={stepLabelStyle}>Paso {step} de 4 · {steps[step - 1].label}</div>

        <div style={cardStyle}>
          <label style={labelStyle}>Tipo de regalo</label>
          <div
            onClick={() => setFormData(prev => ({ ...prev, giftType: 'plata' }))}
            style={{
              ...optionStyle(formData.giftType === 'plata'),
            }}
          >
            <span style={{ fontSize: 24 }}>💰</span>
            <div>
              <div style={{ fontWeight: 700, color: C.ink }}>Plata</div>
              <div style={{ fontSize: 11, color: C.inkMuted }}>Se acredita a su MP</div>
            </div>
          </div>
          <div
            onClick={() => setFormData(prev => ({ ...prev, giftType: 'producto' }))}
            style={optionStyle(formData.giftType === 'producto')}
          >
            <span style={{ fontSize: 24 }}>🎁</span>
            <div>
              <div style={{ fontWeight: 700, color: C.ink }}>Producto</div>
              <div style={{ fontSize: 11, color: C.inkMuted }}>Link o descripción</div>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Título del regalo</label>
            <input
              type="text"
              placeholder="Ej: Para el cumple de Sofia"
              value={formData.giftTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, giftTitle: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Meta total</label>
            <input
              type="number"
              value={formData.targetAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: C.inkMuted, marginTop: 4 }}>
              Lo que querés juntar entre todos
            </div>
          </div>

          <label style={labelStyle}>Modo</label>
          <div
            onClick={() => setFormData(prev => ({ ...prev, giftMode: 'sorpresa' }))}
            style={optionStyle(formData.giftMode === 'sorpresa')}
          >
            <span style={{ fontSize: 20 }}>🎉</span>
            <div>
              <div style={{ fontWeight: 700, color: C.ink }}>Sorpresa</div>
              <div style={{ fontSize: 11, color: C.inkMuted }}>No se entera hasta el día</div>
            </div>
          </div>
          <div
            onClick={() => setFormData(prev => ({ ...prev, giftMode: 'consultado' }))}
            style={optionStyle(formData.giftMode === 'consultado')}
          >
            <span style={{ fontSize: 20 }}>💬</span>
            <div>
              <div style={{ fontWeight: 700, color: C.ink }}>Consultado</div>
              <div style={{ fontSize: 11, color: C.inkMuted }}>Le preguntamos qué quiere</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => setStep(1)} style={{ ...buttonStyle('secondary') }}>
            ‹ Atrás
          </button>
          <button onClick={() => setStep(3)} style={{ ...buttonStyle('primary') }}>
            Siguiente →
          </button>
        </div>
      </div>
    );
  }

  // PASO 3: Resumen
  if (step === 3) {
    return (
      <div style={containerStyle}>
        <h1 style={titleStyle}>Resumen del regalo</h1>
        <div style={progressStyle}>
          {steps.map((s) => (
            <div key={s.num} style={progressBarStyle(s.num === step, s.num < step)} />
          ))}
        </div>

        <div style={stepLabelStyle}>Paso {step} de 4 · {steps[step - 1].label}</div>

        <div style={cardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <div style={labelStyle}>Para quién</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>
                {celebrant?.full_name}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Cumple en</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>
                {daysUntil} días
              </div>
            </div>
            <div>
              <div style={labelStyle}>Tipo</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>
                {formData.giftType === 'plata' ? '💰 Plata' : '🎁 Producto'}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Meta</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>
                ${parseInt(formData.targetAmount).toLocaleString('es-AR')}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={labelStyle}>Título</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>
                {formData.giftTitle}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: C.primaryLight,
          borderRadius: 12,
          padding: 14,
          border: `1px solid ${C.primary}`,
          fontSize: 12,
          color: C.primary,
          fontWeight: 600,
        }}>
          ✓ Todo listo. Clickeá "Crear evento" para que otros amigos puedan sumarse.
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={() => setStep(2)} style={{ ...buttonStyle('secondary') }}>
            ‹ Atrás
          </button>
          <button
            onClick={handleCreateEvent}
            disabled={loading}
            style={{
              ...buttonStyle('primary'),
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '⏳ Creando...' : '✓ Crear evento'}
          </button>
        </div>
      </div>
    );
  }

  // PASO 4: ¡Listo!
  if (step === 4) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: isMobile ? 20 : 40 }}>
          <div style={{
            width: isMobile ? 100 : 140,
            height: isMobile ? 100 : 140,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.success}, #059669)`,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? 48 : 64,
            margin: '0 auto 20px',
            fontWeight: 900,
          }}>
            ✓
          </div>

          <h1 style={{ ...titleStyle, marginBottom: 8 }}>¡Evento creado!</h1>
          <p style={{ fontSize: 14, color: C.inkMuted, marginBottom: 20 }}>
            Ya podés compartir el link para que otros amigos se sumen
          </p>

          <div style={{
            background: 'white',
            borderRadius: 14,
            padding: 16,
            border: `1px solid ${C.border}`,
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.inkMuted, textTransform: 'uppercase' }}>
              Link para compartir
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.primary, marginTop: 6, wordBreak: 'break-all' }}>
              cumpleanitos.com/event/xyz123
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => handleTabChange('detalle-evento')}
              style={{ ...buttonStyle('primary') }}
            >
              Ver evento
            </button>
            <button
              onClick={() => handleTabChange('inicio')}
              style={{ ...buttonStyle('secondary') }}
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }
}

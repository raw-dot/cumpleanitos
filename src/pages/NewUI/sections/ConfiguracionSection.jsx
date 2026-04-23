import React, { useState } from 'react';
import { C } from '../theme';
import { supabase } from '../../../supabaseClient';

export default function ConfiguracionSection({ profile, session, isMobile, handleTabChange }) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    birthday: profile?.birthday || '',
    phone: profile?.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;

    try {
      setSaving(true);
      setMessage('');

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          username: formData.username,
          birthday: formData.birthday,
          phone: formData.phone,
        })
        .eq('id', session.user.id);

      if (error) throw error;

      setMessage('✓ Cambios guardados exitosamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
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

  const subtitleStyle = {
    fontSize: isMobile ? 13 : 15,
    color: C.inkMuted,
    margin: '0 0 24px',
  };

  const sectionStyle = {
    background: 'white',
    borderRadius: 16,
    padding: 20,
    border: `1px solid ${C.border}`,
    marginBottom: 16,
  };

  const fieldStyle = {
    marginBottom: 14,
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
    padding: isMobile ? '12px 16px' : '12px 24px',
    borderRadius: 10,
    border: 'none',
    background: variant === 'primary' ? C.primary : 'white',
    color: variant === 'primary' ? 'white' : C.ink,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    borderBottom: variant === 'primary' ? 'none' : `1px solid ${C.border}`,
    width: variant === 'primary' ? '100%' : 'auto',
  });

  const menuStyle = {
    background: 'white',
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    overflow: 'hidden',
    marginBottom: 16,
  };

  const menuItemStyle = {
    padding: 16,
    borderBottom: `1px solid ${C.borderSoft}`,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    color: C.ink,
  };

  const menuItemLastStyle = {
    ...menuItemStyle,
    borderBottom: 'none',
  };

  const dangerStyle = {
    color: C.danger,
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Configuración</h1>
      <p style={subtitleStyle}>Tu cuenta y preferencias</p>

      {/* Profile Picture Placeholder */}
      <div style={sectionStyle}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              background: C.primaryLight,
              color: C.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              margin: '0 auto 14px',
            }}
          >
            📷
          </div>
          <button style={{ ...buttonStyle('secondary'), width: 'auto' }}>
            📸 Cambiar foto
          </button>
        </div>
      </div>

      {/* Datos personales */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, marginBottom: 14 }}>
          Datos personales
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Nombre completo</label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            style={inputStyle}
            placeholder="Tu nombre"
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Username</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            style={inputStyle}
            placeholder="tu_usuario"
          />
          {formData.username && (
            <div style={{ fontSize: 11, color: C.inkMuted, marginTop: 4 }}>
              cumpleanitos.com/u/{formData.username}
            </div>
          )}
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Fecha de cumpleaños</label>
          <input
            type="date"
            value={formData.birthday}
            onChange={(e) => handleChange('birthday', e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Teléfono</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            style={inputStyle}
            placeholder="+54 9 11 ..."
          />
        </div>
      </div>

      {/* Seguridad */}
      <div style={{ ...menuStyle, marginBottom: 16 }}>
        <div style={menuItemStyle}>🔑 Cambiar contraseña</div>
        <div style={menuItemStyle}>🔒 Privacidad y seguridad</div>
        <div style={menuItemStyle}>🔔 Notificaciones</div>
        <div style={{ ...menuItemLastStyle, ...dangerStyle }}>
          🗑️ Eliminar cuenta
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: message.includes('✓') ? '#DCFCE7' : '#FEE2E2',
            color: message.includes('✓') ? C.success : C.danger,
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 14,
            textAlign: 'center',
          }}
        >
          {message}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10, justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
        <button
          style={{
            ...buttonStyle('secondary'),
            flex: isMobile ? 1 : 'auto',
          }}
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            ...buttonStyle('primary'),
            flex: isMobile ? 1 : 'auto',
            opacity: saving ? 0.7 : 1,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? '⏳ Guardando...' : '💾 Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

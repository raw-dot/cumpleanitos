import React, { useState, useEffect } from 'react';
import { Copy, Share2, Mail, MessageCircle } from 'lucide-react';
import { C } from '../theme';
import MenuMiCumple from '../components/MenuMiCumple';

export default function CompartirLinkSection({ profile, session, isMobile, handleTabChange }) {
  const [copied, setCopied] = useState(false);

  const getProfileUrl = () => {
    if (!profile?.username) return '';
    return `${window.location.origin}/u/${profile.username}`;
  };

  const profileUrl = getProfileUrl();
  const shareText = `🎉 ¡Soy ${profile?.full_name || 'RAW'}! Mirá mi cumple y regalame algo 🎁 ${profileUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform) => {
    let url = '';
    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        break;
      case 'instagram':
        // Instagram no soporta URL schemes en web, muestra instrucciones
        alert('Copia el link y pegalo en tu story o bio de Instagram');
        return;
      case 'email':
        url = `mailto:?subject=¡Mirá mi cumpleaños!&body=${encodeURIComponent(shareText)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        break;
      default:
        return;
    }
    window.open(url, '_blank');
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

  const cardStyle = {
    background: 'white',
    borderRadius: 18,
    padding: isMobile ? 20 : 28,
    border: `1px solid ${C.border}`,
    marginBottom: 20,
  };

  const linkBoxStyle = {
    background: C.primaryLight,
    borderRadius: 14,
    padding: isMobile ? 14 : 18,
    border: `1px solid ${C.primary}`,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  };

  const linkTextStyle = {
    flex: 1,
    fontSize: isMobile ? 13 : 14,
    fontWeight: 600,
    color: C.primary,
    wordBreak: 'break-all',
  };

  const buttonStyle = (bgColor) => ({
    padding: isMobile ? '11px 16px' : '12px 20px',
    borderRadius: 10,
    border: 'none',
    background: bgColor,
    color: bgColor === 'white' ? C.ink : 'white',
    fontWeight: 600,
    fontSize: isMobile ? 12 : 13,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
  });

  const shareGridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
    gap: 10,
    marginBottom: 20,
  };

  const shareButtonStyle = (color) => ({
    padding: isMobile ? 14 : 18,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    background: 'white',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    fontSize: isMobile ? 11 : 12,
    fontWeight: 600,
    color: C.ink,
  });

  const sectionTitleStyle = {
    fontSize: isMobile ? 15 : 18,
    fontWeight: 800,
    color: C.ink,
    marginBottom: 14,
  };

  return (
    <div style={containerStyle}>
      <MenuMiCumple 
        activeTab="compartir" 
        onNavigate={handleTabChange} 
        isMobile={isMobile} 
      />
      <h1 style={titleStyle}>Compartí tu regalo</h1>
      <p style={subtitleStyle}>
        Tus amigos van a poder regalarte sin necesidad de registrarse
      </p>

      {/* Tu link */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>Tu link de regalo</div>
        <div style={linkBoxStyle}>
          <div style={linkTextStyle}>{profileUrl}</div>
          <button
            onClick={handleCopy}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: C.primary,
              padding: 0,
              flexShrink: 0,
            }}
          >
            <Copy size={18} />
          </button>
        </div>
        <button
          onClick={handleCopy}
          style={{
            ...buttonStyle(C.primary),
            width: '100%',
          }}
        >
          {copied ? '✓ Copiado!' : '📋 Copiar link'}
        </button>
      </div>

      {/* Share buttons */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>Compartir en</div>
        <div style={shareGridStyle}>
          <button
            onClick={() => handleShare('whatsapp')}
            style={shareButtonStyle('#25D366')}
          >
            <span style={{ fontSize: 24 }}>💬</span>
            WhatsApp
          </button>
          <button
            onClick={() => handleShare('instagram')}
            style={shareButtonStyle('#E4405F')}
          >
            <span style={{ fontSize: 24 }}>📸</span>
            Instagram
          </button>
          <button
            onClick={() => handleShare('email')}
            style={shareButtonStyle('#EA4335')}
          >
            <span style={{ fontSize: 24 }}>📧</span>
            Email
          </button>
          <button
            onClick={() => handleShare('twitter')}
            style={shareButtonStyle('#1DA1F2')}
          >
            <span style={{ fontSize: 24 }}>𝕏</span>
            Twitter
          </button>
        </div>
      </div>

      {/* Preview */}
      {!isMobile && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Así lo ven tus amigos</div>
          <div
            style={{
              background: C.bg,
              borderRadius: 12,
              padding: 18,
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{
              fontSize: 16,
              fontWeight: 800,
              color: C.ink,
              marginBottom: 6,
            }}>
              🎉 {profile?.full_name || 'RAW'} cumple en breve
            </div>
            <div style={{
              fontSize: 12,
              color: C.inkMuted,
              marginBottom: 12,
            }}>
              Sumáte a la colecta de regalos · {profile?.username && `cumpleanitos.com/u/${profile.username}`}
            </div>
            <div style={{
              display: 'flex',
              gap: 8,
            }}>
              <button
                style={{
                  ...buttonStyle(C.primary),
                }}
              >
                <Gift size={14} /> Regalar
              </button>
              <button
                style={{
                  ...buttonStyle('white'),
                  borderColor: C.border,
                }}
              >
                Ver más
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div
        style={{
          background: C.accentLight,
          borderRadius: 12,
          padding: 16,
          border: `1px solid ${C.accent}`,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: C.accent, marginBottom: 8 }}>
          💡 Consejo
        </div>
        <div style={{ fontSize: 12, color: C.inkMuted, lineHeight: 1.6 }}>
          Compartir en WhatsApp y Instagram te da más visibilidad. Pedile a tus amigos que reenvíen a otros 🚀
        </div>
      </div>
    </div>
  );
}

function Gift({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <polygon points="12 2 15.09 10.26 24 12.75 17.18 19.64 18.91 28.91 12 24.27 5.09 28.91 6.82 19.64 0 12.75 8.91 10.26 12 2"></polygon>
    </svg>
  );
}

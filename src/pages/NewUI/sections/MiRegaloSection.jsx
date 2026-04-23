import React, { useState, useEffect } from 'react';
import { ArrowLeft, Share2, Edit } from 'lucide-react';
import { C, formatCurrency, calcDaysUntil } from '../theme';
import { supabase } from '../../../supabaseClient';

export default function MiRegaloSection({ profile, session, isMobile, handleTabChange }) {
  const [campaign, setCampaign] = useState(null);
  const [item, setItem] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', precio: '', imagen_url: '', item_url: '' });
  const [saving, setSaving] = useState(false);

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
          supabase.from('gift_items').select('*').eq('campaign_id', camp.id).order('created_at').limit(1),
          supabase.from('contributions').select('*, profiles:user_id(username, full_name)').eq('campaign_id', camp.id).order('created_at', { ascending: false }),
        ]);

        if (itemsData && itemsData.length > 0) setItem(itemsData[0]);
        if (contribData) setContributions(contribData);
      }
    } catch (err) {
      console.error('Error loading mi regalo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const url = `${window.location.origin}/u/${profile?.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveRegalo = async () => {
    if (!campaign || !formData.nombre.trim()) return;

    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('gift_items')
        .insert({
          campaign_id: campaign.id,
          name: formData.nombre,
          description: formData.descripcion,
          price: formData.precio ? parseFloat(formData.precio) : null,
          image_url: formData.imagen_url,
          item_url: formData.item_url,
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setItem(data[0]);
        setFormData({ nombre: '', descripcion: '', precio: '', imagen_url: '', item_url: '' });
      }
    } catch (err) {
      console.error('Error saving regalo:', err);
      alert('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: isMobile ? '16px 20px' : 0 }}><p style={{ color: C.inkMuted }}>Cargando...</p></div>;
  }

  // SIN REGALO CARGADO - MOSTRAR FORMULARIO
  if (!item) {
    return (
      <div style={{ padding: isMobile ? '16px 20px 20px' : 0 }}>
        <button
          onClick={() => handleTabChange('micumple')}
          style={{
            background: 'none', border: 'none', color: C.primary,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16,
          }}>
          <ArrowLeft size={16} /> Volver a Mi cumple
        </button>

        <h1 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 800, color: C.ink, marginBottom: 8 }}>
          Cargá tu regalo
        </h1>
        <p style={{ fontSize: isMobile ? 13 : 15, color: C.inkMuted, marginBottom: 24 }}>
          Completá los datos de lo que querés que te regalen
        </p>

        {/* Formulario */}
        <div style={{
          background: 'white', borderRadius: 16, padding: 20, border: `1px solid ${C.border}`,
          maxWidth: 500,
        }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.inkMuted, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
              Nombre del regalo *
            </label>
            <input
              type="text"
              placeholder="Ej: Motor eléctrico"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: `1px solid ${C.border}`,
                fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.inkMuted, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
              Descripción
            </label>
            <textarea
              placeholder="Ej: Es para el corazón del Heart, con batería incluida"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: `1px solid ${C.border}`,
                fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
                minHeight: 80, resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.inkMuted, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
              Precio estimado
            </label>
            <input
              type="number"
              placeholder="Ej: 20000000"
              value={formData.precio}
              onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: `1px solid ${C.border}`,
                fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.inkMuted, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
              URL de imagen
            </label>
            <input
              type="url"
              placeholder="https://ejemplo.com/imagen.jpg"
              value={formData.imagen_url}
              onChange={(e) => setFormData({ ...formData, imagen_url: e.target.value })}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: `1px solid ${C.border}`,
                fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.inkMuted, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
              Link a MercadoLibre (opcional)
            </label>
            <input
              type="url"
              placeholder="https://www.mercadolibre.com.ar/..."
              value={formData.item_url}
              onChange={(e) => setFormData({ ...formData, item_url: e.target.value })}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: `1px solid ${C.border}`,
                fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            onClick={handleSaveRegalo}
            disabled={!formData.nombre.trim() || saving}
            style={{
              width: '100%', padding: '12px', borderRadius: 12, border: 'none',
              background: formData.nombre.trim() ? C.primary : C.borderSoft,
              color: 'white', fontWeight: 700, fontSize: 14,
              cursor: formData.nombre.trim() ? 'pointer' : 'not-allowed',
              opacity: saving ? 0.7 : 1,
            }}>
            {saving ? '⏳ Cargando...' : '✓ Cargar mi regalo'}
          </button>
        </div>
      </div>
    );
  }

  // CON REGALO CARGADO - MOSTRAR DETALLE
  const totalRaised = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const price = parseFloat(item.price) || 0;
  const progressPct = price > 0 ? Math.min(100, (totalRaised / price) * 100) : 0;
  const uniqueContributors = new Set(contributions.map(c => c.user_id).filter(Boolean)).size;
  const daysLeft = calcDaysUntil(profile?.birthday);
  const shareUrl = `${window.location.origin}/u/${profile?.username}`;

  return (
    <div style={{ padding: isMobile ? '16px 20px 20px' : 0 }}>
      <button
        onClick={() => handleTabChange('micumple')}
        style={{
          background: 'none', border: 'none', color: C.inkMuted,
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16,
        }}>
        <ArrowLeft size={16} /> Volver a Mi cumple
      </button>

      <h1 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 800, color: C.ink, margin: '0 0 6px' }}>
        Mi regalo
      </h1>
      <p style={{ fontSize: isMobile ? 13 : 15, color: C.inkMuted, marginBottom: 20 }}>
        {item.name} · {daysLeft !== null ? `Faltan ${daysLeft} días` : ''}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: 20 }}>
        <div>
          {/* Hero */}
          <div style={{
            background: 'white', borderRadius: isMobile ? 20 : 24,
            border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: 20,
          }}>
            {item.image_url && (
              <img src={item.image_url} alt={item.name} style={{ width: '100%', aspectRatio: '16 / 10', objectFit: 'cover', display: 'block' }} />
            )}
            <div style={{ padding: isMobile ? 20 : 28 }}>
              <h2 style={{ fontSize: isMobile ? 20 : 28, fontWeight: 800, color: C.ink, letterSpacing: -0.5, marginBottom: 8 }}>
                {item.name}
              </h2>
              {item.description && (
                <p style={{ fontSize: isMobile ? 13 : 14, color: C.inkSoft, lineHeight: 1.5, marginBottom: 16 }}>
                  {item.description}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#10B981', letterSpacing: -0.6 }}>
                  {formatCurrency(totalRaised)}
                </span>
                <span style={{ fontSize: 12, color: C.inkMuted, fontWeight: 600 }}>
                  de {formatCurrency(price)} · {Math.round(progressPct)}%
                </span>
              </div>
              <div style={{ height: isMobile ? 8 : 10, background: C.borderSoft, borderRadius: 5, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ width: `${progressPct}%`, height: '100%', background: `linear-gradient(90deg, ${C.primary}, ${C.accent})` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.inkMuted, fontWeight: 600 }}>
                <span>{uniqueContributors} aportante{uniqueContributors !== 1 ? 's' : ''}</span>
                <span>Falta {formatCurrency(price - totalRaised)}</span>
              </div>

              {/* Stats mini */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.borderSoft}` }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.ink, letterSpacing: -0.4 }}>{contributions.length}</div>
                  <div style={{ fontSize: 10, color: C.inkMuted, fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>Aportes</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.ink, letterSpacing: -0.4 }}>{Math.round(progressPct)}%</div>
                  <div style={{ fontSize: 10, color: C.inkMuted, fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>Completo</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.accent, letterSpacing: -0.4 }}>{daysLeft !== null ? daysLeft : '?'}</div>
                  <div style={{ fontSize: 10, color: C.inkMuted, fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>Días</div>
                </div>
              </div>

              {!isMobile && (
                <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                  <button style={{
                    flex: 1, padding: '12px 22px', borderRadius: 12, border: 'none',
                    background: C.primary, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  }}>
                    <Share2 size={16} style={{ marginRight: 6 }} /> Compartir
                  </button>
                  <button style={{
                    padding: '12px 22px', borderRadius: 12, border: `1px solid ${C.border}`,
                    background: 'white', color: C.ink, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  }}>
                    <Edit size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Link compartible mobile */}
          {isMobile && (
            <div style={{
              background: C.primaryLight, border: `1px solid ${C.primary}`,
              borderRadius: 14, padding: 14, marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: C.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shareUrl}
              </div>
              <button
                onClick={handleCopy}
                style={{
                  background: C.primary, color: 'white', border: 'none',
                  padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                {copied ? '✓' : 'Copiar'}
              </button>
            </div>
          )}

          {/* Aportes */}
          <h3 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: C.ink, letterSpacing: -0.4, marginBottom: 12 }}>
            Quiénes aportaron 💝
          </h3>

          {contributions.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 16, padding: 24, textAlign: 'center', border: `1px dashed ${C.border}` }}>
              <p style={{ fontSize: 14, color: C.inkMuted }}>Aún no hay aportes</p>
            </div>
          ) : (
            contributions.map((contrib, idx) => (
              <AporteCard key={contrib.id} contrib={contrib} isMobile={isMobile} idx={idx} />
            ))
          )}
        </div>

        {/* SIDEBAR desktop */}
        {!isMobile && (
          <div>
            <SideCard title="🔗 Link para compartir">
              <div style={{ background: C.primaryLight, borderRadius: 10, padding: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: C.primary, fontWeight: 600, wordBreak: 'break-all' }}>{shareUrl}</div>
              </div>
              <button
                onClick={handleCopy}
                style={{
                  width: '100%', padding: '11px 16px', borderRadius: 10, border: 'none',
                  background: C.primary, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}>
                {copied ? '✓ Copiado!' : 'Copiar link'}
              </button>
            </SideCard>

            <SideCard title="📊 Progreso">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <StatMini value={uniqueContributors} label="Aportantes" />
                <StatMini value={`${Math.round(progressPct)}%`} label="Completo" color="#10B981" />
              </div>
            </SideCard>
          </div>
        )}
      </div>
    </div>
  );
}

function AporteCard({ contrib, isMobile, idx }) {
  const colors = ['#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];
  const color = colors[idx % colors.length];
  const name = contrib.profiles?.full_name || contrib.profiles?.username || 'Anónimo';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div style={{
      background: 'white', border: `1px solid ${C.border}`,
      borderRadius: 14, padding: isMobile ? 14 : 18, marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: isMobile ? 40 : 48, height: isMobile ? 40 : 48,
          borderRadius: isMobile ? 20 : 24, background: color, color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: isMobile ? 14 : 16, flexShrink: 0,
        }}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: C.ink }}>{name}</div>
          <div style={{ fontSize: isMobile ? 11 : 12, color: C.inkMuted }}>
            {new Date(contrib.created_at).toLocaleDateString('es-AR')}
          </div>
        </div>
        <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: '#10B981' }}>
          {formatCurrency(contrib.amount)}
        </div>
      </div>
      {contrib.message && (
        <div style={{
          background: C.bg, borderRadius: 10, padding: 10, marginTop: 10,
          fontSize: isMobile ? 12 : 13, fontStyle: 'italic', color: C.inkSoft,
        }}>
          "{contrib.message}"
        </div>
      )}
    </div>
  );
}

function SideCard({ title, children }) {
  return (
    <div style={{
      background: 'white', borderRadius: 18, border: `1px solid ${C.border}`,
      padding: 22, marginBottom: 14,
    }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, letterSpacing: -0.2, marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function StatMini({ value, label, color }) {
  return (
    <div>
      <div style={{ fontSize: 24, fontWeight: 800, color: color || C.ink, letterSpacing: -0.5 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: C.inkMuted, fontWeight: 600, textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}

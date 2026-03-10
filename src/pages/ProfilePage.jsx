import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  COLORS, Button, Card, Avatar, Badge, Input, Textarea, Alert,
  ProgressBar,
  getInitials, formatMoney, formatBirthday, daysUntilBirthday,
} from "../shared";

const PRESET_AMOUNTS = [200, 500, 1050, 2000, 5000];

export default function ProfilePage({ username, campaignId, currentSession, currentProfile }) {
  const [profile, setProfile] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [items, setItems] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showContributeForm, setShowContributeForm] = useState(false);
  const [preSelectedItem, setPreSelectedItem] = useState(null);
  const [form, setForm] = useState({ amount: "", name: "", message: "", anonymous: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Pre-fill form with logged-in user data when component mounts or session changes
  useEffect(() => {
    if (currentSession && currentProfile) {
      setForm(p => ({ ...p, name: currentProfile?.name || currentSession.user.email }));
    }
  }, [currentSession, currentProfile]);

  const totalRaised = contributions.reduce((s, c) => s + (c.amount || 0), 0);
  const days = profile?.birthday ? daysUntilBirthday(profile.birthday) : campaign?.birthday_date ? daysUntilBirthday(campaign.birthday_date) : null;

  useEffect(() => { loadData(); }, [username, campaignId]);

  // Real-time subscription for new contributions
  useEffect(() => {
    if (!campaign?.id) return;
    const channel = supabase
      .channel(`contributions-${campaign.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contributions', filter: `campaign_id=eq.${campaign.id}` }, (payload) => {
        setContributions(prev => {
          // add new contribution if not already present
          if (prev.find(c => c.id === payload.new.id)) return prev;
          return [payload.new, ...prev];
        });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [campaign?.id]);

  const loadData = async () => {
    setLoading(true);
    let camp = null;
    let prof = null;

    if (campaignId) {
      const { data } = await supabase.from("gift_campaigns").select("*").eq("id", campaignId).single();
      camp = data;
      if (camp?.birthday_person_id) {
        const { data: p } = await supabase.from("profiles").select("*").eq("id", camp.birthday_person_id).single();
        prof = p;
      }
    } else if (username) {
      const { data: p } = await supabase.from("profiles").select("*").eq("username", username).single();
      prof = p;
      if (p) {
        const { data: c } = await supabase.from("gift_campaigns").select("*").eq("birthday_person_id", p.id).eq("status", "active").order("created_at", { ascending: false }).limit(1).single();
        camp = c;
      }
    }

    setProfile(prof);
    setCampaign(camp);

    if (camp) {
      const [{ data: itemsData }, { data: contribData }] = await Promise.all([
        supabase.from("gift_items").select("*").eq("campaign_id", camp.id).order("created_at"),
        supabase.from("contributions").select("*").eq("campaign_id", camp.id).order("created_at", { ascending: false }),
      ]);
      if (itemsData) setItems(itemsData);
      if (contribData) setContributions(contribData);
    }
    setLoading(false);
  };

  const openContributeForItem = (item) => {
    setPreSelectedItem(item);
    setForm(p => ({ ...p, amount: item.price?.toString() || "" }));
    setShowContributeForm(true);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareText = profile
      ? `¡Ayudame a juntar para mi regalo de cumpleaños! 🎁🎂`
      : `¡Mirá este regalo de cumpleaños!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign?.title || 'Regalo de cumpleaños',
          text: shareText,
          url: url,
        });
      } catch (e) {
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('¡Link copiado al portapapeles! 🔗');
      setTimeout(() => setSuccess(''), 3000);
    }).catch(() => {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setSuccess('¡Link copiado! 🔗');
      setTimeout(() => setSuccess(''), 3000);
    });
  };

  const submitContribution = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) { setError("Ingresá un monto válido"); return; }
    if (!form.name && !form.anonymous) { setError("Ingresá tu nombre o marcá la opción anónimo"); return; }

    setSubmitting(true);
    setError("");

    const amount = parseFloat(form.amount);
    // If logged in and not anonymous, use logged-in user's name; otherwise use form name
    const gifterName = form.anonymous ? null : (currentSession ? (currentProfile?.name || currentSession.user.email) : form.name);
    const { error: err } = await supabase.from("contributions").insert({
      campaign_id: campaign.id,
      gifter_id: currentSession?.user?.id || null,
      gifter_name: gifterName,
      amount: amount,
      message: form.message || null,
      is_anonymous: form.anonymous,
    });

    setSubmitting(false);
    if (err) { setError("Error al registrar el regalo. Intentá de nuevo."); return; }

    // Reload contributions
    const { data: contribData } = await supabase.from("contributions").select("*").eq("campaign_id", campaign.id).order("created_at", { ascending: false });
    if (contribData) setContributions(contribData);

    setShowContributeForm(false);
    setPreSelectedItem(null);
    setForm({ amount: "", name: "", message: "", anonymous: false });
    setSuccess(`¡Gracias por tu regalo! 🎉 Ahora hacé la transferencia de ${formatMoney(amount)} al alias: ${profile?.payment_alias || "pendiente de confirmar"}`);
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 80, color: COLORS.textLight }}>Cargando perfil...</div>;
  }

  if (!profile && !campaign) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>😕</div>
        <h2 style={{ margin: "0 0 8px" }}>Perfil no encontrado</h2>
        <p style={{ color: COLORS.textLight }}>El usuario o regalo que buscás no existe.</p>
      </div>
    );
  }

  const displayName = profile?.name || campaign?.birthday_person_name || "Cumpleañero";
  const isToday = days === "¡Hoy!";
  const isSoon = typeof days === "number" && days <= 7;

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: COLORS.bg, minHeight: "100vh" }}>
      {/* ── SUCCESS ALERT ── */}
      {success && (
        <div style={{ background: COLORS.success, color: "#fff", padding: "20px", textAlign: "center", fontWeight: 600, borderBottom: `1px solid ${COLORS.success}CC` }}>
          ✓ {success}
        </div>
      )}

      {/* ── HERO SECTION ── */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.primary}20 0%, ${COLORS.accent}15 100%)`,
        padding: "40px 20px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          {isToday ? (
            <div style={{ fontSize: 80, marginBottom: 16 }}>🥳</div>
          ) : (
            <Avatar initials={profile ? getInitials(profile.name) : "🎂"} size={80} />
          )}
          <h1 style={{ margin: "20px 0 8px", fontSize: 36, fontWeight: 900, color: COLORS.text }}>{displayName}</h1>
          <p style={{ margin: "0 0 16px", color: COLORS.textLight, fontSize: 16 }}>
            Cumpleaños el {formatBirthday(profile?.birthday || campaign?.birthday_date || "")}
          </p>
          {isToday ? (
            <Badge color={COLORS.accent} style={{ display: "inline-block" }}>🎉 ¡Hoy es su cumple!</Badge>
          ) : (
            <Badge color={COLORS.primary} style={{ display: "inline-block" }}>
              {typeof days === "number" ? `Faltan ${days} días` : days}
            </Badge>
          )}
          <div style={{ marginTop: 24 }}>
            <Button size="lg" onClick={() => setShowContributeForm(true)}>
              🎁 Aportar para el regalo
            </Button>
          </div>
          {/* Share button */}
          <div style={{ marginTop: 12 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
            >
              🔗 Compartir regalo
            </Button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px 60px" }}>
        {/* ── EL REGALO SECTION ── */}
        {campaign ? (
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24, color: COLORS.text }}>El regalo 🎁</h2>

            {campaign.image_url && (
              <div style={{
                marginBottom: 24,
                borderRadius: 16,
                overflow: "hidden",
                width: "100%",
                maxWidth: "100%",
                background: COLORS.border,
                aspectRatio: "16/9",
                position: "relative",
              }}>
                <img
                  src={campaign.image_url}
                  alt={campaign.title}
                  style={{
                    position: "absolute",
                    top: 0, left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    borderRadius: 16,
                  }}
                />
              </div>
            )}

            <h3 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 12px", color: COLORS.text }}>{campaign.title}</h3>

            <p style={{ fontSize: 16, color: COLORS.textLight, margin: "0 0 24px", lineHeight: 1.6 }}>
              Queremos juntar <strong style={{ color: COLORS.primary, fontWeight: 700 }}>{formatMoney(campaign.goal_amount)}</strong>
            </p>

            <ProgressBar value={totalRaised} max={campaign.goal_amount || 1} />

            <div style={{ display: "flex", gap: 20, margin: "16px 0 24px", flexWrap: "wrap", fontSize: 14 }}>
              <div>
                <div style={{ fontWeight: 700, color: COLORS.success, fontSize: 18 }}>{formatMoney(totalRaised)}</div>
                <div style={{ color: COLORS.textLight, fontSize: 12 }}>recaudados</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{contributions.length}</div>
                <div style={{ color: COLORS.textLight, fontSize: 12 }}>aportantes</div>
              </div>
            </div>

            {campaign.description && (
              <Card style={{ background: COLORS.card, padding: 20, marginBottom: 24 }}>
                <p style={{ margin: 0, color: COLORS.text, lineHeight: 1.7, fontSize: 15 }}>{campaign.description}</p>
              </Card>
            )}

            {campaign.product_link && (
              <Card style={{ background: COLORS.bg, padding: 16, marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 24 }}>🔗</span>
                <Button variant="outline" size="sm" onClick={() => window.open(campaign.product_link, "_blank")} style={{ marginLeft: "auto" }}>
                  Ver producto →
                </Button>
              </Card>
            )}
          </div>
        ) : (
          <Card style={{ textAlign: "center", padding: 40, marginBottom: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎁</div>
            <p style={{ color: COLORS.textLight }}>Este usuario todavía no tiene un regalo activo.</p>
          </Card>
        )}

        {/* ── APORTAR SECTION (INLINE FORM) ── */}
        {campaign && (
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: COLORS.text }}>Aportar para el regalo</h2>
            <p style={{ color: COLORS.textLight, marginBottom: 24 }}>Montos sugeridos</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              {PRESET_AMOUNTS.map(amount => (
                <button
                  key={amount}
                  onClick={() => {
                    setForm(p => ({ ...p, amount: amount.toString() }));
                    setPreSelectedItem(null);
                  }}
                  style={{
                    padding: "16px 20px",
                    borderRadius: 12,
                    border: "none",
                    background: form.amount === amount.toString() ? COLORS.primary : COLORS.card,
                    color: form.amount === amount.toString() ? "#fff" : COLORS.text,
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    textAlign: "center",
                  }}
                  onMouseEnter={e => {
                    if (form.amount !== amount.toString()) {
                      e.currentTarget.style.background = COLORS.border;
                    }
                  }}
                  onMouseLeave={e => {
                    if (form.amount !== amount.toString()) {
                      e.currentTarget.style.background = COLORS.card;
                    }
                  }}
                >
                  DAR {formatMoney(amount)}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 8 }}>O ingresá otro monto</label>
              <Input
                type="number"
                value={form.amount}
                onChange={v => setForm(p => ({ ...p, amount: v }))}
                placeholder="Monto en ARS"
                min="1"
              />
            </div>

            {!form.anonymous && !currentSession && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 8 }}>Tu nombre</label>
                <Input value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Nombre completo" />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 8 }}>Mensaje (opcional)</label>
              <Textarea value={form.message} onChange={v => setForm(p => ({ ...p, message: v }))} placeholder="Escribile algo lindo..." rows={3} />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, marginBottom: 20 }}>
              <input
                type="checkbox"
                checked={form.anonymous}
                onChange={e => setForm(p => ({ ...p, anonymous: e.target.checked }))}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />
              <span>Aportar de forma anónima</span>
            </label>

            {profile?.payment_alias && (
              <Card style={{ background: "#FEFCE8", border: `1px solid #FDE68A`, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 14, color: "#92400E" }}>
                  💳 <strong>Regalá por medio de alias de Mercado Pago:</strong> <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{profile.payment_alias}</span>
                </div>
              </Card>
            )}

            <Alert message={error} type="error" />

            <Button
              size="lg"
              onClick={submitContribution}
              disabled={submitting || !form.amount || (!form.name && !form.anonymous)}
              style={{ width: "100%" }}
            >
              {submitting ? "Procesando..." : "Confirmar regalo 🎁"}
            </Button>
          </div>
        )}

        {/* ── QUIENES REGALARON SECTION ── */}
        {contributions.length > 0 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20, color: COLORS.text }}>Quiénes regalaron 💝</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {contributions.map(c => (
                <Card key={c.id} style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar initials={c.is_anonymous ? "💝" : getInitials(c.gifter_name || "?")} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text }}>
                      {c.is_anonymous ? "Alguien especial 💝" : (c.gifter_name || "Anónimo")}
                    </div>
                    {c.message && (
                      <div style={{ fontSize: 13, color: COLORS.textLight, marginTop: 4, fontStyle: "italic" }}>"{c.message}"</div>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, color: COLORS.success, fontSize: 15 }}>{formatMoney(c.amount)}</div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  COLORS, Button, Card, Avatar, Badge, Input, Textarea, Alert,
  ProgressBar, Modal,
  getInitials, formatMoney, formatBirthday, daysUntilBirthday,
} from "../shared";

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

export default function ProfilePage({ username, campaignId, currentSession }) {
  const [profile, setProfile] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [items, setItems] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showContribute, setShowContribute] = useState(false);
  const [preSelectedItem, setPreSelectedItem] = useState(null);
  const [form, setForm] = useState({ amount: "", name: "", message: "", anonymous: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const totalRaised = contributions.reduce((s, c) => s + (c.amount || 0), 0);
  const days = profile?.birthday ? daysUntilBirthday(profile.birthday) : campaign?.birthday_date ? daysUntilBirthday(campaign.birthday_date) : null;

  useEffect(() => { loadData(); }, [username, campaignId]);

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
    setShowContribute(true);
  };

  const submitContribution = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) { setError("Ingresá un monto válido"); return; }
    if (!form.name && !form.anonymous) { setError("Ingresá tu nombre o marcá la opción anónimo"); return; }

    setSubmitting(true);
    setError("");

    const { error: err } = await supabase.from("contributions").insert({
      campaign_id: campaign.id,
      gifter_id: currentSession?.user?.id || null,
      gifter_name: form.anonymous ? null : form.name,
      amount: parseFloat(form.amount),
      message: form.message || null,
      is_anonymous: form.anonymous,
    });

    setSubmitting(false);
    if (err) { setError("Error al registrar el regalo. Intentá de nuevo."); return; }

    // Reload contributions
    const { data: contribData } = await supabase.from("contributions").select("*").eq("campaign_id", campaign.id).order("created_at", { ascending: false });
    if (contribData) setContributions(contribData);

    setShowContribute(false);
    setPreSelectedItem(null);
    setForm({ amount: "", name: "", message: "", anonymous: false });
    setSuccess(`¡Gracias por tu regalo! 🎉 Ahora transferí ${formatMoney(parseFloat(form.amount))} al alias: ${profile?.payment_alias || "pendiente de confirmar"}`);
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 80, color: COLORS.textLight }}>Cargando perfil...</div>;
  }

  if (!profile && !campaign) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>😕</div>
        <h2 style={{ margin: "0 0 8px" }}>Perfil no encontrado</h2>
        <p style={{ color: COLORS.textLight }}>El usuario o campaña que buscás no existe.</p>
      </div>
    );
  }

  const displayName = profile?.name || campaign?.birthday_person_name || "Cumpleañero";
  const isToday = days === "¡Hoy!";
  const isSoon = typeof days === "number" && days <= 7;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px" }}>
      {success && (
        <Card style={{ background: COLORS.successLight, border: `1px solid #6EE7B7`, marginBottom: 20, padding: 20 }}>
          <div style={{ fontSize: 16, color: "#065F46" }}>{success}</div>
        </Card>
      )}

      {/* ── Profile Header ── */}
      <Card style={{ padding: 36, marginBottom: 24, textAlign: "center", background: `linear-gradient(180deg, ${COLORS.primary}10 0%, transparent 100%)` }}>
        {isToday ? (
          <div style={{ fontSize: 56, marginBottom: 12 }}>🥳</div>
        ) : (
          <Avatar initials={profile ? getInitials(profile.name) : "🎂"} size={96} />
        )}
        <h1 style={{ margin: "16px 0 4px", fontSize: 30, fontWeight: 800 }}>{displayName}</h1>
        {profile?.username && <p style={{ margin: "0 0 12px", color: COLORS.textLight }}>@{profile.username}</p>}
        {profile?.bio && (
          <p style={{ margin: "0 0 16px", color: COLORS.text, fontStyle: "italic", maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
            "{profile.bio}"
          </p>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {profile?.birthday && (
            <Badge color={COLORS.primary}>
              🎂 Cumple: {formatBirthday(profile.birthday)}
            </Badge>
          )}
          {isToday && <Badge color={COLORS.accent}>🎉 ¡HOY ES SU CUMPLE!</Badge>}
          {isSoon && !isToday && <Badge color={COLORS.error}>⚡ ¡Faltan solo {days} días!</Badge>}
        </div>
      </Card>

      {/* ── Campaign ── */}
      {campaign ? (
        <Card style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>{campaign.title}</h2>
          {campaign.description && (
            <p style={{ margin: "0 0 24px", color: COLORS.textLight, lineHeight: 1.6 }}>{campaign.description}</p>
          )}

          <ProgressBar value={totalRaised} max={campaign.goal_amount || 1} />

          <div style={{ display: "flex", gap: 28, margin: "24px 0", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.success }}>{formatMoney(totalRaised)}</div>
              <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>recaudados</div>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700 }}>{contributions.length}</div>
              <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>regaladores</div>
            </div>
            {campaign.goal_amount > 0 && (
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.primary }}>{formatMoney(campaign.goal_amount)}</div>
                <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>meta</div>
              </div>
            )}
          </div>

          <Button size="lg" style={{ width: "100%" }} onClick={() => setShowContribute(true)}>
            🎁 Regalar ahora
          </Button>

          {profile?.payment_alias && (
            <div style={{ marginTop: 16, padding: "12px 16px", background: COLORS.bg, borderRadius: 12, fontSize: 14, color: COLORS.textLight, border: `1px solid ${COLORS.border}` }}>
              💳 Transferí al alias: <strong style={{ color: COLORS.text }}>{profile.payment_alias}</strong>
            </div>
          )}
        </Card>
      ) : (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎁</div>
          <p style={{ color: COLORS.textLight }}>Este usuario todavía no tiene una campaña activa.</p>
        </Card>
      )}

      {/* ── Wishlist ── */}
      {items.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Lista de deseos 🎁</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
            {items.map(item => (
              <Card key={item.id} style={{ padding: 20 }}>
                {item.is_fulfilled && (
                  <Badge color={COLORS.success} style={{ marginBottom: 8 }}>✓ Ya regalado</Badge>
                )}
                <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>{item.name}</h4>
                {item.description && <p style={{ margin: "0 0 8px", fontSize: 13, color: COLORS.textLight }}>{item.description}</p>}
                {item.price && (
                  <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.primary, marginBottom: 12 }}>{formatMoney(item.price)}</div>
                )}
                {!item.is_fulfilled && campaign && (
                  <Button size="sm" style={{ width: "100%" }} onClick={() => openContributeForItem(item)}>
                    Regalar este
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Contributors ── */}
      {contributions.length > 0 && (
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Quiénes ya regalaron 💝</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {contributions.slice(0, 12).map(c => (
              <Card key={c.id} style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar initials={c.is_anonymous ? "💝" : getInitials(c.gifter_name || "?")} size={44} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    {c.is_anonymous ? "Alguien especial 💝" : (c.gifter_name || "Anónimo")}
                  </div>
                  {c.message && (
                    <div style={{ fontSize: 13, color: COLORS.textLight, fontStyle: "italic", marginTop: 2 }}>"{c.message}"</div>
                  )}
                </div>
                <div style={{ fontWeight: 700, color: COLORS.success, fontSize: 17 }}>{formatMoney(c.amount)}</div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Contribute Modal ── */}
      {showContribute && (
        <Modal title={preSelectedItem ? `Regalar: ${preSelectedItem.name}` : "Hacé tu regalo 🎁"} onClose={() => { setShowContribute(false); setError(""); setPreSelectedItem(null); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {preSelectedItem && (
              <div style={{ padding: 12, background: COLORS.primaryLight + "15", borderRadius: 10, fontSize: 14 }}>
                🎁 {preSelectedItem.name}{preSelectedItem.price ? ` · ${formatMoney(preSelectedItem.price)}` : ""}
              </div>
            )}

            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 8 }}>Monto a regalar *</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                {PRESET_AMOUNTS.map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, amount: a.toString() }))}
                    style={{ padding: "8px 14px", borderRadius: 10, border: `2px solid ${form.amount === a.toString() ? COLORS.primary : COLORS.border}`, background: form.amount === a.toString() ? COLORS.primary + "12" : "transparent", color: form.amount === a.toString() ? COLORS.primary : COLORS.text, cursor: "pointer", fontWeight: 600, fontSize: 13 }}
                  >
                    {formatMoney(a)}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                value={form.amount}
                onChange={v => setForm(p => ({ ...p, amount: v }))}
                placeholder="O ingresá otro monto en ARS"
                min="1"
              />
            </div>

            {!form.anonymous && (
              <div>
                <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Tu nombre *</label>
                <Input value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Ej: Juan García" />
              </div>
            )}

            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Mensaje para el cumpleañero (opcional)</label>
              <Textarea value={form.message} onChange={v => setForm(p => ({ ...p, message: v }))} placeholder="Escribile algo lindo para su cumple..." rows={3} />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14 }}>
              <input type="checkbox" checked={form.anonymous} onChange={e => setForm(p => ({ ...p, anonymous: e.target.checked }))} style={{ width: 18, height: 18 }} />
              Regalar de forma anónima
            </label>

            <Alert message={error} type="error" />

            {profile?.payment_alias && (
              <div style={{ padding: "12px 14px", background: "#FEFCE8", border: "1px solid #FDE68A", borderRadius: 10, fontSize: 13 }}>
                ℹ️ <strong>Importante:</strong> Después de confirmar, realizá la transferencia por el monto indicado al alias: <strong>{profile.payment_alias}</strong>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <Button
                onClick={submitContribution}
                disabled={submitting || !form.amount || (!form.name && !form.anonymous)}
                style={{ flex: 1 }}
              >
                {submitting ? "Procesando..." : "¡Confirmar regalo!"}
              </Button>
              <Button variant="secondary" onClick={() => { setShowContribute(false); setError(""); setPreSelectedItem(null); }} style={{ flex: 1 }}>
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  COLORS, Button, Card, Avatar, Badge, Input, Textarea, Alert,
  ProgressBar, Modal, StatCard,
  getInitials, formatMoney, formatBirthday, daysUntilBirthday,
} from "../shared";
import CelebrantDashboard from "./CelebrantDashboard";

export default function ManagerDashboard({ profile, session, onNavigate }) {
  const [view, setView] = useState("campaigns"); // "campaigns" | "my-birthday" | "campaign-detail"
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignContributions, setCampaignContributions] = useState({});
  const [campaignItems, setCampaignItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [createForm, setCreateForm] = useState({
    birthday_person_name: "",
    title: "",
    description: "",
    birthday_date: "",
    goal_amount: "",
  });
  const [newItem, setNewItem] = useState({ name: "", description: "", price: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, [session?.user?.id]);

  const showMsg = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3500); };

  const loadData = async () => {
    if (!session?.user?.id) return;
    setLoading(true);

    const { data: camps } = await supabase
      .from("gift_campaigns")
      .select("*")
      .eq("created_by", session.user.id)
      .order("created_at", { ascending: false });

    if (camps) {
      setCampaigns(camps);

      // Load contributions and items counts for each campaign
      await Promise.all(camps.map(async (camp) => {
        const [{ data: contribs }, { data: itms }] = await Promise.all([
          supabase.from("contributions").select("amount").eq("campaign_id", camp.id),
          supabase.from("gift_items").select("id").eq("campaign_id", camp.id),
        ]);
        const total = contribs?.reduce((s, c) => s + (c.amount || 0), 0) || 0;
        setCampaignContributions(prev => ({ ...prev, [camp.id]: total }));
        setCampaignItems(prev => ({ ...prev, [camp.id]: itms?.length || 0 }));
      }));
    }
    setLoading(false);
  };

  const loadCampaignDetail = async (campaign) => {
    const [{ data: contribs }, { data: itms }] = await Promise.all([
      supabase.from("contributions").select("*").eq("campaign_id", campaign.id).order("created_at", { ascending: false }),
      supabase.from("gift_items").select("*").eq("campaign_id", campaign.id).order("created_at"),
    ]);
    setSelectedCampaign({
      ...campaign,
      contributions: contribs || [],
      items: itms || [],
    });
    setView("campaign-detail");
  };

  const createCampaign = async () => {
    if (!createForm.birthday_person_name || !createForm.title || !createForm.birthday_date) {
      setError("Completá nombre del cumpleañero, título y fecha.");
      return;
    }
    setSaving(true);
    setError("");
    const { data, error: err } = await supabase.from("gift_campaigns").insert({
      title: createForm.title,
      description: createForm.description || null,
      created_by: session.user.id,
      goal_amount: parseFloat(createForm.goal_amount) || 0,
      birthday_date: createForm.birthday_date,
      status: "active",
      birthday_person_name: createForm.birthday_person_name,
    }).select().single();

    setSaving(false);
    if (err) { setError(err.message); return; }
    setCampaigns(prev => [data, ...prev]);
    setCampaignContributions(prev => ({ ...prev, [data.id]: 0 }));
    setCampaignItems(prev => ({ ...prev, [data.id]: 0 }));
    setShowCreate(false);
    setCreateForm({ birthday_person_name: "", title: "", description: "", birthday_date: "", goal_amount: "" });
    showMsg("¡Campaña creada exitosamente!");
  };

  const deleteCampaign = async (id) => {
    if (!confirm("¿Eliminar esta campaña? Esta acción no se puede deshacer.")) return;
    await Promise.all([
      supabase.from("gift_items").delete().eq("campaign_id", id),
      supabase.from("contributions").delete().eq("campaign_id", id),
    ]);
    await supabase.from("gift_campaigns").delete().eq("id", id);
    setCampaigns(prev => prev.filter(c => c.id !== id));
    showMsg("Campaña eliminada");
  };

  const addItemToCampaign = async () => {
    if (!newItem.name || !selectedCampaign) return;
    const { data } = await supabase.from("gift_items").insert({
      campaign_id: selectedCampaign.id,
      name: newItem.name,
      description: newItem.description || null,
      price: newItem.price ? parseFloat(newItem.price) : null,
    }).select().single();
    if (data) {
      setSelectedCampaign(prev => ({ ...prev, items: [...(prev.items || []), data] }));
      setNewItem({ name: "", description: "", price: "" });
      setShowAddItem(false);
      showMsg("Item agregado");
    }
  };

  const deleteItemFromCampaign = async (itemId) => {
    await supabase.from("gift_items").delete().eq("id", itemId);
    setSelectedCampaign(prev => ({ ...prev, items: prev.items.filter(i => i.id !== itemId) }));
  };

  const copyLink = (campaign) => {
    navigator.clipboard.writeText(`${window.location.origin}?c=${campaign.id}`);
    showMsg("¡Link copiado!");
  };

  // ── Totals ──
  const totalRaisedAll = campaigns.reduce((s, c) => s + (campaignContributions[c.id] || 0), 0);
  const upcomingCount = campaigns.filter(c => {
    const d = c.birthday_date ? daysUntilBirthday(c.birthday_date) : null;
    return d !== null && (d === "¡Hoy!" || (typeof d === "number" && d <= 30));
  }).length;

  if (loading) {
    return <div style={{ textAlign: "center", padding: 80, color: COLORS.textLight, fontSize: 16 }}>Cargando campañas...</div>;
  }

  // ── CAMPAIGN DETAIL VIEW ──
  if (view === "campaign-detail" && selectedCampaign) {
    const raised = selectedCampaign.contributions?.reduce((s, c) => s + (c.amount || 0), 0) || 0;
    const days = selectedCampaign.birthday_date ? daysUntilBirthday(selectedCampaign.birthday_date) : null;
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px" }}>
        <Alert message={success} type="success" />
        <button
          onClick={() => setView("campaigns")}
          style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.primary, fontSize: 15, fontWeight: 600, marginBottom: 20, display: "flex", alignItems: "center", gap: 6, padding: 0 }}
        >
          ← Volver a mis campañas
        </button>

        <Card style={{ marginBottom: 24, background: `linear-gradient(135deg, #05966910 0%, ${COLORS.primary}08 100%)` }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{selectedCampaign.title}</h2>
                {days !== null && (
                  <Badge color={days === "¡Hoy!" || (typeof days === "number" && days <= 7) ? COLORS.error : COLORS.primary}>
                    {days === "¡Hoy!" ? "¡Hoy es su cumple!" : `${days} días`}
                  </Badge>
                )}
              </div>
              <p style={{ margin: "0 0 8px", color: COLORS.textLight, fontSize: 14 }}>
                🎂 {selectedCampaign.birthday_person_name}
                {selectedCampaign.birthday_date && ` · ${formatBirthday(selectedCampaign.birthday_date)}`}
              </p>
              {selectedCampaign.description && (
                <p style={{ margin: "8px 0 0", color: COLORS.text, fontSize: 14 }}>{selectedCampaign.description}</p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => copyLink(selectedCampaign)}>🔗 Copiar link</Button>
          </div>
          <div style={{ marginTop: 24 }}>
            <ProgressBar value={raised} max={selectedCampaign.goal_amount || 1} color={COLORS.manager} />
          </div>
        </Card>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 24 }}>
          <StatCard icon="💰" value={formatMoney(raised)} label="Recaudado" color={COLORS.success} />
          <StatCard icon="💝" value={selectedCampaign.contributions?.length || 0} label="Contribuciones" color={COLORS.primary} />
          <StatCard icon="🎁" value={selectedCampaign.items?.length || 0} label="Items en lista" color={COLORS.accent} />
        </div>

        {/* Items (wishlist) */}
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Lista de regalos</h3>
            <Button size="sm" onClick={() => setShowAddItem(true)}>+ Agregar</Button>
          </div>
          {(selectedCampaign.items || []).length === 0 ? (
            <p style={{ color: COLORS.textLight, fontSize: 14, textAlign: "center", padding: "20px 0" }}>
              No hay items en la lista. Agregá regalos que le gustarían al cumpleañero.
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {selectedCampaign.items.map(item => (
                <div key={item.id} style={{ padding: "14px 16px", background: COLORS.bg, borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.name}</div>
                  {item.description && <div style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 6 }}>{item.description}</div>}
                  {item.price && <div style={{ fontWeight: 700, color: COLORS.primary, fontSize: 15 }}>{formatMoney(item.price)}</div>}
                  <button onClick={() => deleteItemFromCampaign(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.error, fontSize: 12, padding: "6px 0 0", fontWeight: 500 }}>Eliminar</button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Contributions */}
        <Card>
          <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700 }}>Contribuciones recibidas</h3>
          {(selectedCampaign.contributions || []).length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: COLORS.textLight }}>
              Aún no hay contribuciones. Compartí el link para que se enteren.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {selectedCampaign.contributions.map(c => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: COLORS.bg, borderRadius: 12 }}>
                  <Avatar initials={c.is_anonymous ? "🎁" : getInitials(c.gifter_name || "?")} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.is_anonymous ? "Anónimo 💝" : (c.gifter_name || "Sin nombre")}</div>
                    {c.message && <div style={{ fontSize: 12, color: COLORS.textLight, fontStyle: "italic" }}>"{c.message}"</div>}
                  </div>
                  <div style={{ fontWeight: 700, color: COLORS.success, fontSize: 16 }}>{formatMoney(c.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Modal: Add Item */}
        {showAddItem && (
          <Modal title="Agregar item a la lista" onClose={() => setShowAddItem(false)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Input value={newItem.name} onChange={v => setNewItem(p => ({ ...p, name: v }))} placeholder="Nombre del regalo *" />
              <Textarea value={newItem.description} onChange={v => setNewItem(p => ({ ...p, description: v }))} placeholder="Descripción, link, marca..." rows={3} />
              <Input type="number" value={newItem.price} onChange={v => setNewItem(p => ({ ...p, price: v }))} placeholder="Precio aproximado (opcional)" min="0" />
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <Button onClick={addItemToCampaign} disabled={!newItem.name} style={{ flex: 1 }}>Agregar</Button>
                <Button variant="secondary" onClick={() => setShowAddItem(false)} style={{ flex: 1 }}>Cancelar</Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // ── MY BIRTHDAY VIEW ──
  if (view === "my-birthday") {
    return (
      <div>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 0" }}>
          <div style={{ display: "flex", gap: 0, marginBottom: 0, borderBottom: `2px solid ${COLORS.border}` }}>
            {[
              { id: "campaigns", label: "🎁 Mis Campañas" },
              { id: "my-birthday", label: "🎂 Mi Cumpleaños" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                style={{ padding: "12px 24px", background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: view === tab.id ? 700 : 500, color: view === tab.id ? COLORS.primary : COLORS.textLight, borderBottom: `2px solid ${view === tab.id ? COLORS.primary : "transparent"}`, marginBottom: -2, whiteSpace: "nowrap" }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <CelebrantDashboard profile={profile} session={session} />
      </div>
    );
  }

  // ── MAIN CAMPAIGNS VIEW ──
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 20px" }}>
      <Alert message={success} type="success" />
      <Alert message={error} type="error" />

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: `2px solid ${COLORS.border}` }}>
        {[
          { id: "campaigns", label: "🎁 Mis Campañas" },
          { id: "my-birthday", label: "🎂 Mi Cumpleaños" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            style={{ padding: "12px 24px", background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: view === tab.id ? 700 : 500, color: view === tab.id ? COLORS.primary : COLORS.textLight, borderBottom: `2px solid ${view === tab.id ? COLORS.primary : "transparent"}`, marginBottom: -2, whiteSpace: "nowrap" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Header ── */}
      <Card style={{ padding: 32, marginBottom: 24, background: `linear-gradient(135deg, #05966910 0%, ${COLORS.primary}08 100%)` }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          <Avatar initials={getInitials(profile?.name)} size={80} bg={`linear-gradient(135deg, #34D399, #059669)`} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{profile?.name}</h2>
              <Badge color={COLORS.manager}>🎁 Gestor de Regalos</Badge>
            </div>
            <p style={{ margin: "0 0 10px", color: COLORS.textLight, fontSize: 14 }}>@{profile?.username}</p>
            <p style={{ margin: 0, fontSize: 14, color: COLORS.text }}>
              Gestionás <strong>{campaigns.length}</strong> campaña{campaigns.length !== 1 ? "s" : ""} ·{" "}
              <strong style={{ color: COLORS.success }}>{formatMoney(totalRaisedAll)}</strong> recaudados en total
            </p>
          </div>
          <Button variant="manager" onClick={() => setShowCreate(true)}>+ Nueva campaña</Button>
        </div>
      </Card>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard icon="🎁" value={campaigns.length} label="Campañas activas" color={COLORS.manager} />
        <StatCard icon="💰" value={formatMoney(totalRaisedAll)} label="Total recaudado" color={COLORS.success} />
        <StatCard icon="🎂" value={upcomingCount} label="Cumples próximos" color={COLORS.accent} />
      </div>

      {/* ── Campaign list ── */}
      <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>Campañas que gestionás</h3>

      {campaigns.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 64 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎁</div>
          <h3 style={{ margin: "0 0 8px", fontSize: 20 }}>No gestionás ninguna campaña</h3>
          <p style={{ color: COLORS.textLight, marginBottom: 24 }}>
            Creá tu primera campaña para organizar el regalo de cumpleaños de un amigo
          </p>
          <Button variant="manager" size="lg" onClick={() => setShowCreate(true)}>
            Crear primera campaña
          </Button>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {campaigns.map(camp => {
            const raised = campaignContributions[camp.id] || 0;
            const itemCount = campaignItems[camp.id] || 0;
            const days = camp.birthday_date ? daysUntilBirthday(camp.birthday_date) : null;
            const isUrgent = days === "¡Hoy!" || (typeof days === "number" && days <= 7);
            return (
              <Card
                key={camp.id}
                onClick={() => loadCampaignDetail(camp)}
                style={{ padding: 24, cursor: "pointer", borderLeft: isUrgent ? `4px solid ${COLORS.error}` : `4px solid ${COLORS.manager}` }}
              >
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${COLORS.accent}40, ${COLORS.primary}30)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🎂</div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 17 }}>{camp.title}</span>
                      {days !== null && (
                        <Badge color={isUrgent ? COLORS.error : COLORS.primary}>
                          {days === "¡Hoy!" ? "¡Hoy!" : `${days} días`}
                        </Badge>
                      )}
                    </div>
                    <p style={{ margin: "0 0 10px", fontSize: 13, color: COLORS.textLight }}>
                      🎂 {camp.birthday_person_name}
                      {camp.birthday_date && ` · ${formatBirthday(camp.birthday_date)}`}
                    </p>
                    <ProgressBar value={raised} max={camp.goal_amount || 1} color={COLORS.manager} />
                    <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, color: COLORS.textLight }}>💰 {formatMoney(raised)} recaudados</span>
                      <span style={{ fontSize: 13, color: COLORS.textLight }}>🎁 {itemCount} items</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }} onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="outline" onClick={() => copyLink(camp)}>🔗 Link</Button>
                    <Button size="sm" variant="ghost" style={{ color: COLORS.error }} onClick={() => deleteCampaign(camp.id)}>Eliminar</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Modal: Crear Campaña ── */}
      {showCreate && (
        <Modal title="Nueva campaña de regalo 🎁" onClose={() => { setShowCreate(false); setError(""); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Nombre del cumpleañero *</label>
              <Input value={createForm.birthday_person_name} onChange={v => setCreateForm(p => ({ ...p, birthday_person_name: v }))} placeholder="Ej: María García" />
            </div>
            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Título de la campaña *</label>
              <Input value={createForm.title} onChange={v => setCreateForm(p => ({ ...p, title: v }))} placeholder="Ej: Regalos para el cumple de María 🎂" />
            </div>
            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Fecha de cumpleaños *</label>
              <Input type="date" value={createForm.birthday_date} onChange={v => setCreateForm(p => ({ ...p, birthday_date: v }))} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Descripción (opcional)</label>
              <Textarea value={createForm.description} onChange={v => setCreateForm(p => ({ ...p, description: v }))} placeholder="Contale a los amigos qué tiene en mente el cumpleañero, qué le gusta, etc." rows={3} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Meta de recaudación en ARS (opcional)</label>
              <Input type="number" value={createForm.goal_amount} onChange={v => setCreateForm(p => ({ ...p, goal_amount: v }))} placeholder="Ej: 25000" min="0" />
            </div>
            <Alert message={error} type="error" />
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <Button variant="manager" onClick={createCampaign} style={{ flex: 1 }} disabled={saving}>
                {saving ? "Creando..." : "Crear campaña"}
              </Button>
              <Button variant="secondary" onClick={() => { setShowCreate(false); setError(""); }} style={{ flex: 1 }}>Cancelar</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

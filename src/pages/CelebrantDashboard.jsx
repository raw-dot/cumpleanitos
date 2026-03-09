import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  COLORS, Button, Card, Avatar, Badge, Input, Textarea, Alert,
  ProgressBar, Modal, Tabs, StatCard,
  getInitials, formatMoney, formatBirthday, daysUntilBirthday,
} from "../shared";

export default function CelebrantDashboard({ profile, session }) {
  const [activeTab, setActiveTab] = useState("campaign");
  const [campaign, setCampaign] = useState(null);
  const [items, setItems] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showEditCampaign, setShowEditCampaign] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", description: "", price: "" });
  const [campaignForm, setCampaignForm] = useState({ title: "", description: "", goal_amount: "" });
  const [paymentAlias, setPaymentAlias] = useState(profile?.payment_alias || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const days = daysUntilBirthday(profile?.birthday);
  const totalRaised = contributions.reduce((s, c) => s + (c.amount || 0), 0);

  useEffect(() => { loadData(); }, [session?.user?.id]);

  const loadData = async () => {
    if (!session?.user?.id) return;
    setLoading(true);

    const { data: camp } = await supabase
      .from("gift_campaigns")
      .select("*")
      .eq("birthday_person_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (camp) {
      setCampaign(camp);
      setCampaignForm({ title: camp.title, description: camp.description || "", goal_amount: camp.goal_amount || "" });

      const [{ data: itemsData }, { data: contribData }] = await Promise.all([
        supabase.from("gift_items").select("*").eq("campaign_id", camp.id).order("created_at"),
        supabase.from("contributions").select("*").eq("campaign_id", camp.id).order("created_at", { ascending: false }),
      ]);
      if (itemsData) setItems(itemsData);
      if (contribData) setContributions(contribData);
    }
    setLoading(false);
  };

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const createCampaign = async () => {
    const { data } = await supabase.from("gift_campaigns").insert({
      title: `Regalos para el cumple de ${profile?.name}`,
      description: "¡Hola! Estoy juntando regalitos para mi cumpleaños. ¡Gracias por visitar mi campaña!",
      birthday_person_id: session.user.id,
      created_by: session.user.id,
      goal_amount: 10000,
      birthday_date: profile?.birthday,
      status: "active",
      birthday_person_name: profile?.name,
    }).select().single();
    if (data) { setCampaign(data); showSuccess("¡Campaña creada!"); }
  };

  const saveCampaign = async () => {
    setSaving(true);
    const { data, error: err } = await supabase
      .from("gift_campaigns")
      .update({ title: campaignForm.title, description: campaignForm.description, goal_amount: parseFloat(campaignForm.goal_amount) || 0 })
      .eq("id", campaign.id)
      .select().single();
    setSaving(false);
    if (!err && data) { setCampaign(data); setShowEditCampaign(false); showSuccess("Campaña actualizada"); }
  };

  const addItem = async () => {
    if (!newItem.name) return;
    const { data, error: err } = await supabase.from("gift_items").insert({
      campaign_id: campaign.id,
      name: newItem.name,
      description: newItem.description || null,
      price: newItem.price ? parseFloat(newItem.price) : null,
    }).select().single();
    if (!err && data) {
      setItems(prev => [...prev, data]);
      setNewItem({ name: "", description: "", price: "" });
      setShowAddItem(false);
      showSuccess("Item agregado a tu lista");
    }
  };

  const deleteItem = async (id) => {
    await supabase.from("gift_items").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const saveProfile = async () => {
    setSaving(true);
    await supabase.from("profiles").update({ bio, payment_alias: paymentAlias }).eq("id", session.user.id);
    setSaving(false);
    showSuccess("Perfil actualizado");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}?u=${profile?.username}`);
    showSuccess("¡Link copiado al portapapeles!");
  };

  const tabs = [
    { id: "campaign", label: "Mi Campaña", icon: "🎂" },
    { id: "wishlist", label: `Lista de Deseos (${items.length})`, icon: "🎁" },
    { id: "contributors", label: `Regaladores (${contributions.length})`, icon: "💝" },
    { id: "settings", label: "Configuración", icon: "⚙️" },
  ];

  if (loading) {
    return <div style={{ textAlign: "center", padding: 80, color: COLORS.textLight, fontSize: 16 }}>Cargando tu campaña...</div>;
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>
      <Alert message={success} type="success" />
      <Alert message={error} type="error" />

      {/* ── Profile Header ── */}
      <Card style={{ padding: 32, marginBottom: 24, background: `linear-gradient(135deg, ${COLORS.primary}10 0%, ${COLORS.accent}08 100%)` }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          <Avatar initials={getInitials(profile?.name)} size={80} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{profile?.name}</h2>
              <Badge color={COLORS.primary}>🎂 Cumpleañero</Badge>
            </div>
            <p style={{ margin: "0 0 10px", color: COLORS.textLight, fontSize: 14 }}>@{profile?.username}</p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14 }}>📅 Cumple: {formatBirthday(profile?.birthday)}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: days === "¡Hoy!" ? COLORS.accent : COLORS.primary }}>
                🎉 {days === "¡Hoy!" ? "¡Hoy es tu cumple!" : `${days} días para tu cumple`}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={copyLink}>🔗 Compartir perfil</Button>
        </div>
      </Card>

      {/* ── Tabs ── */}
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* ── TAB: MI CAMPAÑA ── */}
      {activeTab === "campaign" && (
        <div>
          {campaign ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
                <StatCard icon="💰" value={formatMoney(totalRaised)} label="Recaudado" color={COLORS.success} />
                <StatCard icon="💝" value={contributions.length} label="Regaladores" color={COLORS.primary} />
                <StatCard icon="🎁" value={items.length} label="Items en tu lista" color={COLORS.accent} />
                <StatCard icon="📅" value={typeof days === "number" ? days : "¡Hoy!"} label="Días restantes" color={COLORS.error} />
              </div>

              {/* Campaign Card */}
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div style={{ flex: 1, paddingRight: 16 }}>
                    <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>{campaign.title}</h3>
                    <p style={{ margin: 0, color: COLORS.textLight, fontSize: 14, lineHeight: 1.5 }}>{campaign.description}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowEditCampaign(true)}>Editar</Button>
                </div>
                <ProgressBar value={totalRaised} max={campaign.goal_amount || 1} />
              </Card>

              {/* Share Link */}
              <Card style={{ background: "#F0FDF4", border: "1px solid #86EFAC" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 28 }}>🔗</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>Tu link de campaña</div>
                    <div style={{ fontSize: 13, color: COLORS.textLight, wordBreak: "break-all" }}>
                      {window.location.origin}?u={profile?.username}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button variant="success" size="sm" onClick={copyLink}>Copiar</Button>
                    <Button variant="secondary" size="sm" onClick={() => window.open(`https://wa.me/?text=¡Participá de mi cumple! ${window.location.origin}?u=${profile?.username}`, "_blank")}>
                      WhatsApp
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <Card style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎂</div>
              <h3 style={{ margin: "0 0 8px", fontSize: 20 }}>No tenés una campaña activa</h3>
              <p style={{ color: COLORS.textLight, marginBottom: 24 }}>Creá tu campaña para empezar a recibir regalos de cumpleaños</p>
              <Button size="lg" onClick={createCampaign}>Crear mi campaña</Button>
            </Card>
          )}
        </div>
      )}

      {/* ── TAB: LISTA DE DESEOS ── */}
      {activeTab === "wishlist" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Mi lista de deseos</h3>
            {campaign && <Button size="sm" onClick={() => setShowAddItem(true)}>+ Agregar item</Button>}
          </div>

          {!campaign ? (
            <Card style={{ textAlign: "center", padding: 40 }}>
              <p style={{ color: COLORS.textLight }}>Primero creá tu campaña para agregar items a tu lista.</p>
            </Card>
          ) : items.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
              <p style={{ color: COLORS.textLight, marginBottom: 20 }}>Tu lista de deseos está vacía. ¡Agregá los regalos que te gustarían!</p>
              <Button onClick={() => setShowAddItem(true)}>+ Agregar primer item</Button>
            </Card>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {items.map(item => (
                <Card key={item.id} style={{ padding: 20, position: "relative" }}>
                  {item.is_fulfilled && (
                    <Badge color={COLORS.success} style={{ position: "absolute", top: 16, right: 16 }}>✓ Cumplido</Badge>
                  )}
                  <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>{item.name}</h4>
                  {item.description && <p style={{ margin: "0 0 10px", fontSize: 13, color: COLORS.textLight }}>{item.description}</p>}
                  {item.price && (
                    <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.primary, marginBottom: 12 }}>{formatMoney(item.price)}</div>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.error, fontSize: 13, padding: 0, fontWeight: 500 }}
                  >
                    Eliminar
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: REGALADORES ── */}
      {activeTab === "contributors" && (
        <div>
          {contributions.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💝</div>
              <p style={{ color: COLORS.textLight, marginBottom: 20 }}>Todavía nadie regaló. ¡Compartí tu link para que se enteren!</p>
              <Button onClick={copyLink}>🔗 Compartir mi campaña</Button>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 8 }}>
                <StatCard icon="💰" value={formatMoney(totalRaised)} label="Total recaudado" color={COLORS.success} />
                <StatCard icon="💝" value={contributions.length} label="Personas que regalaron" color={COLORS.primary} />
              </div>
              {contributions.map(c => (
                <Card key={c.id} style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
                  <Avatar initials={c.is_anonymous ? "🎁" : getInitials(c.gifter_name || "?")} size={44} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                      {c.is_anonymous ? "Alguien especial 💝" : (c.gifter_name || "Anónimo")}
                    </div>
                    {c.message && <div style={{ fontSize: 13, color: COLORS.textLight, marginTop: 2, fontStyle: "italic" }}>"{c.message}"</div>}
                    <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 4 }}>
                      {new Date(c.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.success }}>{formatMoney(c.amount)}</div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: CONFIGURACIÓN ── */}
      {activeTab === "settings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>💳 Alias de pago</h3>
            <p style={{ color: COLORS.textLight, fontSize: 14, margin: "0 0 14px" }}>
              Configurá tu alias de Mercado Pago, Ualá o banco para que tus amigos puedan transferirte.
            </p>
            <Input
              placeholder="Ej: tu.nombre.mp · CVU · CBU"
              value={paymentAlias}
              onChange={setPaymentAlias}
            />
            <Button style={{ marginTop: 12 }} onClick={saveProfile} disabled={saving}>
              {saving ? "Guardando..." : "Guardar alias"}
            </Button>
          </Card>

          <Card>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>👤 Tu bio</h3>
            <p style={{ color: COLORS.textLight, fontSize: 14, margin: "0 0 14px" }}>
              Contale algo a tus amigos. Aparece en tu perfil público.
            </p>
            <Textarea placeholder="Contá algo sobre vos o qué te gustaría recibir..." value={bio} onChange={setBio} rows={4} />
            <Button style={{ marginTop: 12 }} onClick={saveProfile} disabled={saving}>
              {saving ? "Guardando..." : "Guardar bio"}
            </Button>
          </Card>

          <Card>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>🔗 Compartir campaña</h3>
            <p style={{ color: COLORS.textLight, fontSize: 14, margin: "0 0 14px" }}>
              Compartí este link con tus amigos para que puedan regalarte.
            </p>
            <div style={{ padding: "12px 16px", background: COLORS.bg, borderRadius: 12, fontFamily: "monospace", fontSize: 13, marginBottom: 12, wordBreak: "break-all", border: `1px solid ${COLORS.border}` }}>
              {window.location.origin}?u={profile?.username}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button onClick={copyLink}>📋 Copiar link</Button>
              <Button variant="success" onClick={() => window.open(`https://wa.me/?text=¡Te invito a ver mi campaña de cumpleaños! 🎂 ${window.location.origin}?u=${profile?.username}`, "_blank")}>
                WhatsApp
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Modal: Editar Campaña ── */}
      {showEditCampaign && (
        <Modal title="Editar tu campaña" onClose={() => setShowEditCampaign(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Título</label>
              <Input value={campaignForm.title} onChange={v => setCampaignForm(p => ({ ...p, title: v }))} placeholder="Título de tu campaña" />
            </div>
            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Descripción</label>
              <Textarea value={campaignForm.description} onChange={v => setCampaignForm(p => ({ ...p, description: v }))} placeholder="Contale a tus amigos qué te gustaría recibir..." rows={4} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Meta de recaudación (ARS)</label>
              <Input type="number" value={campaignForm.goal_amount} onChange={v => setCampaignForm(p => ({ ...p, goal_amount: v }))} placeholder="Ej: 15000" min="0" />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <Button onClick={saveCampaign} style={{ flex: 1 }} disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
              <Button variant="secondary" onClick={() => setShowEditCampaign(false)} style={{ flex: 1 }}>Cancelar</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal: Agregar Item ── */}
      {showAddItem && (
        <Modal title="Agregar a tu lista de deseos" onClose={() => setShowAddItem(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Nombre del regalo *</label>
              <Input value={newItem.name} onChange={v => setNewItem(p => ({ ...p, name: v }))} placeholder="Ej: Auriculares Sony WH-1000XM5" />
            </div>
            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Descripción / Link (opcional)</label>
              <Textarea value={newItem.description} onChange={v => setNewItem(p => ({ ...p, description: v }))} placeholder="Marca, modelo, color, link de donde comprarlo..." rows={3} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Precio aproximado en ARS (opcional)</label>
              <Input type="number" value={newItem.price} onChange={v => setNewItem(p => ({ ...p, price: v }))} placeholder="Ej: 25000" min="0" />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <Button onClick={addItem} disabled={!newItem.name} style={{ flex: 1 }}>Agregar item</Button>
              <Button variant="secondary" onClick={() => setShowAddItem(false)} style={{ flex: 1 }}>Cancelar</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

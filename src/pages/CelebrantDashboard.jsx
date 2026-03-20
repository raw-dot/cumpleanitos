import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  COLORS, Button, Card, Avatar, Badge, Input, Textarea, Alert,
  ProgressBar, Modal, Tabs, StatCard,
  getInitials, formatMoney, formatBirthday, daysUntilBirthday,
} from "../shared";

export default function CelebrantDashboard({ profile, session, defaultTab = "campaign", onViewLanding, onCampaignCreated }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [campaigns, setCampaigns] = useState([]);
  const [campaign, setCampaign] = useState(null);
  const [items, setItems] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showEditCampaign, setShowEditCampaign] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", description: "", price: "", item_url: "", image_url: "" });
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemForm, setEditItemForm] = useState({ name: "", description: "", price: "", item_url: "" });
  const [campaignForm, setCampaignForm] = useState({ title: "", description: "", goal_amount: "", image_url: "", product_link: "" });
  const [paymentAlias, setPaymentAlias] = useState(profile?.payment_alias || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageSuggestions, setImageSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const days = daysUntilBirthday(profile?.birthday);
  const totalRaised = contributions.reduce((s, c) => s + (c.amount || 0), 0);

  useEffect(() => { loadData(); }, [session?.user?.id]);

  const loadData = async (selectId = null) => {
    if (!session?.user?.id) return;
    setLoading(true);

    const { data: allCamps } = await supabase
      .from("gift_campaigns")
      .select("*")
      .eq("birthday_person_id", session.user.id)
      .order("created_at", { ascending: false });

    const campList = allCamps || [];
    setCampaigns(campList);

    const camp = selectId ? campList.find(c => c.id === selectId) : campList[0];

    if (camp) {
      setCampaign(camp);
      setCampaignForm({
        title: camp.title,
        description: camp.description || "",
        goal_amount: camp.goal_amount || "",
        image_url: camp.image_url || "",
        product_link: camp.product_link || ""
      });

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
      title: "Mi Regalo",
      description: `¡Hola! Soy ${profile?.name}. Estoy juntando regalitos para mi cumpleaños. ¡Gracias por visitar mi regalo! 🎂`,
      birthday_person_id: session.user.id,
      created_by: session.user.id,
      goal_amount: 10000,
      birthday_date: profile?.birthday,
      status: "active",
      birthday_person_name: profile?.name,
    }).select().single();
    if (data) { setCampaign(data); showSuccess("¡Regalo creado!"); if (onCampaignCreated) onCampaignCreated(); }
  };

  const uploadImage = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop();
    const path = `campaigns/${session.user.id}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from('cumple-images').upload(path, file, { upsert: true });
    if (error) { setError('Error subiendo imagen: ' + error.message); return; }
    const { data: { publicUrl } } = supabase.storage.from('cumple-images').getPublicUrl(path);
    setCampaignForm(prev => ({ ...prev, image_url: publicUrl }));
    showSuccess('Imagen subida!');
  };

  const saveCampaign = async () => {
    setSaving(true);
    const { data, error: err } = await supabase
      .from("gift_campaigns")
      .update({
        title: campaignForm.title,
        description: campaignForm.description,
        goal_amount: parseFloat(campaignForm.goal_amount) || 0,
        image_url: campaignForm.image_url || null,
        product_link: campaignForm.product_link || null,
      })
      .eq("id", campaign.id)
      .select().single();
    setSaving(false);
    if (!err && data) {
      setCampaign(data);
      setShowEditCampaign(false);
      showSuccess("Regalo actualizado");
      onViewLanding?.();
    }
  };

  const addItem = async () => {
    if (!newItem.name) return;
    const { data, error: err } = await supabase.from("gift_items").insert({
      campaign_id: campaign.id,
      name: newItem.name,
      description: newItem.description || null,
      price: newItem.price ? parseFloat(newItem.price) : null,
      item_url: newItem.item_url || null,
      image_url: newItem.image_url || null,
    }).select().single();
    if (!err && data) {
      setItems(prev => [...prev, data]);
      setNewItem({ name: "", description: "", price: "", item_url: "", image_url: "" });
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

  const switchCampaign = (campId) => loadData(campId);

  // Fetch URL metadata for wish items (via Microlink — incluye imagen y precio)
  const fetchItemMeta = async (urlOverride) => {
    const url = urlOverride || newItem.item_url;
    if (!url) return;
    setFetchingMeta(true);
    try {
      // Microlink trae OG tags, precio y screenshots de ML
      const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}&meta=false&screenshot=false`);
      const json = await res.json();
      if (json.status === "success") {
        const d = json.data;

        // Precio: Microlink puede traerlo en price.amount, o parseamos del título
        let price = "";
        if (d.price?.amount) {
          price = String(Math.round(d.price.amount));
        } else if (d.title) {
          // ML incluye el precio en el title: "Producto $ 12.999 - ..."
          const match = d.title.match(/\$\s*([\d.,]+)/);
          if (match) price = match[1].replace(/\./g, "").replace(",", ".");
        }

        // Imagen: OG image o la primera imagen del crawl
        const image = d.image?.url || d.logo?.url || "";

        // Título: limpiar el precio del título de ML si está ahí
        let title = d.title || "";
        title = title.replace(/\s*\$[\s\d.,]+.*$/, "").trim();

        setNewItem(p => ({
          ...p,
          name: p.name || title,
          description: p.description || d.description || "",
          price: p.price || price,
          image_url: p.image_url || image,
        }));
        showSuccess("Datos cargados del link 🎁");
      }
    } catch { /* silently fail */ }
    setFetchingMeta(false);
  };

  // Edit item
  const startEditItem = (item) => {
    setEditingItemId(item.id);
    setEditItemForm({ name: item.name, description: item.description || "", price: item.price ? String(item.price) : "", item_url: item.item_url || "" });
  };

  const saveItem = async (id) => {
    const { data, error: err } = await supabase.from("gift_items").update({
      name: editItemForm.name,
      description: editItemForm.description || null,
      price: editItemForm.price ? parseFloat(editItemForm.price) : null,
      item_url: editItemForm.item_url || null,
    }).eq("id", id).select().single();
    if (!err && data) {
      setItems(prev => prev.map(i => i.id === id ? data : i));
      setEditingItemId(null);
      showSuccess("Item actualizado");
    }
  };

  const fetchImageSuggestions = async () => {
    const keywords = [campaignForm.title, campaignForm.product_link && "product", campaignForm.description]
      .join(' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 3)
      .join(',') || 'regalo,cumpleanos';
    setLoadingSuggestions(true);
    const base = Date.now();
    const suggestions = Array.from({ length: 6 }, (_, i) => ({
      thumb: `https://picsum.photos/seed/${encodeURIComponent(keywords + '-' + (base + i))}/300/200`,
      full:  `https://picsum.photos/seed/${encodeURIComponent(keywords + '-' + (base + i))}/800/600`,
    }));
    setImageSuggestions(suggestions);
    setLoadingSuggestions(false);
  };

  const tabs = [
    { id: "campaign", label: "Mi Regalo", icon: "🎁" },
    { id: "wishlist", label: `Lista de Deseos (${items.length})`, icon: "🎁" },
    { id: "contributors", label: `Regaladores (${contributions.length})`, icon: "💝" },
    { id: "settings", label: "Configuración", icon: "⚙️" },
  ];

  if (loading) {
    return <div style={{ textAlign: "center", padding: 80, color: COLORS.textLight, fontSize: 16 }}>Cargando tu regalo...</div>;
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>
      <Alert message={success} type="success" />
      <Alert message={error} type="error" />

      {/* ── Profile Header ── */}
      <Card style={{ padding: 32, marginBottom: 24, background: `linear-gradient(135deg, ${COLORS.primary}10 0%, ${COLORS.accent}08 100%)` }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="avatar" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "3px solid #fff", boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }} /> : <Avatar initials={getInitials(profile?.name)} size={80} />}
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
          {/* Campaign switcher — only shows if user has multiple campaigns */}
          {campaigns.length > 1 && (
            <Card style={{ padding: "12px 16px", marginBottom: 16, background: "#FFFBEB", border: "1px solid #FDE68A" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 8 }}>🎂 Tus regalos</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {campaigns.map(c => (
                  <button
                    key={c.id}
                    onClick={() => switchCampaign(c.id)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      border: `2px solid ${c.id === campaign?.id ? COLORS.primary : COLORS.border}`,
                      background: c.id === campaign?.id ? COLORS.primary : "#fff",
                      color: c.id === campaign?.id ? "#fff" : COLORS.text,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            </Card>
          )}

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
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <Button variant="ghost" size="sm" onClick={onViewLanding} title="Ver como lo ven tus amigos">👁 Ver</Button>
                    <Button variant="outline" size="sm" onClick={() => setShowEditCampaign(true)}>Editar</Button>
                  </div>
                </div>
                <ProgressBar value={totalRaised} max={campaign.goal_amount || 1} />
                {campaign.goal_amount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.textLight, marginTop: 6 }}>
                    <span style={{ color: COLORS.success, fontWeight: 600 }}>{Math.round((totalRaised / campaign.goal_amount) * 100)}% recaudado</span>
                    <span>Faltan {formatMoney(Math.max(0, campaign.goal_amount - totalRaised))}</span>
                  </div>
                )}
              </Card>

              {/* Share Link */}
              <Card style={{ background: "#F0FDF4", border: "1px solid #86EFAC" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 28 }}>🔗</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>Tu link del regalo</div>
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

              {/* Ver Landing */}
              <Card
                style={{
                  background: `linear-gradient(135deg, ${COLORS.primary}08, ${COLORS.accent}10)`,
                  border: `1px solid ${COLORS.primary}30`,
                  cursor: "pointer",
                }}
                onClick={onViewLanding ? onViewLanding : () => window.open(`${window.location.origin}?u=${profile?.username}`, "_blank")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 32 }}>👁️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>Ver mi landing de regalo</div>
                    <div style={{ fontSize: 13, color: COLORS.textLight }}>Así ven tu regalo tus amigos cuando abren el link</div>
                  </div>
                  <span style={{ fontSize: 20, color: COLORS.primary }}>→</span>
                </div>
              </Card>
            </div>
          ) : (
            <Card style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎂</div>
              <h3 style={{ margin: "0 0 8px", fontSize: 20 }}>No tenés un regalo activo</h3>
              <p style={{ color: COLORS.textLight, marginBottom: 24 }}>Creá tu regalo para empezar a recibir regalos de cumpleaños</p>
              <Button size="lg" onClick={createCampaign}>Crear mi regalo</Button>
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
              <p style={{ color: COLORS.textLight }}>Primero creá tu regalo para agregar items a tu lista.</p>
            </Card>
          ) : items.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
              <p style={{ color: COLORS.textLight, marginBottom: 20 }}>Tu lista de deseos está vacía. ¡Agregá los regalos que te gustarían!</p>
              <Button onClick={() => setShowAddItem(true)}>+ Agregar primer item</Button>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {items.map(item => (
                <Card key={item.id} style={{ padding: 0, overflow: "hidden" }}>
                  {editingItemId === item.id ? (
                    /* ── Inline edit mode ── */
                    <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary, marginBottom: 2 }}>✏️ Editando item</div>
                      <Input value={editItemForm.name} onChange={v => setEditItemForm(p => ({ ...p, name: v }))} placeholder="Nombre del regalo *" />
                      <Input value={editItemForm.item_url} onChange={v => setEditItemForm(p => ({ ...p, item_url: v }))} placeholder="Link del producto (opcional)" />
                      <Input type="number" value={editItemForm.price} onChange={v => setEditItemForm(p => ({ ...p, price: v }))} placeholder="Precio ARS (opcional)" min="0" />
                      <Textarea value={editItemForm.description} onChange={v => setEditItemForm(p => ({ ...p, description: v }))} placeholder="Descripción (opcional)" rows={2} />
                      <div style={{ display: "flex", gap: 8 }}>
                        <Button size="sm" onClick={() => saveItem(item.id)} disabled={!editItemForm.name} style={{ flex: 1 }}>Guardar</Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingItemId(null)} style={{ flex: 1 }}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex" }}>
                      {/* Columna izquierda: precio */}
                      <div style={{
                        background: item.is_fulfilled
                          ? COLORS.successLight
                          : `linear-gradient(160deg, ${COLORS.primary}14, ${COLORS.accent}0A)`,
                        padding: "24px 18px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 110,
                        borderRight: `1px solid ${COLORS.border}`,
                        gap: 6,
                      }}>
                        <span style={{ fontSize: 30 }}>🎁</span>
                        {item.price ? (
                          <div style={{ fontSize: 17, fontWeight: 800, color: item.is_fulfilled ? COLORS.success : COLORS.primary, textAlign: "center" }}>
                            {formatMoney(item.price)}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: COLORS.textLight, textAlign: "center", fontWeight: 500 }}>Precio libre</div>
                        )}
                      </div>

                      {/* Columna derecha: info + acciones */}
                      <div style={{ flex: 1, padding: "18px 22px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: COLORS.text }}>{item.name}</h4>
                              {item.is_fulfilled && <Badge color={COLORS.success}>✓ Ya regalado</Badge>}
                            </div>
                            {item.description && (
                              <p style={{ margin: 0, fontSize: 13, color: COLORS.textLight, lineHeight: 1.5 }}>{item.description}</p>
                            )}
                            {item.item_url && (
                              <a href={item.item_url} target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: 12, color: COLORS.primary, marginTop: 4, display: "inline-block", textDecoration: "none", fontWeight: 600 }}>
                                🔗 Ver producto →
                              </a>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            <button type="button" onClick={() => startEditItem(item)}
                              style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 8, cursor: "pointer", color: COLORS.primary, fontSize: 12, padding: "5px 10px", fontWeight: 600 }}>
                              Editar
                            </button>
                            <button type="button" onClick={() => deleteItem(item.id)}
                              style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 8, cursor: "pointer", color: COLORS.error, fontSize: 12, padding: "5px 10px", fontWeight: 600 }}>
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
              <Button onClick={copyLink}>🔗 Compartir mi regalo</Button>
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
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>🔗 Compartir regalo</h3>
            <p style={{ color: COLORS.textLight, fontSize: 14, margin: "0 0 14px" }}>
              Compartí este link con tus amigos para que puedan regalarte.
            </p>
            <div style={{ padding: "12px 16px", background: COLORS.bg, borderRadius: 12, fontFamily: "monospace", fontSize: 13, marginBottom: 12, wordBreak: "break-all", border: `1px solid ${COLORS.border}` }}>
              {window.location.origin}?u={profile?.username}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button onClick={copyLink}>📋 Copiar link</Button>
              <Button variant="success" onClick={() => window.open(`https://wa.me/?text=¡Te invito a ver mi regalo de cumpleaños! 🎂 ${window.location.origin}?u=${profile?.username}`, "_blank")}>
                WhatsApp
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Modal: Editar Regalo ── */}
      {showEditCampaign && (
        <Modal title="Editar tu regalo" onClose={() => setShowEditCampaign(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Título</label>
              <Input value={campaignForm.title} onChange={v => setCampaignForm(p => ({ ...p, title: v }))} placeholder="Título de tu regalo" />
            </div>
            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Descripción</label>
              <Textarea value={campaignForm.description} onChange={v => setCampaignForm(p => ({ ...p, description: v }))} placeholder="Contale a tus amigos por qué querés este regalo..." rows={4} />
            </div>
            <div>
              <button
                type="button"
                onClick={fetchImageSuggestions}
                disabled={loadingSuggestions}
                style={{
                  padding: "8px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  cursor: loadingSuggestions ? "not-allowed" : "pointer",
                  color: COLORS.text,
                  opacity: loadingSuggestions ? 0.6 : 1,
                }}
              >
                🔍 Sugerir imágenes
              </button>
            </div>
            {loadingSuggestions && (
              <div style={{ fontSize: 13, color: COLORS.textLight }}>Buscando imágenes...</div>
            )}
            {imageSuggestions.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {imageSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setCampaignForm(p => ({ ...p, image_url: suggestion.full }));
                        setImageSuggestions([]);
                      }}
                      style={{
                        width: "100%",
                        height: 90,
                        borderRadius: 8,
                        cursor: "pointer",
                        overflow: "hidden",
                        backgroundImage: `url(${suggestion.thumb})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setImageSuggestions([])}
                  style={{
                    padding: "6px 10px",
                    fontSize: 12,
                    fontWeight: 500,
                    background: "transparent",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 6,
                    cursor: "pointer",
                    color: COLORS.textLight,
                  }}
                >
                  ✕ Cerrar sugerencias
                </button>
              </div>
            )}
            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Meta de recaudación (ARS)</label>
              <Input type="number" value={campaignForm.goal_amount} onChange={v => setCampaignForm(p => ({ ...p, goal_amount: v }))} placeholder="Ej: 15000" min="0" />
            </div>
            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Foto del regalo</label>
              {campaignForm.image_url && (
                <div style={{ marginBottom: 10 }}>
                  <img src={campaignForm.image_url} alt="Preview" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 10 }} />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={e => e.target.files && uploadImage(e.target.files[0])}
                style={{ display: "none" }}
                id="campaign-image-upload"
              />
              <label htmlFor="campaign-image-upload">
                <div style={{ padding: "10px 14px", background: COLORS.bg, borderRadius: 10, border: `1px solid ${COLORS.border}`, cursor: "pointer", textAlign: "center", fontSize: 14, fontWeight: 500, color: COLORS.text }}>
                  📷 Subir foto del regalo
                </div>
              </label>
            </div>
            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Link del producto</label>
              <Input value={campaignForm.product_link} onChange={v => setCampaignForm(p => ({ ...p, product_link: v }))} placeholder="Link de MercadoLibre, tienda, etc." />
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
        <Modal title="Agregar a tu lista de deseos" onClose={() => { setShowAddItem(false); setNewItem({ name: "", description: "", price: "", item_url: "", image_url: "" }); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Step 1: URL first — auto-fetch metadata */}
            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>
                Link del producto <span style={{ fontSize: 11, opacity: 0.7 }}>(pegá el link y hacé clic en "Buscar datos")</span>
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <Input
                  value={newItem.item_url}
                  onChange={v => setNewItem(p => ({ ...p, item_url: v }))}
                  onBlur={() => { if (newItem.item_url && !newItem.name) fetchItemMeta(); }}
                  placeholder="https://www.mercadolibre.com.ar/..."
                />
                <Button size="sm" variant="outline" onClick={() => fetchItemMeta()} disabled={!newItem.item_url || fetchingMeta} style={{ flexShrink: 0 }}>
                  {fetchingMeta ? "⏳" : "🔍"}
                </Button>
              </div>
            </div>
            {newItem.image_url && (
              <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid " + COLORS.border, textAlign: "center", background: "#F9FAFB" }}>
                <img src={newItem.image_url} alt="Preview" style={{ maxHeight: 160, maxWidth: "100%", objectFit: "contain", padding: 8 }} />
              </div>
            )}
            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Nombre del regalo *</label>
              <Input value={newItem.name} onChange={v => setNewItem(p => ({ ...p, name: v }))} placeholder="Ej: Auriculares Sony WH-1000XM5" />
            </div>
            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Descripción (opcional)</label>
              <Textarea value={newItem.description} onChange={v => setNewItem(p => ({ ...p, description: v }))} placeholder="Marca, modelo, color, detalles..." rows={2} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Precio aproximado en ARS (opcional)</label>
              <Input type="number" value={newItem.price} onChange={v => setNewItem(p => ({ ...p, price: v }))} placeholder="Ej: 25000" min="0" />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <Button onClick={addItem} disabled={!newItem.name} style={{ flex: 1 }}>Agregar item</Button>
              <Button variant="secondary" onClick={() => { setShowAddItem(false); setNewItem({ name: "", description: "", price: "", item_url: "", image_url: "" }); }} style={{ flex: 1 }}>Cancelar</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

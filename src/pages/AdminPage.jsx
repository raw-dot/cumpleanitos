import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, Card, Button, Input, Badge, Avatar, getInitials } from "../shared";

const ROLE_LABELS = {
  celebrant: { label: "Cumpleañero", color: "#7C3AED", bg: "#F5F0FF" },
  gifter:    { label: "Regalador",   color: "#10B981", bg: "#F0FDF9" },
  manager:   { label: "Gestor",      color: "#F59E0B", bg: "#FFFBEB" },
};

export default function AdminPage({ profile }) {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [editing, setEditing]   = useState(null); // { id, field, value }
  const [saving, setSaving]     = useState(false);
  const [confirm, setConfirm]   = useState(null); // id a eliminar
  const [stats, setStats]       = useState({ total: 0, withCampaign: 0, newToday: 0 });

  // Guard: solo admin
  if (!profile?.is_admin) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <p style={{ color: COLORS.textLight }}>No tenés permisos para ver esta sección.</p>
        </div>
      </div>
    );
  }

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!profilesData) { setLoading(false); return; }

    // Enriquecer con datos de campaigns
    const { data: campaigns } = await supabase
      .from("gift_campaigns")
      .select("birthday_person_id, status, goal_amount, created_at");

    const campMap = {};
    (campaigns || []).forEach(c => {
      if (!campMap[c.birthday_person_id]) campMap[c.birthday_person_id] = [];
      campMap[c.birthday_person_id].push(c);
    });

    const enriched = profilesData.map(u => ({
      ...u,
      campaigns: campMap[u.id] || [],
    }));

    setUsers(enriched);

    const today = new Date().toISOString().split("T")[0];
    setStats({
      total: enriched.length,
      withCampaign: enriched.filter(u => u.campaigns.length > 0).length,
      newToday: enriched.filter(u => u.created_at?.startsWith(today)).length,
    });

    setLoading(false);
  };

  const filteredUsers = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    );
  });

  const saveField = async (userId, field, value) => {
    setSaving(true);
    await supabase.from("profiles").update({ [field]: value }).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: value } : u));
    setEditing(null);
    setSaving(false);
  };

  const deleteUser = async (userId) => {
    await supabase.from("profiles").delete().eq("id", userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    setConfirm(null);
  };

  const toggleAdmin = async (userId, current) => {
    await supabase.from("profiles").update({ is_admin: !current }).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !current } : u));
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 80px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800 }}>🛡️ Panel de Administración</h1>
          <p style={{ margin: 0, color: COLORS.textLight, fontSize: 14 }}>ABM de usuarios — solo visible para admins</p>
        </div>
        <Button size="sm" variant="outline" onClick={loadUsers}>↻ Actualizar</Button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { icon: "👥", label: "Usuarios totales", value: stats.total, color: COLORS.primary },
          { icon: "🎂", label: "Con regalo cargado", value: stats.withCampaign, color: "#10B981" },
          { icon: "🆕", label: "Nuevos hoy", value: stats.newToday, color: "#F59E0B" },
          { icon: "📊", label: "Sin regalo", value: stats.total - stats.withCampaign, color: "#EF4444" },
        ].map((s, i) => (
          <Card key={i} style={{ padding: "16px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: COLORS.textLight, marginTop: 2 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <Input
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, @username, email o teléfono..."
        />
      </div>

      {/* Tabla */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: COLORS.textLight }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎂</div>Cargando usuarios...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredUsers.length === 0 && (
            <Card style={{ textAlign: "center", padding: 40, color: COLORS.textLight }}>
              No se encontraron usuarios
            </Card>
          )}
          {filteredUsers.map(user => (
            <Card key={user.id} style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>

                {/* Avatar */}
                <div style={{ flexShrink: 0 }}>
                  <Avatar
                    src={user.avatar_url}
                    initials={getInitials(user.name || user.username || "?")}
                    size={48}
                  />
                </div>

                {/* Info principal */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 15, color: COLORS.text }}>
                      {user.name || "Sin nombre"}
                    </span>
                    <span style={{ fontSize: 13, color: COLORS.textLight }}>@{user.username}</span>
                    {user.is_admin && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#FEF3C7", color: "#92400E" }}>
                        👑 admin
                      </span>
                    )}
                    {user.role && ROLE_LABELS[user.role] && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                        background: ROLE_LABELS[user.role].bg, color: ROLE_LABELS[user.role].color }}>
                        {ROLE_LABELS[user.role].label}
                      </span>
                    )}
                  </div>

                  {/* Datos personales */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: "3px 16px", fontSize: 12, color: COLORS.textLight }}>
                    {user.email    && <span>✉️ {user.email}</span>}
                    {user.phone    && <span>📱 {user.phone}</span>}
                    {user.birthday && <span>🎂 {user.birthday} ({user.age} años)</span>}
                    {user.days_to_birthday != null && <span>📅 Cumple en {user.days_to_birthday} días</span>}
                    {user.created_at && <span>🗓 Registrado {new Date(user.created_at).toLocaleDateString("es-AR")}</span>}
                  </div>

                  {/* Campaigns */}
                  <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {user.campaigns.length === 0 ? (
                      <span style={{ fontSize: 11, color: "#EF4444", background: "#FEF2F2", padding: "2px 8px", borderRadius: 10 }}>Sin regalo cargado</span>
                    ) : (
                      user.campaigns.map((c, i) => (
                        <span key={i} style={{ fontSize: 11, color: "#10B981", background: "#F0FDF4", padding: "2px 8px", borderRadius: 10 }}>
                          🎁 {c.status === "active" ? "Regalo activo" : c.status}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setEditing({ id: user.id, field: "role", value: user.role || "celebrant" })}
                    style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#fff", cursor: "pointer", color: COLORS.primary, fontWeight: 600 }}
                  >
                    Rol
                  </button>
                  <button
                    onClick={() => toggleAdmin(user.id, user.is_admin)}
                    style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: user.is_admin ? "#FEF3C7" : "#fff", cursor: "pointer", color: "#92400E", fontWeight: 600 }}
                  >
                    {user.is_admin ? "Quitar admin" : "Hacer admin"}
                  </button>
                  <button
                    onClick={() => setConfirm(user.id)}
                    style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, border: `1px solid #FCA5A5`, background: "#FEF2F2", cursor: "pointer", color: "#EF4444", fontWeight: 600 }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Editor de rol inline */}
              {editing?.id === user.id && editing?.field === "role" && (
                <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: "12px 20px", background: "#FAFAFA", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>Cambiar rol:</span>
                  {Object.entries(ROLE_LABELS).map(([key, r]) => (
                    <button
                      key={key}
                      onClick={() => saveField(user.id, "role", key)}
                      style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: `2px solid ${editing.value === key ? r.color : COLORS.border}`,
                        background: editing.value === key ? r.bg : "#fff", cursor: "pointer", fontWeight: 600, color: r.color }}
                    >
                      {r.label}
                    </button>
                  ))}
                  <button onClick={() => setEditing(null)} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#fff", cursor: "pointer", color: COLORS.textLight }}>
                    Cancelar
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal confirm delete */}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }}>
          <Card style={{ maxWidth: 380, width: "100%", padding: 28, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ margin: "0 0 8px" }}>¿Eliminar usuario?</h3>
            <p style={{ color: COLORS.textLight, fontSize: 14, margin: "0 0 20px" }}>
              Esta acción elimina el perfil. No se puede deshacer.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Button style={{ flex: 1, background: "#EF4444", boxShadow: "none" }} onClick={() => deleteUser(confirm)}>
                Sí, eliminar
              </Button>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => setConfirm(null)}>
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

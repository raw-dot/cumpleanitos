import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, Card, Button, Input, Avatar, getInitials } from "../shared";

const ROLE_LABELS = {
  celebrant: { label: "Cumpleañero", color: "#7C3AED", bg: "#F5F0FF" },
  gifter:    { label: "Regalador",   color: "#10B981", bg: "#F0FDF9" },
  manager:   { label: "Gestor",      color: "#F59E0B", bg: "#FFFBEB" },
};

const Pill = ({ label, color, bg }) => (
  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: bg, color }}>{label}</span>
);

const IcoBtn = ({ title, onClick, style = {}, children }) => (
  <button title={title} onClick={onClick} style={{
    width: 28, height: 28, borderRadius: 7, border: "0.5px solid #E5E7EB",
    background: "#fff", display: "inline-flex", alignItems: "center",
    justifyContent: "center", cursor: "pointer", fontSize: 13, ...style
  }}>{children}</button>
);

// ─── VISTA TABLA ─────────────────────────────────────────────────────────────
function UserTableView({ users, loading, onBack, onRefresh, onEdit }) {
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all");
  const [selected, setSelected] = useState([]);
  const [page, setPage]       = useState(0);
  const PER_PAGE = 10;

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q);
    const matchFilter =
      filter === "all"      ? true :
      filter === "active"   ? u.is_active !== false :
      filter === "nogift"   ? u.campaigns?.length === 0 :
      filter === "admin"    ? u.is_admin :
      filter === "disabled" ? u.is_active === false : true;
    return matchSearch && matchFilter;
  });

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === paged.length ? [] : paged.map(u => u.id));

  const FILTERS = [
    { key: "all", label: "Todos" },
    { key: "active", label: "Activos" },
    { key: "disabled", label: "Deshabilitados" },
    { key: "nogift", label: "Sin regalo" },
    { key: "admin", label: "Admins" },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 20px 80px" }}>
      {/* Breadcrumb */}
      <div onClick={onBack} style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
        ← Modo Administrador &nbsp;/&nbsp; <span style={{ color: COLORS.text, fontWeight: 600 }}>Tabla de usuarios</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 3px" }}>Tabla de usuarios</h1>
          <p style={{ fontSize: 12, color: COLORS.textLight, margin: 0 }}>{filtered.length} usuarios · click en ✏️ para editar</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button size="sm" variant="outline" onClick={onRefresh}>↻ Actualizar</Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <Input value={search} onChange={v => { setSearch(v); setPage(0); }} placeholder="Buscar por nombre, @usuario, email o teléfono..." style={{ flex: 1, minWidth: 200 }} />
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => { setFilter(f.key); setPage(0); setSelected([]); }} style={{
            fontSize: 12, padding: "5px 12px", borderRadius: 20,
            border: `1.5px solid ${filter === f.key ? COLORS.primary : COLORS.border}`,
            background: filter === f.key ? COLORS.primary : "#fff",
            color: filter === f.key ? "#fff" : COLORS.textLight,
            cursor: "pointer", fontWeight: filter === f.key ? 700 : 400,
          }}>{f.label}</button>
        ))}
      </div>

      {/* Acciones en lote */}
      {selected.length > 0 && (
        <div style={{ background: "#EEEDFE", border: "0.5px solid #AFA9EC", borderRadius: 8, padding: "8px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#3C3489", fontWeight: 600 }}>{selected.length} seleccionados</span>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { label: "Deshabilitar", color: "#F59E0B" },
              { label: "Habilitar", color: "#10B981" },
              { label: "Eliminar", color: "#EF4444" },
            ].map(a => (
              <button key={a.label} style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, border: `0.5px solid ${a.color}40`, background: "#fff", color: a.color, cursor: "pointer", fontWeight: 600 }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: COLORS.textLight }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎂</div>Cargando...
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, border: `0.5px solid ${COLORS.border}`, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#FAFAFA" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", borderBottom: `0.5px solid ${COLORS.border}` }}>
                    <input type="checkbox" checked={selected.length === paged.length && paged.length > 0} onChange={toggleAll} />
                  </th>
                  {["Usuario", "Email", "Rol", "Estado", "Regalo", "Registro", "Acciones"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: COLORS.textLight, textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: `0.5px solid ${COLORS.border}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: COLORS.textLight }}>No hay usuarios</td></tr>
                )}
                {paged.map(user => {
                  const isDisabled = user.is_active === false;
                  return (
                    <tr key={user.id} style={{ opacity: isDisabled ? 0.55 : 1, borderBottom: `0.5px solid ${COLORS.border}` }}>
                      <td style={{ padding: "10px 14px" }}>
                        <input type="checkbox" checked={selected.includes(user.id)} onChange={() => toggleSelect(user.id)} />
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#EEEDFE", color: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            {getInitials(user.name || user.username || "?")}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.text, display: "flex", alignItems: "center", gap: 5 }}>
                              {user.name || "Sin nombre"}
                              {user.is_admin && <span style={{ fontSize: 9, background: "#FEF3C7", color: "#633806", padding: "1px 5px", borderRadius: 10, fontWeight: 700 }}>👑</span>}
                            </div>
                            <div style={{ fontSize: 11, color: COLORS.textLight }}>@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {user.email ? (
                          <div>
                            <div style={{ fontSize: 12, color: COLORS.text }}>{user.email}</div>
                            {user.email_verified ? (
                              <div style={{ fontSize: 10, color: "#10B981" }}>✓ Verificado</div>
                            ) : (
                              <div style={{ fontSize: 10, color: "#F59E0B" }}>⊗ Sin verificar</div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: COLORS.textLight, fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {user.role && ROLE_LABELS[user.role]
                          ? <Pill label={ROLE_LABELS[user.role].label} color={ROLE_LABELS[user.role].color} bg={ROLE_LABELS[user.role].bg} />
                          : <span style={{ fontSize: 11, color: COLORS.textLight }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: isDisabled ? "#EF4444" : "#22C55E", display: "inline-block" }} />
                          {isDisabled ? "deshabilitado" : "activo"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {user.campaigns?.length > 0
                          ? <Pill label="activo" color="#166534" bg="#DCFCE7" />
                          : <Pill label="sin regalo" color="#991B1B" bg="#FEF2F2" />}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: COLORS.textLight, whiteSpace: "nowrap" }}>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—"}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <IcoBtn title="Editar" onClick={() => onEdit(user)} style={{ background: "#EEEDFE", borderColor: "#AFA9EC" }}>✏️</IcoBtn>
                          <IcoBtn title={isDisabled ? "Habilitar" : "Deshabilitar"} onClick={() => {}} style={{ background: isDisabled ? "#DCFCE7" : "#FEF2F2", borderColor: isDisabled ? "#9FE1CB" : "#F09595" }}>
                            {isDisabled ? "✓" : "⊘"}
                          </IcoBtn>
                          <IcoBtn title="Eliminar" onClick={() => {}} style={{ background: "#FEF2F2", borderColor: "#F09595" }}>🗑</IcoBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Paginación */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#FAFAFA", borderTop: `0.5px solid ${COLORS.border}`, fontSize: 12, color: COLORS.textLight, flexWrap: "wrap", gap: 8 }}>
            <span>Mostrando {Math.min(page * PER_PAGE + 1, filtered.length)}–{Math.min((page + 1) * PER_PAGE, filtered.length)} de {filtered.length}</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ padding: "4px 10px", borderRadius: 6, border: `0.5px solid ${COLORS.border}`, background: "#fff", cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.4 : 1, fontSize: 12 }}>← Anterior</button>
              {Array.from({ length: pages }, (_, i) => (
                <button key={i} onClick={() => setPage(i)} style={{ padding: "4px 10px", borderRadius: 6, border: `0.5px solid ${i === page ? COLORS.primary : COLORS.border}`, background: i === page ? COLORS.primary : "#fff", color: i === page ? "#fff" : COLORS.text, cursor: "pointer", fontSize: 12, fontWeight: i === page ? 700 : 400 }}>{i + 1}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} style={{ padding: "4px 10px", borderRadius: 6, border: `0.5px solid ${COLORS.border}`, background: "#fff", cursor: page >= pages - 1 ? "default" : "pointer", opacity: page >= pages - 1 ? 0.4 : 1, fontSize: 12 }}>Siguiente →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PANEL DE EDICIÓN INLINE ──────────────────────────────────────────────────
function EditUserPanel({ user, onSave, onCancel, onDelete, saving }) {
  const [form, setForm] = useState({
    name: user.name || "",
    username: user.username || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "celebrant",
    is_admin: user.is_admin || false,
    is_active: user.is_active !== false,
  });
  const [resetSent, setResetSent] = useState(false);

  const handleReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: window.location.origin });
    if (!error) setResetSent(true);
  };

  return (
    <div style={{ background: "#F9FAFB", border: `0.5px solid ${COLORS.border}`, borderRadius: 12, padding: 20, marginTop: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        ✏️ Editando — {user.name || user.username}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 12, marginBottom: 12 }}>
        {[
          { label: "Nombre completo", key: "name", placeholder: "Nombre completo" },
          { label: "@username", key: "username", placeholder: "usuario" },
          { label: "Email", key: "email", type: "email", placeholder: "email@ejemplo.com" },
          { label: "Teléfono", key: "phone", placeholder: "+54 9 11 ..." },
        ].map(f => (
          <div key={f.key}>
            <label style={{ fontSize: 11, color: COLORS.textLight, fontWeight: 600, display: "block", marginBottom: 4 }}>{f.label}</label>
            <Input value={form[f.key]} onChange={v => setForm(p => ({ ...p, [f.key]: v }))} placeholder={f.placeholder} />
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 12, marginBottom: 12 }}>
        {/* Rol */}
        <div>
          <label style={{ fontSize: 11, color: COLORS.textLight, fontWeight: 600, display: "block", marginBottom: 4 }}>Rol</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.entries(ROLE_LABELS).map(([key, r]) => (
              <button key={key} onClick={() => setForm(p => ({ ...p, role: key }))} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: `2px solid ${form.role === key ? r.color : COLORS.border}`, background: form.role === key ? r.bg : "#fff", color: r.color, cursor: "pointer", fontWeight: 700 }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
        {/* Estado */}
        <div>
          <label style={{ fontSize: 11, color: COLORS.textLight, fontWeight: 600, display: "block", marginBottom: 4 }}>Estado</label>
          <div style={{ display: "flex", gap: 6 }}>
            {[{ v: true, label: "✓ Habilitado", bg: "#DCFCE7", color: "#166534" }, { v: false, label: "⊘ Deshabilitado", bg: "#FEF2F2", color: "#991B1B" }].map(s => (
              <button key={String(s.v)} onClick={() => setForm(p => ({ ...p, is_active: s.v }))} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: `2px solid ${form.is_active === s.v ? s.color : COLORS.border}`, background: form.is_active === s.v ? s.bg : "#fff", color: s.color, cursor: "pointer", fontWeight: 700 }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Admin toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: form.is_admin ? "#FEF3C7" : "#F9FAFB", borderRadius: 8, border: `0.5px solid ${form.is_admin ? "#FAC775" : COLORS.border}`, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>👑</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>Permisos de administrador</div>
          <div style={{ fontSize: 11, color: COLORS.textLight }}>Puede acceder al Modo Administrador y gestionar usuarios</div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          <input type="checkbox" checked={form.is_admin} onChange={e => setForm(p => ({ ...p, is_admin: e.target.checked }))} />
          {form.is_admin ? "Es admin" : "Hacer admin"}
        </label>
      </div>

      {/* Reset password */}
      <div style={{ padding: "10px 14px", background: "#FFFBEB", borderRadius: 8, border: "0.5px solid #FDE68A", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 16 }}>🔒</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#633806" }}>Resetear contraseña</div>
          <div style={{ fontSize: 11, color: "#92400E" }}>Se enviará un email a {user.email} con el link para crear una nueva clave</div>
        </div>
        {resetSent
          ? <span style={{ fontSize: 12, color: "#10B981", fontWeight: 700 }}>✓ Email enviado</span>
          : <Button size="sm" variant="outline" onClick={handleReset}>Enviar email</Button>}
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button onClick={() => onSave(user.id, form)} disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="ghost" onClick={() => onDelete(user.id)} style={{ marginLeft: "auto", color: "#EF4444", border: "1px solid #FCA5A5" }}>🗑 Eliminar usuario</Button>
      </div>
    </div>
  );
}

// ─── PANTALLA PRINCIPAL ADMIN ─────────────────────────────────────────────────
export default function AdminPage({ profile, onBack }) {
  const [view, setView]         = useState("main"); // "main" | "table"
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [editUser, setEditUser] = useState(null);
  const [confirm, setConfirm]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [stats, setStats]       = useState({ total: 0, withCampaign: 0, newToday: 0, disabled: 0 });

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
    
    // Usar función RPC que hace JOIN con auth.users para traer emails
    const { data: profilesData, error } = await supabase.rpc('get_all_users_with_email');
    
    if (error) {
      console.error('Error loading users:', error);
      // Fallback: si la función RPC no existe aún, cargar sin emails
      const { data: fallbackData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (!fallbackData) { setLoading(false); return; }
      
      const { data: campaigns } = await supabase.from("gift_campaigns").select("birthday_person_id, status");
      const campMap = {};
      (campaigns || []).forEach(c => { if (!campMap[c.birthday_person_id]) campMap[c.birthday_person_id] = []; campMap[c.birthday_person_id].push(c); });
      const enriched = fallbackData.map(u => ({ ...u, email: null, campaigns: campMap[u.id] || [] }));
      setUsers(enriched);
      const today = new Date().toISOString().split("T")[0];
      setStats({
        total: enriched.length,
        withCampaign: enriched.filter(u => u.campaigns.length > 0).length,
        newToday: enriched.filter(u => u.created_at?.startsWith(today)).length,
        disabled: enriched.filter(u => u.is_active === false).length,
      });
      setLoading(false);
      return;
    }
    
    if (!profilesData) { setLoading(false); return; }
    
    // Traer campañas
    const { data: campaigns } = await supabase.from("gift_campaigns").select("birthday_person_id, status");
    const campMap = {};
    (campaigns || []).forEach(c => { if (!campMap[c.birthday_person_id]) campMap[c.birthday_person_id] = []; campMap[c.birthday_person_id].push(c); });
    
    // Enriquecer con campañas
    const enriched = profilesData.map(u => ({ 
      ...u, 
      campaigns: campMap[u.id] || [] 
    }));
    
    setUsers(enriched);
    const today = new Date().toISOString().split("T")[0];
    setStats({
      total: enriched.length,
      withCampaign: enriched.filter(u => u.campaigns.length > 0).length,
      newToday: enriched.filter(u => u.created_at?.startsWith(today)).length,
      disabled: enriched.filter(u => u.is_active === false).length,
    });
    setLoading(false);
  };

  const saveUser = async (userId, form) => {
    setSaving(true);
    
    // Actualizar perfil en profiles
    const { error: profileError } = await supabase.from("profiles").update({
      name: form.name,
      username: form.username,
      email: form.email,
      phone: form.phone,
      role: form.role,
      is_admin: form.is_admin,
      is_active: form.is_active,
    }).eq("id", userId);
    
    if (profileError) {
      console.error('Error updating profile:', profileError);
      setSaving(false);
      return;
    }
    
    // Si cambió el email, actualizar en auth.users también
    const originalUser = users.find(u => u.id === userId);
    if (originalUser && form.email !== originalUser.email && form.email) {
      // Enviar email de verificación al nuevo correo
      const { error: emailError } = await supabase.auth.admin.updateUserById(userId, {
        email: form.email,
        email_confirm: false // Esto fuerza que se envíe correo de verificación
      });
      
      if (emailError) {
        console.error('Error updating email in auth:', emailError);
      }
    }
    
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...form } : u));
    setEditUser(null);
    setSaving(false);
  };

  const deleteUser = async (userId) => {
    await supabase.from("profiles").delete().eq("id", userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    setConfirm(null);
    setEditUser(null);
  };

  const toggleDisable = async (userId, current) => {
    const newVal = current === false ? true : false;
    await supabase.from("profiles").update({ is_active: newVal }).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: newVal } : u));
  };

  const toggleAdmin = async (userId, current) => {
    await supabase.from("profiles").update({ is_admin: !current }).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !current } : u));
  };

  const filteredMain = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q);
  });

  // ── VISTA TABLA ──
  if (view === "table") {
    return (
      <>
        <UserTableView users={users} loading={loading} onBack={() => setView("main")} onRefresh={loadUsers} onEdit={u => { setEditUser(u); setView("main"); }} />
        {editUser && (
          <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px 80px" }}>
            <EditUserPanel user={editUser} onSave={saveUser} onCancel={() => setEditUser(null)} onDelete={id => setConfirm(id)} saving={saving} />
          </div>
        )}
        {confirm && <ConfirmDelete onConfirm={() => deleteUser(confirm)} onCancel={() => setConfirm(null)} />}
      </>
    );
  }

  // ── VISTA PRINCIPAL ──
  const STAT_CARDS = [
    { icon: "👥", label: "Usuarios totales", value: stats.total, color: "#7C3AED", onClick: () => setView("table") },
    { icon: "🎂", label: "Con regalo activo", value: stats.withCampaign, color: "#10B981", onClick: null },
    { icon: "🆕", label: "Nuevos hoy", value: stats.newToday, color: "#F59E0B", onClick: null },
    { icon: "⊘", label: "Deshabilitados", value: stats.disabled, color: "#EF4444", onClick: null },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 20px 80px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>🛡️ Modo Administrador</h1>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#FEF3C7", color: "#633806" }}>👑 {profile?.username}</span>
          </div>
          <p style={{ margin: 0, color: COLORS.textLight, fontSize: 14 }}>Gestión completa de usuarios — solo visible para admins</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button size="sm" variant="outline" onClick={loadUsers}>↻ Actualizar</Button>
          {onBack && <Button size="sm" variant="ghost" onClick={onBack}>← Volver</Button>}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 14, marginBottom: 24 }}>
        {STAT_CARDS.map((s, i) => (
          <Card key={i} onClick={s.onClick} style={{ padding: "16px 18px", textAlign: "center", cursor: s.onClick ? "pointer" : "default", transition: "box-shadow 0.15s", border: s.onClick ? `1.5px solid ${s.color}30` : undefined }}
            onMouseEnter={e => s.onClick && (e.currentTarget.style.boxShadow = `0 4px 16px ${s.color}20`)}
            onMouseLeave={e => s.onClick && (e.currentTarget.style.boxShadow = "")}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: COLORS.textLight, marginTop: 2 }}>{s.label}</div>
            {s.onClick && <div style={{ fontSize: 10, color: s.color, marginTop: 4, fontWeight: 600 }}>Ver tabla →</div>}
          </Card>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <Input value={search} onChange={setSearch} placeholder="Buscar por nombre, @usuario, email o teléfono..." />
      </div>

      {/* Lista de usuarios */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: COLORS.textLight }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎂</div>Cargando usuarios...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredMain.length === 0 && (
            <Card style={{ textAlign: "center", padding: 40, color: COLORS.textLight }}>No se encontraron usuarios</Card>
          )}
          {filteredMain.map(user => {
            const isDisabled = user.is_active === false;
            const isEditing  = editUser?.id === user.id;
            return (
              <Card key={user.id} style={{ padding: 0, overflow: "hidden", opacity: isDisabled ? 0.65 : 1 }}>
                <div style={{ padding: "14px 18px", display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                  {/* Avatar */}
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#EEEDFE", color: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                    {getInitials(user.name || user.username || "?")}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 3 }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: COLORS.text }}>{user.name || "Sin nombre"}</span>
                      <span style={{ fontSize: 12, color: COLORS.textLight }}>@{user.username}</span>
                      {user.is_admin && <Pill label="👑 admin" color="#633806" bg="#FEF3C7" />}
                      {user.role && ROLE_LABELS[user.role] && <Pill label={ROLE_LABELS[user.role].label} color={ROLE_LABELS[user.role].color} bg={ROLE_LABELS[user.role].bg} />}
                      {isDisabled && <Pill label="deshabilitado" color="#991B1B" bg="#FEF2F2" />}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 16px", fontSize: 12, color: COLORS.textLight }}>
                      {user.email && (
                        <span>
                          ✉️ {user.email} 
                          {user.email_verified && <span style={{ color: "#10B981", fontSize: 11 }}> ✓</span>}
                          {!user.email_verified && <span style={{ color: "#F59E0B", fontSize: 11 }}> ⊗</span>}
                        </span>
                      )}
                      {user.phone    && <span>📱 {user.phone}</span>}
                      {user.birthday && <span>🎂 {user.birthday} · {user.age} años</span>}
                      {user.created_at && <span>🗓 {new Date(user.created_at).toLocaleDateString("es-AR")}</span>}
                    </div>
                    <div style={{ marginTop: 5, display: "flex", gap: 5 }}>
                      {user.campaigns?.length > 0
                        ? <Pill label="🎁 Regalo activo" color="#166534" bg="#DCFCE7" />
                        : <Pill label="Sin regalo cargado" color="#991B1B" bg="#FEF2F2" />}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div style={{ display: "flex", gap: 5, flexShrink: 0, flexWrap: "wrap" }}>
                    <IcoBtn title="Editar" onClick={() => setEditUser(isEditing ? null : user)} style={{ background: isEditing ? "#EEEDFE" : "#fff", borderColor: isEditing ? "#AFA9EC" : COLORS.border }}>✏️</IcoBtn>
                    <IcoBtn title={isDisabled ? "Habilitar" : "Deshabilitar"} onClick={() => toggleDisable(user.id, user.is_active)} style={{ background: isDisabled ? "#DCFCE7" : "#FEF2F2", borderColor: isDisabled ? "#9FE1CB" : "#F09595" }}>
                      {isDisabled ? "✓" : "⊘"}
                    </IcoBtn>
                    <IcoBtn title={user.is_admin ? "Quitar admin" : "Hacer admin"} onClick={() => toggleAdmin(user.id, user.is_admin)} style={{ background: user.is_admin ? "#FEF3C7" : "#fff", borderColor: user.is_admin ? "#FAC775" : COLORS.border }}>👑</IcoBtn>
                    <IcoBtn title="Eliminar" onClick={() => setConfirm(user.id)} style={{ background: "#FEF2F2", borderColor: "#F09595" }}>🗑</IcoBtn>
                  </div>
                </div>

                {/* Edit panel inline */}
                {isEditing && (
                  <div style={{ borderTop: `0.5px solid ${COLORS.border}` }}>
                    <div style={{ padding: "0 18px 18px" }}>
                      <EditUserPanel user={editUser} onSave={saveUser} onCancel={() => setEditUser(null)} onDelete={id => setConfirm(id)} saving={saving} />
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal confirm delete */}
      {confirm && <ConfirmDelete onConfirm={() => deleteUser(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

function ConfirmDelete({ onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }}>
      <Card style={{ maxWidth: 360, width: "100%", padding: 28, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ margin: "0 0 8px" }}>¿Eliminar usuario?</h3>
        <p style={{ color: COLORS.textLight, fontSize: 14, margin: "0 0 20px" }}>Esta acción elimina el perfil y no se puede deshacer.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <Button style={{ flex: 1, background: "#EF4444", boxShadow: "none" }} onClick={onConfirm}>Sí, eliminar</Button>
          <Button variant="secondary" style={{ flex: 1 }} onClick={onCancel}>Cancelar</Button>
        </div>
      </Card>
    </div>
  );
}

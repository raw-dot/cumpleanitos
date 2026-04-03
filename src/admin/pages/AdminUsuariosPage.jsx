import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../supabaseClient";

const C = {
  primary:   "#7C3AED", primaryBg: "#EDE9FE", primaryLight: "#A78BFA",
  accent:    "#F59E0B", accentBg:  "#FEF3C7",
  success:   "#10B981", successBg: "#D1FAE5",
  error:     "#EF4444", errorBg:   "#FEE2E2",
  text:      "#1F2937", textLight: "#6B7280", textMuted: "#9CA3AF",
  border:    "#E5E7EB", surface:   "#FFFFFF", bg: "#F3F4F6",
};

const fmtDate = (s) => s
  ? new Date(s).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })
  : "—";

const getInitials = (s) => (s || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

const ROLE_LABELS = {
  celebrant: { label: "Cumpleañero", color: C.primary,  bg: C.primaryBg },
  manager:   { label: "Gestor",      color: C.accent,   bg: C.accentBg  },
  gifter:    { label: "Regalador",   color: C.success,  bg: C.successBg },
};

const FILTERS = [
  { id: "all",      label: "Todos"       },
  { id: "active",   label: "Activos"     },
  { id: "disabled", label: "Inactivos"   },
  { id: "admin",    label: "Admins"      },
  { id: "nocampaign", label: "Sin cumple"},
];

const PER_PAGE = 15;

// ─── HOOK ────────────────────────────────────────────────────────────────────
function useUsuarios() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: profiles }, { data: campaigns }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("gift_campaigns").select("birthday_person_id, status, id"),
    ]);
    const campMap = {};
    (campaigns || []).forEach(c => {
      if (!campMap[c.birthday_person_id]) campMap[c.birthday_person_id] = [];
      campMap[c.birthday_person_id].push(c);
    });
    setUsers((profiles || []).map(u => ({ ...u, campaigns: campMap[u.id] || [] })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (userId, current) => {
    const newVal = current === false ? true : false;
    const { error } = await supabase.from("profiles").update({ is_active: newVal }).eq("id", userId);
    if (error) { showToast("Error al cambiar estado", "error"); return; }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: newVal } : u));
    showToast(newVal ? "Usuario habilitado" : "Usuario deshabilitado");
  };

  const toggleAdmin = async (userId, current) => {
    const { error } = await supabase.from("profiles").update({ is_admin: !current }).eq("id", userId);
    if (error) { showToast("Error al cambiar permisos", "error"); return; }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !current } : u));
    showToast(!current ? "Admin activado" : "Admin removido");
  };

  const saveUser = async (userId, form) => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      name: form.name, username: form.username,
      phone: form.phone, role: form.role,
    }).eq("id", userId);
    setSaving(false);
    if (error) { showToast("Error al guardar", "error"); return false; }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...form } : u));
    showToast("Usuario guardado");
    return true;
  };

  const bulkDisable = async (ids) => {
    const { error } = await supabase.from("profiles").update({ is_active: false }).in("id", ids);
    if (error) { showToast("Error al deshabilitar", "error"); return; }
    setUsers(prev => prev.map(u => ids.includes(u.id) ? { ...u, is_active: false } : u));
    showToast(`${ids.length} usuarios deshabilitados`);
  };

  const bulkEnable = async (ids) => {
    const { error } = await supabase.from("profiles").update({ is_active: true }).in("id", ids);
    if (error) { showToast("Error al habilitar", "error"); return; }
    setUsers(prev => prev.map(u => ids.includes(u.id) ? { ...u, is_active: true } : u));
    showToast(`${ids.length} usuarios habilitados`);
  };

  return { users, loading, saving, toast, load, toggleActive, toggleAdmin, saveUser, bulkDisable, bulkEnable };
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 1000,
      background: toast.type === "error" ? C.error : C.primary,
      color: "#fff", borderRadius: 8, padding: "10px 16px",
      fontSize: 13, fontWeight: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      transition: "opacity 0.2s",
    }}>
      {toast.type === "error" ? "✕ " : "✓ "}{toast.msg}
    </div>
  );
}

// ─── EDIT DRAWER ─────────────────────────────────────────────────────────────
function EditDrawer({ user, saving, onSave, onClose }) {
  const [form, setForm] = useState({
    name: user.name || "",
    username: user.username || "",
    phone: user.phone || "",
    role: user.role || "celebrant",
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
    }}>
      {/* scrim */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} />

      {/* drawer */}
      <div style={{
        position: "relative", zIndex: 1,
        width: 360, height: "100vh",
        background: C.surface, borderLeft: `0.5px solid ${C.border}`,
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        {/* header */}
        <div style={{ padding: "18px 20px 16px", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.primaryBg, color: C.primary, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {getInitials(user.name || user.username)}
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name || user.username}</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>{user.email}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.textMuted, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { label: "Nombre completo", key: "name",     placeholder: "Nombre completo" },
            { label: "@username",       key: "username", placeholder: "usuario" },
            { label: "Teléfono",        key: "phone",    placeholder: "+54 9 11 ..." },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 500, display: "block", marginBottom: 4 }}>{label}</label>
              <input
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                style={{ width: "100%", border: `0.5px solid ${C.border}`, borderRadius: 7, padding: "8px 10px", fontSize: 13, color: C.text, background: C.bg, boxSizing: "border-box" }}
              />
            </div>
          ))}

          <div>
            <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 500, display: "block", marginBottom: 6 }}>Rol</label>
            <div style={{ display: "flex", gap: 6 }}>
              {Object.entries(ROLE_LABELS).map(([id, { label, color, bg }]) => (
                <button key={id} onClick={() => set("role", id)} style={{
                  flex: 1, padding: "7px 0", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  border: `2px solid ${form.role === id ? color : C.border}`,
                  background: form.role === id ? bg : "transparent",
                  color: form.role === id ? color : C.textLight,
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Info readonly */}
          <div style={{ background: C.bg, borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            <InfoRow label="Email" value={user.email || "—"} />
            <InfoRow label="Registrado" value={fmtDate(user.created_at)} />
            <InfoRow label="Cumpleaños" value={user.birthday ? fmtDate(user.birthday) : "—"} />
            <InfoRow label="Campañas" value={`${user.campaigns?.length || 0} campañas`} />
          </div>
        </div>

        {/* footer */}
        <div style={{ padding: "14px 20px", borderTop: `0.5px solid ${C.border}`, display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", borderRadius: 7, border: `0.5px solid ${C.border}`, background: "transparent", fontSize: 13, color: C.textLight, cursor: "pointer" }}>
            Cancelar
          </button>
          <button
            onClick={async () => { const ok = await onSave(user.id, form); if (ok) onClose(); }}
            disabled={saving}
            style={{ flex: 2, padding: "9px 0", borderRadius: 7, border: "none", background: saving ? C.primaryLight : C.primary, color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "default" : "pointer" }}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
      <span style={{ color: C.textMuted }}>{label}</span>
      <span style={{ color: C.text, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function AdminUsuariosPage() {
  const isMobile = useIsMobile();
  const { users, loading, saving, toast, load, toggleActive, toggleAdmin, saveUser, bulkDisable, bulkEnable } = useUsuarios();

  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");
  const [page,     setPage]     = useState(0);
  const [selected, setSelected] = useState([]);
  const [editing,  setEditing]  = useState(null);
  const searchRef = useRef(null);

  // filtrado
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchFilter =
      filter === "active"     ? u.is_active !== false :
      filter === "disabled"   ? u.is_active === false :
      filter === "admin"      ? u.is_admin :
      filter === "nocampaign" ? (u.campaigns?.length === 0) :
      true;
    return matchSearch && matchFilter;
  });

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll    = () => setSelected(selected.length === paged.length ? [] : paged.map(u => u.id));

  const handleFilter = (f) => { setFilter(f); setPage(0); setSelected([]); };
  const handleSearch = (v) => { setSearch(v); setPage(0); setSelected([]); };

  // stats rápidos
  const stats = {
    total:       users.length,
    active:      users.filter(u => u.is_active !== false).length,
    disabled:    users.filter(u => u.is_active === false).length,
    withCampaign:users.filter(u => u.campaigns?.length > 0).length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Toast toast={toast} />
      {editing && (
        <EditDrawer
          user={editing}
          saving={saving}
          onSave={saveUser}
          onClose={() => setEditing(null)}
        />
      )}

      {/* ── STAT PILLS ── */}
      <div style={{ display: "flex", gap: 10 }}>
        {[
          { label: "Total",       value: stats.total,        color: C.text        },
          { label: "Activos",     value: stats.active,       color: C.success     },
          { label: "Inactivos",   value: stats.disabled,     color: C.error       },
          { label: "Con cumple",  value: stats.withCampaign, color: C.primary     },
        ].map(s => (
          <div key={s.label} style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "10px 16px", display: "flex", gap: 8, alignItems: "baseline" }}>
            <span style={{ fontSize: 20, fontWeight: 600, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 11, color: C.textMuted }}>{s.label}</span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={load} style={{ padding: "0 14px", borderRadius: 8, border: `0.5px solid ${C.border}`, background: C.surface, fontSize: 12, color: C.textLight, cursor: "pointer" }}>
          ↻ Actualizar
        </button>
      </div>

      {/* ── TOOLBAR ── */}
      <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.textMuted }}>⌕</span>
          <input
            ref={searchRef}
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar por nombre, @username o email…"
            style={{ width: "100%", paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: `0.5px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.text, background: C.bg, boxSizing: "border-box" }}
          />
          {search && (
            <button onClick={() => handleSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.textMuted }}>✕</button>
          )}
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", gap: 4 }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => handleFilter(f.id)} style={{
              padding: "6px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
              border: `0.5px solid ${filter === f.id ? C.primary : C.border}`,
              background: filter === f.id ? C.primaryBg : "transparent",
              color: filter === f.id ? C.primary : C.textLight,
              fontWeight: filter === f.id ? 600 : 400,
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* ── BULK ACTIONS ── */}
      {selected.length > 0 && (
        <div style={{ background: C.primaryBg, border: `0.5px solid ${C.primaryLight}`, borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: C.primary, fontWeight: 600, flex: 1 }}>{selected.length} seleccionados</span>
          <button onClick={async () => { await bulkEnable(selected); setSelected([]); }} style={bulkBtn(C.success)}>✓ Habilitar</button>
          <button onClick={async () => { await bulkDisable(selected); setSelected([]); }} style={bulkBtn(C.error)}>✕ Deshabilitar</button>
          <button onClick={() => setSelected([])} style={bulkBtn(C.textLight)}>Cancelar</button>
        </div>
      )}

      {/* ── TABLA ── */}
      <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: C.textMuted, fontSize: 13 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⟳</div>Cargando usuarios…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: C.textMuted, fontSize: 13 }}>
            Sin usuarios que coincidan
          </div>
        ) : (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}><table style={{ width: "100%", minWidth: 600, borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `0.5px solid ${C.border}` }}>
                <th style={th()}>
                  <input type="checkbox" checked={selected.length === paged.length && paged.length > 0} onChange={toggleAll} style={{ cursor: "pointer" }} />
                </th>
                {["Usuario", "Email", "Rol", "Campañas", "Registrado", "Estado", ""].map(label => (
                  <th key={label} style={th(label === "")}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((user, i) => {
                const isDisabled = user.is_active === false;
                const role = ROLE_LABELS[user.role] || { label: user.role || "—", color: C.textMuted, bg: C.bg };
                const isSel = selected.includes(user.id);
                return (
                  <tr key={user.id} style={{
                    borderBottom: i < paged.length - 1 ? `0.5px solid ${C.border}` : "none",
                    background: isSel ? C.primaryBg : isDisabled ? "#FAFAFA" : C.surface,
                    opacity: isDisabled ? 0.65 : 1,
                  }}>
                    {/* checkbox */}
                    <td style={td()}>
                      <input type="checkbox" checked={isSel} onChange={() => toggleSelect(user.id)} style={{ cursor: "pointer" }} />
                    </td>

                    {/* usuario */}
                    <td style={td()}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: isDisabled ? C.bg : C.primaryBg, color: isDisabled ? C.textMuted : C.primary, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {getInitials(user.name || user.username)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: C.text }}>{user.name || "Sin nombre"}</div>
                          <div style={{ fontSize: 11, color: C.textMuted }}>@{user.username || "—"}</div>
                        </div>
                        {user.is_admin && (
                          <span style={{ fontSize: 9, fontWeight: 700, background: C.accentBg, color: C.accent, padding: "2px 5px", borderRadius: 4 }}>ADMIN</span>
                        )}
                      </div>
                    </td>

                    {/* email */}
                    <td style={td()}>
                      <span style={{ color: C.textLight, fontSize: 12 }}>{user.email || "—"}</span>
                    </td>

                    {/* rol */}
                    <td style={td()}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, background: role.bg, color: role.color }}>
                        {role.label}
                      </span>
                    </td>

                    {/* campañas */}
                    <td style={td()}>
                      {user.campaigns?.length > 0 ? (
                        <span style={{ color: C.primary, fontWeight: 600 }}>{user.campaigns.length}</span>
                      ) : (
                        <span style={{ color: C.textMuted }}>—</span>
                      )}
                    </td>

                    {/* fecha */}
                    <td style={td()}>
                      <span style={{ color: C.textLight, fontSize: 12 }}>{fmtDate(user.created_at)}</span>
                    </td>

                    {/* estado */}
                    <td style={td()}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, background: isDisabled ? C.errorBg : C.successBg, color: isDisabled ? C.error : C.success }}>
                        {isDisabled ? "Inactivo" : "Activo"}
                      </span>
                    </td>

                    {/* acciones */}
                    <td style={{ ...td(), textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                        <IcoBtn title="Editar" onClick={() => setEditing(user)} color={C.primary}>✎</IcoBtn>
                        <IcoBtn
                          title={isDisabled ? "Habilitar" : "Deshabilitar"}
                          onClick={() => toggleActive(user.id, user.is_active)}
                          color={isDisabled ? C.success : C.error}
                        >{isDisabled ? "✓" : "✕"}</IcoBtn>
                        <IcoBtn
                          title={user.is_admin ? "Quitar admin" : "Hacer admin"}
                          onClick={() => toggleAdmin(user.id, user.is_admin)}
                          color={user.is_admin ? C.accent : C.textMuted}
                        >★</IcoBtn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        )}
      </div>

      {/* ── PAGINACIÓN ── */}
      {pages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: C.textMuted }}>
          <span>
            {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} de {filtered.length} usuarios
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <PagBtn disabled={page === 0}          onClick={() => setPage(p => p - 1)}>← Anterior</PagBtn>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
              const p = pages <= 7 ? i : page < 4 ? i : page > pages - 4 ? pages - 7 + i : page - 3 + i;
              return (
                <PagBtn key={p} active={p === page} onClick={() => setPage(p)}>{p + 1}</PagBtn>
              );
            })}
            <PagBtn disabled={page >= pages - 1}   onClick={() => setPage(p => p + 1)}>Siguiente →</PagBtn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HELPERS ESTILO ───────────────────────────────────────────────────────────
const th = (right) => ({
  textAlign: right ? "right" : "left",
  padding: "10px 12px",
  fontSize: 10, fontWeight: 600,
  color: C.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  background: C.bg,
  whiteSpace: "nowrap",
});

const td = () => ({ padding: "11px 12px", verticalAlign: "middle" });

const bulkBtn = (color) => ({
  padding: "6px 14px", borderRadius: 6, border: `0.5px solid ${color}`,
  background: "transparent", color, fontSize: 12, fontWeight: 600, cursor: "pointer",
});

function IcoBtn({ title, onClick, color, children }) {
  return (
    <button title={title} onClick={onClick} style={{
      width: 28, height: 28, borderRadius: 6,
      border: `0.5px solid ${C.border}`, background: C.surface,
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", fontSize: 13, color, fontWeight: 600,
    }}>
      {children}
    </button>
  );
}

function PagBtn({ children, onClick, disabled, active }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "5px 10px", borderRadius: 6,
      border: `0.5px solid ${active ? C.primary : C.border}`,
      background: active ? C.primaryBg : "transparent",
      color: active ? C.primary : disabled ? C.textMuted : C.textLight,
      fontSize: 12, cursor: disabled ? "default" : "pointer", fontWeight: active ? 600 : 400,
    }}>
      {children}
    </button>
  );
}

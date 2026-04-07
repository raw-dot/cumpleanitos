import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";

const C = {
  primary:   "#7C3AED", primaryBg: "#EDE9FE", primaryLight: "#A78BFA",
  accent:    "#F59E0B", accentBg:  "#FEF3C7",
  success:   "#10B981", successBg: "#D1FAE5",
  error:     "#EF4444", errorBg:   "#FEE2E2",
  warn:      "#F97316", warnBg:    "#FFF7ED",
  text:      "#1F2937", textLight: "#6B7280", textMuted: "#9CA3AF",
  border:    "#E5E7EB", surface:   "#FFFFFF", bg: "#F3F4F6",
};

const fmtDate = (s) => s
  ? new Date(s).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })
  : "—";

const TABS = [
  { id: "mensajes",  label: "Mensajes"   },
  { id: "perfiles",  label: "Perfiles"   },
  { id: "campanas",  label: "Campañas"   },
  { id: "regalos",   label: "Regalos"    },
];

// ─── HOOK ─────────────────────────────────────────────────────────────────────
function useModeracion() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [
      { data: contributions },
      { data: profiles      },
      { data: campaigns     },
      { data: items         },
    ] = await Promise.all([
      supabase.from("contributions").select("id, campaign_id, gifter_name, gifter_id, message, amount, created_at, is_anonymous, anonymous").not("message", "is", null).order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, username, name, bio, avatar_url, email, is_active, created_at, role").order("created_at", { ascending: false }),
      supabase.from("gift_campaigns").select("id, title, description, image_url, birthday_person_id, birthday_person_name, status, created_at").order("created_at", { ascending: false }),
      supabase.from("gift_items").select("id, campaign_id, name, description, image_url, price, created_at").order("created_at", { ascending: false }),
    ]);

    // mapear campaign → profile
    const profMap = {};
    (profiles || []).forEach(p => { profMap[p.id] = p; });

    const enrichedCamps = (campaigns || []).map(c => ({
      ...c, profile: profMap[c.birthday_person_id] || {},
    }));

    // mapear campaign → birthday_person_name para items
    const campMap = {};
    (campaigns || []).forEach(c => { campMap[c.id] = c; });
    const enrichedItems = (items || []).map(i => ({
      ...i, campaign: campMap[i.campaign_id] || {},
    }));

    // mapear gifter profile para contributions
    const gifterMap = {};
    (profiles || []).forEach(p => { gifterMap[p.id] = p; });
    const enrichedContribs = (contributions || []).map(c => ({
      ...c,
      campaign: campMap[c.campaign_id] || {},
      gifterProfile: c.gifter_id ? gifterMap[c.gifter_id] : null,
    }));

    setData({
      mensajes:  enrichedContribs,
      perfiles:  profiles || [],
      campanas:  enrichedCamps,
      regalos:   enrichedItems,
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Acciones
  const disableUser = async (userId) => {
    const { error } = await supabase.from("profiles").update({ is_active: false }).eq("id", userId);
    if (error) { showToast("Error al deshabilitar", "error"); return; }
    setData(prev => ({
      ...prev,
      perfiles: prev.perfiles.map(p => p.id === userId ? { ...p, is_active: false } : p),
    }));
    showToast("Usuario deshabilitado");
  };

  const clearMessage = async (contribId) => {
    const { error } = await supabase.from("contributions").update({ message: null }).eq("id", contribId);
    if (error) { showToast("Error al eliminar mensaje", "error"); return; }
    setData(prev => ({
      ...prev,
      mensajes: prev.mensajes.filter(c => c.id !== contribId),
    }));
    showToast("Mensaje eliminado");
  };

  const clearBio = async (userId) => {
    const { error } = await supabase.from("profiles").update({ bio: null }).eq("id", userId);
    if (error) { showToast("Error al limpiar bio", "error"); return; }
    setData(prev => ({
      ...prev,
      perfiles: prev.perfiles.map(p => p.id === userId ? { ...p, bio: null } : p),
    }));
    showToast("Bio eliminada");
  };

  const clearCampaignDesc = async (campId) => {
    const { error } = await supabase.from("gift_campaigns").update({ description: null }).eq("id", campId);
    if (error) { showToast("Error al limpiar descripción", "error"); return; }
    setData(prev => ({
      ...prev,
      campanas: prev.campanas.map(c => c.id === campId ? { ...c, description: null } : c),
    }));
    showToast("Descripción eliminada");
  };

  const clearItemDesc = async (itemId) => {
    const { error } = await supabase.from("gift_items").update({ description: null }).eq("id", itemId);
    if (error) { showToast("Error al limpiar descripción", "error"); return; }
    setData(prev => ({
      ...prev,
      regalos: prev.regalos.map(i => i.id === itemId ? { ...i, description: null } : i),
    }));
    showToast("Descripción eliminada");
  };

  const pauseCampaign = async (campId) => {
    const { error } = await supabase.from("gift_campaigns").update({ status: "inactive" }).eq("id", campId);
    if (error) { showToast("Error al pausar campaña", "error"); return; }
    setData(prev => ({
      ...prev,
      campanas: prev.campanas.map(c => c.id === campId ? { ...c, status: "inactive" } : c),
    }));
    showToast("Campaña pausada");
  };

  return { data, loading, toast, load, disableUser, clearMessage, clearBio, clearCampaignDesc, clearItemDesc, pauseCampaign };
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 1000,
      background: toast.type === "error" ? C.error : C.primary,
      color: "#fff", borderRadius: 8, padding: "10px 16px",
      fontSize: 13, fontWeight: 500,
    }}>
      {toast.type === "error" ? "✕ " : "✓ "}{toast.msg}
    </div>
  );
}

function ActionBtn({ label, color = C.error, onClick, confirm: confirmMsg }) {
  const handle = () => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    onClick();
  };
  return (
    <button onClick={handle} style={{
      padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
      border: `0.5px solid ${color}`, color, background: "transparent",
      cursor: "pointer", whiteSpace: "nowrap",
    }}>{label}</button>
  );
}

function ContentCard({ children, flagged }) {
  return (
    <div style={{
      background: C.surface,
      border: `0.5px solid ${flagged ? C.warn : C.border}`,
      borderLeft: flagged ? `3px solid ${C.warn}` : `0.5px solid ${C.border}`,
      borderRadius: 10, padding: 14,
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      {children}
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <span style={{ fontSize: 11, color: C.textMuted }}>
      <span style={{ color: C.textMuted }}>{label}: </span>
      <span style={{ color: C.textLight, fontWeight: 500 }}>{value}</span>
    </span>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative" }}>
      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.textMuted }}>⌕</span>
      <input
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: `0.5px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.text, background: C.bg, boxSizing: "border-box" }}
      />
      {value && <button onClick={() => onChange("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.textMuted }}>✕</button>}
    </div>
  );
}

function Avatar({ name, size = 32 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: C.primaryBg, color: C.primary, fontSize: size * 0.35, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function EmptyState({ text = "Sin contenido para revisar" }) {
  return (
    <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "48px 32px", textAlign: "center" }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>✓</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>{text}</div>
      <div style={{ fontSize: 12, color: C.textMuted }}>No hay elementos para moderar en esta sección.</div>
    </div>
  );
}

// ─── TAB MENSAJES ─────────────────────────────────────────────────────────────
function TabMensajes({ mensajes, onClearMessage, onDisableUser }) {
  const [search, setSearch] = useState("");

  const filtered = mensajes.filter(c => {
    const q = search.toLowerCase();
    return !q || c.message?.toLowerCase().includes(q) || c.gifter_name?.toLowerCase().includes(q) || c.campaign?.birthday_person_name?.toLowerCase().includes(q);
  });

  // Detectar mensajes potencialmente problemáticos (palabras clave simples)
  const flagWords = ["odio", "estafa", "fraude", "spam", "http", "www.", ".com", "whatsapp", "telegram", "puta", "mierda", "pelotud"];
  const isFlagged = (msg) => msg && flagWords.some(w => msg.toLowerCase().includes(w));

  const flagged   = filtered.filter(c => isFlagged(c.message));
  const normal    = filtered.filter(c => !isFlagged(c.message));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* stats */}
      <div style={{ display: "flex", gap: 10 }}>
        {[
          { label: "Con mensaje",       value: mensajes.length,  color: C.text  },
          { label: "Posible revisión",  value: flagged.length,   color: C.warn  },
          { label: "Sin issues",        value: mensajes.length - mensajes.filter(c => isFlagged(c.message)).length, color: C.success },
        ].map(s => (
          <div key={s.label} style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "10px 16px", display: "flex", gap: 8, alignItems: "baseline" }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 11, color: C.textMuted }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "12px 16px" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar en mensajes, regalador o cumpleañero…" />
      </div>

      {filtered.length === 0 ? <EmptyState text="Sin mensajes para revisar" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {flagged.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.warn, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                — Posible revisión ({flagged.length})
              </div>
              {flagged.map(c => <MensajeCard key={c.id} contrib={c} flagged onClear={() => onClearMessage(c.id)} onDisable={() => onDisableUser(c.gifter_id)} />)}
            </>
          )}
          {normal.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: flagged.length ? 8 : 0 }}>
                — Recientes ({normal.length})
              </div>
              {normal.map(c => <MensajeCard key={c.id} contrib={c} onClear={() => onClearMessage(c.id)} onDisable={c.gifter_id ? () => onDisableUser(c.gifter_id) : null} />)}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MensajeCard({ contrib, flagged, onClear, onDisable }) {
  const isAnon = contrib.is_anonymous || contrib.anonymous;
  return (
    <ContentCard flagged={flagged}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <Avatar name={isAnon ? "?" : (contrib.gifter_name || "?")} size={30} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
              {isAnon ? "Anónimo" : (contrib.gifter_name || "Sin nombre")}
            </span>
            <span style={{ fontSize: 11, color: C.textMuted }}>→</span>
            <span style={{ fontSize: 12, color: C.primary }}>
              {contrib.campaign?.birthday_person_name || "—"}
            </span>
            {flagged && <span style={{ fontSize: 9, fontWeight: 700, background: C.warnBg, color: C.warn, padding: "2px 6px", borderRadius: 4 }}>REVISAR</span>}
          </div>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5, marginTop: 6, background: C.bg, borderRadius: 7, padding: "8px 10px", fontStyle: "italic" }}>
            "{contrib.message}"
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
            <Meta label="Fecha"  value={fmtDate(contrib.created_at)} />
            <Meta label="Monto"  value={`$${Math.round(contrib.amount || 0).toLocaleString("es-AR")}`} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
          <ActionBtn label="Borrar msg" color={C.error} onClick={onClear} confirm="¿Eliminar este mensaje?" />
          {onDisable && !isAnon && <ActionBtn label="Deshabilitar user" color={C.warn} onClick={onDisable} confirm="¿Deshabilitar al usuario?" />}
        </div>
      </div>
    </ContentCard>
  );
}

// ─── TAB PERFILES ─────────────────────────────────────────────────────────────
function TabPerfiles({ perfiles, onClearBio, onDisableUser }) {
  const [search,    setSearch]    = useState("");
  const [showOnly,  setShowOnly]  = useState("bio"); // bio | avatar | all

  const withBio    = perfiles.filter(p => p.bio && p.bio.trim());
  const withAvatar = perfiles.filter(p => p.avatar_url);

  const source = showOnly === "bio" ? withBio : showOnly === "avatar" ? withAvatar : perfiles;
  const filtered = source.filter(p => {
    const q = search.toLowerCase();
    return !q || p.name?.toLowerCase().includes(q) || p.username?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* stats */}
      <div style={{ display: "flex", gap: 10 }}>
        {[
          { label: "Total perfiles",  value: perfiles.length,  color: C.text    },
          { label: "Con bio",         value: withBio.length,   color: C.primary },
          { label: "Con avatar",      value: withAvatar.length, color: C.success },
        ].map(s => (
          <div key={s.label} style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "10px 16px", display: "flex", gap: 8, alignItems: "baseline" }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 11, color: C.textMuted }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre, @username o email…" />
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { id: "bio",    label: `Con bio (${withBio.length})`     },
            { id: "avatar", label: `Con avatar (${withAvatar.length})` },
            { id: "all",    label: "Todos"                            },
          ].map(f => (
            <button key={f.id} onClick={() => setShowOnly(f.id)} style={{
              padding: "6px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
              border: `0.5px solid ${showOnly === f.id ? C.primary : C.border}`,
              background: showOnly === f.id ? C.primaryBg : "transparent",
              color: showOnly === f.id ? C.primary : C.textLight,
              fontWeight: showOnly === f.id ? 600 : 400,
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? <EmptyState text="Sin perfiles para revisar" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(p => (
            <ContentCard key={p.id}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                {/* avatar preview */}
                {p.avatar_url
                  ? <img src={p.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `0.5px solid ${C.border}` }} />
                  : <Avatar name={p.name || p.username} size={40} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.name || "Sin nombre"}</span>
                    <span style={{ fontSize: 12, color: C.primary }}>@{p.username || "—"}</span>
                    <span style={{ fontSize: 10, color: C.textMuted }}>{p.email}</span>
                    {p.is_active === false && <span style={{ fontSize: 9, fontWeight: 700, background: C.errorBg, color: C.error, padding: "2px 6px", borderRadius: 4 }}>INACTIVO</span>}
                  </div>
                  {p.bio && (
                    <div style={{ fontSize: 12, color: C.textLight, lineHeight: 1.5, marginTop: 6, background: C.bg, borderRadius: 7, padding: "7px 10px", fontStyle: "italic" }}>
                      "{p.bio}"
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                    <Meta label="Registrado" value={fmtDate(p.created_at)} />
                    <Meta label="Rol"        value={p.role || "—"} />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                  {p.bio && <ActionBtn label="Borrar bio" color={C.error} onClick={() => onClearBio(p.id)} confirm="¿Eliminar la bio de este usuario?" />}
                  {p.is_active !== false && <ActionBtn label="Deshabilitar" color={C.warn} onClick={() => onDisableUser(p.id)} confirm="¿Deshabilitar este usuario?" />}
                </div>
              </div>
            </ContentCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TAB CAMPAÑAS ─────────────────────────────────────────────────────────────
function TabCampanas({ campanas, onClearDesc, onPause }) {
  const [search, setSearch] = useState("");

  const withDesc  = campanas.filter(c => c.description && c.description.trim());
  const withImage = campanas.filter(c => c.image_url);

  const filtered = withDesc.filter(c => {
    const q = search.toLowerCase();
    return !q || c.birthday_person_name?.toLowerCase().includes(q) || c.title?.toLowerCase().includes(q) || c.profile?.username?.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10 }}>
        {[
          { label: "Total campañas",   value: campanas.length,   color: C.text    },
          { label: "Con descripción",  value: withDesc.length,   color: C.primary },
          { label: "Con imagen",       value: withImage.length,  color: C.success },
        ].map(s => (
          <div key={s.label} style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "10px 16px", display: "flex", gap: 8, alignItems: "baseline" }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 11, color: C.textMuted }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "12px 16px" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar campaña o cumpleañero…" />
      </div>

      {filtered.length === 0 ? <EmptyState text="Sin descripciones para revisar" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(c => (
            <ContentCard key={c.id}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                {c.image_url
                  ? <img src={c.image_url} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: `0.5px solid ${C.border}` }} />
                  : <div style={{ width: 48, height: 48, borderRadius: 8, background: C.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🎂</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.birthday_person_name || "—"}</span>
                    <span style={{ fontSize: 12, color: C.primary }}>@{c.profile?.username || "—"}</span>
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 9999, background: c.status === "active" ? C.successBg : C.bg, color: c.status === "active" ? C.success : C.textMuted, fontWeight: 600 }}>{c.status}</span>
                  </div>
                  {c.title && <div style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>📌 {c.title}</div>}
                  {c.description && (
                    <div style={{ fontSize: 12, color: C.textLight, lineHeight: 1.5, marginTop: 6, background: C.bg, borderRadius: 7, padding: "7px 10px", fontStyle: "italic" }}>
                      "{c.description}"
                    </div>
                  )}
                  <Meta label="Creada" value={fmtDate(c.created_at)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                  {c.description && <ActionBtn label="Borrar desc." color={C.error} onClick={() => onClearDesc(c.id)} confirm="¿Eliminar la descripción de esta campaña?" />}
                  {c.status === "active" && <ActionBtn label="Pausar" color={C.warn} onClick={() => onPause(c.id)} confirm="¿Pausar esta campaña?" />}
                </div>
              </div>
            </ContentCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TAB REGALOS ──────────────────────────────────────────────────────────────
function TabRegalos({ regalos, onClearDesc }) {
  const [search, setSearch] = useState("");

  const withDesc  = regalos.filter(i => i.description && i.description.trim());
  const filtered  = withDesc.filter(i => {
    const q = search.toLowerCase();
    return !q || i.name?.toLowerCase().includes(q) || i.campaign?.birthday_person_name?.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10 }}>
        {[
          { label: "Total regalos",    value: regalos.length,  color: C.text    },
          { label: "Con descripción",  value: withDesc.length, color: C.primary },
        ].map(s => (
          <div key={s.label} style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "10px 16px", display: "flex", gap: 8, alignItems: "baseline" }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 11, color: C.textMuted }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "12px 16px" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre de regalo o cumpleañero…" />
      </div>

      {filtered.length === 0 ? <EmptyState text="Sin descripciones de regalos para revisar" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(item => (
            <ContentCard key={item.id}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                {item.image_url
                  ? <img src={item.image_url} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: `0.5px solid ${C.border}` }} />
                  : <div style={{ width: 44, height: 44, borderRadius: 8, background: C.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎁</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.name || "Sin nombre"}</span>
                    {item.price > 0 && <span style={{ fontSize: 12, color: C.success, fontWeight: 600 }}>${Math.round(item.price).toLocaleString("es-AR")}</span>}
                    <span style={{ fontSize: 11, color: C.primary }}>de {item.campaign?.birthday_person_name || "—"}</span>
                  </div>
                  {item.description && (
                    <div style={{ fontSize: 12, color: C.textLight, lineHeight: 1.5, marginTop: 6, background: C.bg, borderRadius: 7, padding: "7px 10px", fontStyle: "italic" }}>
                      "{item.description}"
                    </div>
                  )}
                  <Meta label="Agregado" value={fmtDate(item.created_at)} />
                </div>
                <ActionBtn label="Borrar desc." color={C.error} onClick={() => onClearDesc(item.id)} confirm="¿Eliminar la descripción de este regalo?" />
              </div>
            </ContentCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdminModeracionPage() {
  const {
    data, loading, toast, load,
    disableUser, clearMessage, clearBio,
    clearCampaignDesc, clearItemDesc, pauseCampaign,
  } = useModeracion();

  const [activeTab, setActiveTab] = useState("mensajes");

  const tabCounts = {
    mensajes: data?.mensajes?.length || 0,
    perfiles: data?.perfiles?.length || 0,
    campanas: data?.campanas?.filter(c => c.description)?.length || 0,
    regalos:  data?.regalos?.filter(i => i.description)?.length || 0,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Toast toast={toast} />

      {/* TABS */}
      <div style={{ display: "flex", alignItems: "center", background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 4, alignSelf: "flex-start" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "7px 16px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13,
            background: activeTab === tab.id ? C.primaryBg : "transparent",
            color: activeTab === tab.id ? C.primary : C.textLight,
            fontWeight: activeTab === tab.id ? 600 : 400,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {tab.label}
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 9999,
              background: activeTab === tab.id ? C.primary : C.bg,
              color: activeTab === tab.id ? "#fff" : C.textMuted,
            }}>
              {tabCounts[tab.id]}
            </span>
          </button>
        ))}
        <div style={{ flex: 1, minWidth: 16 }} />
        <button onClick={load} style={{ padding: "7px 12px", borderRadius: 7, border: `0.5px solid ${C.border}`, background: "transparent", fontSize: 12, color: C.textLight, cursor: "pointer" }}>↻</button>
      </div>

      {/* CONTENIDO */}
      {loading ? (
        <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 32, textAlign: "center", color: C.textMuted, fontSize: 13 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⟳</div>Cargando contenido…
        </div>
      ) : (
        <>
          {activeTab === "mensajes" && <TabMensajes  mensajes={data?.mensajes || []} onClearMessage={clearMessage} onDisableUser={disableUser} />}
          {activeTab === "perfiles" && <TabPerfiles  perfiles={data?.perfiles || []} onClearBio={clearBio} onDisableUser={disableUser} />}
          {activeTab === "campanas" && <TabCampanas  campanas={data?.campanas || []} onClearDesc={clearCampaignDesc} onPause={pauseCampaign} />}
          {activeTab === "regalos"  && <TabRegalos   regalos={data?.regalos  || []} onClearDesc={clearItemDesc} />}
        </>
      )}
    </div>
  );
}

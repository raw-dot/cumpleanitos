import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "../AdminContext";
import { supabase } from "../../supabaseClient";

const C = {
  primary:   "#7C3AED", primaryBg: "#EDE9FE", primaryLight: "#A78BFA",
  accent:    "#F59E0B", accentBg:  "#FEF3C7",
  success:   "#10B981", successBg: "#D1FAE5",
  error:     "#EF4444", errorBg:   "#FEE2E2",
  text:      "#1F2937", textLight: "#6B7280", textMuted: "#9CA3AF",
  border:    "#E5E7EB", surface:   "#FFFFFF", bg: "#F3F4F6",
};

const fmtDate = (s) => s ? new Date(s).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—";

const SECTIONS = [
  { id: "plataforma", label: "Plataforma"    },
  { id: "admins",     label: "Administradores" },
  { id: "alertas",    label: "Umbrales alertas" },
  { id: "about",      label: "Acerca del panel" },
];

const DEFAULT_CONFIG = {
  gift_amounts:      [500, 1000, 2000, 5000],
  alert_no_contrib_days:  14,
  alert_no_campaign_days:  7,
  alert_upcoming_days:     7,
  platform_name:     "Cumpleañitos",
  support_email:     "",
};

// ─── HOOK CONFIG (Supabase + localStorage fallback) ──────────────────────────
function useConfig() {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("admin_config");
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch { return DEFAULT_CONFIG; }
  });
  const [syncing, setSyncing] = useState(false);

  // Al montar: leer desde Supabase
  useEffect(() => {
    supabase.from("app_config").select("value").eq("key", "platform").single()
      .then(({ data }) => {
        if (data?.value) {
          const merged = { ...DEFAULT_CONFIG, ...data.value };
          setConfig(merged);
          localStorage.setItem("admin_config", JSON.stringify(merged));
        }
      });
  }, []);

  const save = async (updates) => {
    const next = { ...config, ...updates };
    setConfig(next);
    localStorage.setItem("admin_config", JSON.stringify(next));
    setSyncing(true);
    await supabase.from("app_config").upsert({ key: "platform", value: next }, { onConflict: "key" });
    setSyncing(false);
  };

  const reset = async () => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem("admin_config");
    await supabase.from("app_config").upsert({ key: "platform", value: DEFAULT_CONFIG }, { onConflict: "key" });
  };

  return { config, save, reset, syncing };
}

// ─── HOOK ADMINS ──────────────────────────────────────────────────────────────
function useAdmins() {
  const [admins,  setAdmins]  = useState([]);
  const [all,     setAll]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);
  const [search,  setSearch]  = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, name, email, is_admin, created_at, role")
      .order("created_at", { ascending: false });
    setAll(data || []);
    setAdmins((data || []).filter(p => p.is_admin));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleAdmin = async (userId, current) => {
    const { error } = await supabase.from("profiles").update({ is_admin: !current }).eq("id", userId);
    if (error) { showToast("Error al cambiar permisos", "error"); return; }
    setAll(prev => prev.map(p => p.id === userId ? { ...p, is_admin: !current } : p));
    setAdmins(prev =>
      !current
        ? [...prev, all.find(p => p.id === userId) && { ...all.find(p => p.id === userId), is_admin: true }].filter(Boolean)
        : prev.filter(p => p.id !== userId)
    );
    showToast(!current ? "Admin activado" : "Admin removido");
    load();
  };

  const candidates = all.filter(p => {
    const q = search.toLowerCase();
    return !p.is_admin && (!q || p.name?.toLowerCase().includes(q) || p.username?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q));
  }).slice(0, 8);

  return { admins, candidates, loading, toast, search, setSearch, toggleAdmin };
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1000, background: toast.type === "error" ? C.error : C.primary, color: "#fff", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 500 }}>
      {toast.type === "error" ? "✕ " : "✓ "}{toast.msg}
    </div>
  );
}

function Section({ title, sub, children }) {
  return (
    <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: `0.5px solid ${C.border}`, background: C.bg }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function Field({ label, sub, children }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "14px 0", borderBottom: `0.5px solid ${C.border}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{children}</div>
    </div>
  );
}

function FieldLast({ label, sub, children }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 16, paddingTop: 14 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{children}</div>
    </div>
  );
}

function NumInput({ value, onChange, min = 1, max = 999, width = 80 }) {
  return (
    <input
      type="number" value={value} min={min} max={max}
      onChange={e => onChange(Number(e.target.value))}
      style={{ width, border: `0.5px solid ${C.border}`, borderRadius: 7, padding: "6px 10px", fontSize: 13, color: C.text, background: C.bg, textAlign: "center" }}
    />
  );
}

function TextInput({ value, onChange, placeholder, width = 240 }) {
  return (
    <input
      type="text" value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{ width, border: `0.5px solid ${C.border}`, borderRadius: 7, padding: "6px 10px", fontSize: 13, color: C.text, background: C.bg }}
    />
  );
}

function SaveBtn({ onClick, saving }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 16px", borderRadius: 7, border: "none",
      background: C.primary, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
    }}>{saving ? "Guardando…" : "Guardar"}</button>
  );
}

function AvatarInitials({ name, size = 32 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: C.primaryBg, color: C.primary, fontSize: size * 0.35, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

// ─── SECCIÓN PLATAFORMA ───────────────────────────────────────────────────────
function SeccionPlataforma({ config, save }) {
  const [amounts,  setAmounts]  = useState(config.gift_amounts.join(", "));
  const [email,    setEmail]    = useState(config.support_email);
  const [saved,    setSaved]    = useState(false);

  const handleSave = () => {
    const parsed = amounts.split(",").map(v => parseInt(v.trim(), 10)).filter(v => !isNaN(v) && v > 0);
    if (parsed.length < 2) { alert("Ingresá al menos 2 montos válidos separados por coma"); return; }
    save({ gift_amounts: parsed, support_email: email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Section title="Configuración de plataforma" sub="Parámetros generales visibles en la app">
      <Field label="Montos sugeridos de regalo" sub="Los botones de monto rápido que ven los regaladores (separados por coma, en ARS)">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={amounts}
            onChange={e => setAmounts(e.target.value)}
            placeholder="500, 1000, 2000, 5000"
            style={{ width: 220, border: `0.5px solid ${C.border}`, borderRadius: 7, padding: "6px 10px", fontSize: 13, color: C.text, background: C.bg }}
          />
          <div style={{ display: "flex", gap: 4 }}>
            {amounts.split(",").map(v => parseInt(v.trim(), 10)).filter(v => !isNaN(v) && v > 0).map((v, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 600, background: C.primaryBg, color: C.primary, padding: "3px 8px", borderRadius: 9999 }}>
                ${v.toLocaleString("es-AR")}
              </span>
            ))}
          </div>
        </div>
      </Field>
      <Field label="Email de soporte" sub="Dirección de contacto para consultas de usuarios">
        <TextInput value={email} onChange={setEmail} placeholder="soporte@cumpleanitos.com" />
      </Field>
      <FieldLast label="Guardar cambios" sub="Los cambios se guardan localmente en este navegador">
        <button onClick={handleSave} style={{
          padding: "7px 18px", borderRadius: 7, border: "none",
          background: saved ? C.success : C.primary,
          color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background 0.2s",
        }}>
          {saved ? "✓ Guardado" : "Guardar"}
        </button>
      </FieldLast>
    </Section>
  );
}

// ─── SECCIÓN ALERTAS ──────────────────────────────────────────────────────────
function SeccionAlertas({ config, save }) {
  const [noContrib,  setNoContrib]  = useState(config.alert_no_contrib_days);
  const [noCampaign, setNoCampaign] = useState(config.alert_no_campaign_days);
  const [upcoming,   setUpcoming]   = useState(config.alert_upcoming_days);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    save({ alert_no_contrib_days: noContrib, alert_no_campaign_days: noCampaign, alert_upcoming_days: upcoming });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Section title="Umbrales de alertas operativas" sub="Define cuándo se disparan las alertas automáticas">
      <Field label="Campaña sin aportes" sub={`Generar alerta si una campaña activa no recibe aportes en X días`}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <NumInput value={noContrib} onChange={setNoContrib} min={1} max={90} />
          <span style={{ fontSize: 12, color: C.textMuted }}>días</span>
        </div>
      </Field>
      <Field label="Usuario sin campaña" sub="Generar alerta si un usuario registrado no crea ninguna campaña en X días">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <NumInput value={noCampaign} onChange={setNoCampaign} min={1} max={60} />
          <span style={{ fontSize: 12, color: C.textMuted }}>días</span>
        </div>
      </Field>
      <Field label="Cumpleaños próximo" sub="Alertar cuando un cumpleaños activo está a X días o menos">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <NumInput value={upcoming} onChange={setUpcoming} min={1} max={30} />
          <span style={{ fontSize: 12, color: C.textMuted }}>días</span>
        </div>
      </Field>
      <FieldLast label="Guardar umbrales" sub="Afecta las alertas generadas en la sección Alertas">
        <button onClick={handleSave} style={{
          padding: "7px 18px", borderRadius: 7, border: "none",
          background: saved ? C.success : C.primary,
          color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          {saved ? "✓ Guardado" : "Guardar"}
        </button>
      </FieldLast>
    </Section>
  );
}

// ─── SECCIÓN ADMINS ───────────────────────────────────────────────────────────
function SeccionAdmins({ admins, candidates, loading, search, setSearch, toggleAdmin }) {
  return (
    <Section title="Administradores de la plataforma" sub="Usuarios con acceso al panel admin">
      {/* Admins actuales */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
          Admins activos ({admins.length})
        </div>
        {loading ? (
          <div style={{ color: C.textMuted, fontSize: 12 }}>Cargando…</div>
        ) : admins.length === 0 ? (
          <div style={{ color: C.textMuted, fontSize: 12, fontStyle: "italic" }}>Sin admins configurados</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {admins.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: C.primaryBg, borderRadius: 8, border: `0.5px solid ${C.primaryLight}` }}>
                <AvatarInitials name={p.name || p.username} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.name || "Sin nombre"}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>@{p.username} · {p.email}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, background: C.primary, color: "#fff", padding: "2px 8px", borderRadius: 9999 }}>ADMIN</span>
                <button
                  onClick={() => { if (window.confirm(`¿Remover admin a @${p.username}?`)) toggleAdmin(p.id, true); }}
                  style={{ fontSize: 11, color: C.error, background: "none", border: `0.5px solid ${C.error}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agregar admin */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
          Agregar administrador
        </div>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.textMuted }}>⌕</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar usuario por nombre, @username o email…"
            style={{ width: "100%", paddingLeft: 28, paddingRight: 10, paddingTop: 8, paddingBottom: 8, border: `0.5px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.text, background: C.bg, boxSizing: "border-box" }}
          />
        </div>
        {search && candidates.length === 0 && (
          <div style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic", padding: "8px 0" }}>Sin usuarios que coincidan</div>
        )}
        {candidates.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {candidates.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: C.bg, borderRadius: 8, border: `0.5px solid ${C.border}` }}>
                <AvatarInitials name={p.name || p.username} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{p.name || "Sin nombre"}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>@{p.username} · {p.email}</div>
                </div>
                <button
                  onClick={() => { if (window.confirm(`¿Dar acceso admin a @${p.username}?`)) toggleAdmin(p.id, false); }}
                  style={{ fontSize: 11, color: C.primary, background: C.primaryBg, border: `0.5px solid ${C.primary}`, borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontWeight: 600 }}
                >
                  + Admin
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

// ─── SECCIÓN ABOUT ────────────────────────────────────────────────────────────
function SeccionAbout({ config, onReset }) {
  const adminVersion = "0.12.0";
  const modules = [
    { name: "Dashboard",    status: "✓", desc: "KPIs + gráfico + actividad reciente" },
    { name: "Usuarios",     status: "✓", desc: "Tabla, búsqueda, filtros, edición, bulk" },
    { name: "Cumpleaños",   status: "✓", desc: "Tabla, drawer detalle, pausar/activar" },
    { name: "Regalos",      status: "✓", desc: "Wishlist + aportes, drawer detalle" },
    { name: "Finanzas",     status: "✓", desc: "Resumen, por campaña, historial" },
    { name: "Analytics",    status: "✓", desc: "Conversión, tendencias, demográfico" },
    { name: "Alertas",      status: "✓", desc: "7 tipos, 3 severidades, descartar" },
    { name: "Moderación",   status: "✓", desc: "Mensajes, perfiles, campañas, regalos" },
    { name: "Configuración",status: "✓", desc: "Plataforma, admins, umbrales" },
  ];

  return (
    <Section title="Acerca del panel admin" sub={`Cumpleañitos Admin v${adminVersion}`}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
        {modules.map(m => (
          <div key={m.name} style={{ background: C.bg, borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 12, color: C.success, fontWeight: 700 }}>{m.status}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{m.name}</span>
            </div>
            <div style={{ fontSize: 10, color: C.textMuted }}>{m.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.bg, borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        {[
          { label: "Versión admin",   value: adminVersion },
          { label: "Stack",           value: "React + Vite + Supabase" },
          { label: "Deploy",          value: "Vercel (auto desde main)" },
          { label: "Config guardada", value: localStorage.getItem("admin_config") ? "Sí (localStorage)" : "Default" },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: C.textMuted }}>{label}</span>
            <span style={{ color: C.text, fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => { if (window.confirm("¿Resetear configuración local a los valores por defecto?")) { onReset(); } }}
        style={{ padding: "7px 16px", borderRadius: 7, border: `0.5px solid ${C.error}`, background: "transparent", color: C.error, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
      >
        Resetear configuración local
      </button>
    </Section>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdminConfiguracionPage() {
  const { isMobile } = useAdmin();
  const { config, save, reset } = useConfig();
  const { admins, candidates, loading, toast, search, setSearch, toggleAdmin } = useAdmins();
  const [activeSection, setActiveSection] = useState("plataforma");

  return (
    <div style={{ display: "flex", gap: 20, flexDirection: isMobile ? "column" : "row", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Toast toast={toast} />

      {/* Sidebar de secciones */}
      <div style={{ width: isMobile ? "100%" : 200, flexShrink: 0 }}>
        <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 8, position: "sticky", top: 0 }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
              width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 7,
              border: "none", cursor: "pointer", fontSize: 13,
              background: activeSection === s.id ? C.primaryBg : "transparent",
              color: activeSection === s.id ? C.primary : C.textLight,
              fontWeight: activeSection === s.id ? 600 : 400,
              marginBottom: 2,
            }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {activeSection === "plataforma" && <SeccionPlataforma config={config} save={save} />}
        {activeSection === "admins"     && <SeccionAdmins admins={admins} candidates={candidates} loading={loading} search={search} setSearch={setSearch} toggleAdmin={toggleAdmin} />}
        {activeSection === "alertas"    && <SeccionAlertas config={config} save={save} />}
        {activeSection === "about"      && <SeccionAbout config={config} onReset={reset} />}
      </div>
    </div>
  );
}

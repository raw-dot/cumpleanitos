import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";

const C = {
  primary:   "#7C3AED", primaryBg: "#EDE9FE", primaryLight: "#A78BFA",
  accent:    "#F59E0B", accentBg:  "#FEF3C7",
  success:   "#10B981", successBg: "#D1FAE5",
  error:     "#EF4444", errorBg:   "#FEE2E2",
  text:      "#1F2937", textLight: "#6B7280", textMuted: "#9CA3AF",
  border:    "#E5E7EB", surface:   "#FFFFFF", bg: "#F3F4F6",
};

const fmt     = (n) => n?.toLocaleString("es-AR") ?? "—";
const fmtARS  = (n) => n != null ? `$${Math.round(n).toLocaleString("es-AR")}` : "$0";
const fmtDate = (s) => s ? new Date(s).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—";
const timeAgo = (s) => {
  if (!s) return "—";
  const diff = (Date.now() - new Date(s)) / 1000;
  if (diff < 60)    return "ahora";
  if (diff < 3600)  return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} d`;
};
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

// ─── HOOK ─────────────────────────────────────────────────────────────────────
function useDashboardData() {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [lastUpdate,setLastUpdate]= useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: profiles },
        { data: campaigns },
        { data: contributions },
        { data: recentProfiles },
        { data: recentCampaigns },
        { data: recentContribs },
        { data: allActivity },
      ] = await Promise.all([
        supabase.from("profiles").select("id, created_at, is_active, username, name, email, role, birthday, avatar_url, last_sign_in_at"),
        supabase.from("gift_campaigns").select("id, birthday_person_id, status, goal_amount, birthday_date, created_at, title"),
        supabase.from("contributions").select("amount, campaign_id, created_at, gifter_name, is_anonymous, anonymous"),
        supabase.from("profiles").select("id, username, name, created_at, role, email, birthday, avatar_url").order("created_at", { ascending: false }).limit(8),
        supabase.from("gift_campaigns").select("id, title, status, created_at, birthday_person_id, birthday_date").order("created_at", { ascending: false }).limit(8),
        supabase.from("contributions").select("amount, gifter_name, is_anonymous, anonymous, created_at, campaign_id").order("created_at", { ascending: false }).limit(10),
        // Para el modal de actividad completa: últimos 50 eventos
        supabase.from("contributions").select("amount, gifter_name, is_anonymous, anonymous, created_at, campaign_id").order("created_at", { ascending: false }).limit(50),
      ]);

      const todayStr = new Date().toISOString().split("T")[0];
      const isAnon   = (c) => c.is_anonymous || c.anonymous;

      // KPIs
      const totalUsers      = (profiles ?? []).length;
      const newToday        = (profiles ?? []).filter(p => p.created_at?.startsWith(todayStr)).length;
      // Activos 7d: usa last_sign_in_at si existe, sino created_at
      const activeUsers7d   = (profiles ?? []).filter(p => {
        const ref = p.last_sign_in_at || p.created_at;
        return ref && ref >= daysAgo(7);
      }).length;
      const activeCampaigns = (campaigns ?? []).filter(c => c.status === "active").length;
      const totalCampaigns  = (campaigns ?? []).length;
      const withContribs    = new Set((contributions ?? []).map(c => c.campaign_id)).size;
      const convRate        = activeCampaigns > 0 ? Math.round((withContribs / activeCampaigns) * 100) : 0;
      const totalRaised     = (contributions ?? []).reduce((s, c) => s + (c.amount || 0), 0);
      const totalContribs   = (contributions ?? []).length;
      const avgGift         = totalContribs > 0 ? Math.round(totalRaised / totalContribs) : 0;
      const anonCount       = (contributions ?? []).filter(isAnon).length;
      const anonPct         = totalContribs > 0 ? Math.round((anonCount / totalContribs) * 100) : 0;

      // Mapas
      const profMap = {};
      (profiles ?? []).forEach(p => { profMap[p.id] = p; });
      const campMap = {};
      (campaigns ?? []).forEach(c => { campMap[c.id] = c; });

      // Actividad reciente enriquecida
      const buildActivity = (profs, camps, contrs) => [
        ...(profs ?? []).map(p => ({
          type: "user",
          text: `Nuevo usuario: ${p.name || p.username || "—"}`,
          at: p.created_at, dot: C.success,
          userId: p.id, user: p,
          username: p.username,
        })),
        ...(camps ?? []).map(c => ({
          type: "campaign",
          text: `Nuevo cumpleaños: ${profMap[c.birthday_person_id]?.name || profMap[c.birthday_person_id]?.username || "—"}`,
          at: c.created_at, dot: C.primary,
          username: profMap[c.birthday_person_id]?.username,
          userId: c.birthday_person_id,
          user: profMap[c.birthday_person_id],
        })),
        ...(contrs ?? []).map(c => ({
          type: "contrib",
          text: `${isAnon(c) ? "Anónimo" : (c.gifter_name || "Alguien")} regaló ${fmtARS(c.amount)}`,
          at: c.created_at, dot: C.accent,
          campaignId: c.campaign_id,
          username: campMap[c.campaign_id] ? profMap[campMap[c.campaign_id]?.birthday_person_id]?.username : null,
        })),
      ].sort((a, b) => new Date(b.at) - new Date(a.at));

      const activity    = buildActivity(recentProfiles, recentCampaigns, recentContribs).slice(0, 10);
      // Para el modal: mezcla más completa con allActivity de contributions
      const fullActivity = buildActivity(recentProfiles, recentCampaigns, allActivity).slice(0, 50);

      // Tabla cumpleaños activos
      const activeCampsList = (campaigns ?? [])
        .filter(c => c.status === "active")
        .map(camp => {
          const campContribs = (contributions ?? []).filter(c => c.campaign_id === camp.id);
          const raised = campContribs.reduce((s, c) => s + (c.amount || 0), 0);
          const profile = profMap[camp.birthday_person_id];
          return {
            id: camp.id, username: profile?.username || "—",
            userId: camp.birthday_person_id, user: profile,
            title: camp.title, date: camp.birthday_date,
            contribs: campContribs.length, raised,
          };
        })
        .sort((a, b) => b.raised - a.raised)
        .slice(0, 8);

      setData({
        kpis: { totalUsers, activeUsers7d, newToday, activeCampaigns, totalCampaigns, convRate, totalRaised, totalContribs, avgGift, anonPct, withContribs },
        activity, fullActivity, activeCampsList, rawContribs: contributions ?? [],
      });
      setLastUpdate(new Date());
    } catch (e) { console.error("Dashboard error:", e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { data, loading, reload: load, lastUpdate };
}

// ─── USER MINI MODAL ──────────────────────────────────────────────────────────
function UserMiniModal({ userId, onClose, onNavigate }) {
  const [user,     setUser]     = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [raised,   setRaised]   = useState(0);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("gift_campaigns").select("*").eq("birthday_person_id", userId).order("created_at", { ascending: false }).limit(1).single(),
    ]).then(([{ data: u }, { data: c }]) => {
      setUser(u);
      setCampaign(c);
      if (c) {
        supabase.from("contributions").select("amount").eq("campaign_id", c.id)
          .then(({ data: cs }) => setRaised((cs || []).reduce((s, x) => s + (x.amount || 0), 0)));
      }
      setLoading(false);
    });
  }, [userId]);

  if (!userId) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
      <div style={{
        position: "relative", background: C.surface, borderRadius: 14,
        border: `0.5px solid ${C.border}`, padding: 24, width: 340,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.textMuted }}>✕</button>

        {loading ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: C.textMuted }}>Cargando…</div>
        ) : !user ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: C.textMuted }}>Usuario no encontrado</div>
        ) : (
          <>
            {/* Avatar + nombre */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: C.primaryBg, color: C.primary, fontSize: 22, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `2px solid ${C.primaryBg}` }}>
                {user.avatar_url
                  ? <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (user.name || user.username || "?").slice(0, 2).toUpperCase()
                }
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{user.name || "Sin nombre"}</div>
                <div style={{ fontSize: 12, color: C.primary }}>@{user.username || "—"}</div>
                {user.email && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{user.email}</div>}
              </div>
            </div>

            {/* Info perfil */}
            <div style={{ background: C.bg, borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              {[
                { label: "Rol",          value: user.role || "—" },
                { label: "Registrado",   value: fmtDate(user.created_at) },
                { label: "Cumpleaños",   value: user.birthday ? fmtDate(user.birthday + "T12:00:00") : "—" },
                { label: "Estado",       value: user.is_active !== false ? "✓ Activo" : "✕ Inactivo" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: C.textMuted }}>{label}</span>
                  <span style={{ color: C.text, fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Campaña activa */}
            {campaign && (
              <div style={{ background: C.primaryBg, borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.primaryLight, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Campaña activa</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.primary, marginBottom: 4 }}>{campaign.title || "Sin título"}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: C.primaryLight }}>Recaudado</span>
                  <span style={{ fontWeight: 700, color: C.primary }}>{fmtARS(raised)}</span>
                </div>
                {campaign.goal_amount > 0 && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 2 }}>
                      <span style={{ color: C.primaryLight }}>Meta</span>
                      <span style={{ color: C.primary }}>{fmtARS(campaign.goal_amount)}</span>
                    </div>
                    <div style={{ height: 4, background: C.primaryLight + "44", borderRadius: 9999, marginTop: 6, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min((raised / campaign.goal_amount) * 100, 100)}%`, background: C.primary, borderRadius: 9999 }} />
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              onClick={() => { onNavigate("usuarios"); onClose(); }}
              style={{ width: "100%", padding: "9px 0", borderRadius: 8, border: "none", background: C.primary, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Ver en gestión de usuarios →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── ACTIVITY MODAL ───────────────────────────────────────────────────────────
function ActivityModal({ items, onClose, onUserClick }) {
  const [filter, setFilter] = useState("all");
  const filtered = items.filter(i => filter === "all" || i.type === filter);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
      <div style={{
        position: "relative", background: C.surface, borderRadius: 14,
        border: `0.5px solid ${C.border}`, width: 520, maxHeight: "78vh",
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      }}>
        {/* header */}
        <div style={{ padding: "16px 20px", borderBottom: `0.5px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text, flex: 1 }}>Actividad reciente</span>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.textMuted }}>✕</button>
          </div>
          {/* filtros */}
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { id: "all",      label: "Todo",        count: items.length },
              { id: "user",     label: "Usuarios",    count: items.filter(i => i.type === "user").length },
              { id: "campaign", label: "Cumpleaños",  count: items.filter(i => i.type === "campaign").length },
              { id: "contrib",  label: "Aportes",     count: items.filter(i => i.type === "contrib").length },
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer",
                border: `0.5px solid ${filter === f.id ? C.primary : C.border}`,
                background: filter === f.id ? C.primaryBg : "transparent",
                color: filter === f.id ? C.primary : C.textLight,
                fontWeight: filter === f.id ? 600 : 400,
              }}>
                {f.label} <span style={{ opacity: 0.7 }}>({f.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* lista */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: C.textMuted, fontSize: 13 }}>Sin eventos</div>
          ) : filtered.map((item, i) => (
            <div
              key={i}
              onClick={() => item.userId && onUserClick(item.userId)}
              style={{
                display: "flex", gap: 12, padding: "11px 20px", alignItems: "flex-start",
                borderBottom: i < filtered.length - 1 ? `0.5px solid ${C.border}` : "none",
                cursor: item.userId ? "pointer" : "default",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => { if (item.userId) e.currentTarget.style.background = C.primaryBg; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.dot, flexShrink: 0, marginTop: 5 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.4 }}>{item.text}</div>
                {item.username && (
                  <div style={{ fontSize: 11, color: C.primary, marginTop: 2 }}>@{item.username}</div>
                )}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, flexShrink: 0, paddingTop: 2 }}>{timeAgo(item.at)}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: "10px 20px", borderTop: `0.5px solid ${C.border}`, fontSize: 11, color: C.textMuted, textAlign: "center" }}>
          Mostrando {filtered.length} eventos · Últimas 24–48 horas
        </div>
      </div>
    </div>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, delta, deltaType = "neutral", sub, onClick, active }) {
  const dc = { up: C.success, down: C.error, warn: C.accent, neutral: C.textMuted };
  return (
    <div
      onClick={onClick}
      style={{
        background: active ? C.primaryBg : C.surface,
        border: `${active ? "1.5px" : "0.5px"} solid ${active ? C.primary : C.border}`,
        borderRadius: 10, padding: "14px 16px",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.15s", position: "relative",
      }}
      onMouseEnter={e => { if (onClick && !active) e.currentTarget.style.background = "#F5F3FF"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = C.surface; }}
    >
      {active && (
        <div style={{ position: "absolute", top: 8, right: 8, fontSize: 9, fontWeight: 700, color: C.primary, background: C.primaryLight + "33", padding: "1px 5px", borderRadius: 4 }}>
          ACTIVO
        </div>
      )}
      <div style={{ fontSize: 11, color: active ? C.primary : C.textMuted, marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: active ? C.primary : C.text, lineHeight: 1 }}>{value}</div>
      {delta && <div style={{ fontSize: 10, color: dc[deltaType], marginTop: 5 }}>{delta}</div>}
      {sub && !delta && <div style={{ fontSize: 10, color: active ? C.primaryLight : C.textMuted, marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
      {[["60%", 11], ["40%", 22], ["50%", 10]].map(([w, h], i) => (
        <div key={i} style={{ height: h, background: C.bg, borderRadius: 4, width: w, marginBottom: i < 2 ? 8 : 0 }} />
      ))}
    </div>
  );
}

function Panel({ title, action, onAction, children }) {
  return (
    <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>{title}</span>
        {action && (
          <button onClick={onAction} style={{ fontSize: 11, color: C.primary, background: "none", border: "none", cursor: "pointer" }}>
            {action}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function DonutKpi({ pct, label, sub, color }) {
  const r = 22, circ = 2 * Math.PI * r, dash = Math.min((pct / 100) * circ, circ);
  return (
    <div style={{ background: C.bg, borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
      <svg width={52} height={52} viewBox="0 0 52 52" style={{ flexShrink: 0 }}>
        <circle cx={26} cy={26} r={r} fill="none" stroke={C.border} strokeWidth={6} />
        <circle cx={26} cy={26} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
        />
        <text x={26} y={30} textAnchor="middle" fontSize={12} fontWeight={600} fill={C.text}>{pct}%</text>
      </svg>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{label}</div>
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
}

function MiniLineChart({ contributions }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return { key: d.toISOString().split("T")[0], label: d.toLocaleDateString("es-AR", { weekday: "short" }).slice(0, 1).toUpperCase() };
  });
  const grouped = days.map(({ key, label }) => ({
    label, count: (contributions ?? []).filter(c => c.created_at?.startsWith(key)).length,
  }));
  const maxVal = Math.max(...grouped.map(d => d.count), 1);
  const W = 480, H = 110, PAD = 16;
  const xStep = (W - PAD * 2) / (grouped.length - 1);
  const pts = grouped.map((d, i) => ({ x: PAD + i * xStep, y: H - PAD - ((d.count / maxVal) * (H - PAD * 2)) }));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaD = `${pathD} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
        <defs>
          <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.primary} stopOpacity="0.12" />
            <stop offset="100%" stopColor={C.primary} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#dashGrad)" />
        <path d={pathD} fill="none" stroke={C.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={C.primary} />)}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textMuted, marginTop: 6, padding: "0 2px" }}>
        {grouped.map((d, i) => <span key={i}>{d.label}</span>)}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage({ onNavigate }) {
  const { data, loading, reload, lastUpdate } = useDashboardData();
  const [activeKpi,     setActiveKpi]     = useState(null);
  const [selectedUserId,setSelectedUserId]= useState(null);
  const [showActivity,  setShowActivity]  = useState(false);

  const k = data?.kpis;

  const kpis = [
    { id: "usuarios",   label: "Usuarios totales",    value: fmt(k?.totalUsers),      delta: k?.newToday > 0 ? `▲ ${k.newToday} hoy` : null, deltaType: "up", nav: "usuarios",   filterHint: "total"   },
    { id: "activos7d",  label: "Activos 7 días",      value: fmt(k?.activeUsers7d),   sub: "con actividad reciente", nav: "usuarios",   filterHint: "active"  },
    { id: "cumpleanos", label: "Cumpleaños activos",   value: fmt(k?.activeCampaigns), sub: `de ${fmt(k?.totalCampaigns)} totales`, nav: "cumpleanos", filterHint: "active"  },
    { id: "aportes",    label: "Aportes recibidos",    value: fmt(k?.totalContribs),   sub: "total histórico",        nav: "regalos",    filterHint: "contribs"},
    { id: "recaudado",  label: "Total recaudado",      value: fmtARS(k?.totalRaised),  sub: "suma de aportes",        nav: "finanzas",   filterHint: "resumen" },
    { id: "promedio",   label: "Ticket promedio",      value: fmtARS(k?.avgGift),      sub: "por aporte",             nav: "finanzas",   filterHint: "resumen" },
  ];

  const handleKpiClick = (kpi) => {
    if (activeKpi === kpi.id) {
      // segundo click → navegar
      onNavigate(kpi.nav);
      setActiveKpi(null);
    } else {
      setActiveKpi(kpi.id);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Modales */}
      {selectedUserId && (
        <UserMiniModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onNavigate={onNavigate}
        />
      )}
      {showActivity && (
        <ActivityModal
          items={data?.fullActivity || []}
          onClose={() => setShowActivity(false)}
          onUserClick={(uid) => { setShowActivity(false); setSelectedUserId(uid); }}
        />
      )}

      {/* Banner de KPI activo */}
      {activeKpi && (
        <div style={{
          background: C.primaryBg, border: `1px solid ${C.primary}`,
          borderRadius: 8, padding: "10px 16px",
          display: "flex", alignItems: "center", gap: 10, fontSize: 13,
        }}>
          <span style={{ color: C.primary, flex: 1 }}>
            <strong>{kpis.find(k => k.id === activeKpi)?.label}</strong> seleccionado
            — tocá de nuevo para ir a la vista detallada, o tocá otra tarjeta
          </span>
          <button
            onClick={() => onNavigate(kpis.find(k => k.id === activeKpi)?.nav)}
            style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: C.primary, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            Ver detalle →
          </button>
          <button onClick={() => setActiveKpi(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* KPI GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 10 }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpis.map(kpi => (
              <KpiCard
                key={kpi.id}
                label={kpi.label}
                value={kpi.value}
                delta={kpi.delta}
                deltaType={kpi.deltaType}
                sub={kpi.sub}
                active={activeKpi === kpi.id}
                onClick={() => handleKpiClick(kpi)}
              />
            ))
        }
      </div>

      {/* CHARTS ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14 }}>
        <Panel title="Aportes por día — últimos 7 días">
          {loading
            ? <div style={{ height: 130, background: C.bg, borderRadius: 6 }} />
            : <MiniLineChart contributions={data?.rawContribs} />
          }
        </Panel>

        <Panel title="Conversión">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {loading ? (
              <><div style={{ height: 68, background: C.bg, borderRadius: 8 }} /><div style={{ height: 68, background: C.bg, borderRadius: 8 }} /></>
            ) : (
              <>
                <DonutKpi
                  pct={k?.convRate ?? 0}
                  label="Con al menos 1 aporte"
                  sub={`${k?.withContribs ?? 0} de ${k?.activeCampaigns ?? 0} activos`}
                  color={C.primary}
                />
                <DonutKpi
                  pct={k?.anonPct ?? 0}
                  label="Aportes anónimos"
                  sub={`${k?.totalContribs ?? 0} aportes totales`}
                  color={C.accent}
                />
              </>
            )}
          </div>
        </Panel>
      </div>

      {/* BOTTOM ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14 }}>
        <Panel title="Cumpleaños activos" action="ver todos →" onAction={() => onNavigate("cumpleanos")}>
          {loading ? (
            <div style={{ height: 160, background: C.bg, borderRadius: 6 }} />
          ) : !data?.activeCampsList?.length ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: C.textMuted, fontSize: 12 }}>No hay cumpleaños activos</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["Usuario", "Fecha", "Aportes", "Recaudado"].map(l => (
                    <th key={l} style={{ textAlign: "left", color: C.textMuted, fontWeight: 500, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", padding: "0 0 8px", borderBottom: `0.5px solid ${C.border}` }}>{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.activeCampsList.map((row, i) => (
                  <tr
                    key={row.id}
                    onClick={() => row.userId && setSelectedUserId(row.userId)}
                    style={{ borderBottom: i < data.activeCampsList.length - 1 ? `0.5px solid ${C.border}` : "none", cursor: row.userId ? "pointer" : "default" }}
                    onMouseEnter={e => { if (row.userId) e.currentTarget.style.background = C.primaryBg; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ padding: "8px 0", color: C.primary, fontWeight: 600 }}>{row.username}</td>
                    <td style={{ padding: "8px 0", color: C.textLight }}>{row.date ? `${new Date(row.date + "T12:00:00").getDate()}/${new Date(row.date + "T12:00:00").getMonth() + 1}` : "—"}</td>
                    <td style={{ padding: "8px 0", color: row.contribs === 0 ? C.error : C.textLight, fontWeight: row.contribs === 0 ? 600 : 400 }}>{row.contribs === 0 ? "—" : row.contribs}</td>
                    <td style={{ padding: "8px 0", color: C.text, fontWeight: 500 }}>{fmtARS(row.raised)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Actividad reciente" action="ver todo →" onAction={() => setShowActivity(true)}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ height: 14, background: C.bg, borderRadius: 4, marginBottom: 12 }} />
            ))
          ) : !data?.activity?.length ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: C.textMuted, fontSize: 12 }}>Sin actividad reciente</div>
          ) : (
            data.activity.slice(0, 7).map((item, i) => (
              <div
                key={i}
                onClick={() => item.userId && setSelectedUserId(item.userId)}
                style={{
                  display: "flex", gap: 10, padding: "8px 0",
                  borderBottom: i < Math.min(data.activity.length, 7) - 1 ? `0.5px solid ${C.border}` : "none",
                  alignItems: "flex-start",
                  cursor: item.userId ? "pointer" : "default",
                  transition: "background 0.1s",
                  borderRadius: 6, margin: "0 -4px", padding: "8px 4px",
                }}
                onMouseEnter={e => { if (item.userId) e.currentTarget.style.background = C.primaryBg; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.dot, flexShrink: 0, marginTop: 5 }} />
                <div style={{ flex: 1, fontSize: 12, color: C.textLight, lineHeight: 1.4 }}>
                  {item.text}
                  {item.username && <div style={{ fontSize: 11, color: C.primary, marginTop: 1 }}>@{item.username}</div>}
                </div>
                <div style={{ fontSize: 10, color: C.textMuted, flexShrink: 0, marginTop: 2 }}>{timeAgo(item.at)}</div>
              </div>
            ))
          )}
        </Panel>
      </div>

      {/* FOOTER */}
      {lastUpdate && (
        <div style={{ fontSize: 10, color: C.textMuted, textAlign: "right" }}>
          Actualizado {lastUpdate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
          {" · "}
          <button onClick={reload} style={{ fontSize: 10, color: C.primary, background: "none", border: "none", cursor: "pointer" }}>
            actualizar
          </button>
        </div>
      )}
    </div>
  );
}

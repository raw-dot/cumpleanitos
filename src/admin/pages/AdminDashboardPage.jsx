import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";

const C = {
  primary:     "#7C3AED",
  primaryBg:   "#EDE9FE",
  primaryLight:"#A78BFA",
  accent:      "#F59E0B",
  accentBg:    "#FEF3C7",
  success:     "#10B981",
  successBg:   "#D1FAE5",
  error:       "#EF4444",
  errorBg:     "#FEE2E2",
  text:        "#1F2937",
  textLight:   "#6B7280",
  textMuted:   "#9CA3AF",
  border:      "#E5E7EB",
  surface:     "#FFFFFF",
  bg:          "#F3F4F6",
};

const fmt = (n) => n?.toLocaleString("es-AR") ?? "—";
const fmtARS = (n) => n != null ? `$${Math.round(n).toLocaleString("es-AR")}` : "—";
const fmtDate = (s) => s ? new Date(s).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) : "—";
const timeAgo = (s) => {
  if (!s) return "—";
  const diff = (Date.now() - new Date(s)) / 1000;
  if (diff < 60)    return "ahora";
  if (diff < 3600)  return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} d`;
};
const today = () => new Date().toISOString().split("T")[0];
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

function useDashboardData() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

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
      ] = await Promise.all([
        supabase.from("profiles").select("id, created_at, is_active, username, name"),
        supabase.from("gift_campaigns").select("id, birthday_person_id, status, goal_amount, birthday_date, created_at, title"),
        supabase.from("contributions").select("amount, campaign_id, created_at, gifter_name, anonymous"),
        supabase.from("profiles").select("id, username, name, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("gift_campaigns").select("id, title, status, created_at, birthday_person_id").order("created_at", { ascending: false }).limit(5),
        supabase.from("contributions").select("amount, gifter_name, anonymous, created_at, campaign_id").order("created_at", { ascending: false }).limit(8),
      ]);

      const todayStr       = today();
      const newToday       = (profiles ?? []).filter(p => p.created_at?.startsWith(todayStr)).length;
      const activeUsers7d  = (profiles ?? []).filter(p => p.created_at >= daysAgo(7)).length;
      const totalUsers     = (profiles ?? []).length;
      const activeCampaigns = (campaigns ?? []).filter(c => c.status === "active").length;
      const totalCampaigns  = (campaigns ?? []).length;
      const withContribs   = new Set((contributions ?? []).map(c => c.campaign_id)).size;
      const convRate       = totalCampaigns > 0 ? Math.round((withContribs / totalCampaigns) * 100) : 0;
      const totalRaised    = (contributions ?? []).reduce((s, c) => s + (c.amount || 0), 0);
      const totalContribs  = (contributions ?? []).length;
      const avgGift        = totalContribs > 0 ? totalRaised / totalContribs : 0;
      const anonCount      = (contributions ?? []).filter(c => c.anonymous).length;
      const anonPct        = totalContribs > 0 ? Math.round((anonCount / totalContribs) * 100) : 0;

      const activity = [
        ...(recentProfiles ?? []).map(p => ({ type: "user", text: `Nuevo usuario: ${p.username || p.name || "—"}`, at: p.created_at, dot: C.success })),
        ...(recentCampaigns ?? []).map(c => ({ type: "campaign", text: "Nuevo cumpleaños creado", at: c.created_at, dot: C.primary })),
        ...(recentContribs ?? []).map(c => ({ type: "contrib", text: `${c.anonymous ? "Anónimo" : (c.gifter_name || "Alguien")} regaló ${fmtARS(c.amount)}`, at: c.created_at, dot: C.accent })),
      ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8);

      const activeCampsList = (campaigns ?? [])
        .filter(c => c.status === "active")
        .slice(0, 6)
        .map(camp => {
          const campContribs = (contributions ?? []).filter(c => c.campaign_id === camp.id);
          const raised = campContribs.reduce((s, c) => s + (c.amount || 0), 0);
          const profile = (profiles ?? []).find(p => p.id === camp.birthday_person_id);
          return { id: camp.id, username: profile?.username || "—", title: camp.title || "Sin título", date: camp.birthday_date, contribs: campContribs.length, raised };
        })
        .sort((a, b) => b.raised - a.raised);

      setData({ kpis: { totalUsers, activeUsers7d, newToday, activeCampaigns, totalCampaigns, convRate, totalRaised, totalContribs, avgGift, anonPct }, activity, activeCampsList });
      setLastUpdate(new Date());
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { data, loading, reload: load, lastUpdate };
}

function KpiCard({ label, value, delta, deltaType = "neutral", sub }) {
  const dc = { up: C.success, down: C.error, warn: C.accent, neutral: C.textMuted };
  return (
    <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: C.text, lineHeight: 1 }}>{value}</div>
      {delta && <div style={{ fontSize: 10, color: dc[deltaType], marginTop: 5 }}>{delta}</div>}
      {sub && !delta && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 5 }}>{sub}</div>}
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

function Panel({ title, action, children }) {
  return (
    <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>{title}</span>
        {action && <span style={{ fontSize: 11, color: C.primary, cursor: "pointer" }}>{action}</span>}
      </div>
      {children}
    </div>
  );
}

function DonutKpi({ pct, label, sub, color }) {
  const r = 22, circ = 2 * Math.PI * r, dash = (pct / 100) * circ;
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

function ActivityFeed({ items }) {
  if (!items?.length) return <div style={{ textAlign: "center", padding: "24px 0", color: C.textMuted, fontSize: 12 }}>Sin actividad reciente</div>;
  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < items.length - 1 ? `0.5px solid ${C.border}` : "none", alignItems: "flex-start" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.dot, flexShrink: 0, marginTop: 5 }} />
          <div style={{ flex: 1, fontSize: 12, color: C.textLight, lineHeight: 1.4 }}>{item.text}</div>
          <div style={{ fontSize: 10, color: C.textMuted, flexShrink: 0, marginTop: 2 }}>{timeAgo(item.at)}</div>
        </div>
      ))}
    </div>
  );
}

function CampaignsTable({ rows }) {
  if (!rows?.length) return <div style={{ textAlign: "center", padding: "24px 0", color: C.textMuted, fontSize: 12 }}>No hay cumpleaños activos</div>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead>
        <tr>
          {["Usuario", "Fecha", "Aportes", "Recaudado"].map(label => (
            <th key={label} style={{ textAlign: "left", color: C.textMuted, fontWeight: 500, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", padding: "0 0 8px", borderBottom: `0.5px solid ${C.border}` }}>{label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.id}>
            <td style={{ padding: "8px 0", borderBottom: i < rows.length - 1 ? `0.5px solid ${C.border}` : "none", color: C.primary, fontWeight: 600 }}>{row.username}</td>
            <td style={{ padding: "8px 0", borderBottom: i < rows.length - 1 ? `0.5px solid ${C.border}` : "none", color: C.textLight }}>{fmtDate(row.date)}</td>
            <td style={{ padding: "8px 0", borderBottom: i < rows.length - 1 ? `0.5px solid ${C.border}` : "none", color: row.contribs === 0 ? C.error : C.textLight, fontWeight: row.contribs === 0 ? 600 : 400 }}>{row.contribs === 0 ? "—" : row.contribs}</td>
            <td style={{ padding: "8px 0", borderBottom: i < rows.length - 1 ? `0.5px solid ${C.border}` : "none", color: C.text, fontWeight: 500 }}>{fmtARS(row.raised)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MiniLineChart({ contributions }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return { key: d.toISOString().split("T")[0], label: d.toLocaleDateString("es-AR", { weekday: "short" }).slice(0, 1).toUpperCase() };
  });
  const grouped = days.map(({ key, label }) => ({
    label,
    count: (contributions ?? []).filter(c => c.created_at?.startsWith(key)).length,
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
          <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.primary} stopOpacity="0.12" />
            <stop offset="100%" stopColor={C.primary} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#adminGrad)" />
        <path d={pathD} fill="none" stroke={C.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={C.primary} />)}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textMuted, marginTop: 6, padding: "0 2px" }}>
        {grouped.map((d, i) => <span key={i}>{d.label}</span>)}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, loading, reload, lastUpdate } = useDashboardData();
  const [rawContribs, setRawContribs] = useState(null);

  useEffect(() => {
    supabase.from("contributions").select("amount, created_at").gte("created_at", daysAgo(7)).then(({ data }) => setRawContribs(data));
  }, []);

  const k = data?.kpis;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* KPI GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 10 }}>
        {loading ? Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />) : [
          { label: "Usuarios totales",    value: fmt(k?.totalUsers),      delta: k?.newToday > 0 ? `▲ ${k.newToday} hoy` : null, deltaType: "up" },
          { label: "Activos 7 días",      value: fmt(k?.activeUsers7d),   sub: "nuevos registros" },
          { label: "Cumpleaños activos",  value: fmt(k?.activeCampaigns), sub: `de ${fmt(k?.totalCampaigns)} totales` },
          { label: "Aportes recibidos",   value: fmt(k?.totalContribs),   sub: "total histórico" },
          { label: "Total recaudado",     value: fmtARS(k?.totalRaised),  sub: "suma de aportes" },
          { label: "Ticket promedio",     value: fmtARS(k?.avgGift),      sub: "por aporte" },
        ].map((kpi, i) => <KpiCard key={i} {...kpi} />)}
      </div>

      {/* CHARTS ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14 }}>
        <Panel title="Aportes por día — últimos 7 días">
          {loading || !rawContribs
            ? <div style={{ height: 130, background: C.bg, borderRadius: 6 }} />
            : <MiniLineChart contributions={rawContribs} />
          }
        </Panel>
        <Panel title="Conversión">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {loading ? (
              <><div style={{ height: 68, background: C.bg, borderRadius: 8 }} /><div style={{ height: 68, background: C.bg, borderRadius: 8 }} /></>
            ) : (
              <>
                <DonutKpi pct={k?.convRate ?? 0} label="Con al menos 1 aporte" sub="de cumpleaños activos" color={C.primary} />
                <DonutKpi pct={k?.anonPct ?? 0} label="Aportes anónimos" sub="del total de aportes" color={C.accent} />
              </>
            )}
          </div>
        </Panel>
      </div>

      {/* BOTTOM ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14 }}>
        <Panel title="Cumpleaños activos" action="ver todos →">
          {loading ? <div style={{ height: 160, background: C.bg, borderRadius: 6 }} /> : <CampaignsTable rows={data?.activeCampsList} />}
        </Panel>
        <Panel title="Actividad reciente" action="ver todo →">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ height: 14, background: C.bg, borderRadius: 4, marginBottom: 12 }} />)
            : <ActivityFeed items={data?.activity} />
          }
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

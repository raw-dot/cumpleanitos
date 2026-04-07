import { useState, useEffect, useCallback } from "react";
import { rg } from "../useAdminBreakpoint";
import { useAdmin } from "../AdminContext";
import { supabase } from "../../supabaseClient";
import { ensureAdminSession } from "../adminFetch";

const C = {
  primary:   "#7C3AED", primaryBg: "#EDE9FE", primaryLight: "#A78BFA",
  accent:    "#F59E0B", accentBg:  "#FEF3C7",
  success:   "#10B981", successBg: "#D1FAE5",
  error:     "#EF4444", errorBg:   "#FEE2E2",
  text:      "#1F2937", textLight: "#6B7280", textMuted: "#9CA3AF",
  border:    "#E5E7EB", surface:   "#FFFFFF", bg: "#F3F4F6",
};

const fmt     = (n) => n != null ? n.toLocaleString("es-AR") : "—";
const fmtARS  = (n) => n != null ? `$${Math.round(n).toLocaleString("es-AR")}` : "$0";
const fmtDate = (s) => s ? new Date(s).toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit", year:"2-digit" }) : "—";
const fmtShort= (s) => s ? new Date(s + "T12:00:00").toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit" }) : "—";
const timeAgo = (s) => {
  if (!s) return "—";
  const d = (Date.now() - new Date(s)) / 1000;
  if (d < 60)    return "ahora";
  if (d < 3600)  return `${Math.floor(d/60)} min`;
  if (d < 86400) return `${Math.floor(d/3600)} h`;
  return `${Math.floor(d/86400)} d`;
};
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const isAnon  = (c) => c.is_anonymous || c.anonymous;

// ─── HOOK ─────────────────────────────────────────────────────────────────────
function useDashboard() {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [lastUpdate,setLastUpdate]= useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Verificar sesión antes de queries — refresca si está por expirar
      await ensureAdminSession();
      // Todas las queries en paralelo
      const [r1, r2, r3, r4, r5, r6] = await Promise.all([
        supabase.from("profiles").select("id, created_at, is_active, username, name, email, role, birthday, avatar_url"),
        supabase.from("gift_campaigns").select("id, birthday_person_id, status, goal_amount, birthday_date, created_at, title"),
        supabase.from("contributions").select("id, amount, campaign_id, created_at, gifter_name, is_anonymous, anonymous"),
        supabase.from("profiles").select("id, username, name, created_at, role, email, birthday, avatar_url").order("created_at", { ascending: false }).limit(8),
        supabase.from("gift_campaigns").select("id, title, status, created_at, birthday_person_id, birthday_date").order("created_at", { ascending: false }).limit(8),
        supabase.from("contributions").select("id, amount, gifter_name, is_anonymous, anonymous, created_at, campaign_id").order("created_at", { ascending: false }).limit(15),
      ]);

      const profiles      = r1.data || [];
      const campaigns     = r2.data || [];
      const contributions = r3.data || [];
      const recentProfs   = r4.data || [];
      const recentCamps   = r5.data || [];
      const recentContrs  = r6.data || [];

      // ── MAPAS ──
      const profMap = {};
      profiles.forEach(p => { profMap[p.id] = p; });

      // ── KPIs ──
      const todayStr        = new Date().toISOString().split("T")[0];
      const totalUsers      = profiles.length;
      const newToday        = profiles.filter(p => p.created_at?.startsWith(todayStr)).length;
      const activeUsers7d   = profiles.filter(p => p.created_at >= daysAgo(7)).length;
      const totalCampaigns  = campaigns.length;
      const activeCampaigns = campaigns.filter(c => c.status === "active").length;
      const totalContribs   = contributions.length;
      const totalRaised     = contributions.reduce((s, c) => s + (c.amount || 0), 0);
      const avgGift         = totalContribs > 0 ? Math.round(totalRaised / totalContribs) : 0;
      const withContribs    = new Set(contributions.map(c => c.campaign_id)).size;
      const convRate        = activeCampaigns > 0 ? Math.round((withContribs / activeCampaigns) * 100) : 0;
      const anonCount       = contributions.filter(isAnon).length;
      const anonPct         = totalContribs > 0 ? Math.round((anonCount / totalContribs) * 100) : 0;

      // ── TABLA ACTIVOS ──
      const campContribMap = {};
      contributions.forEach(c => {
        if (!campContribMap[c.campaign_id]) campContribMap[c.campaign_id] = [];
        campContribMap[c.campaign_id].push(c);
      });

      const activeCampsList = campaigns
        .filter(c => c.status === "active")
        .map(c => {
          const cs    = campContribMap[c.id] || [];
          const raised= cs.reduce((s, x) => s + (x.amount || 0), 0);
          const prof  = profMap[c.birthday_person_id];
          return { id: c.id, username: prof?.username || "—", userId: c.birthday_person_id, user: prof, title: c.title, date: c.birthday_date, contribs: cs.length, raised };
        })
        .sort((a, b) => b.raised - a.raised);

      // ── ACTIVIDAD ──
      const activity = [
        ...recentProfs.map(p => ({ type: "user", text: `Nuevo usuario: ${p.name || p.username || "—"}`, at: p.created_at, dot: C.success, user: p, username: p.username })),
        ...recentCamps.map(c => ({ type: "campaign", text: `Nuevo cumpleaños: ${profMap[c.birthday_person_id]?.name || profMap[c.birthday_person_id]?.username || "—"}`, at: c.created_at, dot: C.primary, user: profMap[c.birthday_person_id], username: profMap[c.birthday_person_id]?.username })),
        ...recentContrs.map(c => ({ type: "contrib", text: `${isAnon(c) ? "Anónimo" : (c.gifter_name || "Alguien")} regaló ${fmtARS(c.amount)}`, at: c.created_at, dot: C.accent })),
      ].sort((a, b) => new Date(b.at) - new Date(a.at));

      // ── GRÁFICO 7D ── (aportes por día)
      const chart7d = Array.from({ length: 7 }, (_, i) => {
        const d   = new Date(Date.now() - (6 - i) * 86400000);
        const key = d.toISOString().split("T")[0];
        const label = d.toLocaleDateString("es-AR", { weekday: "short" }).slice(0, 1).toUpperCase();
        return { key, label, count: contributions.filter(c => c.created_at?.startsWith(key)).length };
      });

      setData({ kpis: { totalUsers, newToday, activeUsers7d, totalCampaigns, activeCampaigns, totalContribs, totalRaised, avgGift, withContribs, convRate, anonCount, anonPct }, activeCampsList, activity, chart7d });
      setLastUpdate(new Date());
    } catch(e) {
      console.error("Dashboard error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { data, loading, reload: load, lastUpdate };
}

// ─── USER MODAL ───────────────────────────────────────────────────────────────
function UserModal({ user, onClose, onNavigate }) {
  if (!user) return null;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:600, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.4)" }} />
      <div style={{ position:"relative", background:C.surface, borderRadius:14, border:`0.5px solid ${C.border}`, padding:24, width:320, fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", boxShadow:"0 8px 32px rgba(0,0,0,0.15)" }}>
        <button onClick={onClose} style={{ position:"absolute", top:14, right:14, background:"none", border:"none", cursor:"pointer", fontSize:18, color:C.textMuted }}>✕</button>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, marginBottom:16 }}>
          <div style={{ width:56, height:56, borderRadius:"50%", background:C.primaryBg, color:C.primary, fontSize:20, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
            {user.avatar_url
              ? <img src={user.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              : (user.name || user.username || "?").slice(0,2).toUpperCase()
            }
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:16, fontWeight:700, color:C.text }}>{user.name || "Sin nombre"}</div>
            <div style={{ fontSize:12, color:C.primary }}>@{user.username || "—"}</div>
          </div>
        </div>
        <div style={{ background:C.bg, borderRadius:8, padding:12, display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
          {[
            { label:"Email",      value: user.email || "—"     },
            { label:"Rol",        value: user.role  || "—"     },
            { label:"Registrado", value: fmtDate(user.created_at) },
            { label:"Cumpleaños", value: user.birthday ? fmtShort(user.birthday) : "—" },
            { label:"Estado",     value: user.is_active === false ? "Inactivo" : "Activo" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
              <span style={{ color:C.textMuted }}>{label}</span>
              <span style={{ color:C.text, fontWeight:500 }}>{value}</span>
            </div>
          ))}
        </div>
        <button onClick={() => { onNavigate("usuarios"); onClose(); }} style={{ width:"100%", padding:"9px 0", borderRadius:8, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>
          Ver en gestión de usuarios →
        </button>
      </div>
    </div>
  );
}

// ─── ACTIVITY MODAL ───────────────────────────────────────────────────────────
function ActivityModal({ items, onClose, onUserClick }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:600, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.4)" }} />
      <div style={{ position:"relative", background:C.surface, borderRadius:14, border:`0.5px solid ${C.border}`, width:480, maxHeight:"70vh", display:"flex", flexDirection:"column", boxShadow:"0 8px 32px rgba(0,0,0,0.15)" }}>
        <div style={{ padding:"16px 20px", borderBottom:`0.5px solid ${C.border}`, display:"flex", alignItems:"center", fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
          <span style={{ fontSize:15, fontWeight:700, color:C.text, flex:1 }}>Actividad reciente</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:C.textMuted }}>✕</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"4px 0", fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
          {items.length === 0
            ? <div style={{ padding:"32px 20px", textAlign:"center", color:C.textMuted, fontSize:13 }}>Sin actividad</div>
            : items.map((item, i) => (
                <div key={i} onClick={() => item.user && (onUserClick(item.user), onClose())}
                  style={{ display:"flex", gap:12, padding:"10px 20px", alignItems:"flex-start", borderBottom:i < items.length-1 ? `0.5px solid ${C.border}` : "none", cursor:item.user ? "pointer" : "default" }}
                  onMouseEnter={e => { if (item.user) e.currentTarget.style.background = C.primaryBg; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ width:8, height:8, borderRadius:"50%", background:item.dot, flexShrink:0, marginTop:5 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:C.text }}>{item.text}</div>
                    {item.username && <div style={{ fontSize:11, color:C.primary, marginTop:2 }}>@{item.username}</div>}
                  </div>
                  <div style={{ fontSize:11, color:C.textMuted, flexShrink:0 }}>{timeAgo(item.at)}</div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, delta, deltaType, onClick, active }) {
  const dc = { up:C.success, down:C.error, warn:C.accent, neutral:C.textMuted };
  return (
    <div onClick={onClick}
      style={{ background: active ? C.primaryBg : C.surface, border:`${active?"1.5px":"0.5px"} solid ${active ? C.primary : C.border}`, borderRadius:10, padding:"14px 16px", cursor:onClick?"pointer":"default", transition:"all 0.12s" }}
      onMouseEnter={e => { if(onClick) e.currentTarget.style.background = C.primaryBg; }}
      onMouseLeave={e => { if(!active) e.currentTarget.style.background = C.surface; }}
    >
      <div style={{ fontSize:11, color:active?C.primary:C.textMuted, marginBottom:6, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700, color:active?C.primary:C.text, lineHeight:1 }}>{value}</div>
      {delta  && <div style={{ fontSize:10, color:dc[deltaType]||C.textMuted, marginTop:5 }}>{delta}</div>}
      {sub && !delta && <div style={{ fontSize:10, color:active?C.primaryLight:C.textMuted, marginTop:5 }}>{sub}</div>}
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div style={{ background:C.surface, border:`0.5px solid ${C.border}`, borderRadius:10, padding:"14px 16px" }}>
      {[["60%",11],["40%",22],["50%",10]].map(([w,h],i)=>(
        <div key={i} style={{ height:h, background:C.bg, borderRadius:4, width:w, marginBottom:i<2?8:0 }} />
      ))}
    </div>
  );
}

// ─── DONUT ────────────────────────────────────────────────────────────────────
function Donut({ pct, label, sub, color }) {
  const r=22, circ=2*Math.PI*r, dash=(Math.min(pct,100)/100)*circ;
  return (
    <div style={{ background:C.bg, borderRadius:8, padding:"12px 14px", display:"flex", alignItems:"center", gap:12 }}>
      <svg width={52} height={52} viewBox="0 0 52 52" style={{ flexShrink:0 }}>
        <circle cx={26} cy={26} r={r} fill="none" stroke={C.border} strokeWidth={6}/>
        <circle cx={26} cy={26} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ*0.25}
          strokeLinecap="round"
          style={{ transform:"rotate(-90deg)", transformOrigin:"50% 50%" }}
        />
        <text x={26} y={30} textAnchor="middle" fontSize={12} fontWeight={600} fill={C.text}>{pct}%</text>
      </svg>
      <div>
        <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{label}</div>
        <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{sub}</div>
      </div>
    </div>
  );
}

// ─── LINE CHART ───────────────────────────────────────────────────────────────
function LineChart({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const W=480, H=110, PAD=16;
  const xStep = (W - PAD*2) / (data.length-1);
  const pts = data.map((d,i) => ({ x: PAD + i*xStep, y: H - PAD - ((d.count/max) * (H-PAD*2)) }));
  const pathD = pts.map((p,i) => `${i===0?"M":"L"}${p.x},${p.y}`).join(" ");
  const areaD = `${pathD} L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`;
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display:"block" }}>
        <defs>
          <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.primary} stopOpacity="0.12"/>
            <stop offset="100%" stopColor={C.primary} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#dg)"/>
        <path d={pathD} fill="none" stroke={C.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p,i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={C.primary}/>)}
      </svg>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:C.textMuted, marginTop:6, padding:"0 2px" }}>
        {data.map((d,i) => <span key={i}>{d.label}</span>)}
      </div>
    </div>
  );
}

// ─── PANEL ────────────────────────────────────────────────────────────────────
function Panel({ title, action, onAction, children }) {
  return (
    <div style={{ background:C.surface, border:`0.5px solid ${C.border}`, borderRadius:10, padding:16 }}>
      <div style={{ display:"flex", alignItems:"center", marginBottom:14 }}>
        <span style={{ fontSize:13, fontWeight:600, color:C.text, flex:1 }}>{title}</span>
        {action && <button onClick={onAction} style={{ fontSize:11, color:C.primary, background:"none", border:"none", cursor:"pointer" }}>{action}</button>}
      </div>
      {children}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage({ onNavigate }) {
  const { isMobile } = useAdmin();
  const { data, loading, reload, lastUpdate } = useDashboard();
  const [activeKpi,    setActiveKpi]    = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showActivity, setShowActivity] = useState(false);

  const k = data?.kpis;

  const KPIS = [
    { id:"usuarios",   label:"Usuarios totales",   value: fmt(k?.totalUsers),      delta: k?.newToday > 0 ? `▲ ${k.newToday} hoy` : null, deltaType:"up", nav:"usuarios" },
    { id:"activos",    label:"Activos 7 días",      value: fmt(k?.activeUsers7d),   sub:"nuevos registros",                                                 nav:"usuarios" },
    { id:"cumpleanos", label:"Cumpleaños activos",  value: fmt(k?.activeCampaigns), sub:`de ${fmt(k?.totalCampaigns)} totales`,                             nav:"cumpleanos" },
    { id:"aportes",    label:"Aportes recibidos",   value: fmt(k?.totalContribs),   sub:"total histórico",                                                  nav:"regalos" },
    { id:"recaudado",  label:"Total recaudado",     value: fmtARS(k?.totalRaised),  sub:"suma de aportes",                                                  nav:"finanzas" },
    { id:"promedio",   label:"Ticket promedio",     value: fmtARS(k?.avgGift),      sub:"por aporte",                                                       nav:"finanzas" },
  ];

  const handleKpi = (kpi) => {
    setActiveKpi(kpi.id);
    setTimeout(() => { setActiveKpi(null); onNavigate(kpi.nav); }, 250);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {selectedUser && <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} onNavigate={onNavigate} />}
      {showActivity  && <ActivityModal items={data?.activity || []} onClose={() => setShowActivity(false)} onUserClick={setSelectedUser} />}

      {/* KPI GRID */}
      <div style={{ display:"grid", gridTemplateColumns: rg.kpi6(isMobile), gap:10 }}>
        {loading
          ? Array.from({length:6}).map((_,i) => <KpiSkeleton key={i}/>)
          : KPIS.map(kpi => (
              <KpiCard key={kpi.id} {...kpi} active={activeKpi===kpi.id} onClick={() => handleKpi(kpi)} />
            ))
        }
      </div>

      {!loading && <div style={{ fontSize:10, color:C.textMuted, textAlign:"right", marginTop:-8 }}>↑ Tocá una tarjeta para ir al módulo</div>}

      {/* CHARTS */}
      <div style={{ display:"grid", gridTemplateColumns: rg.chartPanel(isMobile), gap:14 }}>
        <Panel title="Aportes por día — últimos 7 días">
          {loading
            ? <div style={{ height:130, background:C.bg, borderRadius:6 }}/>
            : data?.chart7d && <LineChart data={data.chart7d}/>
          }
        </Panel>

        <Panel title="Conversión">
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {loading ? (
              <><div style={{ height:68, background:C.bg, borderRadius:8 }}/><div style={{ height:68, background:C.bg, borderRadius:8 }}/></>
            ) : (<>
              <Donut
                pct={k?.convRate ?? 0}
                label="Con al menos 1 aporte"
                sub={`${k?.withContribs ?? 0} de ${k?.activeCampaigns ?? 0} activos`}
                color={C.primary}
              />
              <Donut
                pct={k?.anonPct ?? 0}
                label="Aportes anónimos"
                sub={`${k?.anonCount ?? 0} de ${k?.totalContribs ?? 0} totales`}
                color={C.accent}
              />
            </>)}
          </div>
        </Panel>
      </div>

      {/* BOTTOM */}
      <div style={{ display:"grid", gridTemplateColumns: rg.tablePanel(isMobile), gap:14 }}>

        {/* Tabla cumpleaños activos */}
        <Panel title="Cumpleaños activos" action="ver todos →" onAction={() => onNavigate("cumpleanos")}>
          {loading
            ? <div style={{ height:160, background:C.bg, borderRadius:6 }}/>
            : !data?.activeCampsList?.length
              ? <div style={{ padding:"24px 0", textAlign:"center", color:C.textMuted, fontSize:12 }}>Sin cumpleaños activos</div>
              : (
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr>
                      {["Usuario","Fecha","Aportes","Recaudado"].map(l => (
                        <th key={l} style={{ textAlign:"left", color:C.textMuted, fontWeight:500, fontSize:10, textTransform:"uppercase", letterSpacing:"0.05em", padding:"0 0 8px", borderBottom:`0.5px solid ${C.border}` }}>{l}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.activeCampsList.map((row, i) => (
                      <tr key={row.id}>
                        <td style={{ padding:"8px 0", borderBottom: i < data.activeCampsList.length-1 ? `0.5px solid ${C.border}` : "none" }}>
                          <button
                            onClick={() => row.user && setSelectedUser(row.user)}
                            style={{ background:"none", border:"none", padding:0, cursor:row.user?"pointer":"default", color:C.primary, fontWeight:600, fontSize:12, textDecoration:row.user?"underline":"none", textDecorationStyle:"dotted" }}
                          >
                            {row.username}
                          </button>
                        </td>
                        <td style={{ padding:"8px 0", borderBottom: i < data.activeCampsList.length-1 ? `0.5px solid ${C.border}` : "none", color:C.textLight }}>
                          {fmtShort(row.date)}
                        </td>
                        <td style={{ padding:"8px 0", borderBottom: i < data.activeCampsList.length-1 ? `0.5px solid ${C.border}` : "none", color:row.contribs===0?C.error:C.textLight, fontWeight:row.contribs===0?600:400 }}>
                          {row.contribs===0?"—":row.contribs}
                        </td>
                        <td style={{ padding:"8px 0", borderBottom: i < data.activeCampsList.length-1 ? `0.5px solid ${C.border}` : "none", color:C.text, fontWeight:500 }}>
                          {fmtARS(row.raised)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
          }
        </Panel>

        {/* Feed actividad */}
        <Panel title="Actividad reciente" action="ver todo →" onAction={() => setShowActivity(true)}>
          {loading
            ? Array.from({length:5}).map((_,i) => <div key={i} style={{ height:14, background:C.bg, borderRadius:4, marginBottom:12 }}/>)
            : !data?.activity?.length
              ? <div style={{ padding:"16px 0", textAlign:"center", color:C.textMuted, fontSize:12 }}>Sin actividad</div>
              : data.activity.slice(0,7).map((item,i) => (
                  <div key={i}
                    onClick={() => item.user && setSelectedUser(item.user)}
                    style={{ display:"flex", gap:10, padding:"8px 0", borderBottom: i<6 ? `0.5px solid ${C.border}` : "none", alignItems:"flex-start", cursor:item.user?"pointer":"default" }}
                    onMouseEnter={e => { if(item.user) e.currentTarget.style.background=C.primaryBg; }}
                    onMouseLeave={e => { e.currentTarget.style.background="transparent"; }}
                  >
                    <div style={{ width:6, height:6, borderRadius:"50%", background:item.dot, flexShrink:0, marginTop:5 }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:C.textLight, lineHeight:1.4 }}>{item.text}</div>
                      {item.username && <div style={{ fontSize:11, color:C.primary, marginTop:2 }}>@{item.username}</div>}
                    </div>
                    <div style={{ fontSize:10, color:C.textMuted, flexShrink:0, marginTop:2 }}>{timeAgo(item.at)}</div>
                  </div>
                ))
          }
        </Panel>
      </div>

      {/* Footer */}
      {lastUpdate && (
        <div style={{ fontSize:10, color:C.textMuted, textAlign:"right" }}>
          Actualizado {lastUpdate.toLocaleTimeString("es-AR", { hour:"2-digit", minute:"2-digit" })}
          {" · "}
          <button onClick={reload} style={{ fontSize:10, color:C.primary, background:"none", border:"none", cursor:"pointer" }}>actualizar</button>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "../AdminContext";
import { supabase } from "../../supabaseClient";
import { ensureAdminSession } from "../adminFetch";

const C = {
  primary:   "#7C3AED", primaryBg: "#EDE9FE", primaryLight: "#A78BFA",
  accent:    "#F59E0B", accentBg:  "#FEF3C7",
  success:   "#10B981", successBg: "#D1FAE5",
  error:     "#EF4444", errorBg:   "#FEE2E2",
  info:      "#3B82F6", infoBg:    "#EFF6FF",
  text:      "#1F2937", textLight: "#6B7280", textMuted: "#9CA3AF",
  border:    "#E5E7EB", surface:   "#FFFFFF", bg: "#F3F4F6",
};

const fmtARS  = (n) => n != null ? `$${Math.round(n).toLocaleString("es-AR")}` : "$0";
const fmtPct  = (n) => `${Math.round(n || 0)}%`;
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

const TABS = [
  { id: "conversion",   label: "Conversión"   },
  { id: "temporal",     label: "Tendencias"   },
  { id: "demografico",  label: "Demográfico"  },
];

// ─── HOOK ─────────────────────────────────────────────────────────────────────
function useAnalytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await ensureAdminSession();
    const [r1, r2, r3, r4] = await Promise.all([
      supabase.from("profiles").select("id, created_at, role, birthday, age, is_active, username, name"),
      supabase.from("gift_campaigns").select("id, birthday_person_id, status, goal_amount, created_at, birthday_date"),
      supabase.from("contributions").select("id, campaign_id, amount, created_at, is_anonymous, anonymous"),
      supabase.from("gift_items").select("id, campaign_id, price, created_at"),
    ]);

    if (r1.error) console.error("profiles error:", r1.error);
    if (r2.error) console.error("campaigns error:", r2.error);
    if (r3.error) console.error("contributions error:", r3.error);

    const profiles      = r1.data || [];
    const campaigns     = r2.data || [];
    const contributions = r3.data || [];
    const items         = r4.data || [];

    // ── CONVERSIÓN ──────────────────────────────────────────────────────────
    const totalUsers       = profiles.length;
    // Usuarios únicos que tienen al menos 1 campaña
    const usersWithCamp    = new Set(campaigns.map(c => c.birthday_person_id)).size;
    // Campañas que tienen al menos 1 aporte
    const campWithContrib  = new Set(contributions.map(c => c.campaign_id)).size;
    const totalCamps       = campaigns.length;
    const activeCamps      = campaigns.filter(c => c.status === "active").length;
    const totalContribs    = contributions.length;
    const totalRaised      = contributions.reduce((s, c) => s + (c.amount || 0), 0);

    // Embudo consistente: todos en la misma unidad (usuarios)
    // Usuarios sin campaña = no llegaron al paso 2
    const usersNoCamp = totalUsers - usersWithCamp;
    // De los que tienen campaña, cuántos recibieron al menos 1 aporte
    const campIdSet = new Set(campaigns.map(c => c.id));
    const campIdsWithContrib = new Set(contributions.map(c => c.campaign_id));
    const usersWithContrib = campaigns
      .filter(c => campIdsWithContrib.has(c.id))
      .map(c => c.birthday_person_id);
    const usersWithContribUnique = new Set(usersWithContrib).size;

    // Conversiones bien calculadas
    const convUserToCamp    = totalUsers    > 0 ? (usersWithCamp / totalUsers) * 100 : 0;
    const convCampToContrib = usersWithCamp > 0 ? (usersWithContribUnique / usersWithCamp) * 100 : 0;

    // Promedios (sobre campañas que tienen aportes, no sobre todas)
    const avgContribPerCamp = campWithContrib > 0 ? totalContribs / campWithContrib : 0;
    const avgRaisedPerCamp  = campWithContrib > 0 ? totalRaised / campWithContrib : 0;
    const avgRaisedPerUser  = usersWithCamp > 0 ? totalRaised / usersWithCamp : 0;
    const anonPct           = totalContribs > 0
      ? (contributions.filter(c => c.is_anonymous || c.anonymous).length / totalContribs) * 100
      : 0;
    const withGoal          = campaigns.filter(c => c.goal_amount > 0);
    const reachedGoal       = withGoal.filter(c => {
      const campContribs = contributions.filter(x => x.campaign_id === c.id);
      const raised = campContribs.reduce((s, x) => s + (x.amount || 0), 0);
      return raised >= c.goal_amount;
    });
    const goalReachedPct = withGoal.length > 0 ? (reachedGoal.length / withGoal.length) * 100 : 0;

    // Tiempo hasta primer aporte (días desde creación de campaña)
    const campContribMap = {};
    contributions.forEach(c => {
      if (!campContribMap[c.campaign_id] || c.created_at < campContribMap[c.campaign_id])
        campContribMap[c.campaign_id] = c.created_at;
    });
    const campCreatedMap = {};
    campaigns.forEach(c => { campCreatedMap[c.id] = c.created_at; });
    const daysToFirstContrib = Object.entries(campContribMap)
      .map(([cid, firstAt]) => {
        const created = campCreatedMap[cid];
        if (!created || !firstAt) return null;
        return (new Date(firstAt) - new Date(created)) / 86400000;
      })
      .filter(d => d !== null && d >= 0);
    const avgDaysToFirst = daysToFirstContrib.length > 0
      ? daysToFirstContrib.reduce((s, d) => s + d, 0) / daysToFirstContrib.length
      : null;

    // ── TEMPORAL ────────────────────────────────────────────────────────────
    // Registros por día (últimos 30 días)
    const last30 = daysAgo(30);
    const days30 = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(Date.now() - (29 - i) * 86400000);
      return d.toISOString().split("T")[0];
    });

    const regByDay = days30.map(day => ({
      day,
      label: new Date(day + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "numeric" }),
      users:    (profiles    || []).filter(p => p.created_at?.startsWith(day)).length,
      camps:    (campaigns   || []).filter(c => c.created_at?.startsWith(day)).length,
      contribs: contributions.filter(c => c.created_at?.startsWith(day)).length,
      raised:   contributions.filter(c => c.created_at?.startsWith(day)).reduce((s, c) => s + (c.amount || 0), 0),
    }));

    // Aportes por hora del día
    const hourBuckets = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0, label: `${h}h` }));
    contributions.forEach(c => {
      if (!c.created_at) return;
      const h = new Date(c.created_at).getHours();
      hourBuckets[h].count++;
    });

    // Aportes por día de semana
    const weekBuckets = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(label => ({ label, count: 0 }));
    contributions.forEach(c => {
      if (!c.created_at) return;
      weekBuckets[new Date(c.created_at).getDay()].count++;
    });

    // ── DEMOGRÁFICO ──────────────────────────────────────────────────────────
    // Distribución por rol — contar todos los valores reales
    const allRoles = profiles.map(p => p.role || "sin_rol");
    const roleCount = allRoles.reduce((acc, r) => { acc[r] = (acc[r] || 0) + 1; return acc; }, {});
    const roleDist = {
      celebrant: roleCount["celebrant"] || 0,
      manager:   roleCount["manager"]   || 0,
      gifter:    roleCount["gifter"]    || 0,
      other:     (roleCount["other"] || 0) + (roleCount["sin_rol"] || 0),
    };

    // Distribución por edad — calcular desde birthday si age no existe
    const calcAge = (p) => {
      if (p.age) return p.age;
      if (!p.birthday) return null;
      const today = new Date();
      const bday  = new Date(p.birthday + "T12:00:00");
      let age = today.getFullYear() - bday.getFullYear();
      const m = today.getMonth() - bday.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) age--;
      return age > 0 && age < 120 ? age : null;
    };

    const ageRanges = [
      { label: "13-17", min: 13, max: 17, count: 0 },
      { label: "18-24", min: 18, max: 24, count: 0 },
      { label: "25-34", min: 25, max: 34, count: 0 },
      { label: "35-44", min: 35, max: 44, count: 0 },
      { label: "45+",   min: 45, max: 999, count: 0 },
      { label: "Sin dato", min: -1, max: -1, count: 0 },
    ];
    profiles.forEach(p => {
      const age = calcAge(p);
      if (!age) { ageRanges[5].count++; return; }
      const range = ageRanges.find(r => r.min !== -1 && age >= r.min && age <= r.max);
      if (range) range.count++;
      else ageRanges[5].count++;
    });

    // Cumpleaños por mes
    const monthBuckets = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
      .map((label, i) => ({ label, count: 0, month: i + 1 }));
    profiles.forEach(p => {
      if (!p.birthday) return;
      const m = new Date(p.birthday + "T12:00:00").getMonth();
      monthBuckets[m].count++;
    });

    // Usuarios activos vs inactivos
    const activeUsers   = profiles.filter(p => p.is_active !== false).length;
    const inactiveUsers = profiles.filter(p => p.is_active === false).length;

    setData({
      conversion: { totalUsers, usersWithCamp, usersWithContribUnique, usersNoCamp, totalCamps, activeCamps, campWithContrib, totalContribs, convUserToCamp, convCampToContrib, avgContribPerCamp, avgRaisedPerCamp, avgRaisedPerUser, anonPct, goalReachedPct, avgDaysToFirst },
      temporal:   { regByDay, hourBuckets, weekBuckets },
      demografico: { roleDist, ageRanges, monthBuckets, activeUsers, inactiveUsers, totalUsers },
    });
    } catch(e) {
      console.error("Admin load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { data, loading, load };
}

// ─── CHART COMPONENTS ─────────────────────────────────────────────────────────

// Barra horizontal con label y valor
function HBar({ label, value, max, color = C.primary, suffix = "" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <div style={{ width: 80, fontSize: 12, color: C.textLight, textAlign: "right", flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 8, background: C.bg, borderRadius: 9999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 9999, transition: "width 0.4s" }} />
      </div>
      <div style={{ width: 50, fontSize: 12, fontWeight: 600, color: C.text, textAlign: "right", flexShrink: 0 }}>{value}{suffix}</div>
    </div>
  );
}

// Mini bar chart vertical
function VBarChart({ data: bars, height = 100, color = C.primary, colorFn }) {
  const max = Math.max(...(bars || []).map(b => b.count || b.value || 0), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height, paddingBottom: 18, position: "relative" }}>
      {(bars || []).map((b, i) => {
        const val = b.count || b.value || 0;
        const pct = (val / max) * 100;
        const col = colorFn ? colorFn(i, bars.length) : color;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
            <div title={`${b.label}: ${val}`} style={{ width: "100%", borderRadius: "3px 3px 0 0", height: `${Math.max(pct, 2)}%`, background: col, transition: "height 0.4s", cursor: "default" }} />
            {b.label !== undefined && (
              <div style={{ fontSize: 8, color: C.textMuted, marginTop: 4, textAlign: "center", whiteSpace: "nowrap", position: "absolute", bottom: 0 }}>
                {typeof b.label === "number" ? (b.label % 3 === 0 ? b.label + "h" : "") : b.label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Embudo de conversión
function Funnel({ steps }) {
  const max = steps[0]?.value || 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {steps.map((step, i) => {
        const pct = (step.value / max) * 100;
        const convPct = i > 0 ? (step.value / steps[i-1].value * 100) : 100;
        return (
          <div key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.primaryBg, color: C.primary, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i+1}</div>
              <div style={{ fontSize: 12, color: C.textLight, flex: 1 }}>{step.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{step.value.toLocaleString("es-AR")}</div>
              {i > 0 && <div style={{ fontSize: 11, color: convPct >= 50 ? C.success : C.accent, minWidth: 36, textAlign: "right" }}>{fmtPct(convPct)}</div>}
            </div>
            <div style={{ height: 8, background: C.bg, borderRadius: 9999, overflow: "hidden", marginLeft: 30 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: i === 0 ? C.primaryLight : C.primary, borderRadius: 9999, transition: "width 0.5s" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Donut simple
function Donut({ segments, size = 80, stroke = 12 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={stroke} />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const el = (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={seg.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={circ * 0.25 - offset}
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

// Panel contenedor
function Panel({ title, sub, children, cols }) {
  return (
    <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 16, gridColumn: cols }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

// Stat inline
function Stat({ label, value, color = C.text, size = 24 }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: size, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Skeleton({ h = 200 }) {
  return <div style={{ height: h, background: C.bg, borderRadius: 8 }} />;
}

// ─── TAB CONVERSIÓN ───────────────────────────────────────────────────────────
function TabConversion({ data, loading }) {
  const { isMobile } = useAdmin();
  if (loading) return <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>{Array.from({length:4}).map((_,i) => <Skeleton key={i} h={180} />)}</div>;
  const cv = data?.conversion;
  if (!cv) return null;

  const funnelSteps = [
    { label: "Usuarios registrados",         value: cv.totalUsers        },
    { label: "Crearon un cumpleaños",         value: cv.usersWithCamp     },
    { label: "Recibieron al menos 1 aporte",  value: cv.campWithContrib   },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* fila superior */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 14 }}>
        <Panel title="Embudo de conversión" sub="usuarios → cumpleaños → aportes">
          <Funnel steps={funnelSteps} />
          <div style={{ display: "flex", gap: 16, marginTop: 14, justifyContent: "center" }}>
            <Stat label="Registro → Cumple" value={fmtPct(cv.convUserToCamp)}  color={C.primary} size={20} />
            <Stat label="Cumple → Aporte"   value={fmtPct(cv.convCampToContrib)} color={C.success} size={20} />
          </div>
        </Panel>

        <Panel title="Métricas de aportes" sub="promedios por cumpleañero">
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 4 }}>
            <Stat label="Promedio aportes por cumpleaños" value={cv.avgContribPerCamp.toFixed(1)} color={C.primary} />
            <Stat label="Recaudado promedio por cumpleaños" value={fmtARS(cv.avgRaisedPerCamp)} color={C.success} />
            <Stat label="Recaudado promedio por usuario" value={fmtARS(cv.avgRaisedPerUser)} color={C.text} />
          </div>
        </Panel>

        <Panel title="Indicadores clave" sub="eficiencia de la plataforma">
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
            <div style={{ background: C.primaryBg, borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", justify: "space-between", gap: 10 }}>
              <div style={{ fontSize: 12, color: C.primaryLight, flex: 1 }}>Campañas que alcanzaron la meta</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>{fmtPct(cv.goalReachedPct)}</div>
            </div>
            <div style={{ background: C.accentBg, borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 12, color: C.accent, flex: 1 }}>Aportes anónimos</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>{fmtPct(cv.anonPct)}</div>
            </div>
            <div style={{ background: C.bg, borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 12, color: C.textLight, flex: 1 }}>Días promedio hasta 1er aporte</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>
                {cv.avgDaysToFirst !== null ? cv.avgDaysToFirst.toFixed(1) : "—"}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* fila inferior: desglose del embudo */}
      <Panel title="Desglose completo">
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: 10 }}>
          {[
            { label: "Usuarios totales",          value: cv.totalUsers,              color: C.text    },
            { label: "Con cumpleaños",             value: cv.usersWithCamp,           color: C.primary },
            { label: "Campañas activas",           value: cv.activeCamps,             color: C.primary },
            { label: "Con al menos 1 aporte",     value: cv.usersWithContribUnique,  color: C.success },
            { label: "Aportes registrados",        value: cv.totalContribs,           color: C.success },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center", padding: "14px 8px", background: C.bg, borderRadius: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value.toLocaleString("es-AR")}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ─── TAB TEMPORAL ─────────────────────────────────────────────────────────────
function TabTemporal({ data, loading }) {
  const { isMobile } = useAdmin();
  if (loading) return <div style={{ display: "flex", flexDirection: "column", gap: 14 }}><Skeleton h={220} /><Skeleton h={160} /></div>;
  const t = data?.temporal;
  if (!t) return null;

  const maxRaised = Math.max(...t.regByDay.map(d => d.raised), 1);
  const maxUsers  = Math.max(...t.regByDay.map(d => d.users), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Registros + aportes por día */}
      <Panel title="Aportes diarios — últimos 30 días" sub="monto recaudado por día">
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 120, marginBottom: 6 }}>
          {t.regByDay.map((d, i) => {
            const pct = maxRaised > 0 ? (d.raised / maxRaised) * 100 : 0;
            const isLast7 = i >= 23;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }} title={`${d.label}: ${fmtARS(d.raised)}`}>
                <div style={{ width: "100%", borderRadius: "2px 2px 0 0", height: `${Math.max(pct, 1)}%`, background: isLast7 ? C.primary : C.primaryLight, opacity: isLast7 ? 1 : 0.5 }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.textMuted }}>
          <span>{t.regByDay[0]?.label}</span>
          <span style={{ color: C.primary, fontSize: 10, fontWeight: 600 }}>últimos 7 días</span>
          <span>{t.regByDay[29]?.label}</span>
        </div>
      </Panel>

      {/* Nuevos usuarios por día */}
      <Panel title="Nuevos registros — últimos 30 días" sub="usuarios por día">
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 80, marginBottom: 6 }}>
          {t.regByDay.map((d, i) => {
            const pct = maxUsers > 0 ? (d.users / maxUsers) * 100 : 0;
            return (
              <div key={i} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }} title={`${d.label}: ${d.users} registros`}>
                <div style={{ width: "100%", borderRadius: "2px 2px 0 0", height: `${Math.max(pct, d.users > 0 ? 4 : 0)}%`, background: C.success, opacity: 0.7 }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.textMuted }}>
          <span>{t.regByDay[0]?.label}</span>
          <span>{t.regByDay[29]?.label}</span>
        </div>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Por hora */}
        <Panel title="Aportes por hora del día" sub="cuándo regalan más">
          <VBarChart
            data={t.hourBuckets.map(h => ({ label: h.hour, count: h.count }))}
            height={100}
            colorFn={(i) => {
              const h = i;
              if (h >= 9 && h <= 13) return C.primary;
              if (h >= 19 && h <= 23) return C.accent;
              return C.primaryLight;
            }}
          />
          <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11 }}>
            <span style={{ color: C.primary }}>● Mañana (9-13h)</span>
            <span style={{ color: C.accent }}>● Noche (19-23h)</span>
          </div>
        </Panel>

        {/* Por día de semana */}
        <Panel title="Aportes por día de semana" sub="días de mayor actividad">
          {t.weekBuckets.map((d, i) => (
            <HBar key={i} label={d.label} value={d.count} max={Math.max(...t.weekBuckets.map(b => b.count), 1)}
              color={[5,6].includes(i) ? C.accent : C.primary}
            />
          ))}
        </Panel>
      </div>
    </div>
  );
}

// ─── TAB DEMOGRÁFICO ──────────────────────────────────────────────────────────
function TabDemografico({ data, loading }) {
  const { isMobile } = useAdmin();
  if (loading) return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>{Array.from({length:4}).map((_,i) => <Skeleton key={i} h={160} />)}</div>;
  const d = data?.demografico;
  if (!d) return null;

  const roleConfig = {
    celebrant: { label: "Cumpleañeros", color: C.primary  },
    manager:   { label: "Gestores",    color: C.accent   },
    gifter:    { label: "Regaladores", color: C.success  },
    other:     { label: "Sin rol",     color: C.textMuted },
  };
  const roleTotal = Object.values(d.roleDist).reduce((s,v) => s+v, 0) || 1;
  const ageMax = Math.max(...d.ageRanges.map(a => a.count), 1);
  const monthMax = Math.max(...d.monthBuckets.map(m => m.count), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Roles */}
        <Panel title="Distribución por rol" sub="tipos de usuario registrados">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Donut
              size={90} stroke={14}
              segments={Object.entries(d.roleDist).map(([k,v]) => ({ value: v, color: roleConfig[k]?.color || C.textMuted }))}
            />
            <div style={{ flex: 1 }}>
              {Object.entries(d.roleDist).map(([k, v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: roleConfig[k]?.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: C.textLight, flex: 1 }}>{roleConfig[k]?.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{v}</span>
                  <span style={{ fontSize: 10, color: C.textMuted }}>({fmtPct(v/roleTotal*100)})</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Estado de cuentas */}
        <Panel title="Estado de cuentas" sub="activos vs inactivos">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Donut
              size={90} stroke={14}
              segments={[
                { value: d.activeUsers,   color: C.success },
                { value: d.inactiveUsers, color: C.error   },
              ]}
            />
            <div style={{ flex: 1 }}>
              {[
                { label: "Activos",   value: d.activeUsers,   color: C.success },
                { label: "Inactivos", value: d.inactiveUsers, color: C.error   },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                  <span style={{ fontSize: 12, color: C.textLight, flex: 1 }}>{s.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</span>
                  <span style={{ fontSize: 10, color: C.textMuted }}>({fmtPct(s.value/d.totalUsers*100)})</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Edades */}
        <Panel title="Distribución por edad" sub="rangos etarios de los usuarios">
          {d.ageRanges.map((r, i) => (
            <HBar key={i} label={r.label} value={r.count} max={ageMax}
              color={i === 5 ? C.textMuted : C.primary}
            />
          ))}
        </Panel>

        {/* Cumpleaños por mes */}
        <Panel title="Cumpleaños por mes" sub="distribución de fechas en el año">
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80, marginBottom: 6 }}>
            {d.monthBuckets.map((m, i) => {
              const pct = (m.count / monthMax) * 100;
              return (
                <div key={i} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }} title={`${m.label}: ${m.count}`}>
                  <div style={{ width: "100%", borderRadius: "2px 2px 0 0", height: `${Math.max(pct, m.count > 0 ? 4 : 0)}%`, background: C.primary, opacity: 0.75 + (i === new Date().getMonth() ? 0.25 : 0) }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.textMuted }}>
            {d.monthBuckets.map((m, i) => <span key={i}>{m.label.slice(0,1)}</span>)}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 8, textAlign: "center" }}>
            Mes más popular: <span style={{ fontWeight: 600, color: C.primary }}>
              {d.monthBuckets.reduce((a, b) => a.count >= b.count ? a : b).label}
            </span>
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const { data, loading, load } = useAnalytics();
  const [activeTab, setActiveTab] = useState("conversion");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* TABS */}
      <div style={{ display: "flex", alignItems: "center", background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 4, alignSelf: "flex-start" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "7px 18px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13,
            background: activeTab === tab.id ? C.primaryBg : "transparent",
            color: activeTab === tab.id ? C.primary : C.textLight,
            fontWeight: activeTab === tab.id ? 600 : 400,
          }}>{tab.label}</button>
        ))}
        <div style={{ flex: 1, minWidth: 20 }} />
        <button onClick={load} style={{ padding: "7px 12px", borderRadius: 7, border: `0.5px solid ${C.border}`, background: "transparent", fontSize: 12, color: C.textLight, cursor: "pointer" }}>↻</button>
      </div>

      {activeTab === "conversion"  && <TabConversion  data={data} loading={loading} />}
      {activeTab === "temporal"    && <TabTemporal    data={data} loading={loading} />}
      {activeTab === "demografico" && <TabDemografico data={data} loading={loading} />}
    </div>
  );
}

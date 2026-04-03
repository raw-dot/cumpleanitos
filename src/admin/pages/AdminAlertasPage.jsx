import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";

const C = {
  primary:   "#7C3AED", primaryBg: "#EDE9FE", primaryLight: "#A78BFA",
  accent:    "#F59E0B", accentBg:  "#FEF3C7",
  success:   "#10B981", successBg: "#D1FAE5",
  error:     "#EF4444", errorBg:   "#FEE2E2",
  info:      "#3B82F6", infoBg:    "#EFF6FF",
  text:      "#1F2937", textLight: "#6B7280", textMuted: "#9CA3AF",
  border:    "#E5E7EB", surface:   "#FFFFFF", bg: "#F3F4F6",
};

const fmtDate = (s) => s ? new Date(s).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—";
const fmtARS  = (n) => n != null ? `$${Math.round(n).toLocaleString("es-AR")}` : "$0";
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const now = new Date(); now.setHours(0,0,0,0);
  const d = new Date(dateStr + "T12:00:00");
  d.setFullYear(now.getFullYear());
  if (d < now) d.setFullYear(now.getFullYear() + 1);
  return Math.round((d - now) / 86400000);
};

const SEVERITY = {
  high:   { label: "Alta",  color: C.error,   bg: C.errorBg,   dot: "#EF4444" },
  medium: { label: "Media", color: C.accent,  bg: C.accentBg,  dot: "#F59E0B" },
  low:    { label: "Baja",  color: C.info,    bg: C.infoBg,    dot: "#3B82F6" },
};

// ─── HOOK ─────────────────────────────────────────────────────────────────────
function useAlertas() {
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem("admin_dismissed_alerts") || "[]"); }
    catch { return []; }
  });

  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem("admin_dismissed_alerts", JSON.stringify(next));
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [
      { data: campaigns },
      { data: contributions },
      { data: profiles },
      { data: items },
    ] = await Promise.all([
      supabase.from("gift_campaigns").select("id, title, birthday_person_name, birthday_person_id, status, goal_amount, birthday_date, created_at"),
      supabase.from("contributions").select("id, campaign_id, amount, created_at"),
      supabase.from("profiles").select("id, username, name, is_active, created_at, payment_alias"),
      supabase.from("gift_items").select("id, campaign_id, price"),
    ]);

    // Construir mapas
    const contribMap = {};
    (contributions || []).forEach(c => {
      if (!contribMap[c.campaign_id]) contribMap[c.campaign_id] = [];
      contribMap[c.campaign_id].push(c);
    });
    const profMap = {};
    (profiles || []).forEach(p => { profMap[p.id] = p; });
    const itemMap = {};
    (items || []).forEach(i => {
      if (!itemMap[i.campaign_id]) itemMap[i.campaign_id] = [];
      itemMap[i.campaign_id].push(i);
    });

    const generated = [];

    // ── ALTA SEVERIDAD ──────────────────────────────────────────────────────

    // 1. Cumpleaños activos en ≤3 días sin ningún aporte
    (campaigns || [])
      .filter(c => c.status === "active")
      .forEach(c => {
        const days = daysUntil(c.birthday_date);
        const cs = contribMap[c.id] || [];
        if (days !== null && days <= 3 && cs.length === 0) {
          generated.push({
            id: `urgent-no-contrib-${c.id}`,
            severity: "high",
            type: "sin_aportes_urgente",
            title: "Cumpleaños inminente sin aportes",
            desc: `${c.birthday_person_name || c.title || "—"} cumple en ${days === 0 ? "hoy" : `${days} día${days !== 1 ? "s" : ""}`} y no tiene ningún aporte registrado.`,
            meta: { campId: c.id, username: profMap[c.birthday_person_id]?.username, date: c.birthday_date },
          });
        }
      });

    // 2. Campañas activas sin aportes hace más de 14 días
    (campaigns || [])
      .filter(c => c.status === "active")
      .forEach(c => {
        const cs = contribMap[c.id] || [];
        const createdDaysAgo = c.created_at ? Math.floor((Date.now() - new Date(c.created_at)) / 86400000) : 0;
        if (cs.length === 0 && createdDaysAgo >= 14) {
          generated.push({
            id: `no-contrib-14d-${c.id}`,
            severity: "high",
            type: "sin_aportes_14d",
            title: "Campaña sin aportes hace +14 días",
            desc: `${c.birthday_person_name || "—"} tiene su campaña activa hace ${createdDaysAgo} días sin recibir ningún aporte.`,
            meta: { campId: c.id, username: profMap[c.birthday_person_id]?.username },
          });
        }
      });

    // ── MEDIA SEVERIDAD ─────────────────────────────────────────────────────

    // 3. Cumpleaños activos en ≤7 días (alerta temprana)
    (campaigns || [])
      .filter(c => c.status === "active")
      .forEach(c => {
        const days = daysUntil(c.birthday_date);
        const cs = contribMap[c.id] || [];
        if (days !== null && days > 3 && days <= 7 && cs.length > 0) {
          generated.push({
            id: `upcoming-7d-${c.id}`,
            severity: "medium",
            type: "proximo_7d",
            title: "Cumpleaños próximo — en 7 días",
            desc: `${c.birthday_person_name || "—"} cumple en ${days} días. Tiene ${cs.length} aportes por ${fmtARS(cs.reduce((s,c)=>s+(c.amount||0),0))}.`,
            meta: { campId: c.id, username: profMap[c.birthday_person_id]?.username, date: c.birthday_date },
          });
        }
      });

    // 4. Usuarios sin payment_alias con campaña activa
    (campaigns || [])
      .filter(c => c.status === "active")
      .forEach(c => {
        const prof = profMap[c.birthday_person_id];
        const cs = contribMap[c.id] || [];
        if (prof && !prof.payment_alias && cs.length > 0) {
          generated.push({
            id: `no-alias-${c.id}`,
            severity: "medium",
            type: "sin_alias",
            title: "Campaña con aportes sin alias de cobro",
            desc: `@${prof.username || "—"} tiene ${cs.length} aporte${cs.length !== 1 ? "s" : ""} registrados pero no configuró su alias de pago.`,
            meta: { userId: prof.id, username: prof.username },
          });
        }
      });

    // 5. Campañas activas sin regalos cargados
    (campaigns || [])
      .filter(c => c.status === "active")
      .forEach(c => {
        const its = itemMap[c.id] || [];
        const createdDaysAgo = c.created_at ? Math.floor((Date.now() - new Date(c.created_at)) / 86400000) : 0;
        if (its.length === 0 && createdDaysAgo >= 7) {
          generated.push({
            id: `no-items-${c.id}`,
            severity: "medium",
            type: "sin_regalos",
            title: "Campaña sin regalos en wishlist",
            desc: `${c.birthday_person_name || "—"} tiene la campaña activa hace ${createdDaysAgo} días pero no cargó ningún regalo en su wishlist.`,
            meta: { campId: c.id, username: profMap[c.birthday_person_id]?.username },
          });
        }
      });

    // ── BAJA SEVERIDAD ──────────────────────────────────────────────────────

    // 6. Nuevos usuarios sin campaña hace más de 7 días
    (profiles || [])
      .filter(p => p.is_active !== false)
      .forEach(p => {
        const campas = (campaigns || []).filter(c => c.birthday_person_id === p.id);
        const daysOld = p.created_at ? Math.floor((Date.now() - new Date(p.created_at)) / 86400000) : 0;
        if (campas.length === 0 && daysOld >= 7 && daysOld <= 30) {
          generated.push({
            id: `no-camp-${p.id}`,
            severity: "low",
            type: "sin_campana",
            title: "Usuario sin campaña hace +7 días",
            desc: `@${p.username || "—"} se registró hace ${daysOld} días y todavía no creó ninguna campaña.`,
            meta: { userId: p.id, username: p.username },
          });
        }
      });

    // 7. Campaña que superó la meta (celebración)
    (campaigns || [])
      .filter(c => c.goal_amount > 0 && c.status === "active")
      .forEach(c => {
        const raised = (contribMap[c.id] || []).reduce((s, x) => s + (x.amount || 0), 0);
        if (raised >= c.goal_amount) {
          generated.push({
            id: `goal-reached-${c.id}`,
            severity: "low",
            type: "meta_alcanzada",
            title: "🎉 Meta alcanzada",
            desc: `${c.birthday_person_name || "—"} alcanzó su meta de ${fmtARS(c.goal_amount)} con ${fmtARS(raised)} recaudados.`,
            meta: { campId: c.id, username: profMap[c.birthday_person_id]?.username },
          });
        }
      });

    setAlerts(generated);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = alerts.filter(a => !dismissed.includes(a.id));
  return { alerts: visible, allCount: alerts.length, dismissedCount: dismissed.length, loading, load, dismiss };
}

// ─── ALERTA CARD ──────────────────────────────────────────────────────────────
function AlertCard({ alert, onDismiss }) {
  const sev = SEVERITY[alert.severity];
  return (
    <div style={{
      background: C.surface, border: `0.5px solid ${C.border}`,
      borderLeft: `3px solid ${sev.dot}`,
      borderRadius: 10, padding: "14px 16px",
      display: "flex", alignItems: "flex-start", gap: 12,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: sev.dot, flexShrink: 0, marginTop: 5 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{alert.title}</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 9999, background: sev.bg, color: sev.color }}>
            {sev.label}
          </span>
        </div>
        <div style={{ fontSize: 12, color: C.textLight, lineHeight: 1.5 }}>{alert.desc}</div>
        {alert.meta?.username && (
          <div style={{ fontSize: 11, color: C.primary, marginTop: 4 }}>@{alert.meta.username}</div>
        )}
        {alert.meta?.date && (
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Fecha: {fmtDate(alert.meta.date + "T00:00:00")}</div>
        )}
      </div>
      <button
        onClick={() => onDismiss(alert.id)}
        title="Descartar alerta"
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: C.textMuted, padding: 4, flexShrink: 0, lineHeight: 1 }}
      >✕</button>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdminAlertasPage() {
  const { alerts, allCount, dismissedCount, loading, load, dismiss } = useAlertas();
  const [filter, setFilter] = useState("all");

  const filtered = alerts.filter(a => filter === "all" || a.severity === filter);

  const counts = {
    high:   alerts.filter(a => a.severity === "high").length,
    medium: alerts.filter(a => a.severity === "medium").length,
    low:    alerts.filter(a => a.severity === "low").length,
  };

  const FILTERS = [
    { id: "all",    label: "Todas",  count: alerts.length  },
    { id: "high",   label: "Alta",   count: counts.high    },
    { id: "medium", label: "Media",  count: counts.medium  },
    { id: "low",    label: "Baja",   count: counts.low     },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {/* Contadores por severidad */}
        {[
          { label: "Alta",  count: counts.high,   color: C.error,  bg: C.errorBg  },
          { label: "Media", count: counts.medium, color: C.accent, bg: C.accentBg },
          { label: "Baja",  count: counts.low,    color: C.info,   bg: C.infoBg   },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `0.5px solid ${s.color}22`, borderRadius: 8, padding: "10px 16px", display: "flex", gap: 8, alignItems: "baseline" }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.count}</span>
            <span style={{ fontSize: 11, color: s.color, opacity: 0.8 }}>{s.label}</span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        {dismissedCount > 0 && (
          <span style={{ fontSize: 11, color: C.textMuted }}>{dismissedCount} descartadas en esta sesión</span>
        )}
        <button onClick={load} style={{ padding: "8px 14px", borderRadius: 8, border: `0.5px solid ${C.border}`, background: C.surface, fontSize: 12, color: C.textLight, cursor: "pointer" }}>
          ↻ Actualizar
        </button>
      </div>

      {/* FILTROS */}
      <div style={{ display: "flex", gap: 4, background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 4, alignSelf: "flex-start" }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13,
            background: filter === f.id ? C.primaryBg : "transparent",
            color: filter === f.id ? C.primary : C.textLight,
            fontWeight: filter === f.id ? 600 : 400,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {f.label}
            {f.count > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, background: filter === f.id ? C.primary : C.bg, color: filter === f.id ? "#fff" : C.textMuted, padding: "1px 5px", borderRadius: 9999 }}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* LISTA */}
      {loading ? (
        <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 32, textAlign: "center", color: C.textMuted, fontSize: 13 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⟳</div>Analizando la plataforma…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "48px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>
            {alerts.length === 0 ? "Todo en orden" : "Sin alertas en esta categoría"}
          </div>
          <div style={{ fontSize: 13, color: C.textMuted }}>
            {alerts.length === 0 ? "No se detectaron situaciones que requieran atención." : "Probá cambiando el filtro para ver otras alertas."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Separar por severidad */}
          {["high","medium","low"].map(sev => {
            const group = filtered.filter(a => a.severity === sev);
            if (!group.length) return null;
            const s = SEVERITY[sev];
            return (
              <div key={sev}>
                <div style={{ fontSize: 11, fontWeight: 600, color: s.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, marginTop: 4 }}>
                  — Severidad {s.label} ({group.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {group.map(alert => (
                    <AlertCard key={alert.id} alert={alert} onDismiss={dismiss} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTER INFO */}
      <div style={{ fontSize: 11, color: C.textMuted, textAlign: "center", padding: "4px 0" }}>
        Las alertas se generan en tiempo real analizando el estado de campañas, usuarios y aportes.
        Los descartes se resetean al recargar la página.
      </div>
    </div>
  );
}

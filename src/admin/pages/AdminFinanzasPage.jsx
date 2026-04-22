import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "../AdminContext";
import { supabase } from "../../supabaseClient";
import { ensureAdminSession } from "../adminFetch";
import { getRealAlias } from "../../utils/paymentAliasHelpers";

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
const fmtDate = (s) => s ? new Date(s).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—";
const fmtDateTime = (s) => s ? new Date(s).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
const fmtMonth = (s) => s ? new Date(s).toLocaleDateString("es-AR", { month: "short", year: "2-digit" }) : "—";
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

const TABS = [
  { id: "resumen",     label: "Resumen"             },
  { id: "campanas",    label: "Por campaña"          },
  { id: "timeline",    label: "Historial de aportes" },
  { id: "comisiones",  label: "💰 Comisiones"        },
];

const PER_PAGE = 15;

// ─── HOOK ─────────────────────────────────────────────────────────────────────
function useFinanzas() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await ensureAdminSession();

    const [
      { data: contribs },
      { data: campaigns },
      { data: profiles },
      { data: mpOrders },
      { data: webhookLogs },
      { data: mpTransactions },
    ] = await Promise.all([
      supabase.from("contributions").select("*").order("created_at", { ascending: false }),
      supabase.from("gift_campaigns").select("id, title, birthday_person_name, birthday_person_id, status, goal_amount, birthday_date, created_at, commission_enabled, commission_percentage"),
      supabase.from("profiles").select("id, username, name, payment_alias"),
      supabase.from("mp_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("mp_webhook_logs").select("*").order("received_at", { ascending: false }).limit(50),
      supabase.from("mp_transactions").select("*").order("approved_at", { ascending: false }).limit(50),
    ]);

    const campMap = {};
    (campaigns || []).forEach(c => { campMap[c.id] = c; });
    const profMap = {};
    (profiles || []).forEach(p => { profMap[p.id] = p; });

    // Enriquecer contributions
    const enrichedContribs = (contribs || []).map(c => ({
      ...c,
      campaign: campMap[c.campaign_id] || {},
    }));

    // Agrupar por campaña
    const byCampaign = {};
    enrichedContribs.forEach(c => {
      const cid = c.campaign_id;
      if (!byCampaign[cid]) {
        byCampaign[cid] = {
          campaign: campMap[cid] || {},
          profile:  profMap[campMap[cid]?.birthday_person_id] || {},
          contribs: [],
          raised: 0,
          count: 0,
        };
      }
      byCampaign[cid].contribs.push(c);
      byCampaign[cid].raised += c.amount || 0;
      byCampaign[cid].count  += 1;
    });

    const campaignRows = Object.values(byCampaign)
      .sort((a, b) => b.raised - a.raised);

    // Crear allCampaigns: TODAS las campañas con sus datos enriquecidos
    const allCampaigns = (campaigns || []).map(camp => {
      const campData = byCampaign[camp.id] || {};
      return {
        ...campData,
        campaign: camp,
        profile: profMap[camp.birthday_person_id] || {},
        raised: campData.raised || 0,
        count: campData.count || 0,
      };
    }).sort((a, b) => b.raised - a.raised);

    // Agrupar por mes (últimos 6 meses)
    const monthMap = {};
    enrichedContribs.forEach(c => {
      const key = c.created_at?.slice(0, 7); // "2026-03"
      if (!key) return;
      if (!monthMap[key]) monthMap[key] = { key, total: 0, count: 0 };
      monthMap[key].total += c.amount || 0;
      monthMap[key].count += 1;
    });
    const monthlyData = Object.values(monthMap)
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-6);

    // KPIs globales
    const totalRaised   = enrichedContribs.reduce((s, c) => s + (c.amount || 0), 0);
    const totalCount    = enrichedContribs.length;
    const avgPerContrib = totalCount > 0 ? totalRaised / totalCount : 0;
    const last30        = enrichedContribs.filter(c => c.created_at >= daysAgo(30));
    const raised30      = last30.reduce((s, c) => s + (c.amount || 0), 0);
    const last7         = enrichedContribs.filter(c => c.created_at >= daysAgo(7));
    const raised7       = last7.reduce((s, c) => s + (c.amount || 0), 0);
    const anonPct       = totalCount > 0 ? Math.round(enrichedContribs.filter(c => c.is_anonymous || c.anonymous).length / totalCount * 100) : 0;
    const activeCampsWithRaised = campaignRows.filter(r => r.raised > 0).length;

    // Top 5 campañas
    const top5 = campaignRows.slice(0, 5);

    // KPIs de comisiones (mp_orders aprobados)
    const approvedOrders = (mpOrders || []).filter(o => o.status === "approved");
    const pendingOrders  = (mpOrders || []).filter(o => o.status === "pending");
    const totalCommission = approvedOrders.reduce((s, o) => s + (o.platform_fee_amount || 0), 0);
    const totalNetSellers = approvedOrders.reduce((s, o) => s + (o.net_amount || 0), 0);
    const totalGrossMP    = approvedOrders.reduce((s, o) => s + (o.gross_amount || 0), 0);
    const commissionLast30 = approvedOrders
      .filter(o => o.created_at >= daysAgo(30))
      .reduce((s, o) => s + (o.platform_fee_amount || 0), 0);
    const commissionLast7 = approvedOrders
      .filter(o => o.created_at >= daysAgo(7))
      .reduce((s, o) => s + (o.platform_fee_amount || 0), 0);

    // Comisiones por mes (últimos 6)
    const commMonthMap = {};
    approvedOrders.forEach(o => {
      const key = o.created_at?.slice(0, 7);
      if (!key) return;
      if (!commMonthMap[key]) commMonthMap[key] = { key, fee: 0, gross: 0, count: 0 };
      commMonthMap[key].fee   += o.platform_fee_amount || 0;
      commMonthMap[key].gross += o.gross_amount || 0;
      commMonthMap[key].count += 1;
    });
    const commMonthly = Object.values(commMonthMap)
      .sort((a, b) => a.key.localeCompare(b.key)).slice(-6);

    // Enriquecer mp_orders con campaña, perfil del cumpleañero y transaction
    const txByOrder = {};
    (mpTransactions || []).forEach(t => { txByOrder[t.order_id] = t; });

    const enrichedOrders = (mpOrders || []).map(o => ({
      ...o,
      campaign:    campMap[o.campaign_id] || {},
      seller:      profMap[o.seller_user_id] || {},
      transaction: txByOrder[o.id] || null,
    }));

    setData({
      contribs: enrichedContribs,
      campaignRows,
      allCampaigns,
      monthlyData,
      kpis: { totalRaised, totalCount, avgPerContrib, raised30, raised7, anonPct, activeCampsWithRaised },
      top5,
      mpOrders: enrichedOrders,
      commKpis: {
        totalCommission, totalNetSellers, totalGrossMP,
        commissionLast30, commissionLast7,
        approvedCount: approvedOrders.length,
        pendingCount:  pendingOrders.length,
        avgFeePct: approvedOrders.length > 0
          ? approvedOrders.reduce((s, o) => s + (o.platform_fee_pct || 0), 0) / approvedOrders.length
          : 10,
      },
      commMonthly,
      webhookLogs: webhookLogs || [],
      mpTransactions: mpTransactions || [],
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

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = C.text }) {
  return (
    <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "16px 18px" }}>
      {[["60%", 11], ["40%", 24], ["50%", 11]].map(([w, h], i) => (
        <div key={i} style={{ height: h, background: C.bg, borderRadius: 4, width: w, marginBottom: i < 2 ? 8 : 0 }} />
      ))}
    </div>
  );
}

// ─── MINI BAR CHART ───────────────────────────────────────────────────────────
function BarChart({ data }) {
  if (!data?.length) return <div style={{ height: 120, background: C.bg, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 12 }}>Sin datos</div>;
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120, padding: "0 4px" }}>
      {data.map((d, i) => {
        const pct = (d.total / max) * 100;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
              <div
                title={`${fmtARS(d.total)} · ${d.count} aportes`}
                style={{
                  width: "100%", borderRadius: "4px 4px 0 0",
                  height: `${Math.max(pct, 4)}%`,
                  background: i === data.length - 1 ? C.primary : C.primaryLight,
                  opacity: i === data.length - 1 ? 1 : 0.5,
                  transition: "height 0.4s",
                  cursor: "default",
                }}
              />
            </div>
            <div style={{ fontSize: 9, color: C.textMuted, textAlign: "center", whiteSpace: "nowrap" }}>
              {d.key.slice(5)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── TARJETA OPERACIONES (colapsable, dentro de Resumen) ─────────────────────
function OperacionesCard({ data, onGoToComisiones }) {
  const txs    = data?.mpTransactions || [];
  const logs   = data?.webhookLogs || [];
  const total  = txs.length;
  const errores = logs.filter(l => l.processing_status === "error").length;

  return (
    <div
      onClick={onGoToComisiones}
      style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px" }}>
        <div style={{ fontSize: 26 }}>📡</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Operaciones</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
            Transacciones confirmadas por Mercado Pago
            {errores > 0 && <span style={{ marginLeft: 8, color: C.error, fontWeight: 600 }}>· {errores} error{errores > 1 ? "es" : ""}</span>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: total > 0 ? C.success : C.textMuted, lineHeight: 1 }}>{total}</div>
          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>transacciones</div>
        </div>
        <div style={{ fontSize: 20, color: C.textMuted, marginLeft: 4 }}>›</div>
      </div>
    </div>
  );
}

// ─── TAB RESUMEN ─────────────────────────────────────────────────────────────
function TabResumen({ data, loading, onGoToComisiones }) {
  const { isMobile } = useAdmin();
  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)}
      </div>
    </div>
  );

  const k = data?.kpis;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* KPIs fila 1 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, minmax(0,1fr))", gap: 10 }}>
        <KpiCard label="Total recaudado"     value={fmtARS(k?.totalRaised)}    sub="histórico acumulado"     color={C.success} />
        <KpiCard label="Últimos 30 días"     value={fmtARS(k?.raised30)}       sub="aportes recientes"      color={C.primary} />
        <KpiCard label="Últimos 7 días"      value={fmtARS(k?.raised7)}        sub="esta semana"            color={C.primary} />
        <KpiCard label="Promedio por aporte" value={fmtARS(k?.avgPerContrib)}  sub={`sobre ${k?.totalCount} aportes`} />
      </div>

      {/* KPIs fila 2 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0,1fr))", gap: 10 }}>
        <KpiCard label="Aportes totales"        value={k?.totalCount}                sub="registrados"        />
        <KpiCard label="Campañas con recaudación" value={k?.activeCampsWithRaised}   sub="al menos 1 aporte"  color={C.success} />
        <KpiCard label="Aportes anónimos"        value={`${k?.anonPct}%`}            sub="del total"          color={C.accent} />
      </div>

      {/* Gráfico mensual */}
      <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14 }}>
          Recaudación mensual
        </div>
        <BarChart data={data?.monthlyData} />
        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          {data?.monthlyData?.map((d, i) => (
            <div key={i} style={{ fontSize: 11, color: C.textMuted }}>
              <span style={{ fontWeight: 600, color: C.text }}>{fmtARS(d.total)}</span>
              {" "}{d.key.slice(5)}/{d.key.slice(2, 4)}
              <span style={{ marginLeft: 4, color: C.textMuted }}>({d.count} ap.)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 campañas */}
      <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14 }}>Top 5 campañas por recaudación</div>
        {!data?.top5?.length
          ? <div style={{ textAlign: "center", padding: "24px 0", color: C.textMuted, fontSize: 12 }}>Sin datos</div>
          : data.top5.map((row, i) => {
              const pct = data.kpis.totalRaised > 0 ? (row.raised / data.kpis.totalRaised) * 100 : 0;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < data.top5.length - 1 ? `0.5px solid ${C.border}` : "none" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.primaryBg, color: C.primary, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: C.text, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {row.campaign?.birthday_person_name || row.campaign?.title || "—"}
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>
                      @{row.profile?.username || "—"} · {row.count} aportes
                    </div>
                    <div style={{ height: 3, background: C.bg, borderRadius: 9999, marginTop: 5, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: C.primary, borderRadius: 9999 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.success, flexShrink: 0 }}>
                    {fmtARS(row.raised)}
                  </div>
                </div>
              );
            })
        }
      </div>
      {/* Tarjeta colapsable — Operaciones */}
      <OperacionesCard data={data} onGoToComisiones={onGoToComisiones} />
    </div>
  );
}
function TabCampanas({ data, loading }) {
  const { isMobile } = useAdmin();
  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(0);
  const [detail, setDetail] = useState(null);

  const rows = data?.campaignRows || [];
  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    return !q
      || r.campaign?.birthday_person_name?.toLowerCase().includes(q)
      || r.campaign?.title?.toLowerCase().includes(q)
      || r.profile?.username?.toLowerCase().includes(q);
  });
  const pages = Math.ceil(filtered.length / PER_PAGE);
  const paged  = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {detail && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex" }}>
          <div onClick={() => setDetail(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 380, background: C.surface, borderLeft: `0.5px solid ${C.border}`, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "18px 20px 16px", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{detail.campaign?.birthday_person_name || "—"}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>@{detail.profile?.username || "—"}</div>
              </div>
              <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.textMuted }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
                <div style={{ background: C.primaryBg, borderRadius: 8, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.primary }}>{fmtARS(detail.raised)}</div>
                  <div style={{ fontSize: 10, color: C.primaryLight, marginTop: 2 }}>recaudado</div>
                </div>
                <div style={{ background: C.bg, borderRadius: 8, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{detail.count}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>aportes</div>
                </div>
              </div>
              {/* meta */}
              {detail.campaign?.goal_amount > 0 && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textMuted, marginBottom: 5 }}>
                    <span>Meta: {fmtARS(detail.campaign.goal_amount)}</span>
                    <span style={{ color: C.primary, fontWeight: 600 }}>
                      {Math.min(Math.round((detail.raised / detail.campaign.goal_amount) * 100), 100)}%
                    </span>
                  </div>
                  <div style={{ height: 6, background: C.bg, borderRadius: 9999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min((detail.raised / detail.campaign.goal_amount) * 100, 100)}%`, background: C.primary, borderRadius: 9999 }} />
                  </div>
                </div>
              )}
              {/* info */}
              <div style={{ background: C.bg, borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 7 }}>
                <InfoRow label="Alias de cobro"   value={getRealAlias(detail.profile?.payment_alias) || "—"} />
                <InfoRow label="Promedio aporte"   value={detail.count > 0 ? fmtARS(detail.raised / detail.count) : "—"} />
                <InfoRow label="Fecha cumpleaños"  value={fmtDate(detail.campaign?.birthday_date)} />
                <InfoRow label="Estado campaña"    value={detail.campaign?.status || "—"} />
                <InfoRow label="Aportes anónimos"  value={`${detail.contribs.filter(c => c.is_anonymous || c.anonymous).length}`} />
              </div>
              {/* aportes */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Todos los aportes</div>
                {detail.contribs.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: i < detail.contribs.length - 1 ? `0.5px solid ${C.border}` : "none" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: (c.is_anonymous || c.anonymous) ? C.textMuted : C.primary, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, color: C.textLight }}>{(c.is_anonymous || c.anonymous) ? "Anónimo" : (c.gifter_name || "—")}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.success }}>{fmtARS(c.amount)}</span>
                    <span style={{ fontSize: 10, color: C.textMuted }}>{fmtDate(c.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* search */}
      <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "12px 16px" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.textMuted }}>⌕</span>
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Buscar campaña o cumpleañero…"
            style={{ width: "100%", paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: `0.5px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.text, background: C.bg, boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* tabla */}
      <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        {loading
          ? <div style={{ padding: 32, textAlign: "center", color: C.textMuted, fontSize: 13 }}>Cargando…</div>
          : !filtered.length
            ? <div style={{ padding: 48, textAlign: "center", color: C.textMuted, fontSize: 13 }}>Sin resultados</div>
            : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `0.5px solid ${C.border}` }}>
                    {["Cumpleañero", "Alias de cobro", "Aportes", "Recaudado", "Meta", "Promedio", "Estado", ""].map(l => (
                      <th key={l} style={{ textAlign: l === "" ? "right" : "left", padding: "10px 12px", fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", background: C.bg, whiteSpace: "nowrap" }}>{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((row, i) => {
                    const alias = getRealAlias(row.profile?.payment_alias);
                    const avg   = row.count > 0 ? row.raised / row.count : 0;
                    const pct   = row.campaign?.goal_amount > 0 ? Math.min(Math.round(row.raised / row.campaign.goal_amount * 100), 100) : null;
                    return (
                      <tr key={i}
                        onClick={() => setDetail(row)}
                        style={{ borderBottom: i < paged.length - 1 ? `0.5px solid ${C.border}` : "none", cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.background = C.primaryBg}
                        onMouseLeave={e => e.currentTarget.style.background = C.surface}
                      >
                        <td style={{ padding: "11px 12px", verticalAlign: "middle" }}>
                          <div style={{ fontWeight: 600, color: C.text }}>{row.campaign?.birthday_person_name || "—"}</div>
                          <div style={{ fontSize: 11, color: C.primary }}>@{row.profile?.username || "—"}</div>
                        </td>
                        <td style={{ padding: "11px 12px", verticalAlign: "middle" }}>
                          <span style={{ fontSize: 12, fontFamily: "monospace", color: alias ? C.text : C.textMuted }}>{alias || "—"}</span>
                        </td>
                        <td style={{ padding: "11px 12px", verticalAlign: "middle" }}>
                          <span style={{ fontWeight: 600, color: row.count > 0 ? C.primary : C.textMuted }}>{row.count || "—"}</span>
                        </td>
                        <td style={{ padding: "11px 12px", verticalAlign: "middle" }}>
                          <span style={{ fontWeight: 700, color: row.raised > 0 ? C.success : C.textMuted }}>{fmtARS(row.raised)}</span>
                        </td>
                        <td style={{ padding: "11px 12px", verticalAlign: "middle" }}>
                          {pct !== null
                            ? <div>
                                <span style={{ fontSize: 11, color: C.textMuted }}>{fmtARS(row.campaign.goal_amount)}</span>
                                <div style={{ height: 3, background: C.bg, borderRadius: 9999, marginTop: 4, overflow: "hidden", width: 60 }}>
                                  <div style={{ height: "100%", width: `${pct}%`, background: C.primary, borderRadius: 9999 }} />
                                </div>
                              </div>
                            : <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>
                          }
                        </td>
                        <td style={{ padding: "11px 12px", verticalAlign: "middle" }}>
                          <span style={{ fontSize: 12, color: C.textLight }}>{avg > 0 ? fmtARS(avg) : "—"}</span>
                        </td>
                        <td style={{ padding: "11px 12px", verticalAlign: "middle" }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, background: row.campaign?.status === "active" ? C.successBg : C.bg, color: row.campaign?.status === "active" ? C.success : C.textMuted }}>
                            {row.campaign?.status || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "11px 12px", verticalAlign: "middle", textAlign: "right" }}>
                          <span style={{ fontSize: 11, color: C.primary }}>ver →</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
        }
      </div>
      <Pagination page={page} pages={pages} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
    </div>
  );
}

// ─── TAB HISTORIAL ────────────────────────────────────────────────────────────
function TabTimeline({ data, loading }) {
  const [page, setPage] = useState(0);
  const contribs = data?.contribs || [];
  const pages = Math.ceil(contribs.length / PER_PAGE);
  const paged = contribs.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  // Agrupar por fecha para el timeline
  const grouped = {};
  paged.forEach(c => {
    const day = c.created_at?.slice(0, 10) || "—";
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(c);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
        {loading
          ? <div style={{ textAlign: "center", padding: "32px 0", color: C.textMuted, fontSize: 13 }}>Cargando…</div>
          : !contribs.length
            ? <div style={{ textAlign: "center", padding: "48px 0", color: C.textMuted, fontSize: 13 }}>Sin aportes registrados</div>
            : Object.entries(grouped).map(([day, items]) => (
                <div key={day} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, paddingBottom: 6, borderBottom: `0.5px solid ${C.border}` }}>
                    {new Date(day + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
                    <span style={{ marginLeft: 8, fontWeight: 400, color: C.textMuted }}>
                      {fmtARS(items.reduce((s, c) => s + (c.amount || 0), 0))} · {items.length} aportes
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {items.map((c, i) => {
                      const isAnon = c.is_anonymous || c.anonymous;
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < items.length - 1 ? `0.5px solid ${C.border}` : "none" }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: isAnon ? C.textMuted : C.primary, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: isAnon ? C.textMuted : C.text, fontStyle: isAnon ? "italic" : "normal" }}>
                              {isAnon ? "Anónimo" : (c.gifter_name || "—")}
                            </span>
                            {" "}
                            <span style={{ fontSize: 12, color: C.textLight }}>→ {c.campaign?.birthday_person_name || "—"}</span>
                            {c.message && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2, fontStyle: "italic" }}>"{c.message}"</div>}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: C.success, flexShrink: 0 }}>{fmtARS(c.amount)}</span>
                          <span style={{ fontSize: 10, color: C.textMuted, flexShrink: 0 }}>
                            {c.created_at ? new Date(c.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
        }
      </div>
      <Pagination page={page} pages={pages} total={contribs.length} perPage={PER_PAGE} onChange={setPage} />
    </div>
  );
}

// ─── SHARED ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
      <span style={{ color: C.textMuted }}>{label}</span>
      <span style={{ color: C.text, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function Pagination({ page, pages, total, perPage, onChange }) {
  if (pages <= 1) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: C.textMuted }}>
      <span>{page * perPage + 1}–{Math.min((page + 1) * perPage, total)} de {total}</span>
      <div style={{ display: "flex", gap: 4 }}>
        <PagBtn disabled={page === 0}        onClick={() => onChange(p => p - 1)}>← Ant</PagBtn>
        {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
          const p = pages <= 7 ? i : page < 4 ? i : page > pages - 4 ? pages - 7 + i : page - 3 + i;
          return <PagBtn key={p} active={p === page} onClick={() => onChange(p)}>{p + 1}</PagBtn>;
        })}
        <PagBtn disabled={page >= pages - 1} onClick={() => onChange(p => p + 1)}>Sig →</PagBtn>
      </div>
    </div>
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
    }}>{children}</button>
  );
}

// ─── TAB COMISIONES ───────────────────────────────────────────────────────────
const STATUS_LABEL = {
  approved:   { label: "Aprobado",   color: "#16a34a", bg: "#DCFCE7" },
  pending:    { label: "Pendiente",  color: "#D97706", bg: "#FEF3C7" },
  rejected:   { label: "Rechazado",  color: "#DC2626", bg: "#FEE2E2" },
  cancelled:  { label: "Cancelado",  color: "#6B7280", bg: "#F3F4F6" },
  refunded:   { label: "Devuelto",   color: "#7C3AED", bg: "#EDE9FE" },
  in_process: { label: "En proceso", color: "#3B82F6", bg: "#EFF6FF" },
};

function StatusBadge({ status }) {
  const s = STATUS_LABEL[status] || { label: status, color: "#6B7280", bg: "#F3F4F6" };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, borderRadius: 20, padding: "2px 8px", whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

function CommBarChart({ data }) {
  if (!data?.length) return <div style={{ height: 100, background: C.bg, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 12 }}>Sin órdenes aprobadas aún</div>;
  const max = Math.max(...data.map(d => d.fee), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100, padding: "0 4px" }}>
      {data.map((d, i) => {
        const pct = (d.fee / max) * 100;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
              <div
                title={`${fmtARS(d.fee)} comisión · ${d.count} órdenes`}
                style={{
                  width: "100%", borderRadius: "4px 4px 0 0",
                  height: `${Math.max(pct, 4)}%`,
                  background: i === data.length - 1 ? C.accent : "#FCD34D",
                  opacity: i === data.length - 1 ? 1 : 0.6,
                  transition: "height 0.4s",
                }}
              />
            </div>
            <div style={{ fontSize: 9, color: C.textMuted, textAlign: "center" }}>{d.key.slice(5)}</div>
          </div>
        );
      })}
    </div>
  );
}

function TabComisiones({ data, loading }) {
  const { isMobile } = useAdmin();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [subTab, setSubTab] = useState("resumen");
  const [commissionConfig, setCommissionConfig] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [bdCampaigns, setBdCampaigns] = useState(null);

  // Recargar SOLO los campaigns cuando entra a config tab
  useEffect(() => {
    if (subTab === "config") {
      const loadCampaigns = async () => {
        const { data: camps, error } = await supabase
          .from("gift_campaigns")
          .select("*");
        
        if (error) {
          console.error("[Config Tab] ❌ Error:", error);
          return;
        }

        if (camps && camps.length > 0) {
          console.log("[Config Tab] ✅ Cargados:", camps.length, "campaigns");
          console.log("[Config Tab] Primer campaign:", camps[0]);
          
          setBdCampaigns(camps);
          
          const initialConfig = {};
          camps.forEach(camp => {
            const enabled = camp.commission_enabled === true;
            console.log(`[Config Tab] ${camp.id.slice(0,8)}: commission_enabled=${camp.commission_enabled} (type: ${typeof camp.commission_enabled}) → enabled=${enabled}`);
            initialConfig[camp.id] = {
              enabled: enabled,
              percentage: Number(camp.commission_percentage) || 10,
            };
          });
          console.log("[Config Tab] ✅ Config:", initialConfig);
          setCommissionConfig(initialConfig);
        } else {
          console.warn("[Config Tab] ⚠️ Sin campaigns");
        }
      };
      loadCampaigns();
    }
  }, [subTab]);

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)}
      </div>
    </div>
  );

  const k = data?.commKpis;
  const orders = (data?.mpOrders || []).filter(o => filter === "all" || o.status === filter);
  const totalPages = Math.ceil(orders.length / PER_PAGE);
  const pageOrders = orders.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const feeRate = k?.avgFeePct ? `${k.avgFeePct.toFixed(0)}%` : "10%";

  // Usar campaigns de la BD cuando está en config tab
  const campaigns = subTab === "config" && bdCampaigns ? bdCampaigns : (data?.allCampaigns || []);

  // Filtrar campañas por búsqueda
  const filteredCampaigns = campaigns.filter(camp => {
    const searchLower = searchTerm.toLowerCase();
    // bdCampaigns tiene estructura plana, allCampaigns tiene camp.campaign?.X
    const name = (camp.birthday_person_name || camp.campaign?.birthday_person_name || "").toLowerCase();
    const title = (camp.title || camp.campaign?.title || "").toLowerCase();
    const username = (camp.profile?.username || "").toLowerCase();
    return name.includes(searchLower) || title.includes(searchLower) || username.includes(searchLower);
  });

  // Guardar cambios usando endpoint serverless (bypassa RLS)
  const handleSaveConfig = async () => {
    try {
      const updates = Object.entries(commissionConfig).map(([campaignId, config]) => ({
        id: campaignId,
        commission_enabled: config.enabled === true,
        commission_percentage: Number(config.percentage) || 10,
      }));

      if (updates.length === 0) {
        alert("No hay cambios para guardar");
        return;
      }

      console.log("[Save] Enviando al endpoint:", updates);

      // Obtener token de sesión
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No hay sesión activa");
      }

      const response = await fetch("/api/update-commission-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ updates })
      });

      const result = await response.json();
      console.log("[Save] Respuesta del servidor:", result);

      if (!response.ok || !result.success) {
        console.error("[Save] Error:", result);
        throw new Error(result.error || "Error desconocido");
      }

      alert(`✅ ${result.total} configuraciones guardadas correctamente`);
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error("[Save] Error:", error);
      alert(`❌ Error al guardar: ${error.message}`);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* SUB-TABS */}
      <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 4, width: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 0 }}>
        {["resumen", "config"].map(tab => (
          <button key={tab}
            onClick={() => setSubTab(tab)}
            style={{
              padding: "7px 14px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13,
              flexShrink: 0,
              background: subTab === tab ? C.primaryBg : "transparent",
              color: subTab === tab ? C.primary : C.textLight,
              fontWeight: subTab === tab ? 600 : 400,
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {tab === "resumen" ? "Resumen" : "Configuración de comisiones"}
          </button>
        ))}
      </div>

      {/* ===== RESUMEN TAB ===== */}
      {subTab === "resumen" && (
      <>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, minmax(0,1fr))", gap: 10 }}>
        <KpiCard label="Comisión total cobrada"   value={fmtARS(k?.totalCommission)}   sub={`tasa promedio ${feeRate}`}    color={C.accent} />
        <KpiCard label="Últimos 30 días"           value={fmtARS(k?.commissionLast30)}  sub="comisión reciente"              color={C.primary} />
        <KpiCard label="Últimos 7 días"            value={fmtARS(k?.commissionLast7)}   sub="esta semana"                   color={C.primary} />
        <KpiCard label="Pagos aprobados"           value={k?.approvedCount || 0}         sub={`${k?.pendingCount || 0} pendientes`} color={C.success} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, minmax(0,1fr))", gap: 10 }}>
        <KpiCard label="Volumen bruto procesado"  value={fmtARS(k?.totalGrossMP)}      sub="total facturado via MP"        />
        <KpiCard label="Neto a cumpleañeros"      value={fmtARS(k?.totalNetSellers)}   sub="después de comisión"           color={C.success} />
        <KpiCard label="Retención plataforma"
          value={k?.totalGrossMP > 0 ? `${((k.totalCommission / k.totalGrossMP) * 100).toFixed(1)}%` : "—"}
          sub="del volumen total" color={C.accent} />
      </div>

      <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>Comisión mensual cobrada</div>
        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14 }}>Solo órdenes aprobadas</div>
        <CommBarChart data={data?.commMonthly} />
        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          {data?.commMonthly?.map((d, i) => (
            <div key={i} style={{ fontSize: 11, color: C.textMuted }}>
              <span style={{ fontWeight: 600, color: C.accent }}>{fmtARS(d.fee)}</span>
              {" "}{d.key.slice(5)}/{d.key.slice(2, 4)}
              <span style={{ marginLeft: 4 }}>({d.count} pag.)</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
            Órdenes Mercado Pago
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: C.textMuted }}>({orders.length} total)</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["all", "approved", "pending", "rejected", "cancelled"].map(s => (
              <button
                key={s}
                onClick={() => { setFilter(s); setPage(1); }}
                style={{
                  fontSize: 11, padding: "4px 10px", borderRadius: 20, border: "none", cursor: "pointer",
                  background: filter === s ? C.primaryBg : C.bg,
                  color: filter === s ? C.primary : C.textLight,
                  fontWeight: filter === s ? 600 : 400,
                }}
              >
                {s === "all" ? "Todos" : (STATUS_LABEL[s]?.label || s)}
              </button>
            ))}
          </div>
        </div>

        {!pageOrders.length ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: C.textMuted, fontSize: 13 }}>
            Sin órdenes MP aún. Cuando alguien haga un aporte por MP aparecerán acá.
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1.5px solid ${C.border}` }}>
                    {[
                      "Usuario (regalo)",
                      "Regalador",
                      "ID Pago MP",
                      "Meta del regalo",
                      "Recibido (neto)",
                      "Comisión",
                      "Estado",
                      "F. aprobación",
                      "F. cumpleaños",
                    ].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: C.textLight, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageOrders.map((o, i) => {
                    const camp = o.campaign || {};
                    const seller = o.seller || {};
                    return (
                      <tr key={o.id} style={{ borderBottom: `0.5px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : "#FAFAFA" }}>
                        <td style={{ padding: "10px 10px", minWidth: 160 }}>
                          <div style={{ fontWeight: 600, color: C.text, fontSize: 12 }}>
                            {camp.birthday_person_name || seller.name || "—"}
                          </div>
                          <div style={{ fontSize: 11, color: C.textLight, marginTop: 1 }}>
                            @{seller.username || "—"}
                          </div>
                          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {camp.title || "Sin título"}
                          </div>
                        </td>
                        <td style={{ padding: "10px 10px", minWidth: 110 }}>
                          <div style={{ fontWeight: 500, color: C.text }}>
                            {o.is_anonymous ? (
                              <span style={{ color: C.textMuted, fontStyle: "italic" }}>Anónimo</span>
                            ) : (o.payer_name || "—")}
                          </div>
                          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>
                            {fmtARS(o.gross_amount)} bruto
                          </div>
                        </td>
                        <td style={{ padding: "10px 10px", minWidth: 140 }}>
                          {o.transaction?.mp_payment_id && !o.transaction.mp_payment_id.startsWith("manual-") ? (
                            <>
                              <div style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: C.primary }}>
                                {o.transaction.mp_payment_id}
                              </div>
                              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                                {o.transaction.mp_payment_method || "—"}{o.transaction.mp_payment_type ? ` · ${o.transaction.mp_payment_type}` : ""}
                              </div>
                            </>
                          ) : (
                            <span style={{ fontSize: 11, color: C.textMuted, fontStyle: "italic" }}>sin ID real</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 10px", minWidth: 110 }}>
                          <div style={{ fontWeight: 600, color: C.text }}>
                            {camp.goal_amount > 0 ? fmtARS(camp.goal_amount) : <span style={{ color: C.textMuted }}>Libre</span>}
                          </div>
                          {(() => {
                            const goalPct = camp.goal_amount > 0
                              ? Math.min(100, Math.round((o.gross_amount / camp.goal_amount) * 100))
                              : null;
                            return goalPct !== null ? (
                              <div style={{ marginTop: 4 }}>
                                <div style={{ height: 3, background: C.bg, borderRadius: 9999, overflow: "hidden", width: 70 }}>
                                  <div style={{ height: "100%", width: `${goalPct}%`, background: goalPct >= 100 ? C.success : C.primary, borderRadius: 9999 }} />
                                </div>
                                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{goalPct}%</div>
                              </div>
                            ) : null;
                          })()}
                        </td>
                        <td style={{ padding: "10px 10px", whiteSpace: "nowrap" }}>
                          <div style={{ fontWeight: 700, color: C.success, fontSize: 13 }}>
                            {fmtARS(o.net_amount)}
                          </div>
                          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>
                            en cuenta MP
                          </div>
                        </td>
                        <td style={{ padding: "10px 10px", whiteSpace: "nowrap" }}>
                          <div style={{ fontWeight: 700, color: C.accent, fontSize: 13 }}>
                            {fmtARS(o.platform_fee_amount)}
                          </div>
                          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>
                            {o.platform_fee_pct}% retención
                          </div>
                        </td>
                        <td style={{ padding: "10px 10px" }}>
                          <StatusBadge status={o.status} />
                        </td>
                        <td style={{ padding: "10px 10px", whiteSpace: "nowrap", color: C.textLight, fontSize: 11 }}>
                          {o.transaction?.approved_at
                            ? <><div style={{ fontWeight: 500, color: C.text }}>{fmtDate(o.transaction.approved_at)}</div>
                               <div style={{ fontSize: 10, color: C.textMuted }}>{new Date(o.transaction.approved_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}hs</div></>
                            : <span style={{ color: C.textMuted }}>{fmtDate(o.created_at)}</span>
                          }
                        </td>
                        <td style={{ padding: "10px 10px", whiteSpace: "nowrap" }}>
                          {(() => {
                            const camp = o.campaign || {};
                            return camp.birthday_date ? (
                              <>
                                <div style={{ fontSize: 11, color: C.text, fontWeight: 500 }}>
                                  {fmtDate(camp.birthday_date)}
                                </div>
                                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>
                                  {(() => {
                                    const today = new Date();
                                    const bd = new Date(camp.birthday_date);
                                    bd.setFullYear(today.getFullYear());
                                    if (bd < today) bd.setFullYear(today.getFullYear() + 1);
                                    const days = Math.ceil((bd - today) / 86400000);
                                    return days === 0 ? "🎂 ¡Hoy!" : days <= 7 ? `🎂 en ${days}d` : `en ${days}d`;
                                  })()}
                                </div>
                              </>
                            ) : <span style={{ color: C.textMuted }}>—</span>;
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: "5px 12px", borderRadius: 6, border: `0.5px solid ${C.border}`, background: "transparent", cursor: page === 1 ? "default" : "pointer", color: page === 1 ? C.textMuted : C.text, fontSize: 12 }}>
                  ← Ant
                </button>
                <span style={{ fontSize: 12, color: C.textMuted, padding: "5px 8px" }}>{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: "5px 12px", borderRadius: 6, border: `0.5px solid ${C.border}`, background: "transparent", cursor: page === totalPages ? "default" : "pointer", color: page === totalPages ? C.textMuted : C.text, fontSize: 12 }}>
                  Sig →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ background: C.accentBg, border: `0.5px solid #FDE68A`, borderRadius: 10, padding: 14, fontSize: 12, color: "#92400E", lineHeight: 1.6 }}>
        💡 <strong>Cómo funciona la comisión:</strong> Cada vez que alguien paga por MP, se crea una orden con el monto bruto. La plataforma retiene el {feeRate} como comisión de marketplace. El cumpleañero recibe el neto directamente en su cuenta de MP. Las órdenes pendientes se confirman cuando MP procesa el pago y notifica por webhook.
      </div>
      </>
      )}

      {/* ===== CONFIG TAB ===== */}
      {subTab === "config" && (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        
        {/* Buscador */}
        <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
          <input type="text" placeholder="Buscar campaña o cumpleañero..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{
            width: "100%", padding: "8px 12px", border: `0.5px solid ${C.border}`, borderRadius: 6, fontSize: 13, boxSizing: "border-box"
          }} />
        </div>

        {/* Tabla de campañas */}
        <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14 }}>
            Comisiones por regalo
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: C.textMuted }}>Habilita o deshabilita comisión por cada campaña</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1.5px solid ${C.border}`, background: C.bg }}>
                  {[
                    "CUMPLEAÑERO",
                    "REGALO",
                    "ALIAS DE COBRO",
                    "APORTES",
                    "RECAUDADO",
                    "META",
                    "PROMEDIO",
                    "ESTADO",
                    "COMISIÓN HABILITADA",
                    "PORCENTAJE",
                  ].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.textMuted, fontSize: 10, whiteSpace: "nowrap", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ padding: "32px 12px", textAlign: "center", color: C.textMuted, fontSize: 12 }}>
                      {searchTerm ? "Sin resultados para tu búsqueda" : "Sin campañas aún"}
                    </td>
                  </tr>
                ) : filteredCampaigns.map((camp, i) => {
                  const cid = camp.id;
                  const isEnabled = commissionConfig[cid]?.enabled !== false;
                  const percentage = commissionConfig[cid]?.percentage ?? 10;
                  
                  return (
                    <tr key={cid} style={{ borderBottom: `0.5px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : "#FAFAFA" }}>
                      <td style={{ padding: "12px", minWidth: 160 }}>
                        <div style={{ fontWeight: 600, color: C.text }}>
                          {camp.birthday_person_name || "—"}
                        </div>
                        <div style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>
                          @{"—"}
                        </div>
                      </td>
                      <td style={{ padding: "12px", minWidth: 200 }}>
                        <span style={{ color: C.text, fontSize: 12 }}>{camp.title || "Sin título"}</span>
                      </td>
                      <td style={{ padding: "12px", minWidth: 120 }}>
                        <span style={{ color: C.textMuted }}>—</span>
                      </td>
                      <td style={{ padding: "12px", minWidth: 80 }}>
                        <span style={{ color: C.primary, fontWeight: 600 }}>{camp.count || 0}</span>
                      </td>
                      <td style={{ padding: "12px", minWidth: 120 }}>
                        <span style={{ color: C.success, fontWeight: 600 }}>{fmtARS(camp.raised || 0)}</span>
                      </td>
                      <td style={{ padding: "12px", minWidth: 100 }}>
                        <span style={{ color: C.textMuted }}>{fmtARS(camp.goal_amount || 0)}</span>
                      </td>
                      <td style={{ padding: "12px", minWidth: 100 }}>
                        <span style={{ color: C.text, fontWeight: 500 }}>
                          {fmtARS(camp.raised > 0 ? camp.raised / camp.count : 0)}
                        </span>
                      </td>
                      <td style={{ padding: "12px", minWidth: 100 }}>
                        <span style={{ background: C.successBg, color: C.success, padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>active</span>
                      </td>
                      <td style={{ padding: "12px", minWidth: 100, textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) => setCommissionConfig(prev => ({
                            ...prev,
                            [cid]: { ...prev[cid], enabled: e.target.checked }
                          }))}
                          style={{
                            appearance: "none",
                            WebkitAppearance: "none",
                            width: 48,
                            height: 28,
                            borderRadius: 14,
                            border: "none",
                            background: isEnabled ? C.primary : "#D1D5DB",
                            cursor: "pointer",
                            position: "relative",
                            transition: "background 0.2s",
                            outline: "none",
                          }}
                        />
                        <style>{`
                          input[type="checkbox"]::-webkit-slider-thumb {
                            appearance: none;
                          }
                          input[type="checkbox"]::after {
                            content: '';
                            position: absolute;
                            width: 24px;
                            height: 24px;
                            border-radius: 50%;
                            background: white;
                            top: 2px;
                            left: 2px;
                            transition: left 0.2s;
                          }
                          input[type="checkbox"]:checked::after {
                            left: 22px;
                          }
                        `}</style>
                      </td>
                      <td style={{ padding: "12px", minWidth: 120 }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <input type="number" value={percentage} onChange={(e) => setCommissionConfig(prev => ({
                            ...prev,
                            [cid]: { ...prev[cid], percentage: parseFloat(e.target.value) || 0 }
                          }))} min="0" max="100" step="0.5" style={{
                            width: 70, padding: "6px 8px", border: `0.5px solid ${C.border}`, borderRadius: 4, fontSize: 12
                          }} />
                          <span style={{ fontSize: 12, color: C.textLight, minWidth: 20 }}>%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Botón guardar */}
        <button onClick={handleSaveConfig} style={{
          padding: "10px 20px", background: C.primary, color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600
        }}>
          Guardar cambios
        </button>
      </div>
      )}
    </div>
  );
}


function WHBadge({ status }) {
  const s = WH_STATUS[status] || { label: status, color: "#6B7280", bg: "#F3F4F6" };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: s.bg, borderRadius: 20, padding: "2px 7px", whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

function CollapseCard({ icon, title, count, countColor, sub, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
      {/* Header tocable */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "16px 18px", cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div style={{ fontSize: 22 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{title}</div>
          {sub && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{sub}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: countColor || C.primary, lineHeight: 1 }}>{count}</div>
          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>operaciones</div>
        </div>
        <div style={{ fontSize: 18, color: C.textMuted, marginLeft: 8, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          ›
        </div>
      </div>
      {/* Contenido expandible */}
      {open && (
        <div style={{ borderTop: `0.5px solid ${C.border}` }}>
          {children}
        </div>
      )}
    </div>
  );
}

function TabOperaciones({ data, loading }) {
  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {Array.from({ length: 2 }).map((_, i) => <KpiSkeleton key={i} />)}
    </div>
  );

  const logs = data?.webhookLogs || [];
  const txs  = data?.mpTransactions || [];
  const processed = logs.filter(l => l.processing_status === "processed").length;
  const errors    = logs.filter(l => l.processing_status === "error").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* TARJETA 1 — Transacciones confirmadas */}
      <CollapseCard
        icon="💳"
        title="Transacciones confirmadas"
        count={txs.length}
        countColor={C.success}
        sub="Pagos aprobados por Mercado Pago"
        defaultOpen={true}
      >
        {!txs.length ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: C.textMuted, fontSize: 13 }}>Sin transacciones aún</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {txs.map((tx, i) => (
              <div key={tx.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 18px",
                borderBottom: i < txs.length - 1 ? `0.5px solid ${C.border}` : "none",
                background: i % 2 === 0 ? "transparent" : "#FAFAFA",
              }}>
                {/* Indicador estado */}
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: tx.mp_status === "approved" ? C.success : C.error, flexShrink: 0 }} />
                {/* Info principal */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, fontFamily: "monospace" }}>
                    {tx.mp_payment_id?.startsWith("manual-") ? "— sin ID real" : tx.mp_payment_id}
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                    {tx.mp_payment_method || "—"}{tx.mp_payment_type ? ` · ${tx.mp_payment_type}` : ""}
                  </div>
                </div>
                {/* Monto */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.success }}>{fmtARS(tx.gross_amount)}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                    {tx.approved_at
                      ? new Date(tx.approved_at).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) + "hs"
                      : "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapseCard>

      {/* TARJETA 2 — Webhook Logs */}
      <CollapseCard
        icon="📡"
        title="Notificaciones webhook"
        count={logs.length}
        countColor={errors > 0 ? C.error : C.info}
        sub={`${processed} procesadas · ${errors} errores`}
      >
        {!logs.length ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: C.textMuted, fontSize: 13 }}>Sin logs de webhook aún</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {logs.map((log, i) => (
              <div key={log.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 18px",
                borderBottom: i < logs.length - 1 ? `0.5px solid ${C.border}` : "none",
                background: i % 2 === 0 ? "transparent" : "#FAFAFA",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: "monospace" }}>
                    {log.resource_id || "—"}
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.external_reference || "sin ref"}
                  </div>
                  {log.error_message && (
                    <div style={{ fontSize: 10, color: C.error, marginTop: 2 }}>{log.error_message}</div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <WHBadge status={log.processing_status} />
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>
                    {log.received_at
                      ? new Date(log.received_at).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) + "hs"
                      : "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapseCard>

      {/* Nota */}
      <div style={{ background: C.infoBg, border: `0.5px solid #BFDBFE`, borderRadius: 10, padding: 12, fontSize: 11, color: "#1E40AF", lineHeight: 1.6 }}>
        📡 Solo los pagos <strong>approved</strong> por MP generan contribution y comisión. Los demás se ignoran.
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function AdminFinanzasPage({ initialFilter } = {}) {
  const { data, loading, load } = useFinanzas();
  const [activeTab, setActiveTab] = useState(initialFilter || "resumen");

  useEffect(() => {
    if (initialFilter) setActiveTab(initialFilter);
  }, [initialFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* TABS */}
      <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 4, width: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 0, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "7px 14px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13,
            flexShrink: 0,
            background: activeTab === tab.id ? C.primaryBg : "transparent",
            color: activeTab === tab.id ? C.primary : C.textLight,
            fontWeight: activeTab === tab.id ? 600 : 400,
            transition: "all 0.15s",
            whiteSpace: "nowrap",
          }}>{tab.label}</button>
        ))}
        <div style={{ flex: 1, minWidth: 8 }} />
        <button onClick={load} style={{ padding: "7px 12px", borderRadius: 7, border: `0.5px solid ${C.border}`, background: "transparent", fontSize: 12, color: C.textLight, cursor: "pointer", flexShrink: 0 }}>↻</button>
      </div>

      {activeTab === "resumen"      && <TabResumen    data={data} loading={loading} onGoToComisiones={() => setActiveTab("comisiones")} />}
      {activeTab === "campanas"     && <TabCampanas   data={data} loading={loading} />}
      {activeTab === "timeline"     && <TabTimeline   data={data} loading={loading} />}
      {activeTab === "comisiones"   && <TabComisiones data={data} loading={loading} />}
    </div>
  );
}

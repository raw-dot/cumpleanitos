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
const fmtMonth = (s) => s ? new Date(s).toLocaleDateString("es-AR", { month: "short", year: "2-digit" }) : "—";
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

const TABS = [
  { id: "resumen",   label: "Resumen"             },
  { id: "campanas",  label: "Por campaña"          },
  { id: "timeline",  label: "Historial de aportes" },
];

const PER_PAGE = 15;

// ─── HOOK ─────────────────────────────────────────────────────────────────────
function useFinanzas() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
      await ensureAdminSession();

    const [
      { data: contribs },
      { data: campaigns },
      { data: profiles },
    ] = await Promise.all([
      supabase.from("contributions").select("*").order("created_at", { ascending: false }),
      supabase.from("gift_campaigns").select("id, title, birthday_person_name, birthday_person_id, status, goal_amount, birthday_date, created_at"),
      supabase.from("profiles").select("id, username, name, payment_alias"),
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

    setData({
      contribs: enrichedContribs,
      campaignRows,
      monthlyData,
      kpis: { totalRaised, totalCount, avgPerContrib, raised30, raised7, anonPct, activeCampsWithRaised },
      top5,
    });
    setLoading(false);
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

// ─── TAB RESUMEN ─────────────────────────────────────────────────────────────
function TabResumen({ data, loading }) {
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
    </div>
  );
}

// ─── TAB POR CAMPAÑA ──────────────────────────────────────────────────────────
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

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function AdminFinanzasPage({ initialFilter } = {}) {
  const { data, loading, load } = useFinanzas();
  const [activeTab, setActiveTab] = useState(initialFilter || "resumen");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* TABS */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 4, alignSelf: "flex-start" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "7px 18px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13,
            background: activeTab === tab.id ? C.primaryBg : "transparent",
            color: activeTab === tab.id ? C.primary : C.textLight,
            fontWeight: activeTab === tab.id ? 600 : 400,
            transition: "all 0.15s",
          }}>{tab.label}</button>
        ))}
        <div style={{ flex: 1, minWidth: 20 }} />
        <button onClick={load} style={{ padding: "7px 12px", borderRadius: 7, border: `0.5px solid ${C.border}`, background: "transparent", fontSize: 12, color: C.textLight, cursor: "pointer" }}>↻</button>
      </div>

      {activeTab === "resumen"  && <TabResumen   data={data} loading={loading} />}
      {activeTab === "campanas" && <TabCampanas  data={data} loading={loading} />}
      {activeTab === "timeline" && <TabTimeline  data={data} loading={loading} />}
    </div>
  );
}

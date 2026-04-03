import { useIsMobile, rg } from "../useAdminBreakpoint";
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

const fmtDate  = (s) => s ? new Date(s).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—";
const fmtARS   = (n) => n != null ? `$${Math.round(n).toLocaleString("es-AR")}` : "$0";
const fmtShort = (s) => s ? new Date(s).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) : "—";

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const now = new Date(); now.setHours(0,0,0,0);
  const d = new Date(dateStr + "T12:00:00");
  d.setFullYear(now.getFullYear());
  if (d < now) d.setFullYear(now.getFullYear() + 1);
  return Math.round((d - now) / 86400000);
};

const STATUS_MAP = {
  active:   { label: "Activo",    color: C.success, bg: C.successBg },
  inactive: { label: "Inactivo",  color: C.textMuted, bg: C.bg },
  draft:    { label: "Borrador",  color: C.accent,  bg: C.accentBg },
  finished: { label: "Finalizado",color: C.info,    bg: C.infoBg   },
};

const FILTERS = [
  { id: "all",      label: "Todos"       },
  { id: "active",   label: "Activos"     },
  { id: "nogift",   label: "Sin aportes" },
  { id: "upcoming", label: "Próximos 30d"},
  { id: "finished", label: "Finalizados" },
];

const PER_PAGE = 15;

// ─── HOOK ────────────────────────────────────────────────────────────────────
function useCumpleanos() {
  const [campaigns,  setCampaigns]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [
      { data: camps },
      { data: contribs },
      { data: items },
      { data: profiles },
    ] = await Promise.all([
      supabase.from("gift_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("contributions").select("amount, campaign_id, anonymous"),
      supabase.from("gift_items").select("id, campaign_id"),
      supabase.from("profiles").select("id, username, name, email"),
    ]);

    // mapas rápidos
    const contribMap = {};
    (contribs || []).forEach(c => {
      if (!contribMap[c.campaign_id]) contribMap[c.campaign_id] = [];
      contribMap[c.campaign_id].push(c);
    });
    const itemMap = {};
    (items || []).forEach(i => {
      if (!itemMap[i.campaign_id]) itemMap[i.campaign_id] = [];
      itemMap[i.campaign_id].push(i);
    });
    const profMap = {};
    (profiles || []).forEach(p => { profMap[p.id] = p; });

    const enriched = (camps || []).map(c => {
      const cs   = contribMap[c.campaign_id] || contribMap[c.id] || [];
      const its  = itemMap[c.campaign_id]    || itemMap[c.id]    || [];
      const prof = profMap[c.birthday_person_id] || {};
      const raised = cs.reduce((s, x) => s + (x.amount || 0), 0);
      return {
        ...c,
        contribs: cs,
        items: its,
        profile: prof,
        raised,
        contribCount: cs.length,
        itemCount: its.length,
        pct: c.goal_amount > 0 ? Math.min(Math.round((raised / c.goal_amount) * 100), 100) : 0,
      };
    });

    setCampaigns(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async (campId, current) => {
    const next = current === "active" ? "inactive" : "active";
    const { error } = await supabase.from("gift_campaigns").update({ status: next }).eq("id", campId);
    if (error) { showToast("Error al cambiar estado", "error"); return; }
    setCampaigns(prev => prev.map(c => c.id === campId ? { ...c, status: next } : c));
    showToast(next === "active" ? "Cumpleaños activado" : "Cumpleaños pausado");
  };

  return { campaigns, loading, toast, load, toggleStatus };
}

// ─── DETAIL DRAWER ───────────────────────────────────────────────────────────
function DetailDrawer({ camp, onClose, onToggleStatus }) {
  const days = daysUntil(camp.birthday_date);
  const status = STATUS_MAP[camp.status] || STATUS_MAP.inactive;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} />
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0,
        width: 400, background: C.surface, borderLeft: `0.5px solid ${C.border}`,
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        {/* header */}
        <div style={{ padding: "18px 20px 16px", borderBottom: `0.5px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>
                {camp.birthday_person_name || camp.title || "Sin nombre"}
              </div>
              <div style={{ fontSize: 12, color: C.textMuted }}>
                @{camp.profile?.username || "—"} · {camp.profile?.email || ""}
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.textMuted, padding: 4 }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center" }}>
            <StatusPill status={camp.status} />
            {days !== null && (
              <span style={{ fontSize: 11, color: days <= 7 ? C.error : C.textMuted }}>
                {days === 0 ? "🎂 Hoy!" : `📅 en ${days} días`}
              </span>
            )}
          </div>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>

          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: "Recaudado",  value: fmtARS(camp.raised)     },
              { label: "Aportes",    value: camp.contribCount        },
              { label: "Regalos",    value: camp.itemCount           },
            ].map(k => (
              <div key={k.label} style={{ background: C.bg, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{k.value}</div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {camp.goal_amount > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textMuted, marginBottom: 5 }}>
                <span>Meta: {fmtARS(camp.goal_amount)}</span>
                <span style={{ color: C.primary, fontWeight: 600 }}>{camp.pct}%</span>
              </div>
              <div style={{ height: 6, background: C.bg, borderRadius: 9999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${camp.pct}%`, background: C.primary, borderRadius: 9999, transition: "width 0.5s" }} />
              </div>
            </div>
          )}

          {/* Info grid */}
          <div style={{ background: C.bg, borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 7 }}>
            <InfoRow label="Título"           value={camp.title || "—"} />
            <InfoRow label="Fecha cumpleaños" value={fmtDate(camp.birthday_date)} />
            <InfoRow label="Creado"           value={fmtDate(camp.created_at)} />
            <InfoRow label="% anónimos"       value={camp.contribCount > 0 ? `${Math.round((camp.contribs.filter(c=>c.anonymous).length / camp.contribCount) * 100)}%` : "—"} />
          </div>

          {/* Últimos aportes */}
          {camp.contribCount > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Últimos aportes</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {camp.contribs.slice(0, 6).map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: i < Math.min(camp.contribs.length, 6) - 1 ? `0.5px solid ${C.border}` : "none" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.anonymous ? C.textMuted : C.primary, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, color: C.textLight }}>{c.anonymous ? "Anónimo" : (c.gifter_name || "—")}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{fmtARS(c.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div style={{ padding: "14px 20px", borderTop: `0.5px solid ${C.border}` }}>
          <button
            onClick={() => onToggleStatus(camp.id, camp.status)}
            style={{
              width: "100%", padding: "9px 0", borderRadius: 7,
              border: `0.5px solid ${camp.status === "active" ? C.error : C.success}`,
              background: "transparent",
              color: camp.status === "active" ? C.error : C.success,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            {camp.status === "active" ? "✕ Pausar cumpleaños" : "✓ Activar cumpleaños"}
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

function StatusPill({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.inactive;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
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

// ─── MINI PROGRESS ───────────────────────────────────────────────────────────
function MiniProgress({ pct }) {
  return (
    <div style={{ height: 4, background: C.bg, borderRadius: 9999, overflow: "hidden", width: 60 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? C.success : C.primary, borderRadius: 9999 }} />
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function AdminCumpleanosPage() {
  const { campaigns, loading, toast, load, toggleStatus } = useCumpleanos();
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");
  const [page,     setPage]     = useState(0);
  const [detail,   setDetail]   = useState(null);

  const filtered = campaigns.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || c.birthday_person_name?.toLowerCase().includes(q)
      || c.title?.toLowerCase().includes(q)
      || c.profile?.username?.toLowerCase().includes(q)
      || c.profile?.email?.toLowerCase().includes(q);

    const days = daysUntil(c.birthday_date);
    const matchFilter =
      filter === "active"   ? c.status === "active" :
      filter === "nogift"   ? c.contribCount === 0 :
      filter === "upcoming" ? (days !== null && days <= 30 && c.status === "active") :
      filter === "finished" ? c.status === "finished" :
      true;

    return matchSearch && matchFilter;
  });

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const handleFilter = (f) => { setFilter(f); setPage(0); };
  const handleSearch = (v) => { setSearch(v); setPage(0); };

  // stats
  const stats = {
    total:    campaigns.length,
    active:   campaigns.filter(c => c.status === "active").length,
    nogift:   campaigns.filter(c => c.contribCount === 0).length,
    upcoming: campaigns.filter(c => { const d = daysUntil(c.birthday_date); return d !== null && d <= 30 && c.status === "active"; }).length,
    raised:   campaigns.reduce((s, c) => s + c.raised, 0),
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Toast toast={toast} />
      {detail && (
        <DetailDrawer
          camp={detail}
          onClose={() => setDetail(null)}
          onToggleStatus={(id, st) => { toggleStatus(id, st); setDetail(prev => ({ ...prev, status: st === "active" ? "inactive" : "active" })); }}
        />
      )}

      {/* ── STAT PILLS ── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "Totales",       value: stats.total,               color: C.text    },
          { label: "Activos",       value: stats.active,              color: C.success },
          { label: "Sin aportes",   value: stats.nogift,              color: C.error   },
          { label: "Próximos 30d",  value: stats.upcoming,            color: C.accent  },
          { label: "Total recaudado", value: fmtARS(stats.raised),    color: C.primary },
        ].map(s => (
          <div key={s.label} style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "10px 16px", display: "flex", gap: 8, alignItems: "baseline" }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</span>
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
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.textMuted }}>⌕</span>
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar por nombre, @username o email…"
            style={{ width: "100%", paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: `0.5px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.text, background: C.bg, boxSizing: "border-box" }}
          />
          {search && <button onClick={() => handleSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.textMuted }}>✕</button>}
        </div>
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

      {/* ── TABLA ── */}
      <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: C.textMuted, fontSize: 13 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⟳</div>Cargando cumpleaños…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: C.textMuted, fontSize: 13 }}>Sin resultados</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `0.5px solid ${C.border}` }}>
                {["Cumpleañero", "Usuario", "Fecha", "Recaudado", "Meta", "Aportes", "Estado", ""].map(label => (
                  <th key={label} style={{
                    textAlign: label === "" ? "right" : "left",
                    padding: "10px 12px",
                    fontSize: 10, fontWeight: 600, color: C.textMuted,
                    textTransform: "uppercase", letterSpacing: "0.05em",
                    background: C.bg, whiteSpace: "nowrap",
                  }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((camp, i) => {
                const days = daysUntil(camp.birthday_date);
                const isUrgent = days !== null && days <= 7 && camp.status === "active";
                return (
                  <tr
                    key={camp.id}
                    onClick={() => setDetail(camp)}
                    style={{
                      borderBottom: i < paged.length - 1 ? `0.5px solid ${C.border}` : "none",
                      background: isUrgent ? "#FFFBEB" : C.surface,
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = C.primaryBg}
                    onMouseLeave={e => e.currentTarget.style.background = isUrgent ? "#FFFBEB" : C.surface}
                  >
                    {/* cumpleañero */}
                    <td style={{ padding: "11px 12px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.primaryBg, color: C.primary, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {(camp.birthday_person_name || camp.title || "?").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: C.text }}>{camp.birthday_person_name || "Sin nombre"}</div>
                          {camp.title && <div style={{ fontSize: 11, color: C.textMuted, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{camp.title}</div>}
                        </div>
                      </div>
                    </td>

                    {/* usuario */}
                    <td style={{ padding: "11px 12px", verticalAlign: "middle" }}>
                      <span style={{ fontSize: 12, color: C.primary, fontWeight: 500 }}>@{camp.profile?.username || "—"}</span>
                    </td>

                    {/* fecha */}
                    <td style={{ padding: "11px 12px", verticalAlign: "middle" }}>
                      <div style={{ fontSize: 12, color: isUrgent ? C.error : C.textLight, fontWeight: isUrgent ? 600 : 400 }}>
                        {fmtShort(camp.birthday_date)}
                      </div>
                      {days !== null && (
                        <div style={{ fontSize: 10, color: isUrgent ? C.error : C.textMuted }}>
                          {days === 0 ? "🎂 hoy" : `en ${days}d`}
                        </div>
                      )}
                    </td>

                    {/* recaudado */}
                    <td style={{ padding: "11px 12px", verticalAlign: "middle" }}>
                      <span style={{ fontWeight: 600, color: camp.raised > 0 ? C.text : C.textMuted }}>
                        {fmtARS(camp.raised)}
                      </span>
                    </td>

                    {/* meta + progress */}
                    <td style={{ padding: "11px 12px", verticalAlign: "middle" }}>
                      {camp.goal_amount > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontSize: 11, color: C.textMuted }}>{fmtARS(camp.goal_amount)}</span>
                          <MiniProgress pct={camp.pct} />
                        </div>
                      ) : (
                        <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>
                      )}
                    </td>

                    {/* aportes */}
                    <td style={{ padding: "11px 12px", verticalAlign: "middle" }}>
                      {camp.contribCount > 0 ? (
                        <span style={{ fontWeight: 600, color: C.primary }}>{camp.contribCount}</span>
                      ) : (
                        <span style={{ color: C.error, fontWeight: 600 }}>—</span>
                      )}
                    </td>

                    {/* estado */}
                    <td style={{ padding: "11px 12px", verticalAlign: "middle" }}>
                      <StatusPill status={camp.status} />
                    </td>

                    {/* acción */}
                    <td style={{ padding: "11px 12px", verticalAlign: "middle", textAlign: "right" }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => toggleStatus(camp.id, camp.status)}
                        title={camp.status === "active" ? "Pausar" : "Activar"}
                        style={{
                          width: 28, height: 28, borderRadius: 6,
                          border: `0.5px solid ${C.border}`, background: C.surface,
                          cursor: "pointer", fontSize: 13,
                          color: camp.status === "active" ? C.error : C.success,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {camp.status === "active" ? "✕" : "✓"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── PAGINACIÓN ── */}
      {pages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: C.textMuted }}>
          <span>{page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} de {filtered.length}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <PagBtn disabled={page === 0}         onClick={() => setPage(p => p - 1)}>← Ant</PagBtn>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
              const p = pages <= 7 ? i : page < 4 ? i : page > pages - 4 ? pages - 7 + i : page - 3 + i;
              return <PagBtn key={p} active={p === page} onClick={() => setPage(p)}>{p + 1}</PagBtn>;
            })}
            <PagBtn disabled={page >= pages - 1}  onClick={() => setPage(p => p + 1)}>Sig →</PagBtn>
          </div>
        </div>
      )}
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

import { useState, useEffect, useCallback } from "react";
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
const fmtDate = (s) => s ? new Date(s).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—";
const fmtTime = (s) => s ? new Date(s).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : "";

const TABS = [
  { id: "items",   label: "Regalos (wishlist)" },
  { id: "contribs",label: "Aportes recibidos"  },
];

const PER_PAGE = 15;

// ─── HOOK ────────────────────────────────────────────────────────────────────
function useRegalos() {
  const [items,    setItems]    = useState([]);
  const [contribs, setContribs] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
      await ensureAdminSession();
    const [
      { data: giftItems },
      { data: contributions },
      { data: campaigns },
      { data: profiles },
    ] = await Promise.all([
      supabase.from("gift_items").select("*").order("created_at", { ascending: false }),
      supabase.from("contributions").select("*").order("created_at", { ascending: false }),
      supabase.from("gift_campaigns").select("id, title, birthday_person_name, birthday_person_id, status"),
      supabase.from("profiles").select("id, username, name"),
    ]);

    const campMap = {};
    (campaigns || []).forEach(c => { campMap[c.id] = c; });
    const profMap = {};
    (profiles || []).forEach(p => { profMap[p.id] = p; });

    const enrichedItems = (giftItems || []).map(i => ({
      ...i,
      campaign: campMap[i.campaign_id] || {},
    }));

    const enrichedContribs = (contributions || []).map(c => ({
      ...c,
      campaign: campMap[c.campaign_id] || {},
      gifterProfile: c.gifter_id ? profMap[c.gifter_id] : null,
    }));

    setItems(enrichedItems);
    setContribs(enrichedContribs);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  return { items, contribs, loading, load };
}

// ─── DETAIL DRAWER ─────────────────────────────────────────────────────────
function ContribDrawer({ contrib, onClose }) {
  const isAnon = contrib.is_anonymous || contrib.anonymous;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} />
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0,
        width: 360, background: C.surface, borderLeft: `0.5px solid ${C.border}`,
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        <div style={{ padding: "18px 20px 16px", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Detalle de aporte</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{fmtDate(contrib.created_at)} · {fmtTime(contrib.created_at)}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.textMuted }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* monto destacado */}
          <div style={{ background: C.primaryBg, borderRadius: 10, padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: C.primary }}>{fmtARS(contrib.amount)}</div>
            <div style={{ fontSize: 12, color: C.primaryLight, marginTop: 4 }}>monto registrado</div>
          </div>

          {/* quién regaló */}
          <div style={{ background: C.bg, borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 7 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Regalador</div>
            <InfoRow label="Nombre"    value={isAnon ? "Anónimo" : (contrib.gifter_name || "—")} />
            <InfoRow label="Contacto"  value={contrib.gifter_contact || "—"} />
            <InfoRow label="Usuario"   value={contrib.gifterProfile ? `@${contrib.gifterProfile.username}` : "—"} />
            {isAnon && <div style={{ fontSize: 11, background: C.accentBg, color: C.accent, padding: "4px 8px", borderRadius: 6, fontWeight: 600 }}>Aporte anónimo</div>}
          </div>

          {/* mensaje */}
          {contrib.message && (
            <div style={{ background: C.bg, borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Mensaje</div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5, fontStyle: "italic" }}>"{contrib.message}"</div>
            </div>
          )}

          {/* cumpleaños */}
          <div style={{ background: C.bg, borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 7 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Cumpleaños</div>
            <InfoRow label="Cumpleañero" value={contrib.campaign?.birthday_person_name || "—"} />
            <InfoRow label="Título"      value={contrib.campaign?.title || "—"} />
            <InfoRow label="Estado"      value={contrib.campaign?.status || "—"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemDrawer({ item, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} />
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0,
        width: 360, background: C.surface, borderLeft: `0.5px solid ${C.border}`,
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        <div style={{ padding: "18px 20px 16px", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{item.name}</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Agregado {fmtDate(item.created_at)}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.textMuted }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {item.image_url && (
            <img src={item.image_url} alt={item.name} style={{ width: "100%", borderRadius: 8, objectFit: "cover", maxHeight: 180 }} />
          )}

          {item.price && (
            <div style={{ background: C.primaryBg, borderRadius: 10, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.primary }}>{fmtARS(item.price)}</div>
              <div style={{ fontSize: 12, color: C.primaryLight, marginTop: 2 }}>precio sugerido</div>
            </div>
          )}

          <div style={{ background: C.bg, borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 7 }}>
            <InfoRow label="Cumpleañero" value={item.campaign?.birthday_person_name || "—"} />
            <InfoRow label="Campaña"     value={item.campaign?.title || "—"} />
            <InfoRow label="Estado"      value={item.campaign?.status || "—"} />
          </div>

          {item.description && (
            <div style={{ background: C.bg, borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Descripción</div>
              <div style={{ fontSize: 13, color: C.textLight, lineHeight: 1.5 }}>{item.description}</div>
            </div>
          )}

          {item.item_url && (
            <a href={item.item_url} target="_blank" rel="noopener noreferrer" style={{
              display: "block", textAlign: "center", padding: "9px 0", borderRadius: 7,
              border: `0.5px solid ${C.primary}`, color: C.primary,
              fontSize: 13, fontWeight: 600, textDecoration: "none",
            }}>
              Ver producto →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
      <span style={{ color: C.textMuted }}>{label}</span>
      <span style={{ color: C.text, fontWeight: 500, textAlign: "right", maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}

// ─── TABLA ITEMS ─────────────────────────────────────────────────────────────
function TablaItems({ items, loading, onSelect }) {
  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(0);

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    return !q || i.name?.toLowerCase().includes(q) || i.campaign?.birthday_person_name?.toLowerCase().includes(q);
  });
  const pages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  // stats
  const withPrice   = items.filter(i => i.price > 0).length;
  const totalValue  = items.reduce((s, i) => s + (i.price || 0), 0);
  const withLink    = items.filter(i => i.item_url).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* stats */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "Regalos totales",  value: items.length,                  color: C.text    },
          { label: "Con precio",       value: withPrice,                     color: C.primary },
          { label: "Valor total wishlist", value: fmtARS(totalValue),        color: C.success },
          { label: "Con link producto",value: withLink,                      color: C.accent  },
        ].map(s => (
          <div key={s.label} style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "10px 16px", display: "flex", gap: 8, alignItems: "baseline" }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 11, color: C.textMuted }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* search */}
      <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "12px 16px" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.textMuted }}>⌕</span>
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Buscar por nombre de regalo o cumpleañero…"
            style={{ width: "100%", paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: `0.5px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.text, background: C.bg, boxSizing: "border-box" }}
          />
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.textMuted }}>✕</button>}
        </div>
      </div>

      {/* tabla */}
      <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        {loading ? <LoadingState text="Cargando regalos…" /> : filtered.length === 0 ? <EmptyState /> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `0.5px solid ${C.border}` }}>
                {["Regalo", "Cumpleañero", "Precio", "Link", "Agregado", ""].map(label => (
                  <th key={label} style={thStyle(label === "")}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((item, i) => (
                <tr key={item.id}
                  onClick={() => onSelect(item)}
                  style={{ borderBottom: i < paged.length - 1 ? `0.5px solid ${C.border}` : "none", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = C.primaryBg}
                  onMouseLeave={e => e.currentTarget.style.background = C.surface}
                >
                  <td style={tdStyle()}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {item.image_url
                        ? <img src={item.image_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                        : <div style={{ width: 32, height: 32, borderRadius: 6, background: C.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🎁</div>
                      }
                      <div>
                        <div style={{ fontWeight: 600, color: C.text }}>{item.name}</div>
                        {item.description && <div style={{ fontSize: 11, color: C.textMuted, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle()}><span style={{ fontSize: 12, color: C.primary, fontWeight: 500 }}>{item.campaign?.birthday_person_name || "—"}</span></td>
                  <td style={tdStyle()}><span style={{ fontWeight: 600, color: item.price ? C.text : C.textMuted }}>{item.price ? fmtARS(item.price) : "—"}</span></td>
                  <td style={tdStyle()}>
                    {item.item_url
                      ? <span style={{ fontSize: 11, background: C.infoBg, color: C.info, padding: "2px 7px", borderRadius: 9999, fontWeight: 600 }}>Sí</span>
                      : <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>
                    }
                  </td>
                  <td style={tdStyle()}><span style={{ fontSize: 12, color: C.textLight }}>{fmtDate(item.created_at)}</span></td>
                  <td style={{ ...tdStyle(), textAlign: "right" }}>
                    <span style={{ fontSize: 11, color: C.primary }}>ver →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} pages={pages} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
    </div>
  );
}

// ─── TABLA APORTES ────────────────────────────────────────────────────────────
function TablaContribs({ contribs, loading, onSelect }) {
  const [search, setSearch]  = useState("");
  const [filter, setFilter]  = useState("all");
  const [page,   setPage]    = useState(0);

  const filtered = contribs.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || c.gifter_name?.toLowerCase().includes(q)
      || c.campaign?.birthday_person_name?.toLowerCase().includes(q)
      || c.message?.toLowerCase().includes(q);
    const isAnon = c.is_anonymous || c.anonymous;
    const matchFilter =
      filter === "anon"    ? isAnon :
      filter === "named"   ? !isAnon :
      filter === "message" ? !!c.message :
      true;
    return matchSearch && matchFilter;
  });

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const totalAmount = contribs.reduce((s, c) => s + (c.amount || 0), 0);
  const anonCount   = contribs.filter(c => c.is_anonymous || c.anonymous).length;
  const withMsg     = contribs.filter(c => c.message).length;
  const avgAmount   = contribs.length > 0 ? totalAmount / contribs.length : 0;

  const CONTRIB_FILTERS = [
    { id: "all",     label: "Todos"     },
    { id: "named",   label: "Con nombre"},
    { id: "anon",    label: "Anónimos"  },
    { id: "message", label: "Con mensaje"},
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* stats */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "Total aportes",  value: contribs.length,           color: C.text    },
          { label: "Total recaudado",value: fmtARS(totalAmount),       color: C.success },
          { label: "Promedio",       value: fmtARS(avgAmount),         color: C.primary },
          { label: "Anónimos",       value: `${anonCount} (${contribs.length > 0 ? Math.round(anonCount/contribs.length*100) : 0}%)`, color: C.accent },
          { label: "Con mensaje",    value: withMsg,                   color: C.info    },
        ].map(s => (
          <div key={s.label} style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "10px 16px", display: "flex", gap: 8, alignItems: "baseline" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 11, color: C.textMuted }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* toolbar */}
      <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.textMuted }}>⌕</span>
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Buscar por nombre, cumpleañero o mensaje…"
            style={{ width: "100%", paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: `0.5px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.text, background: C.bg, boxSizing: "border-box" }}
          />
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.textMuted }}>✕</button>}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {CONTRIB_FILTERS.map(f => (
            <button key={f.id} onClick={() => { setFilter(f.id); setPage(0); }} style={{
              padding: "6px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
              border: `0.5px solid ${filter === f.id ? C.primary : C.border}`,
              background: filter === f.id ? C.primaryBg : "transparent",
              color: filter === f.id ? C.primary : C.textLight,
              fontWeight: filter === f.id ? 600 : 400,
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* tabla */}
      <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        {loading ? <LoadingState text="Cargando aportes…" /> : filtered.length === 0 ? <EmptyState /> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `0.5px solid ${C.border}` }}>
                {["Regalador", "Cumpleañero", "Monto", "Mensaje", "Fecha", ""].map(label => (
                  <th key={label} style={thStyle(label === "")}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((c, i) => {
                const isAnon = c.is_anonymous || c.anonymous;
                return (
                  <tr key={c.id}
                    onClick={() => onSelect(c)}
                    style={{ borderBottom: i < paged.length - 1 ? `0.5px solid ${C.border}` : "none", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = C.primaryBg}
                    onMouseLeave={e => e.currentTarget.style.background = C.surface}
                  >
                    {/* regalador */}
                    <td style={tdStyle()}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: isAnon ? C.bg : C.primaryBg, color: isAnon ? C.textMuted : C.primary, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {isAnon ? "?" : (c.gifter_name || "?").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: isAnon ? C.textMuted : C.text, fontStyle: isAnon ? "italic" : "normal" }}>
                            {isAnon ? "Anónimo" : (c.gifter_name || "Sin nombre")}
                          </div>
                          {c.gifter_contact && <div style={{ fontSize: 11, color: C.textMuted }}>{c.gifter_contact}</div>}
                        </div>
                        {isAnon && <span style={{ fontSize: 9, fontWeight: 700, background: C.accentBg, color: C.accent, padding: "1px 5px", borderRadius: 4 }}>ANON</span>}
                      </div>
                    </td>

                    {/* cumpleañero */}
                    <td style={tdStyle()}>
                      <span style={{ fontSize: 12, color: C.primary, fontWeight: 500 }}>{c.campaign?.birthday_person_name || "—"}</span>
                    </td>

                    {/* monto */}
                    <td style={tdStyle()}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.success }}>{fmtARS(c.amount)}</span>
                    </td>

                    {/* mensaje */}
                    <td style={tdStyle()}>
                      {c.message
                        ? <span style={{ fontSize: 12, color: C.textLight, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>"{c.message}"</span>
                        : <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>
                      }
                    </td>

                    {/* fecha */}
                    <td style={tdStyle()}>
                      <div style={{ fontSize: 12, color: C.textLight }}>{fmtDate(c.created_at)}</div>
                      <div style={{ fontSize: 10, color: C.textMuted }}>{fmtTime(c.created_at)}</div>
                    </td>

                    <td style={{ ...tdStyle(), textAlign: "right" }}>
                      <span style={{ fontSize: 11, color: C.primary }}>ver →</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} pages={pages} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
    </div>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function LoadingState({ text }) {
  return <div style={{ padding: 32, textAlign: "center", color: C.textMuted, fontSize: 13 }}><div style={{ fontSize: 24, marginBottom: 8 }}>⟳</div>{text}</div>;
}
function EmptyState() {
  return <div style={{ padding: 48, textAlign: "center", color: C.textMuted, fontSize: 13 }}>Sin resultados</div>;
}
const thStyle = (right) => ({
  textAlign: right ? "right" : "left", padding: "10px 12px",
  fontSize: 10, fontWeight: 600, color: C.textMuted,
  textTransform: "uppercase", letterSpacing: "0.05em",
  background: C.bg, whiteSpace: "nowrap",
});
const tdStyle = () => ({ padding: "11px 12px", verticalAlign: "middle" });

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

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdminRegalosPage({ initialFilter } = {}) {
  const { items, contribs, loading, load } = useRegalos();
  const [activeTab,      setActiveTab]      = useState(initialFilter === "items" ? "items" : "contribs");
  const [selectedItem,   setSelectedItem]   = useState(null);
  const [selectedContrib,setSelectedContrib]= useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {selectedItem   && <ItemDrawer   item={selectedItem}     onClose={() => setSelectedItem(null)}    />}
      {selectedContrib && <ContribDrawer contrib={selectedContrib} onClose={() => setSelectedContrib(null)} />}

      {/* ── TABS ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 4, alignSelf: "flex-start" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "7px 18px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13,
            background: activeTab === tab.id ? C.primaryBg : "transparent",
            color: activeTab === tab.id ? C.primary : C.textLight,
            fontWeight: activeTab === tab.id ? 600 : 400,
            transition: "all 0.15s",
          }}>
            {tab.label}
            <span style={{ marginLeft: 6, fontSize: 11, background: activeTab === tab.id ? C.primary : C.bg, color: activeTab === tab.id ? "#fff" : C.textMuted, padding: "1px 6px", borderRadius: 9999, fontWeight: 600 }}>
              {tab.id === "items" ? items.length : contribs.length}
            </span>
          </button>
        ))}
        <div style={{ flex: 1, minWidth: 20 }} />
        <button onClick={load} style={{ padding: "7px 12px", borderRadius: 7, border: `0.5px solid ${C.border}`, background: "transparent", fontSize: 12, color: C.textLight, cursor: "pointer" }}>
          ↻
        </button>
      </div>

      {/* ── CONTENIDO ── */}
      {activeTab === "items"
        ? <TablaItems    items={items}     loading={loading} onSelect={setSelectedItem}    />
        : <TablaContribs contribs={contribs} loading={loading} onSelect={setSelectedContrib} />
      }
    </div>
  );
}

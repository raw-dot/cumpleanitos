import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";

const COLORS = {
  primary: "#7C3AED", primaryDark: "#5B21B6", accent: "#F59E0B",
  bg: "#F5F5F7", card: "#FFFFFF", text: "#1F2937", textLight: "#6B7280",
  border: "#E5E7EB", success: "#10B981", error: "#EF4444",
};

function fmtMoney(n) {
  if (!n) return "$0";
  if (n >= 1000000) return "$" + (n/1000000).toFixed(1) + "M";
  if (n >= 1000) return "$" + Math.round(n/1000) + "k";
  return "$" + Math.round(n).toLocaleString("es-AR");
}

function fmtDate(s) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
}

function ProgressBar({ pct }) {
  const color = pct >= 80 ? COLORS.success : pct >= 50 ? COLORS.accent : COLORS.primary;
  return (
    <div style={{ height: 5, background: "#F3F4F6", borderRadius: 3, margin: "6px 0" }}>
      <div style={{ height: "100%", width: Math.min(pct,100) + "%", borderRadius: 3, background: color, transition: "width 0.3s" }} />
    </div>
  );
}

export default function GiftsGivenPage({ onBack }) {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadingTimeoutRef = useRef(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current); };
  }, []);

  useEffect(() => {
    fetchGiftsGiven();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && mountedRef.current && loadingTimeoutRef.current) fetchGiftsGiven();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const fetchGiftsGiven = async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    loadingTimeoutRef.current = setTimeout(() => { if (mountedRef.current) setLoading(false); }, 6000);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setLoading(false); return; }

        // Traer todos los aportes hechos por este usuario
        const { data: contribs } = await supabase
          .from("contributions")
          .select("id, amount, message, created_at, campaign_id, is_anonymous, anonymous")
          .eq("gifter_id", session.user.id)
          .order("created_at", { ascending: false });

        if (!contribs || contribs.length === 0) { setLoading(false); return; }

        // Traer las campañas asociadas
        const campIds = [...new Set(contribs.map(c => c.campaign_id))];
        const { data: campaigns } = await supabase
          .from("gift_campaigns")
          .select("id, title, goal_amount, status, image_url, birthday_date, birthday_person_id, birthday_person_name")
          .in("id", campIds);

        // Traer aportes totales de cada campaña para mostrar progreso
        const { data: allContribs } = await supabase
          .from("contributions")
          .select("campaign_id, amount")
          .in("campaign_id", campIds);

        const campMap = {};
        (campaigns || []).forEach(c => { campMap[c.id] = c; });

        const raisedMap = {};
        (allContribs || []).forEach(c => {
          raisedMap[c.campaign_id] = (raisedMap[c.campaign_id] || 0) + (parseFloat(c.amount) || 0);
        });

        const enriched = contribs.map(c => ({
          ...c,
          campaign: campMap[c.campaign_id] || null,
          campaignRaised: raisedMap[c.campaign_id] || 0,
        }));

        setContributions(enriched);
      } catch (e) {
        console.error("GiftsGiven error:", e);
      } finally {
        if (loadingTimeoutRef.current) { clearTimeout(loadingTimeoutRef.current); loadingTimeoutRef.current = null; }
        if (mountedRef.current) setLoading(false);
      }
  };

  const totalAportado = contributions.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  const activas  = contributions.filter(c => c.campaign?.status === "active");
  const cerradas = contributions.filter(c => c.campaign?.status !== "active");

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid " + COLORS.border, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 20, color: COLORS.primary, fontWeight: 800, cursor: "pointer", padding: "2px 8px 2px 0" }}>‹</button>
        <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>Regalos que hice</span>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: COLORS.textLight }}>Cargando...</div>
      ) : contributions.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>Todavía no regalaste nada</div>
          <div style={{ fontSize: 14, color: COLORS.textLight }}>Explorá perfiles y hacé tu primer aporte</div>
        </div>
      ) : (
        <>
          {/* Resumen total */}
          <div style={{ background: "#fff", margin: "12px 12px 0", borderRadius: 14, border: "1px solid " + COLORS.border, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 2 }}>Total regalado</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.primary }}>{fmtMoney(totalAportado)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 2 }}>Aportes</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>{contributions.length}</div>
              </div>
            </div>
          </div>

          {/* Campañas activas */}
          {activas.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", padding: "14px 16px 6px" }}>
                Activos · {activas.length}
              </div>
              {activas.map(c => {
                const camp = c.campaign;
                const pct = camp?.goal_amount > 0 ? Math.round((c.campaignRaised / camp.goal_amount) * 100) : 0;
                return (
                  <div key={c.id} style={{ background: "#fff", margin: "0 12px 10px", borderRadius: 14, border: "1px solid " + COLORS.border, overflow: "hidden" }}>
                    {camp?.image_url && (
                      <img src={camp.image_url} alt="" style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} />
                    )}
                    <div style={{ padding: "11px 14px 6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#EDE9FE", color: COLORS.primary, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {getInitials(camp?.birthday_person_name || "?")}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.text }}>{camp?.birthday_person_name || "—"}</div>
                          {camp?.birthday_date && <div style={{ fontSize: 11, color: COLORS.textLight }}>🎂 {fmtDate(camp.birthday_date)}</div>}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.primary }}>{fmtMoney(c.amount)}</div>
                          <div style={{ fontSize: 10, color: COLORS.textLight }}>mi aporte</div>
                        </div>
                      </div>
                      {camp?.title && <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 6 }}>🎁 {camp.title}</div>}
                      {c.message && <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 4, fontStyle: "italic" }}>"{c.message}"</div>}
                    </div>
                    {camp?.goal_amount > 0 && (
                      <div style={{ padding: "0 14px 10px" }}>
                        <ProgressBar pct={pct} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textLight }}>
                          <span>{fmtMoney(c.campaignRaised)} de {fmtMoney(camp.goal_amount)}</span>
                          <span style={{ fontWeight: 700, color: pct >= 80 ? COLORS.success : COLORS.textLight }}>{pct}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* Historial */}
          {cerradas.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", padding: "14px 16px 6px" }}>
                Historial · {cerradas.length}
              </div>
              <div style={{ background: "#fff", margin: "0 12px", borderRadius: 14, border: "1px solid " + COLORS.border, overflow: "hidden" }}>
                {cerradas.map((c, i) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: i < cerradas.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#F0FDF9", color: COLORS.success, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✓</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{c.campaign?.birthday_person_name || "—"}</div>
                      <div style={{ fontSize: 11, color: COLORS.textLight }}>{fmtDate(c.created_at)}</div>
                      {c.message && <div style={{ fontSize: 11, color: COLORS.textLight, fontStyle: "italic" }}>"{c.message}"</div>}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.text }}>{fmtMoney(c.amount)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

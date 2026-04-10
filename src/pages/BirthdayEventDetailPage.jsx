import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const V = "#7C3AED";
const VL = "#EDE9FE";
const VD = "#5B21B6";
const A = "#F59E0B";
const AL = "#FEF3C7";
const G = "#10B981";
const GL = "#D1FAE5";
const R = "#EF4444";
const RL = "#FEE2E2";

const MONTH_NAMES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function formatARS(n) {
  if (!n && n !== 0) return "—";
  return "$" + new Intl.NumberFormat("es-AR").format(n);
}

// ── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ raised, target }) {
  const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
  return (
    <div>
      <div style={{ height: 10, background: "#E5E7EB", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${V}, ${A})`, borderRadius: 999, transition: "width .5s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B7280", marginTop: 4 }}>
        <span><strong style={{ color: V }}>{formatARS(raised)}</strong> recaudado</span>
        <span>Meta: {formatARS(target)}</span>
      </div>
    </div>
  );
}

// ── VISTA DEL CUMPLEAÑERO: DECISIÓN ──────────────────────────────────────────
function CelebrantDecisionView({ event, organizers, onDecide }) {
  const [deciding, setDeciding] = useState(false);

  const decide = async (decision) => {
    setDeciding(true);
    await supabase.from("birthday_events").update({
      celebrant_decision: decision,
      celebrant_decided_at: new Date().toISOString(),
      status: decision === "approved" ? "active" : decision === "surprise" ? "active" : "rejected",
    }).eq("id", event.id);
    setDeciding(false);
    onDecide(decision);
  };

  return (
    <div style={{ background: "#F9FAFB", minHeight: "100%" }}>
      {/* HERO */}
      <div style={{
        background: `linear-gradient(160deg, ${A} 0%, #D97706 100%)`,
        padding: "28px 20px 24px", textAlign: "center", color: "#fff",
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>¡Tus amigos te prepararon algo!</h2>
        <p style={{ fontSize: 14, opacity: .9, marginTop: 6 }}>
          {organizers.length === 1
            ? `${organizers[0].profiles?.full_name || organizers[0].profiles?.username} está organizando tu cumple`
            : `${organizers.length} personas están organizando tu cumple`}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 12 }}>
          {organizers.slice(0, 4).map((o, i) => (
            <div key={o.id} style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "rgba(255,255,255,.3)", border: "2px solid #fff",
              marginLeft: i === 0 ? 0 : -6, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 14,
            }}>👤</div>
          ))}
          <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 8, opacity: .9 }}>
            {organizers.map(o => o.profiles?.full_name || o.profiles?.username).join(", ")}
          </span>
        </div>
      </div>

      {/* OPCIONES */}
      <div style={{ padding: "16px 16px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Ver el regalo */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 18, boxShadow: "0 4px 16px rgba(0,0,0,.08)", border: `2px solid ${G}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: GL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👀</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "#1F2937" }}>Ver el regalo</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>Y decidir si te gusta</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.5, marginBottom: 14 }}>
            Podés ver qué te quieren regalar, aprobarlo o pedirles que lo cambien.
          </p>
          <button
            onClick={() => onDecide("see")}
            style={{
              width: "100%", padding: 12, background: G, border: "none",
              borderRadius: 12, fontFamily: "inherit", fontSize: 14, fontWeight: 800,
              color: "#fff", cursor: "pointer",
            }}
          >Ver el regalo →</button>
        </div>

        {/* Sorpresa */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 18, boxShadow: "0 4px 16px rgba(0,0,0,.08)", border: `2px solid ${V}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: VL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🎁</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "#1F2937" }}>Quiero sorpresa</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>No quiero saber nada</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.5, marginBottom: 14 }}>
            No vas a ver nada hasta el día de tu cumple. ¡Confiá en ellos!
          </p>
          <button
            onClick={() => decide("surprise")}
            disabled={deciding}
            style={{
              width: "100%", padding: 12, background: VL, border: "none",
              borderRadius: 12, fontFamily: "inherit", fontSize: 14, fontWeight: 800,
              color: V, cursor: "pointer",
            }}
          >{deciding ? "Guardando…" : "Mantener como sorpresa 🎁"}</button>
        </div>
      </div>
    </div>
  );
}

// ── VISTA DEL CUMPLEAÑERO: VE EL REGALO ──────────────────────────────────────
function CelebrantGiftView({ event, onApprove, onReject }) {
  const [deciding, setDeciding] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleApprove = async () => {
    setDeciding(true);
    await supabase.from("birthday_events").update({
      celebrant_decision: "approved",
      celebrant_decided_at: new Date().toISOString(),
      status: "active",
    }).eq("id", event.id);
    setDeciding(false);
    onApprove();
  };

  const handleReject = async () => {
    setDeciding(true);
    await supabase.from("birthday_events").update({
      celebrant_decision: "rejected",
      celebrant_decided_at: new Date().toISOString(),
      celebrant_rejection_reason: rejectReason,
      status: "rejected",
    }).eq("id", event.id);
    setDeciding(false);
    onReject();
  };

  return (
    <div style={{ background: "#F9FAFB", minHeight: "100%" }}>
      <div style={{ background: `linear-gradient(160deg, ${G} 0%, #059669 100%)`, padding: "24px 20px", textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 40 }}>🔓</div>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginTop: 8 }}>¡Tus amigos quieren regalarte esto!</h2>
        <p style={{ fontSize: 13, opacity: .9, marginTop: 4 }}>Podés aprobarlo o pedirles que lo cambien</p>
      </div>

      {/* DETALLE DEL REGALO */}
      <div style={{ background: "#fff", margin: "14px 16px", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,.08)" }}>
        <div style={{ height: 120, background: `linear-gradient(135deg, ${VL}, ${AL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>
          {event.gift_type === "product" ? "📦" : event.gift_type === "experience" ? "✨" : "💰"}
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#1F2937" }}>{event.gift_title}</div>
          {event.gift_description && <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4, lineHeight: 1.5 }}>{event.gift_description}</div>}
          {event.gift_link && (
            <a href={event.gift_link} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 13, color: V, fontWeight: 600 }}>
              🔗 Ver en la tienda
            </a>
          )}
          <div style={{ fontSize: 24, fontWeight: 900, color: V, marginTop: 12 }}>{formatARS(event.gift_amount_target)}</div>
          <div style={{ fontSize: 11, color: "#9CA3AF" }}>Meta de recaudación</div>
        </div>
      </div>

      <div style={{ padding: "0 16px 8px" }}>
        <div style={{ background: AL, borderRadius: 12, padding: "10px 12px", display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ fontSize: 14 }}>💡</span>
          <span style={{ fontSize: 12, color: "#92400E", fontWeight: 600, lineHeight: 1.5 }}>
            Si aprobás, tus amigos pueden empezar a aportar. Si rechazás, el organizador podrá modificar el regalo.
          </span>
        </div>
      </div>

      {showRejectForm ? (
        <div style={{ padding: "12px 16px 32px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1F2937", marginBottom: 8 }}>¿Por qué lo rechazás? (opcional)</div>
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Contales qué cambiarías…"
            style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #E5E7EB", borderRadius: 12, fontSize: 14, fontFamily: "inherit", color: "#1F2937", outline: "none", resize: "none", height: 80 }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={() => setShowRejectForm(false)} style={{ flex: 1, padding: 13, border: "2px solid #E5E7EB", borderRadius: 12, background: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: "#6B7280", cursor: "pointer" }}>Cancelar</button>
            <button onClick={handleReject} disabled={deciding} style={{ flex: 1, padding: 13, background: R, border: "none", borderRadius: 12, fontFamily: "inherit", fontSize: 13, fontWeight: 800, color: "#fff", cursor: "pointer" }}>{deciding ? "…" : "Confirmar rechazo"}</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, padding: "12px 16px 32px" }}>
          <button onClick={() => setShowRejectForm(true)} style={{ flex: 1, padding: 13, border: "2px solid #E5E7EB", borderRadius: 12, background: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 800, color: "#6B7280", cursor: "pointer" }}>✗ Rechazar</button>
          <button onClick={handleApprove} disabled={deciding} style={{ flex: 2, padding: 13, background: `linear-gradient(135deg, ${G}, #059669)`, border: "none", borderRadius: 12, fontFamily: "inherit", fontSize: 13, fontWeight: 800, color: "#fff", cursor: "pointer" }}>
            {deciding ? "Guardando…" : "✓ ¡Me encanta, aprobado!"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── VISTA REGALADOR / ORGANIZADOR ─────────────────────────────────────────────
function GiverView({ event, friend, organizers, raised, contributionsCount, isCelebrant, navigate }) {
  const isSurprise = event.status === "active" && event.celebrant_decision === "surprise";
  const isVerified = event.celebrant_decision === "approved";
  const isPending = event.status === "pending_validation" || (!event.celebrant_decision && event.privacy_mode === "consult");

  return (
    <div style={{ background: "#F9FAFB", minHeight: "100%", paddingBottom: 80 }}>
      <div style={{ padding: "14px 16px 0" }}>
        {/* CARD PRINCIPAL DEL REGALO */}
        <div style={{ background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,.08)", marginBottom: 14 }}>
          {/* Header */}
          <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #F3F4F6" }}>
            <span style={{ fontSize: 26 }}>🧑</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1F2937" }}>{friend?.name}</div>
              {friend?.birthday_month && friend?.birthday_day && (
                <div style={{ fontSize: 12, color: "#6B7280" }}>🎂 {friend.birthday_day} de {MONTH_NAMES[friend.birthday_month - 1]}</div>
              )}
            </div>
            {/* Status pill */}
            {isVerified && (
              <div style={{ background: GL, color: "#065F46", fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 999, display: "flex", alignItems: "center", gap: 3 }}>✅ Verificado</div>
            )}
            {isSurprise && (
              <div style={{ background: VL, color: V, fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 999, display: "flex", alignItems: "center", gap: 3 }}>🎁 Sorpresa</div>
            )}
            {isPending && (
              <div style={{ background: AL, color: "#92400E", fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 999 }}>⏳ Pendiente</div>
            )}
            {event.status === "rejected" && (
              <div style={{ background: RL, color: R, fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 999 }}>✗ Rechazado</div>
            )}
          </div>

          {/* Regalo */}
          {isSurprise ? (
            <div style={{ padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>🎁</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#6B7280" }}>{friend?.name} eligió modo sorpresa</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>No va a ver el regalo hasta su cumple</div>
            </div>
          ) : (
            <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: VL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                {event.gift_type === "product" ? "📦" : event.gift_type === "experience" ? "✨" : "💰"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1F2937" }}>{event.gift_title || "Sin título"}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                  {isVerified ? `Aprobado por ${friend?.name}` : isPending ? "Esperando validación" : "Regalo definido"}
                  {event.gift_type && ` · ${event.gift_type === "product" ? "Producto" : event.gift_type === "experience" ? "Experiencia" : "Dinero"}`}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: V }}>{formatARS(event.gift_amount_target)}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>meta</div>
              </div>
            </div>
          )}

          {/* Progress */}
          <div style={{ padding: "0 14px 14px" }}>
            <ProgressBar raised={raised} target={event.gift_amount_target || 0} />
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{contributionsCount} aportes</div>
          </div>

          {/* Botón aportar */}
          {(isVerified || isSurprise) && (
            <div style={{ padding: "0 14px 14px" }}>
              <button
                onClick={() => navigate("profile", { campaign: event.id })}
                style={{
                  width: "100%", padding: 13,
                  background: `linear-gradient(135deg, ${V}, ${VD})`,
                  border: "none", borderRadius: 12, fontFamily: "inherit",
                  fontSize: 14, fontWeight: 800, color: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >🎁 Aportar al regalo</button>
            </div>
          )}
        </div>

        {/* Nota de estado */}
        {isVerified && (
          <div style={{ background: GL, borderRadius: 12, padding: "10px 12px", display: "flex", gap: 8, marginBottom: 14 }}>
            <span>✅</span>
            <span style={{ fontSize: 12, color: "#065F46", fontWeight: 600, lineHeight: 1.5 }}>{friend?.name} aprobó este regalo. Podés aportar con confianza.</span>
          </div>
        )}
        {isSurprise && (
          <div style={{ background: VL, borderRadius: 12, padding: "10px 12px", display: "flex", gap: 8, marginBottom: 14 }}>
            <span>🎁</span>
            <span style={{ fontSize: 12, color: VD, fontWeight: 600, lineHeight: 1.5 }}>{friend?.name} no sabe qué es el regalo. ¡Guardá el secreto!</span>
          </div>
        )}
        {isPending && (
          <div style={{ background: AL, borderRadius: 12, padding: "10px 12px", display: "flex", gap: 8, marginBottom: 14 }}>
            <span>⏳</span>
            <span style={{ fontSize: 12, color: "#92400E", fontWeight: 600, lineHeight: 1.5 }}>Esperando que {friend?.name} decida si quiere ver el regalo o modo sorpresa.</span>
          </div>
        )}
        {event.status === "rejected" && (
          <div style={{ background: RL, borderRadius: 12, padding: "10px 12px", display: "flex", gap: 8, marginBottom: 14 }}>
            <span>❌</span>
            <span style={{ fontSize: 12, color: "#B91C1C", fontWeight: 600, lineHeight: 1.5 }}>
              {friend?.name} rechazó el regalo.
              {event.celebrant_rejection_reason && ` Motivo: "${event.celebrant_rejection_reason}"`}
            </span>
          </div>
        )}

        {/* ORGANIZADORES */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "#9CA3AF", marginBottom: 10 }}>Organizadores</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {organizers.map(o => (
              <div key={o.id} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "#fff", border: "1.5px solid #E5E7EB",
                borderRadius: 999, padding: "5px 10px 5px 5px",
              }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: VL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>👤</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>{o.profiles?.full_name || o.profiles?.username || "—"}</div>
                  <div style={{ fontSize: 10, color: o.role === "principal" ? "#92400E" : V, fontWeight: 700 }}>
                    {o.role === "principal" ? "Principal 👑" : "Secundario"}
                    {o.share_group && ` · ${o.share_group}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function BirthdayEventDetailPage({ navigate, profile, params }) {
  const eventId = params?.eventId;
  const [event, setEvent] = useState(params?.event || null);
  const [friend, setFriend] = useState(null);
  const [organizers, setOrganizers] = useState([]);
  const [raised, setRaised] = useState(0);
  const [contributionsCount, setContributionsCount] = useState(0);
  const [loading, setLoading] = useState(!params?.event);
  const [celebrantView, setCelebrantView] = useState("decision"); // "decision" | "gift" | "done"

  useEffect(() => {
    if (eventId) loadAll(eventId);
  }, [eventId]);

  const loadAll = async (id) => {
    setLoading(true);
    const [{ data: ev }, { data: orgs }, { data: contribs }] = await Promise.all([
      supabase.from("birthday_events").select("*, friends(*)").eq("id", id).single(),
      supabase.from("birthday_organizers").select("*, profiles(id,username,full_name,avatar_url)").eq("birthday_event_id", id).eq("status", "active"),
      supabase.from("contributions").select("amount").eq("campaign_id", id).eq("status", "approved"),
    ]);
    if (ev) {
      setEvent(ev);
      setFriend(ev.friends);
    }
    if (orgs) setOrganizers(orgs);
    if (contribs) {
      setRaised(contribs.reduce((s, c) => s + (c.amount || 0), 0));
      setContributionsCount(contribs.length);
    }
    setLoading(false);
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Cargando…</div>;
  if (!event) return <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Evento no encontrado</div>;

  const friendData = friend || params?.friend;

  // ¿Es el cumpleañero?
  const isCelebrant = friendData?.friend_user_id === profile?.id;

  // ¿Es el organizador principal?
  const isOwner = event.owner_user_id === profile?.id;

  const title = event.title || `Cumpleaños de ${friendData?.name}`;

  return (
    <div style={{ background: "#F9FAFB", minHeight: "100%", display: "flex", flexDirection: "column" }}>
      {/* NAV */}
      <div style={{ background: "#fff", padding: "12px 20px 10px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={() => navigate("friends")}
          style={{ width: 34, height: 34, borderRadius: "50%", background: "#F3F4F6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#4B5563" }}>‹</button>
        <div style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 800, color: "#1F2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
        <div style={{ width: 34 }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* VISTA CUMPLEAÑERO */}
        {isCelebrant && !event.celebrant_decision && event.privacy_mode === "consult" && celebrantView === "decision" && (
          <CelebrantDecisionView
            event={event}
            organizers={organizers}
            onDecide={(d) => {
              if (d === "see") setCelebrantView("gift");
              else if (d === "surprise") loadAll(eventId);
            }}
          />
        )}
        {isCelebrant && celebrantView === "gift" && (!event.celebrant_decision || event.celebrant_decision === null) && (
          <CelebrantGiftView
            event={event}
            onApprove={() => loadAll(eventId)}
            onReject={() => loadAll(eventId)}
          />
        )}

        {/* VISTA NORMAL (regalador / organizador / cumpleañero post-decisión) */}
        {(!isCelebrant || event.celebrant_decision || event.privacy_mode === "surprise" || celebrantView === "done") && (
          <GiverView
            event={event}
            friend={friendData}
            organizers={organizers}
            raised={raised}
            contributionsCount={contributionsCount}
            isCelebrant={isCelebrant}
            navigate={navigate}
          />
        )}
      </div>
    </div>
  );
}

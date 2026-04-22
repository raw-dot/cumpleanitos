import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { COLORS } from "../utils/constants";
import PhoneSignupFlow from "../components/PhoneSignupFlow";
import SignupDonePage from "./SignupDonePage";

/**
 * InviteLandingPage — Landing pública para el cumpleañero
 * Flujo: Landing → Validar datos → Elegir ver/sorpresa → Aprobar regalo
 */

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const S = {
  page: { maxWidth: 480, margin: "0 auto", padding: 0 },
  header: { display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}` },
  backBtn: { width: 36, height: 36, borderRadius: "50%", border: "none", background: "#F3F4F6", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" },
  body: { padding: "12px 20px 20px" },
  cta: (disabled) => ({
    width: "100%", padding: 16, borderRadius: 16, border: "none",
    background: disabled ? "#E5E7EB" : `linear-gradient(135deg, ${COLORS.primary}, #6D28D9)`,
    color: disabled ? COLORS.textLight : "#fff", fontWeight: 700, fontSize: 16,
    cursor: disabled ? "default" : "pointer", fontFamily: "inherit",
  }),
  ctaGreen: { width: "100%", padding: 16, borderRadius: 16, border: "none", background: "linear-gradient(135deg, #10B981, #059669)", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: "inherit" },
  ctaOrange: { width: "100%", padding: 16, borderRadius: 16, border: "none", background: "linear-gradient(135deg, #F97316, #EA580C)", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: "inherit" },
  label: { fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 },
  input: { width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 16, color: COLORS.text, outline: "none", fontWeight: 500, boxSizing: "border-box", fontFamily: "inherit" },
  card: (hl) => ({ background: "#fff", borderRadius: 16, padding: 16, border: hl ? `2px solid ${COLORS.primary}` : "1px solid #E5E7EB", boxShadow: hl ? "0 4px 24px rgba(124,58,237,0.12)" : "none" }),
  tipBox: (bg) => ({ padding: "12px 14px", background: bg || "#FEF3C7", borderRadius: 12, fontSize: 13, color: "#6B7280", display: "flex", gap: 8, lineHeight: 1.4, marginTop: 12 }),
  footer: { padding: "12px 20px 16px" },
  progressPill: { background: "#EDE9FE", color: COLORS.primary, fontWeight: 700, fontSize: 12, padding: "4px 10px", borderRadius: 999 },
  progressBar: { flex: 1, height: 6, background: "#E5E7EB", borderRadius: 999, overflow: "hidden" },
};

function InviteLandingPage({ token }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [event, setEvent] = useState(null);
  const [friend, setFriend] = useState(null);
  const [giftOptions, setGiftOptions] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [step, setStep] = useState("landing"); // landing, validate, approve, surprise_done, approved_done, phone_signup, signup_done
  const [saving, setSaving] = useState(false);
  const [isSurpriseMode, setIsSurpriseMode] = useState(false);
  const [signedUpUserId, setSignedUpUserId] = useState(null);

  // Editable fields for validation
  const [editName, setEditName] = useState("");
  const [editDay, setEditDay] = useState("");
  const [editMonth, setEditMonth] = useState("");
  const [editAge, setEditAge] = useState("");

  useEffect(() => {
    loadEventByToken();
  }, [token]);

  const loadEventByToken = async () => {
    try {
      // Fetch event by token - this is a public query
      const { data: evData, error: evErr } = await supabase
        .from("gift_events")
        .select("*, friend_preregisters(*), gift_options(*)")
        .eq("invitation_token", token)
        .single();

      if (evErr || !evData) {
        setError("No se encontró este evento. El link puede haber expirado.");
        setLoading(false);
        return;
      }

      setEvent(evData);

      // Load friend data from join
      const frData = evData.friend_preregisters;
      if (frData) {
        setFriend(frData);
        setEditName(frData.name || "");
        setEditDay(frData.birthday_day?.toString() || "");
        setEditMonth(frData.birthday_month?.toString() || "");
        setEditAge(frData.estimated_next_age?.toString() || "");
      }

      // Gift options from join
      const optData = evData.gift_options;

      setGiftOptions(optData || []);

      // Load organizers
      const { data: orgData } = await supabase
        .from("event_organizers")
        .select("*, profiles(name, avatar_url)")
        .eq("gift_event_id", evData.id)
        .eq("status", "active");

      setOrganizers(orgData || []);

      // Mark invitation as accepted
      if (evData.status === "invitation_sent" || evData.status === "draft") {
        await supabase
          .from("gift_events")
          .update({ status: "pending_validation", invitation_accepted_at: new Date().toISOString() })
          .eq("id", evData.id);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading event:", err);
      setError("Error al cargar el evento");
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setSaving(true);
    try {
      // Update friend_preregister with corrected data
      if (friend) {
        await supabase
          .from("friend_preregisters")
          .update({
            name: editName,
            birthday_day: editDay ? parseInt(editDay) : null,
            birthday_month: editMonth ? parseInt(editMonth) : null,
            estimated_next_age: editAge ? parseInt(editAge) : null,
            estimated_birth_year: editMonth && editAge ? new Date().getFullYear() - parseInt(editAge) : null,
            status: "validated",
            updated_at: new Date().toISOString(),
          })
          .eq("id", friend.id);
      }

      // Update event status
      await supabase
        .from("gift_events")
        .update({ status: "validated", validated_at: new Date().toISOString() })
        .eq("id", event.id);

      setEvent(prev => ({ ...prev, status: "validated" }));
      setStep("approve");
    } catch (err) {
      console.error("Error validating:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleChooseSurprise = () => {
    setIsSurpriseMode(true);
    setStep("validate");
  };

  const handleApproveGift = async (optionId) => {
    setSaving(true);
    try {
      await supabase
        .from("gift_options")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", optionId);

      await supabase
        .from("gift_events")
        .update({
          status: "active",
          surprise_mode: isSurpriseMode,
          activated_at: new Date().toISOString(),
        })
        .eq("id", event.id);

      setStep("phone_signup");
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleRequestChange = async () => {
    const msg = prompt("¿Qué te gustaría que te regalen?");
    if (!msg) return;
    setSaving(true);
    try {
      await supabase.from("gift_change_requests").insert({
        gift_event_id: event.id,
        requested_by: friend?.linked_profile_id || "00000000-0000-0000-0000-000000000000",
        message: msg,
        original_option_id: giftOptions[0]?.id || null,
      });

      await supabase
        .from("gift_events")
        .update({ status: "gift_change_requested", gift_change_count: (event.gift_change_count || 0) + 1 })
        .eq("id", event.id);

      // Ir a registro en lugar de alert
      setStep("phone_signup");
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handlePhoneSignupSuccess = (userId) => {
    setSignedUpUserId(userId);
    setStep("signup_done");
  };

  // ── LOADING ──
  if (loading) {
    return (
      <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: COLORS.textLight }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎂</div>
          Cargando tu sorpresa...
        </div>
      </div>
    );
  }

  // ── ERROR ──
  if (error) {
    return (
      <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>😔</div>
          <p style={{ color: COLORS.textLight }}>{error}</p>
        </div>
      </div>
    );
  }

  // ── LANDING: Ver / Sorpresa ──
  if (step === "landing") {
    const orgNames = organizers.map(o => o.profiles?.name || "Un amigo").join(", ");
    return (
      <div style={S.page}>
        <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16 }}>🎂</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: COLORS.primary }}>cumpleanitos</span>
        </div>
        <div style={{
          background: "linear-gradient(135deg, #F97316, #FB923C)",
          padding: "32px 20px", textAlign: "center",
        }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px", lineHeight: 1.2 }}>
            ¡{friend?.name || "Amigo/a"}, están<br/>organizando tu cumple!
          </h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, margin: "8px 0 0" }}>
            {orgNames} te {organizers.length > 1 ? "están" : "está"} preparando algo especial
          </p>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={S.card(true)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 28 }}>👀</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Ver el regalo</div>
                <div style={{ fontSize: 12, color: COLORS.textLight }}>Y decidir si te gusta</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 12px" }}>
              Podés ver qué te quieren regalar, aprobarlo o pedirles que lo cambien.
            </p>
            <button style={S.ctaGreen} onClick={() => setStep("validate")}>Ver el regalo →</button>
          </div>

          <div style={S.card(false)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 28 }}>🎁</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Quiero sorpresa</div>
                <div style={{ fontSize: 12, color: COLORS.textLight }}>No quiero saber nada</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 12px" }}>
              No vas a ver nada hasta el día de tu cumple. ¡Confiá en ellos!
            </p>
            <button style={S.ctaOrange} onClick={handleChooseSurprise} disabled={saving}>
              {saving ? "Guardando..." : "Mantener como sorpresa 🎁"}
            </button>
          </div>

          <div style={S.tipBox("#FEF3C7")}>
            <span>💡</span>
            <span>Si elegís sorpresa, el regalo queda oculto para vos hasta el día de tu cumple.</span>
          </div>
        </div>
      </div>
    );
  }

  // ── VALIDATE: Confirmar datos ──
  if (step === "validate") {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <button onClick={() => setStep("landing")} style={S.backBtn}>‹</button>
          <span style={{ fontWeight: 700, fontSize: 17, color: COLORS.text }}>Confirmá tus datos</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px 0" }}>
          <span style={S.progressPill}>Paso 1 de 2</span>
          <div style={S.progressBar}><div style={{ width: "50%", height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${COLORS.primary}, #F97316)` }} /></div>
        </div>
        <div style={S.body}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: "8px 0 4px" }}>¿Está todo bien? ✅</h2>
          <p style={{ fontSize: 14, color: COLORS.textLight, margin: "0 0 20px" }}>Confirmá o corregí tus datos</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={S.label}>Tu nombre</label>
              <input style={S.input} value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Fecha de nacimiento</label>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <input style={{ ...S.input, flex: 1, textAlign: "center", fontWeight: 600 }} value={editDay} onChange={e => setEditDay(e.target.value)} placeholder="Día" type="number" />
                <select style={{ ...S.input, flex: 2, fontWeight: 600 }} value={editMonth} onChange={e => setEditMonth(e.target.value)}>
                  <option value="">Mes</option>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={S.label}>Edad que cumplís</label>
              <input style={S.input} value={editAge} onChange={e => setEditAge(e.target.value)} type="number" />
            </div>
          </div>
        </div>
        <div style={S.footer}>
          <button style={S.cta(saving)} disabled={saving} onClick={async () => {
            await handleValidate();
            setStep("approve");
          }}>{saving ? "Guardando..." : "Confirmar datos →"}</button>
        </div>
      </div>
    );
  }

  // ── APPROVE: Ver y aprobar regalo ──
  if (step === "approve") {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <button onClick={() => setStep("validate")} style={S.backBtn}>‹</button>
          <span style={{ fontWeight: 700, fontSize: 17, color: COLORS.text }}>Tu regalo</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px 0" }}>
          <span style={S.progressPill}>Paso 2 de 2</span>
          <div style={S.progressBar}><div style={{ width: "100%", height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${COLORS.primary}, #F97316)` }} /></div>
        </div>
        <div style={S.body}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: "8px 0 4px" }}>Esto te quieren regalar 🎁</h2>
          <p style={{ fontSize: 14, color: COLORS.textLight, margin: "0 0 16px" }}>Aprobalo o pedí que lo cambien</p>

          {giftOptions.map(opt => (
            <div key={opt.id} style={{ ...S.card(true), marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>📦</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{opt.title}</div>
                  <div style={{ fontSize: 12, color: COLORS.textLight }}>Propuesto por el organizador{opt.category ? ` · ${opt.category}` : ""}</div>
                </div>
              </div>
              {opt.amount && (
                <div style={{ margin: "12px 0 0", padding: 10, background: "#EDE9FE", borderRadius: 10, textAlign: "center" }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: COLORS.primary }}>${parseFloat(opt.amount).toLocaleString("es-AR")}</span>
                  <span style={{ fontSize: 12, color: COLORS.textLight, marginLeft: 8 }}>meta</span>
                </div>
              )}
            </div>
          ))}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button style={S.ctaGreen} disabled={saving} onClick={() => giftOptions[0] && handleApproveGift(giftOptions[0].id)}>
              {saving ? "Guardando..." : "✅ ¡Me encanta! Aprobarlo"}
            </button>
            <button onClick={handleRequestChange} disabled={saving} style={{
              padding: 14, width: "100%", borderRadius: 16,
              border: "2px solid #F97316", background: "#fff",
              color: "#F97316", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
            }}>🔄 Prefiero otra cosa</button>
          </div>
        </div>
      </div>
    );
  }

  // ── SURPRISE DONE ──
  if (step === "surprise_done") {
    return (
      <div style={S.page}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center", minHeight: "60vh" }}>
          <div style={{ width: 100, height: 100, borderRadius: "50%", background: "#FED7AA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, marginBottom: 20 }}>🎁</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>¡Modo sorpresa activado!</h1>
          <p style={{ fontSize: 14, color: COLORS.textLight, margin: "0 0 16px" }}>No vas a ver nada del regalo hasta tu cumple.<br/>¡Confiá en tus amigos!</p>
          <div style={S.tipBox("#FEF3C7")}>
            <span>💡</span>
            <span>¿Querés organizar el cumple de algún amigo? ¡Registrate en cumpleanitos!</span>
          </div>
          <div style={{ marginTop: 24, width: "100%" }}>
            <a href="/" style={{ display: "block", textAlign: "center", ...S.cta(false), textDecoration: "none" }}>
              Explorar cumpleanitos 🎂
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── APPROVED DONE ──
  if (step === "approved_done") {
    return (
      <div style={S.page}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center", minHeight: "60vh" }}>
          <div style={{ width: 100, height: 100, borderRadius: "50%", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, marginBottom: 20 }}>✅</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>¡Regalo aprobado!</h1>
          <p style={{ fontSize: 14, color: COLORS.textLight, margin: "0 0 16px" }}>Tus amigos ya pueden empezar a juntar los aportes.<br/>¡Que lo disfrutes! 🎉</p>
          <div style={{ marginTop: 24, width: "100%" }}>
            <a href="/" style={{ display: "block", textAlign: "center", ...S.cta(false), textDecoration: "none" }}>
              Explorar cumpleanitos 🎂
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── PHONE SIGNUP ──
  if (step === "phone_signup") {
    return (
      <PhoneSignupFlow
        onSuccess={handlePhoneSignupSuccess}
        friendPreregisterId={friend?.id}
        name={friend?.name}
      />
    );
  }

  // ── SIGNUP DONE ──
  if (step === "signup_done") {
    return <SignupDonePage event={event} giftOptions={giftOptions} isSurprise={isSurpriseMode} />;
  }

  return null;
}

export default InviteLandingPage;

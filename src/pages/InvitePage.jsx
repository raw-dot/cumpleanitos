import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const V = "#7C3AED";
const VL = "#EDE9FE";
const VD = "#5B21B6";
const A = "#F59E0B";
const AL = "#FEF3C7";
const G = "#10B981";

const MONTH_NAMES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre"
];

const THIS_YEAR = new Date().getFullYear();

// ── PASO 1: PRESENTACIÓN ──────────────────────────────────────────────────────
function StepWelcome({ inviter, onStart }) {
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${VD} 0%, ${V} 55%, #9333EA 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 28px", textAlign: "center", color: "#fff" }}>

      {/* Avatar del invitador */}
      <div style={{ width: 88, height: 88, borderRadius: "50%", background: "rgba(255,255,255,.2)", border: "3px solid rgba(255,255,255,.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, marginBottom: 20 }}>
        {inviter?.avatar_url
          ? <img src={inviter.avatar_url} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          : "🧑"}
      </div>

      <div style={{ fontSize: 13, opacity: .7, marginBottom: 8, letterSpacing: .5 }}>
        {inviter?.full_name || inviter?.username || "Tu amigo/a"} te invitó
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.2, marginBottom: 12 }}>
        Quiere recordar<br/>
        <span style={{ color: A }}>tu cumpleaños 🎂</span>
      </h1>

      <p style={{ fontSize: 15, opacity: .85, lineHeight: 1.6, marginBottom: 40, maxWidth: 300 }}>
        Agregá tu fecha de cumpleaños y quedás en su agenda. Tarda menos de 1 minuto.
      </p>

      <button
        onClick={onStart}
        style={{
          width: "100%", maxWidth: 320, padding: "18px 24px",
          background: A, border: "none", borderRadius: 18,
          fontFamily: "inherit", fontSize: 18, fontWeight: 900, color: "#fff",
          cursor: "pointer", boxShadow: "0 8px 24px rgba(245,158,11,.4)",
          animation: "pulse 2.5s ease-in-out infinite",
        }}
      >
        Agregar mi cumpleaños 🎉
      </button>

      <div style={{ marginTop: 20, fontSize: 13, opacity: .6 }}>
        Ya usás Cumpleañitos? <span style={{ textDecoration: "underline", cursor: "pointer" }} onClick={() => window.location.href = "/"}>Iniciá sesión</span>
      </div>

      <style>{`@keyframes pulse{0%,100%{box-shadow:0 8px 24px rgba(245,158,11,.4)}50%{box-shadow:0 12px 32px rgba(245,158,11,.6)}}`}</style>
    </div>
  );
}

// ── PASO 2: DATOS ─────────────────────────────────────────────────────────────
function StepData({ inviter, onDone }) {
  const [name, setName]   = useState("");
  const [day, setDay]     = useState("");
  const [month, setMonth] = useState("");
  const [age, setAge]     = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep]   = useState("data"); // data | confirm | done
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  const birthdayYear = age ? THIS_YEAR - parseInt(age) : null;
  const monthName = month && parseInt(month) >= 1 && parseInt(month) <= 12
    ? MONTH_NAMES[parseInt(month) - 1]
    : null;

  const inp = {
    width: "100%", padding: "14px 16px", border: "1.5px solid #E5E7EB",
    borderRadius: 14, fontSize: 16, fontFamily: "inherit", fontWeight: 600,
    outline: "none", color: "#1F2937", background: "#fff", boxSizing: "border-box",
  };

  const canSubmit = name.trim() && day && month;

  const handleSave = async () => {
    if (!canSubmit) return setError("Completá tu nombre, día y mes");
    setSaving(true); setError(null);

    try {
      // 1. Buscar si el invitador existe
      const { data: inviterProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", inviter.username)
        .single();

      if (!inviterProfile) throw new Error("No encontramos al usuario que te invitó");

      // 2. ¿Ya existe sesión? (el amigo ya tiene cuenta)
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Ya tiene cuenta — agregar directamente como friend
        await supabase.from("friends").insert({
          user_id: inviterProfile.id,
          friend_user_id: user.id,
          name: name.trim(),
          birthday_day: parseInt(day),
          birthday_month: parseInt(month),
          birthday_year: birthdayYear || null,
          is_registered: true,
        });
        // Actualizar su propio perfil con la fecha
        await supabase.from("profiles").update({
          birthday: birthdayYear
            ? `${birthdayYear}-${String(parseInt(month)).padStart(2,"0")}-${String(parseInt(day)).padStart(2,"0")}`
            : null,
          phone: phone || null,
        }).eq("id", user.id);

      } else {
        // No tiene cuenta — guardar friend sin user_id + invitation record
        const { error: friendErr } = await supabase.from("friends").insert({
          user_id: inviterProfile.id,
          name: name.trim(),
          birthday_day: parseInt(day),
          birthday_month: parseInt(month),
          birthday_year: birthdayYear || null,
          age_requested_at: !birthdayYear ? new Date().toISOString() : null,
        });
        if (friendErr) throw friendErr;

        // Guardar invitation para tracking
        await supabase.from("friend_invitations").insert({
          inviter_user_id: inviterProfile.id,
          invitee_name: name.trim(),
          invitee_phone: phone || null,
          birthday_day: parseInt(day),
          birthday_month: parseInt(month),
          birthday_year: birthdayYear || null,
          status: "pending",
        }).select();
      }

      setSaving(false);
      setStep("done");
    } catch (err) {
      setSaving(false);
      setError(err.message);
    }
  };

  // ── PANTALLA DONE ──────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${G} 0%, #059669 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 28px", textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 10 }}>
          ¡Listo, {name.split(" ")[0]}!
        </h2>
        <p style={{ fontSize: 15, opacity: .9, lineHeight: 1.6, marginBottom: 32, maxWidth: 300 }}>
          {inviter?.full_name || inviter?.username} ya sabe que cumplís el <strong>{day} de {monthName}</strong>
          {birthdayYear ? ` y que cumplís ${THIS_YEAR - birthdayYear} años` : ""}.
        </p>

        <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 16, padding: "16px 20px", marginBottom: 32, maxWidth: 320, width: "100%" }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>¿Querés tu propia agenda?</div>
          <div style={{ fontSize: 13, opacity: .9, lineHeight: 1.5 }}>
            Creá tu cuenta en Cumpleañitos y también vos podés organizar regalos para tus amigos.
          </div>
        </div>

        <button
          onClick={() => window.location.href = "/registro"}
          style={{ width: "100%", maxWidth: 320, padding: "16px 24px", background: "#fff", border: "none", borderRadius: 16, fontFamily: "inherit", fontSize: 16, fontWeight: 800, color: V, cursor: "pointer" }}
        >
          Crear mi cuenta gratis 🎂
        </button>
        <button
          onClick={() => window.location.href = "/"}
          style={{ marginTop: 12, background: "none", border: "none", color: "#fff", fontSize: 14, opacity: .7, cursor: "pointer", fontFamily: "inherit" }}
        >
          Ir al inicio
        </button>
      </div>
    );
  }

  // ── PANTALLA DATA ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${V}, ${VD})`, padding: "24px 20px 32px", textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 13, opacity: .8, marginBottom: 4 }}>
          Agenda de {inviter?.full_name || inviter?.username}
        </div>
        <div style={{ fontSize: 22, fontWeight: 900 }}>Tu fecha de cumpleaños 🎂</div>
      </div>

      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -16, padding: "24px 20px 40px" }}>

        {error && (
          <div style={{ background: "#FEE2E2", color: "#B91C1C", borderRadius: 12, padding: "12px 14px", fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Nombre */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "#4B5563", marginBottom: 8 }}>Tu nombre</div>
          <input
            style={{ ...inp, borderColor: name ? V : "#E5E7EB" }}
            placeholder="Ej: Sofía García"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Día y Mes */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "#4B5563", marginBottom: 8 }}>
            ¿Cuándo es tu cumpleaños?
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {/* Día */}
            <div style={{ flex: 1, textAlign: "center" }}>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Día"
                maxLength={2}
                value={day}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g,"").slice(0,2);
                  const n = parseInt(v);
                  if (!v || (n >= 1 && n <= 31)) setDay(v);
                }}
                style={{ ...inp, textAlign: "center", fontSize: 28, fontWeight: 900, borderColor: day ? V : "#E5E7EB", color: day ? "#1F2937" : "#9CA3AF", padding: "14px 8px" }}
              />
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 5 }}>Día</div>
            </div>
            {/* Mes */}
            <div style={{ flex: 2, textAlign: "center" }}>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Mes"
                maxLength={2}
                value={month}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g,"").slice(0,2);
                  const n = parseInt(v);
                  if (!v || (n >= 1 && n <= 12)) setMonth(v);
                }}
                style={{ ...inp, textAlign: "center", fontSize: 28, fontWeight: 900, borderColor: month ? V : "#E5E7EB", color: month ? "#1F2937" : "#9CA3AF", padding: "14px 8px" }}
              />
              <div style={{ fontSize: 12, fontWeight: 700, marginTop: 5, color: monthName ? V : "#9CA3AF" }}>
                {monthName
                  ? monthName.charAt(0).toUpperCase() + monthName.slice(1)
                  : "Mes"}
              </div>
            </div>
          </div>
        </div>

        {/* Edad — el juego */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "#4B5563", marginBottom: 4 }}>
            ¿Cuántos años cumplís este año?
          </div>
          <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 10 }}>
            Opcional — para que tus amigos sepan cuántos años cumplís 🙈
          </div>
          <input
            type="number" min="1" max="120"
            placeholder="—"
            value={age}
            onChange={e => setAge(e.target.value)}
            style={{ ...inp, fontSize: 44, fontWeight: 900, textAlign: "center", padding: "14px", color: V, borderColor: age ? V : "#E5E7EB", borderWidth: 2, borderRadius: 16 }}
          />
          {age && birthdayYear && (
            <div style={{ marginTop: 10, padding: "10px 14px", background: VL, borderRadius: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span>📅</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: VD }}>
                Naciste en <strong>{birthdayYear}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Teléfono — opcional */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "#4B5563", marginBottom: 4 }}>
            Tu WhatsApp <span style={{ fontWeight: 400, textTransform: "none", color: "#9CA3AF" }}>(opcional)</span>
          </div>
          <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8 }}>
            Para que tus amigos puedan organizarte un regalo sorpresa
          </div>
          <input
            style={{ ...inp, borderColor: phone ? V : "#E5E7EB" }}
            placeholder="+54 9 11 1234 5678"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            type="tel"
          />
        </div>

        {/* Botón */}
        <button
          onClick={handleSave}
          disabled={saving || !canSubmit}
          style={{
            width: "100%", padding: 18,
            background: (!canSubmit || saving) ? "#E5E7EB" : `linear-gradient(135deg, ${V}, ${VD})`,
            color: (!canSubmit || saving) ? "#9CA3AF" : "#fff",
            border: "none", borderRadius: 16, fontFamily: "inherit",
            fontSize: 17, fontWeight: 900,
            cursor: (!canSubmit || saving) ? "not-allowed" : "pointer",
            boxShadow: (!canSubmit || saving) ? "none" : "0 6px 20px rgba(124,58,237,.35)",
          }}
        >
          {saving ? "Guardando..." : "Listo, agregar mi cumple 🎂"}
        </button>

        <div style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 16 }}>
          Tus datos solo son visibles para {inviter?.full_name || inviter?.username} y sus amigos
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function InvitePage({ username }) {
  const [inviter, setInviter]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep]         = useState("welcome"); // welcome | data

  useEffect(() => {
    if (username) loadInviter();
  }, [username]);

  const loadInviter = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .eq("username", username)
      .single();
    setLoading(false);
    if (!data) return setNotFound(true);
    setInviter(data);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(160deg, ${VD}, ${V})` }}>
        <div style={{ color: "#fff", fontSize: 16, opacity: .8 }}>Cargando...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F9FAFB", padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🤔</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#1F2937", marginBottom: 8 }}>Link no encontrado</div>
        <div style={{ fontSize: 14, color: "#6B7280" }}>Este link de invitación no existe o expiró.</div>
        <button onClick={() => window.location.href = "/"} style={{ marginTop: 24, padding: "12px 24px", background: V, color: "#fff", border: "none", borderRadius: 12, fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Ir al inicio
        </button>
      </div>
    );
  }

  if (step === "welcome") return <StepWelcome inviter={inviter} onStart={() => setStep("data")} />;
  return <StepData inviter={inviter} onDone={() => {}} />;
}

import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";

const V = "#7C3AED";
const VL = "#EDE9FE";
const VD = "#5B21B6";
const A = "#F59E0B";
const AL = "#FEF3C7";
const G = "#10B981";
const GL = "#D1FAE5";
const THIS_YEAR = new Date().getFullYear();

const MONTH_NAMES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre"
];

function daysUntilBirthday(month, day) {
  if (!month || !day) return null;
  const today = new Date();
  let next = new Date(today.getFullYear(), month - 1, day);
  if (next < today) next = new Date(today.getFullYear() + 1, month - 1, day);
  return Math.round((next - today) / (1000 * 60 * 60 * 24));
}

function bdayLabel(days) {
  if (days === null) return null;
  if (days === 0) return "Hoy! 🎉";
  if (days === 1) return "Mañana! 🎂";
  if (days <= 7) return `en ${days} dias 🔥`;
  return `en ${days} dias`;
}

function badgeStyle(days) {
  if (days === null) return { background: "#F3F4F6", color: "#6B7280" };
  if (days <= 7) return { background: AL, color: "#92400E" };
  if (days <= 30) return { background: "#DBEAFE", color: "#1E40AF" };
  return { background: "#F3F4F6", color: "#6B7280" };
}

const avatarEmojis = ["🧑","👩","🧔","👧","👨","👱","🧒","👵","👴","🧓"];
const bgColors = ["#EDE9FE","#FEF3C7","#DBEAFE","#FEE2E2","#D1FAE5","#FCE7F3"];
const getEmoji = f => avatarEmojis[f.name.charCodeAt(0) % avatarEmojis.length];
const getBg    = f => bgColors[f.name.charCodeAt(0) % bgColors.length];

// ── MODAL SHELL ────────────────────────────────────────────────────────────────
function Modal({ onBgClick, children }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 300, padding: 16,
      }}
      onClick={e => e.target === e.currentTarget && onBgClick?.()}
    >
      <div
        style={{
          background: "#fff", borderRadius: 24, width: "100%",
          maxWidth: 440, maxHeight: "90vh", overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: 36, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "12px auto 8px" }} />
        {children}
      </div>
    </div>
  );
}


// ── INVITE MODAL ──────────────────────────────────────────────────────────────
function InviteModal({ onClose, profile }) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = profile?.username
    ? `https://test.cumpleanitos.com/invitar/${profile.username}`
    : "https://test.cumpleanitos.com";

  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      "Hola! Te invito a agregar tu cumpleanios en mi agenda de Cumpleanitos. " +
      "Solo entra al link y carga tu fecha, tarda menos de 1 minuto! " +
      inviteUrl
    );
    window.open("https://wa.me/?text=" + text, "_blank");
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({
        title: "Agregate a mi agenda de cumpleanios",
        text: "Carga tu fecha de cumpleanios en mi agenda de Cumpleanitos!",
        url: inviteUrl,
      });
    } else {
      copyLink();
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "12px auto 0" }} />

        <div style={{ padding: "20px 24px 32px", textAlign: "center" }}>
          {/* Hero */}
          <div style={{ fontSize: 48, marginBottom: 10 }}>🎂</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#1F2937", marginBottom: 8 }}>
            Invitar amigos a tu agenda
          </div>
          <div style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, marginBottom: 24 }}>
            Compartí este link. Tus amigos entran, cargan su fecha de cumpleanios y aparecen automaticamente en tu agenda.
          </div>

          {/* Link preview */}
          <div style={{ background: VL, borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 20, textAlign: "left" }}>
            <span style={{ fontSize: 20 }}>🔗</span>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: 11, color: V, fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, marginBottom: 2 }}>Tu link personal</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: VD, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{inviteUrl}</div>
            </div>
            <button
              onClick={copyLink}
              style={{ background: copied ? G : V, color: "#fff", border: "none", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}
            >
              {copied ? "Copiado! ✓" : "Copiar"}
            </button>
          </div>

          {/* Botones de compartir */}
          <button
            onClick={shareWhatsApp}
            style={{ width: "100%", padding: "15px 16px", marginBottom: 10, background: "#25D366", border: "none", borderRadius: 16, fontFamily: "inherit", fontSize: 16, fontWeight: 800, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
          >
            <span style={{ fontSize: 22 }}>💬</span>
            Compartir por WhatsApp
          </button>

          <button
            onClick={shareNative}
            style={{ width: "100%", padding: "14px 16px", marginBottom: 10, background: "#F3F4F6", border: "none", borderRadius: 16, fontFamily: "inherit", fontSize: 15, fontWeight: 700, color: "#4B5563", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
          >
            <span style={{ fontSize: 20 }}>📤</span>
            Otras apps (Instagram, Mail...)
          </button>

          <button onClick={onClose} style={{ width: "100%", padding: 12, background: "none", border: "none", fontFamily: "inherit", fontSize: 14, color: "#9CA3AF", cursor: "pointer" }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ADD FRIEND MODAL ──────────────────────────────────────────────────────────
function AddFriendModal({ onClose, onSave, initialGameMode = false }) {
  const [step, setStep]         = useState("method"); // method|contact|manual|sent
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [day, setDay]           = useState("");
  const [month, setMonth]       = useState("");
  const [age, setAge]           = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);
  const [savedFriend, setSavedFriend] = useState(null);

  const birthdayYear = age ? THIS_YEAR - parseInt(age) : null;

  const supportsContacts =
    typeof navigator !== "undefined" &&
    "contacts" in navigator &&
    typeof navigator.contacts?.select === "function";

  const inp = {
    width: "100%", padding: "12px 14px", border: "1.5px solid #E5E7EB",
    borderRadius: 12, fontSize: 15, fontFamily: "inherit", fontWeight: 600,
    outline: "none", color: "#1F2937", background: "#fff", boxSizing: "border-box",
  };
  const sel = { ...inp, appearance: "none", WebkitAppearance: "none" };

  const pickContact = async () => {
    try {
      const list = await navigator.contacts.select(["name","tel"], { multiple: false });
      if (list && list.length > 0) {
        const c = list[0];
        setName(c.name?.[0] || "");
        setPhone((c.tel?.[0] || "").replace(/\s+/g,"").replace(/[^\d+]/g,""));
        setStep("contact");
      }
    } catch {
      setStep("manual");
    }
  };

  const saveFriend = async () => {
    if (!name.trim()) return setError("El nombre es obligatorio");
    setSaving(true); setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setError("Sesión expirada, recargá la página");
    const { data, error: e } = await supabase.from("friends").insert({
      user_id: user.id,
      name: name.trim(),
      birthday_day:   day   ? parseInt(day)   : null,
      birthday_month: month ? parseInt(month) : null,
      birthday_year:  birthdayYear || null,
      age_requested_at: new Date().toISOString(),
    }).select().single();
    setSaving(false);
    if (e) return setError(e.message);
    setSavedFriend({ ...data, phone });
    setStep("sent");
  };

  const openWhatsApp = () => {
    const appUrl = "https://test.cumpleanitos.com";
    const bdayPart = day && month
      ? " (el " + day + " de " + MONTH_NAMES[parseInt(month) - 1] + ")"
      : "";
    const text =
      "Hola " + savedFriend.name + "! " +
      "Te agregue en Cumpleanitos para no olvidarme de tu cumple" + bdayPart + ". " +
      "Podes entrar y confirmar tu fecha de nacimiento? Asi todos tus amigos saben cuantos anios cumples! " +
      appUrl;
    const enc = encodeURIComponent(text);
    const cleanPhone = (savedFriend.phone || "").replace(/[^\d]/g,"");
    window.open(
      cleanPhone
        ? "https://wa.me/" + cleanPhone + "?text=" + enc
        : "https://wa.me/?text=" + enc,
      "_blank"
    );
  };

  const resetToAdd = () => {
    setStep("method"); setName(""); setPhone("");
    setDay(""); setMonth(""); setAge("");
    setSavedFriend(null); setError(null);
  };

  // ── PANTALLA: elegir método ─────────────────────────────────────────────────
  if (step === "method") {
    return (
      <Modal onBgClick={onClose}>
        <div style={{ padding: "8px 24px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📱</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#1F2937", marginBottom: 6 }}>
            {initialGameMode ? "Agregá tu primer amigo" : "Agregar amigo"}
          </div>
          <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 24, lineHeight: 1.6 }}>
            Cargá el nombre y número de WhatsApp. Después le mandamos un mensaje para que confirme su cumple.
          </div>

          <button
            onClick={() => setStep("manual")}
            style={{
              width: "100%", padding: "16px", marginBottom: 10,
              background: `linear-gradient(135deg, ${V}, ${VD})`, border: "none", borderRadius: 16,
              fontFamily: "inherit", fontSize: 16, fontWeight: 800, color: "#fff",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left",
              boxShadow: "0 4px 14px rgba(124,58,237,.3)",
            }}
          >
            <span style={{ fontSize: 24, flexShrink: 0 }}>🎂</span>
            <div>
              <div>Cargar amigo</div>
              <div style={{ fontSize: 12, fontWeight: 600, opacity: .85 }}>Nombre, fecha y número de WhatsApp</div>
            </div>
          </button>

          {supportsContacts && (
            <button
              onClick={pickContact}
              style={{
                width: "100%", padding: "14px 16px",
                background: "#F3F4F6", border: "none", borderRadius: 16,
                fontFamily: "inherit", fontSize: 14, fontWeight: 700, color: "#4B5563",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left",
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>📒</span>
              <div>Importar de mis contactos</div>
            </button>
          )}
        </div>
      </Modal>
    );
  }

  // ── PANTALLA: datos del contacto ────────────────────────────────────────────
  if (step === "contact" || step === "manual") {
    const isImported = step === "contact";
    return (
      <Modal onBgClick={onClose}>
        <div style={{ padding: "8px 24px 28px" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>{isImported ? "✅" : "🎂"}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#1F2937" }}>
              {isImported ? "Contacto importado" : "Cargar manualmente"}
            </div>
            {isImported && (
              <div style={{ fontSize: 13, color: G, marginTop: 3 }}>
                Revisa que el nombre y numero esten bien
              </div>
            )}
          </div>

          {error && (
            <div style={{ background: "#FEE2E2", color: "#B91C1C", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "#4B5563", marginBottom: 7 }}>Nombre</div>
            <input style={{ ...inp, borderColor: name ? V : "#E5E7EB" }} placeholder="Ej: Sofia Garcia" value={name} onChange={e => setName(e.target.value)} autoFocus={!isImported} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "#4B5563", marginBottom: 7 }}>
              WhatsApp (con codigo de pais)
            </div>
            <input style={{ ...inp, borderColor: phone ? V : "#E5E7EB" }} placeholder="+54 9 11 1234 5678" value={phone} onChange={e => setPhone(e.target.value)} type="tel" />
            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
              Le mandamos un WhatsApp para que confirme su cumple
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "#4B5563", marginBottom: 7 }}>
              Cuando cumple?{" "}
              <span style={{ fontWeight: 400, textTransform: "none", color: "#9CA3AF" }}>(opcional)</span>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="14"
                  maxLength={2}
                  value={day}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g,"").slice(0,2);
                    const n = parseInt(v);
                    if (!v || (n >= 1 && n <= 31)) setDay(v);
                  }}
                  style={{ ...inp, width: "100%", textAlign: "center", fontSize: 26, fontWeight: 900, borderColor: day ? V : "#E5E7EB", padding: "14px 8px", color: day ? "#1F2937" : "#9CA3AF" }}
                />
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 5 }}>Día</div>
              </div>
              <div style={{ flex: 2, textAlign: "center" }}>
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="04"
                  maxLength={2}
                  value={month}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g,"").slice(0,2);
                    const n = parseInt(v);
                    if (!v || (n >= 1 && n <= 12)) setMonth(v);
                  }}
                  style={{ ...inp, width: "100%", textAlign: "center", fontSize: 26, fontWeight: 900, borderColor: month ? V : "#E5E7EB", padding: "14px 8px", color: month ? "#1F2937" : "#9CA3AF" }}
                />
                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 5, color: (month && parseInt(month) >= 1 && parseInt(month) <= 12) ? V : "#9CA3AF" }}>
                  {(month && parseInt(month) >= 1 && parseInt(month) <= 12)
                    ? MONTH_NAMES[parseInt(month) - 1].charAt(0).toUpperCase() + MONTH_NAMES[parseInt(month) - 1].slice(1)
                    : "mes"}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "#4B5563", marginBottom: 4 }}>
              Cuantos anios cumple este anio?
            </div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8 }}>
              Si no lo sabes, no importa — pone tu mejor estimacion 🙈
            </div>
            <input
              type="number" min="1" max="120" placeholder="--"
              value={age} onChange={e => setAge(e.target.value)}
              style={{ ...inp, fontSize: 44, fontWeight: 900, textAlign: "center", padding: "14px", color: V, borderColor: age ? V : "#E5E7EB", borderWidth: 2, borderRadius: 16 }}
            />
            {age && birthdayYear && (
              <div style={{ marginTop: 8, padding: "10px 14px", background: VL, borderRadius: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span>📅</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: VD }}>
                  Anio estimado: <strong>{birthdayYear}</strong>
                </span>
                <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: "auto" }}>El cumpleaniero lo valida</span>
              </div>
            )}
          </div>

          <button
            onClick={saveFriend}
            disabled={saving || !name.trim()}
            style={{
              width: "100%", padding: 15, marginBottom: 8,
              background: (!name.trim() || saving) ? "#E5E7EB" : `linear-gradient(135deg, ${V}, ${VD})`,
              color: (!name.trim() || saving) ? "#9CA3AF" : "#fff",
              border: "none", borderRadius: 14, fontFamily: "inherit",
              fontSize: 15, fontWeight: 800,
              cursor: (!name.trim() || saving) ? "not-allowed" : "pointer",
              boxShadow: (!name.trim() || saving) ? "none" : "0 4px 14px rgba(124,58,237,.3)",
            }}
          >
            {saving ? "Guardando..." : "Guardar y mandar WhatsApp 💬"}
          </button>

          <button onClick={() => setStep("method")} style={{ width: "100%", padding: 11, background: "none", border: "none", fontFamily: "inherit", fontSize: 13, color: "#9CA3AF", cursor: "pointer" }}>
            Volver
          </button>
        </div>
      </Modal>
    );
  }

  // ── PANTALLA: enviado ───────────────────────────────────────────────────────
  if (step === "sent") {
    return (
      <Modal>
        <div style={{ padding: "8px 24px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#1F2937", marginBottom: 6 }}>
            {savedFriend.name} agregado/a!
          </div>
          <div style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, marginBottom: 24 }}>
            Ahora mandales un WhatsApp para que confirmen su cumple y se unan a Cumpleanitos.
          </div>

          <button
            onClick={openWhatsApp}
            style={{
              width: "100%", padding: "15px 16px", marginBottom: 10,
              background: "#25D366", border: "none", borderRadius: 16,
              fontFamily: "inherit", fontSize: 16, fontWeight: 800, color: "#fff",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}
          >
            <span style={{ fontSize: 22 }}>💬</span>
            Mandar WhatsApp a {savedFriend.name}
          </button>

          <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 20 }}>
            Si ya usa Cumpleanitos tambien le llegara una notificacion en la app.
          </div>

          <button
            onClick={resetToAdd}
            style={{ width: "100%", padding: 13, marginBottom: 8, background: VL, border: "none", borderRadius: 14, fontFamily: "inherit", fontSize: 14, fontWeight: 700, color: V, cursor: "pointer" }}
          >
            + Agregar otro amigo
          </button>

          <button
            onClick={onSave}
            style={{ width: "100%", padding: 13, background: "#F3F4F6", border: "none", borderRadius: 14, fontFamily: "inherit", fontSize: 14, fontWeight: 700, color: "#6B7280", cursor: "pointer" }}
          >
            Listo, ya esta
          </button>
        </div>
      </Modal>
    );
  }

  return null;
}

// ── ONBOARDING JUEGO ──────────────────────────────────────────────────────────
function OnboardingGame({ friendsCount, onStart }) {
  return (
    <div style={{
      background: `linear-gradient(160deg, ${VD} 0%, ${V} 50%, #9333EA 100%)`,
      minHeight: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 28px", textAlign: "center", color: "#fff",
    }}>
      <div style={{ fontSize: 13, letterSpacing: 4, opacity: .6, marginBottom: 16 }}>★ ★ ★ ★ ★</div>
      <h1 style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.2, marginBottom: 12 }}>
        Sabes cuando cumplen<br/>
        <span style={{ color: A }}>tus amigos?</span>
      </h1>
      <p style={{ fontSize: 14, opacity: .85, lineHeight: 1.6, marginBottom: 36, maxWidth: 280 }}>
        Importa tus contactos de WhatsApp y armá tu agenda de cumpleaños.
      </p>

      <button
        onClick={onStart}
        style={{
          width: 148, height: 148, borderRadius: "50%",
          background: `linear-gradient(135deg, ${A} 0%, #F97316 100%)`,
          border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          color: "#fff", fontFamily: "inherit",
          boxShadow: "0 0 0 14px rgba(245,158,11,.18), 0 0 0 28px rgba(245,158,11,.08)",
          animation: "pulse 2.5s ease-in-out infinite",
        }}
      >
        <span style={{ fontSize: 44, marginBottom: 4 }}>🎂</span>
        <span style={{ fontSize: 15, fontWeight: 900 }}>A jugar!</span>
      </button>

      <div style={{ background: "rgba(255,255,255,.12)", borderRadius: 14, padding: "14px 20px", marginTop: 32, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: A }}>{friendsCount}</div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>cumpleaños cargados</div>
          <div style={{ fontSize: 12, opacity: .7 }}>{friendsCount === 0 ? "Importa el primero!" : "Segui sumando!"}</div>
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 0 14px rgba(245,158,11,.18),0 0 0 28px rgba(245,158,11,.08)}50%{box-shadow:0 0 0 20px rgba(245,158,11,.22),0 0 0 38px rgba(245,158,11,.1)}}`}</style>
    </div>
  );
}

// ── SWIPE DECK ────────────────────────────────────────────────────────────────
function SwipeDeck({ friends, onOrganize }) {
  const [idx, setIdx] = useState(0);
  const [swipeDir, setSwipeDir] = useState(null);
  const touchStartX = useRef(0);

  const upcoming = [...friends]
    .filter(f => f.birthday_month && f.birthday_day)
    .sort((a, b) => (daysUntilBirthday(a.birthday_month, a.birthday_day) ?? 9999) - (daysUntilBirthday(b.birthday_month, b.birthday_day) ?? 9999))
    .slice(0, 5);

  if (upcoming.length === 0) return null;

  const current = upcoming[idx];
  const next    = upcoming[(idx + 1) % upcoming.length];
  const after   = upcoming[(idx + 2) % upcoming.length];

  const advance = () => {
    setSwipeDir("left");
    setTimeout(() => { setIdx(i => (i + 1) % upcoming.length); setSwipeDir(null); }, 220);
  };

  const days = daysUntilBirthday(current.birthday_month, current.birthday_day);

  return (
    <div style={{ padding: "12px 20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "#9CA3AF" }}>Proximos cumpleaños</div>
        <div style={{ fontSize: 11, background: VL, color: V, padding: "2px 8px", borderRadius: 999, fontWeight: 800 }}>{upcoming.length} amigos</div>
      </div>

      <div style={{ position: "relative", height: 110, marginBottom: 14 }}>
        {upcoming.length > 2 && (
          <div style={{ position: "absolute", width: "100%", background: "#fff", borderRadius: 18, padding: "14px 16px", boxShadow: "0 4px 16px rgba(124,58,237,.1)", transform: "translateY(18px) scale(.93)", zIndex: 1, display: "flex", alignItems: "center", gap: 12, opacity: .6 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: getBg(after), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{getEmoji(after)}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1F2937" }}>{after.name}</div>
          </div>
        )}
        {upcoming.length > 1 && (
          <div style={{ position: "absolute", width: "100%", background: "#fff", borderRadius: 18, padding: "14px 16px", boxShadow: "0 4px 16px rgba(124,58,237,.1)", transform: "translateY(9px) scale(.965)", zIndex: 2, display: "flex", alignItems: "center", gap: 12, opacity: .8 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: getBg(next), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{getEmoji(next)}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1F2937" }}>{next.name}</div>
          </div>
        )}
        <div
          style={{ position: "absolute", width: "100%", background: "#fff", borderRadius: 18, padding: "14px 16px", boxShadow: "0 8px 24px rgba(124,58,237,.15)", transform: swipeDir ? "translateX(-110%) rotate(-8deg)" : "translateY(0) scale(1)", transition: swipeDir ? "transform .22s ease-in" : "transform .2s ease-out", zIndex: 3, display: "flex", alignItems: "center", gap: 12, cursor: "grab" }}
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={e => { if (Math.abs(touchStartX.current - e.changedTouches[0].clientX) > 50) advance(); }}
        >
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: getBg(current), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, position: "relative" }}>
            {getEmoji(current)}
            {current.is_registered && <div style={{ position: "absolute", bottom: 0, right: 0, width: 14, height: 14, borderRadius: "50%", background: G, border: "2px solid #fff" }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1F2937" }}>{current.name}</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
              🎂 {current.birthday_day} de {MONTH_NAMES[current.birthday_month - 1]}
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999, ...badgeStyle(days) }}>
            {bdayLabel(days)}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 16 }}>
        {[
          { bg: "#F3F4F6", color: "#6B7280", icon: "→", label: "Siguiente", fn: advance },
          { bg: VL, color: V, icon: "🎁", label: "Organizar", fn: () => onOrganize(current) },
          { bg: GL, color: G, icon: "✓", label: "Anotado", fn: advance },
        ].map(btn => (
          <button key={btn.label} onClick={btn.fn} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
            <div style={{ width: 50, height: 50, borderRadius: "50%", background: btn.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: btn.color }}>{btn.icon}</div>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF" }}>{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function FriendsPage({ navigate, profile }) {
  const [friends, setFriends]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => { loadFriends(); }, []);

  const loadFriends = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("friends").select("*")
      .order("birthday_month", { ascending: true })
      .order("birthday_day",   { ascending: true });
    setLoading(false);
    const list = data || [];
    setFriends(list);
    if (list.length === 0 && !localStorage.getItem("friends_onboarding_done")) {
      setShowOnboarding(true);
    }
  };

  const handleSaved = () => {
    setShowAddModal(false);
    setShowOnboarding(false);
    localStorage.setItem("friends_onboarding_done", "1");
    loadFriends();
  };

  const hotFriend = [...friends]
    .filter(f => f.birthday_month && f.birthday_day)
    .sort((a, b) => (daysUntilBirthday(a.birthday_month, a.birthday_day) ?? 9999) - (daysUntilBirthday(b.birthday_month, b.birthday_day) ?? 9999))[0];
  const hotDays = hotFriend ? daysUntilBirthday(hotFriend.birthday_month, hotFriend.birthday_day) : null;

  if (showOnboarding) {
    return (
      <>
        <OnboardingGame friendsCount={friends.length} onStart={() => setShowInviteModal(true)} />
        {showInviteModal && <InviteModal onClose={() => setShowInviteModal(false)} profile={profile} />}
      </>
    );
  }

  return (
    <div style={{ background: "#F9FAFB", minHeight: "100%" }}>
      <div style={{ background: "#fff", padding: "16px 20px 12px", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1F2937" }}>Mis cumpleaños 🎂</h2>
            <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
              {friends.length === 0 ? "Importa tus primeros amigos" : `${friends.length} amigos en tu agenda`}
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            style={{ width: 46, height: 46, borderRadius: "50%", background: `linear-gradient(135deg, ${V}, ${VD})`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#fff", boxShadow: "0 4px 12px rgba(124,58,237,.35)", fontFamily: "inherit" }}
          >+</button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Cargando...</div>
      ) : friends.length === 0 ? (
        <div style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📱</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1F2937", marginBottom: 8 }}>Todavia no tenes amigos cargados</div>
          <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 28, lineHeight: 1.6 }}>Importa tus contactos de WhatsApp y armá tu agenda de cumpleaños.</div>
          <button onClick={() => setShowInviteModal(true)} style={{ padding: "14px 28px", background: `linear-gradient(135deg, ${V}, ${VD})`, color: "#fff", border: "none", borderRadius: 14, fontFamily: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(124,58,237,.3)" }}>
            📤 Invitar amigos!
          </button>
        </div>
      ) : (
        <>
          {hotFriend && hotDays !== null && hotDays <= 15 && (
            <div style={{ margin: "14px 20px 0" }}>
              <div style={{ background: `linear-gradient(135deg, ${V}, ${VD})`, borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, color: "#fff" }}>
                <span style={{ fontSize: 26 }}>🔥</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>
                    {hotDays === 0 ? `Hoy cumple ${hotFriend.name}!` : hotDays === 1 ? `Mañana cumple ${hotFriend.name}!` : `${hotFriend.name} cumple en ${hotDays} dias`}
                  </div>
                  <div style={{ fontSize: 12, opacity: .85 }}>Ya organizaste algo?</div>
                </div>
                <button onClick={() => navigate("birthday-event-create", { friend: hotFriend })} style={{ background: A, color: "#fff", border: "none", borderRadius: 10, padding: "7px 12px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  Organizar
                </button>
              </div>
            </div>
          )}

          <SwipeDeck friends={friends} onOrganize={f => navigate("birthday-event-create", { friend: f })} />

          <div style={{ padding: "0 20px 80px" }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "#9CA3AF", marginBottom: 10 }}>Todos tus amigos</div>
            {friends.map(f => {
              const days = daysUntilBirthday(f.birthday_month, f.birthday_day);
              return (
                <div key={f.id} onClick={() => navigate("birthday-event-create", { friend: f })} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}>
                  <div style={{ width: 46, height: 46, borderRadius: "50%", background: getBg(f), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, position: "relative" }}>
                    {getEmoji(f)}
                    {f.is_registered && <div style={{ position: "absolute", bottom: 0, right: 0, width: 13, height: 13, borderRadius: "50%", background: G, border: "2px solid #fff" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1F2937" }}>{f.name}</div>
                    {f.birthday_month && f.birthday_day ? (
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 1 }}>
                        🎂 {f.birthday_day} de {MONTH_NAMES[f.birthday_month - 1]}
                        {days !== null ? ` · ${bdayLabel(days)}` : ""}
                        {f.birthday_year ? ` · cumple ${THIS_YEAR - f.birthday_year} años` : ""}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: A, marginTop: 1 }}>⏳ Esperando que confirme su cumple</div>
                    )}
                  </div>
                  {days !== null && days <= 7
                    ? <div style={{ fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 999, background: AL, color: "#92400E" }}>Pronto 🔥</div>
                    : <div style={{ fontSize: 18, color: "#D1D5DB" }}>›</div>
                  }
                </div>
              );
            })}

            <div onClick={() => setShowInviteModal(true)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", cursor: "pointer", marginTop: 4 }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: VL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: V }}>📤</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: V }}>Invitar amigos</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>Compartí tu link — ellos cargan su propio cumple</div>
              </div>
            </div>
          </div>
        </>
      )}

      {showInviteModal && <InviteModal onClose={() => setShowInviteModal(false)} profile={profile} />}
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { COLORS } from "../shared";

const V = "#7C3AED";
const VL = "#EDE9FE";
const VM = "#A78BFA";
const VD = "#5B21B6";
const A = "#F59E0B";
const AL = "#FEF3C7";
const G = "#10B981";
const GL = "#D1FAE5";

const MONTH_NAMES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre"
];

function daysUntilBirthday(month, day) {
  if (!month || !day) return null;
  const today = new Date();
  const thisYear = today.getFullYear();
  let next = new Date(thisYear, month - 1, day);
  if (next < today) next = new Date(thisYear + 1, month - 1, day);
  const diff = Math.round((next - today) / (1000 * 60 * 60 * 24));
  return diff;
}

function bdayLabel(days) {
  if (days === null) return null;
  if (days === 0) return "¡Hoy! 🎉";
  if (days === 1) return "¡Mañana! 🎂";
  if (days <= 7) return `en ${days} días 🔥`;
  if (days <= 30) return `en ${days} días`;
  return `en ${days} días`;
}

function badgeStyle(days) {
  if (days === null) return { background: "#F3F4F6", color: "#6B7280" };
  if (days <= 7) return { background: AL, color: "#92400E" };
  if (days <= 30) return { background: "#DBEAFE", color: "#1E40AF" };
  return { background: "#F3F4F6", color: "#6B7280" };
}

// ── ONBOARDING JUEGO ─────────────────────────────────────────────────────────
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
        ¿Sabés cuándo cumplen<br/>
        <span style={{ color: A }}>tus amigos?</span>
      </h1>
      <p style={{ fontSize: 14, opacity: .85, lineHeight: 1.6, marginBottom: 36, maxWidth: 280 }}>
        Armá tu agenda de cumpleaños y organizá los mejores regalos con todos.
      </p>

      {/* BOTÓN REDONDO GRANDE */}
      <button
        onClick={onStart}
        style={{
          width: 148, height: 148, borderRadius: "50%",
          background: `linear-gradient(135deg, ${A} 0%, #F97316 100%)`,
          border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          color: "#fff", fontFamily: "inherit",
          boxShadow: `0 0 0 14px rgba(245,158,11,.18), 0 0 0 28px rgba(245,158,11,.08)`,
          animation: "pulse 2.5s ease-in-out infinite",
        }}
      >
        <span style={{ fontSize: 44, marginBottom: 4 }}>🎂</span>
        <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: .3 }}>¡A jugar!</span>
      </button>

      <div style={{
        background: "rgba(255,255,255,.12)", borderRadius: 14,
        padding: "14px 20px", marginTop: 32,
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: A }}>{friendsCount}</div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>cumpleaños cargados</div>
          <div style={{ fontSize: 12, opacity: .7 }}>
            {friendsCount === 0 ? "¡Agregá el primero!" : `¡Seguí sumando!`}
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{box-shadow:0 0 0 14px rgba(245,158,11,.18),0 0 0 28px rgba(245,158,11,.08)} 50%{box-shadow:0 0 0 20px rgba(245,158,11,.22),0 0 0 38px rgba(245,158,11,.1)} }`}</style>
    </div>
  );
}

// ── ADD FRIEND MODAL ──────────────────────────────────────────────────────────
function AddFriendModal({ onClose, onSave, initialGameMode = false }) {
  const [name, setName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [age, setAge] = useState("");
  const [saving, setSaving] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(null); // { id, name } después de guardar sin edad

  const thisYear = new Date().getFullYear();
  const birthdayYear = age ? thisYear - parseInt(age) : null;
  const canSave = name.trim() && day && month;

  const inp = {
    width: "100%", padding: "12px 14px", border: "1.5px solid #E5E7EB",
    borderRadius: 12, fontSize: 15, fontFamily: "inherit",
    fontWeight: 600, outline: "none", color: "#1F2937", background: "#fff",
    boxSizing: "border-box",
  };
  const sel = { ...inp, appearance: "none", WebkitAppearance: "none" };

  // Guardar el amigo (con o sin año)
  const saveFriend = async (withAgeRequest = false) => {
    if (!canSave) return setError("Completá nombre, día y mes");
    if (age && (parseInt(age) < 1 || parseInt(age) > 120)) return setError("La edad no parece válida");
    setSaving(true); setError(null);
    const { data, error: e } = await supabase.from("friends").insert({
      name: name.trim(),
      birthday_day: parseInt(day),
      birthday_month: parseInt(month),
      birthday_year: birthdayYear,
      age_requested_at: withAgeRequest ? new Date().toISOString() : null,
    }).select().single();
    setSaving(false);
    if (e) return setError(e.message);
    if (withAgeRequest) {
      setSaved(data);  // mostramos pantalla de "preguntar"
    } else {
      onSave();
    }
  };

  // Armar mensaje y abrir WhatsApp
  const openWhatsApp = () => {
    const appUrl = `https://test.cumpleanitos.com/amigos/completar/${saved.id}`;
    const msg = encodeURIComponent(
      `¡Hola ${saved.name}! 🎂\n` +
      `Te agregué en Cumpleañitos para no olvidar tu cumpleaños, ` +
      `pero no sé en qué año naciste.\n` +
      `¿Me ayudás completando este dato? → ${appUrl}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  // Pantalla de éxito: "preguntar al cumpleañero"
  if (saved) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}>
        <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 480, paddingBottom: "env(safe-area-inset-bottom, 24px)" }} onClick={e => e.stopPropagation()}>
          <div style={{ width: 36, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "12px auto 0" }} />
          <div style={{ padding: "24px 24px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎂</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#1F2937", marginBottom: 6 }}>
              ¡{saved.name} fue agregado/a!
            </div>
            <div style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, marginBottom: 24 }}>
              Le vamos a preguntar en qué año nació para poder mostrarle cuántos años cumple.
            </div>

            {/* WhatsApp */}
            <button
              onClick={openWhatsApp}
              style={{
                width: "100%", padding: "14px 16px", marginBottom: 10,
                background: "#25D366", border: "none", borderRadius: 14,
                fontFamily: "inherit", fontSize: 15, fontWeight: 800, color: "#fff",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>💬</span>
              Preguntarle por WhatsApp
            </button>

            {/* Notificación interna (solo si está registrado) */}
            <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 20 }}>
              Si {saved.name} usa Cumpleañitos, también le llegará una notificación en la app.
            </div>

            <button
              onClick={onSave}
              style={{
                width: "100%", padding: 14,
                background: "#F3F4F6", border: "none", borderRadius: 14,
                fontFamily: "inherit", fontSize: 14, fontWeight: 700, color: "#6B7280",
                cursor: "pointer",
              }}
            >Listo, ya está</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: 36, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "12px auto 0" }} />

        <div style={{ textAlign: "center", padding: "20px 20px 0" }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>🎂</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#1F2937" }}>
            {initialGameMode ? "¿Quién es tu amigo/a?" : "Agregar amigo"}
          </div>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 3 }}>
            {initialGameMode ? "¡Empezá cargando el primero!" : "Nombre y cuándo cumple"}
          </div>
        </div>

        <div style={{ padding: "20px 20px 28px" }}>
          {error && (
            <div style={{ background: "#FEE2E2", color: "#B91C1C", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>
              {error}
            </div>
          )}

          {/* NOMBRE */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "#4B5563", marginBottom: 7 }}>Nombre</div>
            <input style={inp} placeholder="Ej: Sofía García" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>

          {/* DÍA Y MES */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "#4B5563", marginBottom: 7 }}>¿Cuándo cumple?</div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <select style={{ ...sel, width: "100%" }} value={day} onChange={e => setDay(e.target.value)}>
                  <option value="">Día</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <select style={{ ...sel, width: "100%" }} value={month} onChange={e => setMonth(e.target.value)}>
                  <option value="">Mes</option>
                  {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* EDAD — el juego */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "#4B5563", marginBottom: 4 }}>
              ¿Cuántos años cumple este año?
            </div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 10 }}>
              Si no lo sabés exacto, no importa — poné tu mejor estimación 🙈
            </div>
            <input
              type="number" min="1" max="120" placeholder="—"
              value={age} onChange={e => setAge(e.target.value)}
              style={{ ...inp, fontSize: 48, fontWeight: 900, textAlign: "center", padding: "16px 14px", color: V, borderColor: age ? V : "#E5E7EB", borderWidth: 2, borderRadius: 16 }}
            />
            {age && birthdayYear && (
              <div style={{ marginTop: 10, padding: "10px 14px", background: VL, borderRadius: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>📅</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: VD }}>
                  Año de nacimiento estimado: <strong>{birthdayYear}</strong>
                </span>
                <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: "auto" }}>El cumpleañero lo valida</span>
              </div>
            )}
          </div>

          {/* BOTÓN PRINCIPAL */}
          <button
            onClick={() => saveFriend(false)}
            disabled={saving || asking || !canSave}
            style={{
              width: "100%", padding: 16, marginBottom: 10,
              background: (!canSave || saving) ? "#E5E7EB" : `linear-gradient(135deg, ${V}, ${VD})`,
              color: (!canSave || saving) ? "#9CA3AF" : "#fff",
              border: "none", borderRadius: 14, fontFamily: "inherit",
              fontSize: 16, fontWeight: 800,
              cursor: (!canSave || saving) ? "not-allowed" : "pointer",
              boxShadow: (!canSave || saving) ? "none" : `0 4px 14px rgba(124,58,237,.3)`,
            }}
          >
            {saving ? "Guardando…" : initialGameMode ? "¡Agregar! 🎂" : "Guardar amigo"}
          </button>

          {/* BOTÓN PREGUNTAR — solo si no puso edad */}
          {!age && canSave && (
            <button
              onClick={() => saveFriend(true)}
              disabled={saving || asking}
              style={{
                width: "100%", padding: 14,
                background: "#F3F4F6", border: "none", borderRadius: 14,
                fontFamily: "inherit", fontSize: 14, fontWeight: 700,
                color: "#4B5563", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <span style={{ fontSize: 18 }}>💬</span>
              No sé — preguntarle al cumpleañero
            </button>
          )}

          {!age && !canSave && (
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "#9CA3AF" }}>
              Podés dejarlo en blanco si no tenés idea
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SWIPE CARD DECK ───────────────────────────────────────────────────────────
function SwipeDeck({ friends, onOrganize }) {
  const [idx, setIdx] = useState(0);
  const [swipeDir, setSwipeDir] = useState(null);
  const [touching, setTouching] = useState(false);
  const touchStartX = useRef(0);

  const upcoming = [...friends]
    .filter(f => f.birthday_month && f.birthday_day)
    .sort((a, b) => (daysUntilBirthday(a.birthday_month, a.birthday_day) ?? 9999) - (daysUntilBirthday(b.birthday_month, b.birthday_day) ?? 9999))
    .slice(0, 5);

  if (upcoming.length === 0) return null;

  const current = upcoming[idx];
  const next = upcoming[(idx + 1) % upcoming.length];
  const after = upcoming[(idx + 2) % upcoming.length];

  const advance = () => {
    setSwipeDir("left");
    setTimeout(() => { setIdx(i => (i + 1) % upcoming.length); setSwipeDir(null); }, 220);
  };

  const handleTouchStart = e => { touchStartX.current = e.touches[0].clientX; setTouching(true); };
  const handleTouchEnd = e => {
    setTouching(false);
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) advance();
  };

  const avatarEmojis = ["🧑","👩","🧔","👧","👨","👱","🧒","👵","👴","🧓"];
  const getEmoji = (f) => avatarEmojis[f.name.charCodeAt(0) % avatarEmojis.length];
  const bgColors = ["#EDE9FE","#FEF3C7","#DBEAFE","#FEE2E2","#D1FAE5","#FCE7F3"];
  const getBg = (f) => bgColors[f.name.charCodeAt(0) % bgColors.length];

  const days = daysUntilBirthday(current.birthday_month, current.birthday_day);

  return (
    <div style={{ padding: "12px 20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "#9CA3AF" }}>
          Próximos cumpleaños
        </div>
        <div style={{ fontSize: 11, background: VL, color: V, padding: "2px 8px", borderRadius: 999, fontWeight: 800 }}>
          {upcoming.length} amigos
        </div>
      </div>

      {/* STACK DE CARTAS */}
      <div style={{ position: "relative", height: 110, marginBottom: 14 }}>
        {/* carta 3 (fondo) */}
        {upcoming.length > 2 && (
          <div style={{
            position: "absolute", width: "100%",
            background: "#fff", borderRadius: 18, padding: "14px 16px",
            boxShadow: "0 4px 16px rgba(124,58,237,.1)",
            transform: "translateY(18px) scale(.93)", zIndex: 1,
            display: "flex", alignItems: "center", gap: 12, opacity: .7,
          }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: getBg(after), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{getEmoji(after)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1F2937" }}>{after.name}</div>
            </div>
          </div>
        )}
        {/* carta 2 */}
        {upcoming.length > 1 && (
          <div style={{
            position: "absolute", width: "100%",
            background: "#fff", borderRadius: 18, padding: "14px 16px",
            boxShadow: "0 4px 16px rgba(124,58,237,.1)",
            transform: "translateY(9px) scale(.965)", zIndex: 2,
            display: "flex", alignItems: "center", gap: 12, opacity: .85,
          }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: getBg(next), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{getEmoji(next)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1F2937" }}>{next.name}</div>
            </div>
          </div>
        )}
        {/* carta 1 (frente) */}
        <div
          style={{
            position: "absolute", width: "100%",
            background: "#fff", borderRadius: 18, padding: "14px 16px",
            boxShadow: "0 8px 24px rgba(124,58,237,.15)",
            transform: swipeDir ? `translateX(${swipeDir === "left" ? "-110%" : "110%"}) rotate(${swipeDir === "left" ? -8 : 8}deg)` : "translateY(0) scale(1)",
            transition: swipeDir ? "transform .22s ease-in" : "transform .2s ease-out",
            zIndex: 3, display: "flex", alignItems: "center", gap: 12, cursor: "grab",
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: getBg(current), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, position: "relative" }}>
            {getEmoji(current)}
            {current.is_registered && (
              <div style={{ position: "absolute", bottom: 0, right: 0, width: 14, height: 14, borderRadius: "50%", background: G, border: "2px solid #fff" }} />
            )}
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

      {/* ACCIONES SWIPE */}
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 16 }}>
        <button onClick={advance} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
          <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#6B7280" }}>→</div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF" }}>Siguiente</span>
        </button>
        <button onClick={() => onOrganize(current)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
          <div style={{ width: 50, height: 50, borderRadius: "50%", background: VL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎁</div>
          <span style={{ fontSize: 10, fontWeight: 700, color: V }}>Organizar</span>
        </button>
        <button onClick={advance} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
          <div style={{ width: 50, height: 50, borderRadius: "50%", background: GL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✓</div>
          <span style={{ fontSize: 10, fontWeight: 700, color: G }}>Anotado</span>
        </button>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function FriendsPage({ navigate, profile }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [gameMode, setGameMode] = useState(false); // true = viene del onboarding

  useEffect(() => { loadFriends(); }, []);

  const loadFriends = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("friends")
      .select("*")
      .order("birthday_month", { ascending: true })
      .order("birthday_day", { ascending: true });
    setLoading(false);
    if (!error) {
      setFriends(data || []);
      // Onboarding solo si no tiene amigos Y nunca lo vio antes
      // IMPORTANTE: nunca abrir el modal automáticamente
      if ((data || []).length === 0 && !localStorage.getItem("friends_onboarding_done")) {
        setShowOnboarding(true);
      }
    }
  };

  const handleStartGame = () => {
    setShowOnboarding(false);
    setGameMode(true);
    // Solo abrir modal al tocar el botón explícitamente
    setShowAddModal(true);
  };

  const handleAddSaved = () => {
    setShowAddModal(false);
    localStorage.setItem("friends_onboarding_done", "1");
    loadFriends();
  };

  // Amigo con cumple más próximo
  const hotFriend = [...friends]
    .filter(f => f.birthday_month && f.birthday_day)
    .sort((a, b) => (daysUntilBirthday(a.birthday_month, a.birthday_day) ?? 9999) - (daysUntilBirthday(b.birthday_month, b.birthday_day) ?? 9999))[0];
  const hotDays = hotFriend ? daysUntilBirthday(hotFriend.birthday_month, hotFriend.birthday_day) : null;

  const avatarEmojis = ["🧑","👩","🧔","👧","👨","👱","🧒","👵","👴","🧓"];
  const bgColors = ["#EDE9FE","#FEF3C7","#DBEAFE","#FEE2E2","#D1FAE5","#FCE7F3"];
  const getEmoji = f => avatarEmojis[f.name.charCodeAt(0) % avatarEmojis.length];
  const getBg = f => bgColors[f.name.charCodeAt(0) % bgColors.length];

  if (showOnboarding) {
    return <OnboardingGame friendsCount={friends.length} onStart={handleStartGame} />;
  }

  return (
    <div style={{ background: "#F9FAFB", minHeight: "100%" }}>
      {/* HEADER */}
      <div style={{ background: "#fff", padding: "16px 20px 12px", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1F2937" }}>
              Mis cumpleaños 🎂
            </h2>
            <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
              {friends.length === 0 ? "Agregá tus primeros amigos" : `${friends.length} amigos en tu agenda`}
            </p>
          </div>
          {/* BOTÓN + permanente */}
          <button
            onClick={() => { setGameMode(false); setShowAddModal(true); }}
            style={{
              width: 46, height: 46, borderRadius: "50%",
              background: `linear-gradient(135deg, ${V}, ${VD})`,
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, color: "#fff", fontWeight: 900,
              boxShadow: `0 4px 12px rgba(124,58,237,.35)`,
            }}
          >+</button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Cargando…</div>
      ) : friends.length === 0 ? (
        /* ESTADO VACÍO */
        <div style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎂</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1F2937", marginBottom: 8 }}>
            Todavía no tenés amigos cargados
          </div>
          <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 28, lineHeight: 1.6 }}>
            Agregá a tus amigos con su fecha de cumpleaños y organizá los mejores regalos.
          </div>
          <button
            onClick={() => setShowOnboarding(true)}
            style={{
              padding: "14px 28px",
              background: `linear-gradient(135deg, ${V}, ${VD})`,
              color: "#fff", border: "none", borderRadius: 14,
              fontFamily: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer",
              boxShadow: `0 4px 14px rgba(124,58,237,.3)`,
            }}
          >🎂 ¡Empezar el juego!</button>
        </div>
      ) : (
        <>
          {/* STRIP ALERTA CUMPLE PRÓXIMO */}
          {hotFriend && hotDays !== null && hotDays <= 15 && (
            <div style={{ margin: "14px 20px 0" }}>
              <div style={{
                background: `linear-gradient(135deg, ${V}, ${VD})`,
                borderRadius: 16, padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 12, color: "#fff",
              }}>
                <span style={{ fontSize: 26 }}>🔥</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>
                    {hotDays === 0 ? `¡Hoy cumple ${hotFriend.name}!` : hotDays === 1 ? `¡Mañana cumple ${hotFriend.name}!` : `${hotFriend.name} cumple en ${hotDays} días`}
                  </div>
                  <div style={{ fontSize: 12, opacity: .85 }}>¿Ya organizaste algo?</div>
                </div>
                <button
                  onClick={() => navigate("birthday-event-create", { friend: hotFriend })}
                  style={{
                    background: A, color: "#fff", border: "none",
                    borderRadius: 10, padding: "7px 12px",
                    fontSize: 12, fontWeight: 800, cursor: "pointer",
                    fontFamily: "inherit", whiteSpace: "nowrap",
                  }}
                >Organizar</button>
              </div>
            </div>
          )}

          {/* SWIPE DECK */}
          <SwipeDeck
            friends={friends}
            onOrganize={f => navigate("birthday-event-create", { friend: f })}
          />

          {/* LISTA COMPLETA */}
          <div style={{ padding: "0 20px 80px" }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "#9CA3AF", marginBottom: 10 }}>
              Todos tus amigos
            </div>
            {friends.map(f => {
              const days = daysUntilBirthday(f.birthday_month, f.birthday_day);
              return (
                <div
                  key={f.id}
                  onClick={() => navigate("birthday-event-create", { friend: f })}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 0", borderBottom: "1px solid #F3F4F6",
                    cursor: "pointer",
                  }}
                >
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
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>Sin fecha de cumpleaños</div>
                    )}
                  </div>
                  {days !== null && days <= 7 ? (
                    <div style={{ fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 999, background: AL, color: "#92400E" }}>Pronto 🔥</div>
                  ) : (
                    <div style={{ fontSize: 18, color: "#D1D5DB" }}>›</div>
                  )}
                </div>
              );
            })}

            {/* Botón agregar al final de la lista también */}
            <div
              onClick={() => { setGameMode(false); setShowAddModal(true); }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 0", cursor: "pointer", marginTop: 4,
              }}
            >
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: VL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: V }}>＋</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: V }}>Agregar amigo</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>Nombre + fecha de cumpleaños</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODAL AGREGAR */}
      {showAddModal && (
        <AddFriendModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddSaved}
          initialGameMode={gameMode}
        />
      )}
    </div>
  );
}

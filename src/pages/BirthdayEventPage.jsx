import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const V = "#7C3AED";
const VL = "#EDE9FE";
const VD = "#5B21B6";
const A = "#F59E0B";
const AL = "#FEF3C7";
const G = "#10B981";
const GL = "#D1FAE5";

const MONTH_NAMES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre"
];

const AMOUNT_PRESETS = [10000, 20000, 50000, 100000, 200000];

function formatARS(n) {
  if (!n) return "";
  return new Intl.NumberFormat("es-AR").format(n);
}

// ── STEPPER HEADER ────────────────────────────────────────────────────────────
function StepHeader({ step, total }) {
  return (
    <div style={{ padding: "12px 20px 8px", background: "#fff", borderBottom: "1px solid #F3F4F6" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i < step ? V : i === step ? VL : "#F3F4F6",
            transition: "background .3s",
          }} />
        ))}
      </div>
      <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>
        Paso {step + 1} de {total}
      </div>
    </div>
  );
}

// ── STEP 1: INFO EVENTO + MODO ────────────────────────────────────────────────
function Step1({ friend, title, setTitle, privacyMode, setPrivacyMode, onNext }) {
  const inp = {
    width: "100%", padding: "12px 14px", border: "1.5px solid #E5E7EB",
    borderRadius: 12, fontSize: 15, fontFamily: "inherit",
    fontWeight: 600, outline: "none", color: "#1F2937", background: "#fff",
  };
  return (
    <div style={{ padding: "16px 20px" }}>
      {/* Cumpleañero */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "#4B5563", marginBottom: 6 }}>Cumpleañero/a</div>
        <div style={{ background: VL, border: `1.5px solid #A78BFA`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 26 }}>🧑</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: V }}>{friend.name}</div>
            {friend.birthday_month && friend.birthday_day && (
              <div style={{ fontSize: 12, color: V, opacity: .7 }}>
                🎂 {friend.birthday_day} de {MONTH_NAMES[friend.birthday_month - 1]}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Título */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "#4B5563", marginBottom: 6 }}>Título del evento</div>
        <input
          style={{ ...inp, borderColor: title ? V : "#E5E7EB" }}
          placeholder={`El cumple de ${friend.name} 🎉`}
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      {/* Modo */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "#4B5563", marginBottom: 6 }}>¿El cumpleañero sabe del regalo?</div>
        <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", border: "1.5px solid #E5E7EB" }}>
          {[
            { value: "consult", icon: "✅", label: "Lo consulto primero", sub: "Le pregunto qué quiere recibir" },
            { value: "surprise", icon: "🎁", label: "Sorpresa total", sub: "No sabe nada hasta el día" },
          ].map((opt, i) => (
            <div
              key={opt.value}
              onClick={() => setPrivacyMode(opt.value)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "13px 14px", cursor: "pointer",
                background: privacyMode === opt.value ? VL : "#fff",
                borderBottom: i === 0 ? "1px solid #F3F4F6" : "none",
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                border: `2px solid ${privacyMode === opt.value ? V : "#D1D5DB"}`,
                background: privacyMode === opt.value ? V : "#fff",
                flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {privacyMode === opt.value && <div style={{ width: 8, height: 8, background: "#fff", borderRadius: "50%" }} />}
              </div>
              <span style={{ fontSize: 18 }}>{opt.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: privacyMode === opt.value ? V : "#1F2937" }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>{opt.sub}</div>
              </div>
            </div>
          ))}
        </div>
        {privacyMode === "consult" && (
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 5 }}>
            {friend.name} recibirá una notificación para aprobar el regalo o elegir sorpresa.
          </div>
        )}
      </div>

      <button
        onClick={onNext}
        disabled={!title.trim()}
        style={{
          width: "100%", padding: 15,
          background: title.trim() ? `linear-gradient(135deg, ${V}, ${VD})` : "#E5E7EB",
          color: title.trim() ? "#fff" : "#9CA3AF",
          border: "none", borderRadius: 14, fontFamily: "inherit",
          fontSize: 15, fontWeight: 800, cursor: title.trim() ? "pointer" : "not-allowed",
          boxShadow: title.trim() ? `0 4px 14px rgba(124,58,237,.3)` : "none",
        }}
      >Siguiente →</button>
    </div>
  );
}

// ── STEP 2: ORGANIZADORES ─────────────────────────────────────────────────────
function Step2({ profile, coOrganizers, setCoOrganizers, onNext, onBack }) {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const searchUsers = async (q) => {
    if (q.length < 2) return setSearchResults([]);
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
      .neq("id", profile.id)
      .limit(5);
    setSearching(false);
    setSearchResults(data || []);
  };

  const addOrganizer = (user) => {
    if (coOrganizers.find(o => o.id === user.id)) return;
    setCoOrganizers(prev => [...prev, { ...user, shareGroup: "" }]);
    setSearch(""); setSearchResults([]);
  };

  const removeOrganizer = (id) => setCoOrganizers(prev => prev.filter(o => o.id !== id));

  const updateGroup = (id, val) =>
    setCoOrganizers(prev => prev.map(o => o.id === id ? { ...o, shareGroup: val } : o));

  return (
    <div style={{ padding: "16px 20px" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#1F2937", marginBottom: 4 }}>Organizadores del regalo</div>
        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
          Podés sumar organizadores secundarios. Cada uno puede compartir el regalo con su grupo de amigos.
        </div>
      </div>

      {/* Vos (principal) */}
      <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1.5px solid #E5E7EB", marginBottom: 14 }}>
        <div style={{ padding: "10px 14px", background: VL, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: V }}>Organizadores</span>
          <span style={{ fontSize: 11, color: V, fontWeight: 600 }}>{1 + coOrganizers.length} total</span>
        </div>

        {/* Principal = vos */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: AL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👑</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1F2937" }}>
              {profile?.full_name || profile?.username || "Vos"}
            </div>
            <div style={{ fontSize: 11, color: "#92400E", fontWeight: 700 }}>Organizador principal</div>
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>Podés invitar a todos</div>
          </div>
          <div style={{ background: V, color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 999 }}>Principal</div>
        </div>

        {/* Secundarios */}
        {coOrganizers.map(org => (
          <div key={org.id} style={{ padding: "12px 14px", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: VL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🤝</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1F2937" }}>{org.full_name || org.username}</div>
                <div style={{ fontSize: 11, color: V, fontWeight: 600 }}>Organizador secundario</div>
              </div>
              <button onClick={() => removeOrganizer(org.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>✕</button>
            </div>
            <input
              placeholder={`¿Con qué grupo comparte? (ej: Amigos del trabajo)`}
              value={org.shareGroup}
              onChange={e => updateGroup(org.id, e.target.value)}
              style={{
                width: "100%", padding: "9px 12px", border: "1.5px solid #E5E7EB",
                borderRadius: 10, fontSize: 13, fontFamily: "inherit",
                color: "#1F2937", outline: "none", background: "#F9FAFB",
              }}
            />
          </div>
        ))}
      </div>

      {/* Buscar usuario */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "#4B5563", marginBottom: 6 }}>Agregar organizador secundario</div>
        <div style={{ position: "relative" }}>
          <input
            placeholder="Buscar por nombre o usuario…"
            value={search}
            onChange={e => { setSearch(e.target.value); searchUsers(e.target.value); }}
            style={{
              width: "100%", padding: "11px 14px", border: "1.5px solid #E5E7EB",
              borderRadius: 12, fontSize: 14, fontFamily: "inherit",
              color: "#1F2937", outline: "none", background: "#fff",
            }}
          />
          {searching && <div style={{ position: "absolute", right: 12, top: 12, fontSize: 12, color: "#9CA3AF" }}>…</div>}
        </div>
        {searchResults.length > 0 && (
          <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 12, marginTop: 4, overflow: "hidden" }}>
            {searchResults.map(u => (
              <div
                key={u.id}
                onClick={() => addOrganizer(u)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #F3F4F6" }}
              >
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: VL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👤</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1F2937" }}>{u.full_name || u.username}</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>@{u.username}</div>
                </div>
                <div style={{ marginLeft: "auto", fontSize: 12, color: V, fontWeight: 700 }}>+ Agregar</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onBack} style={{ flex: 1, padding: 14, border: "2px solid #E5E7EB", borderRadius: 14, background: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 700, color: "#6B7280", cursor: "pointer" }}>← Atrás</button>
        <button onClick={onNext} style={{ flex: 2, padding: 14, background: `linear-gradient(135deg, ${V}, ${VD})`, border: "none", borderRadius: 14, fontFamily: "inherit", fontSize: 14, fontWeight: 800, color: "#fff", cursor: "pointer", boxShadow: `0 4px 14px rgba(124,58,237,.3)` }}>Siguiente →</button>
      </div>
    </div>
  );
}

// ── STEP 3: DEFINIR REGALO ────────────────────────────────────────────────────
function Step3({ giftData, setGiftData, onSave, onBack, saving }) {
  const { type, title, description, amount, link } = giftData;
  const set = (k, v) => setGiftData(prev => ({ ...prev, [k]: v }));

  const inp = {
    width: "100%", padding: "12px 14px", border: "1.5px solid #E5E7EB",
    borderRadius: 12, fontSize: 15, fontFamily: "inherit",
    fontWeight: 600, outline: "none", color: "#1F2937", background: "#fff",
  };

  return (
    <div style={{ padding: "16px 20px 32px" }}>
      {/* Tipo */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "#4B5563", marginBottom: 8 }}>Tipo de regalo</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { value: "product", icon: "📦", label: "Producto" },
            { value: "experience", icon: "✨", label: "Experiencia" },
            { value: "money", icon: "💰", label: "Dinero" },
          ].map(opt => (
            <div
              key={opt.value}
              onClick={() => set("type", opt.value)}
              style={{
                background: type === opt.value ? VL : "#fff",
                border: `2px solid ${type === opt.value ? V : "#E5E7EB"}`,
                borderRadius: 12, padding: "12px 8px", textAlign: "center", cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 4 }}>{opt.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: type === opt.value ? V : "#6B7280" }}>{opt.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Título */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "#4B5563", marginBottom: 6 }}>¿Qué querés regalar?</div>
        <input style={{ ...inp, borderColor: title ? V : "#E5E7EB" }} placeholder="Ej: AirPods Pro, cena en restaurante…" value={title} onChange={e => set("title", e.target.value)} />
      </div>

      {/* Descripción */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "#4B5563", marginBottom: 6 }}>Descripción (opcional)</div>
        <textarea
          style={{ ...inp, resize: "none", height: 72 }}
          placeholder="Contales a los demás qué es y por qué lo elegiste…"
          value={description}
          onChange={e => set("description", e.target.value)}
        />
      </div>

      {/* Meta */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "#4B5563", marginBottom: 6 }}>Meta de recaudación</div>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, fontWeight: 800, color: V }}>$</span>
          <input
            style={{ ...inp, paddingLeft: 30, fontSize: 20, fontWeight: 800, color: V, borderColor: amount ? V : "#E5E7EB" }}
            placeholder="0"
            type="number"
            value={amount}
            onChange={e => set("amount", e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          {AMOUNT_PRESETS.map(p => (
            <button key={p} onClick={() => set("amount", p)}
              style={{ padding: "5px 10px", background: VL, borderRadius: 999, fontSize: 12, fontWeight: 700, color: V, cursor: "pointer", border: "none", fontFamily: "inherit" }}>
              ${formatARS(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Link */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "#4B5563", marginBottom: 6 }}>Link del producto (opcional)</div>
        <input style={inp} placeholder="https://www.mercadolibre.com.ar/…" value={link} onChange={e => set("link", e.target.value)} />
        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>Pegá el link de MercadoLibre u otra tienda</div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onBack} style={{ flex: 1, padding: 14, border: "2px solid #E5E7EB", borderRadius: 14, background: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 700, color: "#6B7280", cursor: "pointer" }}>← Atrás</button>
        <button
          onClick={onSave}
          disabled={saving || !title.trim() || !amount}
          style={{
            flex: 2, padding: 14,
            background: (!title.trim() || !amount || saving) ? "#E5E7EB" : `linear-gradient(135deg, ${V}, ${VD})`,
            border: "none", borderRadius: 14, fontFamily: "inherit",
            fontSize: 14, fontWeight: 800,
            color: (!title.trim() || !amount || saving) ? "#9CA3AF" : "#fff",
            cursor: (!title.trim() || !amount || saving) ? "not-allowed" : "pointer",
            boxShadow: (!title.trim() || !amount || saving) ? "none" : `0 4px 14px rgba(124,58,237,.3)`,
          }}
        >{saving ? "Guardando…" : "¡Crear evento! 🎉"}</button>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function BirthdayEventPage({ navigate, profile, params }) {
  const friend = params?.friend;
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(friend ? `El cumple de ${friend.name} 🎉` : "");
  const [privacyMode, setPrivacyMode] = useState("consult");
  const [coOrganizers, setCoOrganizers] = useState([]);
  const [giftData, setGiftData] = useState({ type: "product", title: "", description: "", amount: "", link: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Si no hay friend, redirigir
  useEffect(() => {
    if (!friend) navigate("friends");
  }, []);

  if (!friend) return null;

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      // 1. Crear el birthday_event
      const { data: event, error: e1 } = await supabase
        .from("birthday_events")
        .insert({
          friend_id: friend.id,
          owner_user_id: profile.id,
          title: title.trim(),
          birthday_date: friend.birthday_month && friend.birthday_day
            ? `${new Date().getFullYear()}-${String(friend.birthday_month).padStart(2,"0")}-${String(friend.birthday_day).padStart(2,"0")}`
            : null,
          status: "draft",
          privacy_mode: privacyMode,
          gift_title: giftData.title.trim(),
          gift_description: giftData.description.trim() || null,
          gift_type: giftData.type,
          gift_amount_target: parseFloat(giftData.amount) || null,
          gift_link: giftData.link.trim() || null,
        })
        .select()
        .single();

      if (e1) throw e1;

      // 2. Crear organizador principal
      await supabase.from("birthday_organizers").insert({
        birthday_event_id: event.id,
        user_id: profile.id,
        role: "principal",
        status: "active",
      });

      // 3. Crear organizadores secundarios
      if (coOrganizers.length > 0) {
        await supabase.from("birthday_organizers").insert(
          coOrganizers.map(org => ({
            birthday_event_id: event.id,
            user_id: org.id,
            role: "secondary",
            share_group: org.shareGroup || null,
            invited_by: profile.id,
            status: "active",
          }))
        );
      }

      // 4. Navegar al detalle del evento
      navigate("birthday-event-detail", { eventId: event.id, event });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div style={{ background: "#F9FAFB", minHeight: "100%", display: "flex", flexDirection: "column" }}>
      {/* NAVBAR */}
      <div style={{ background: "#fff", padding: "12px 20px 10px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => step === 0 ? navigate("friends") : setStep(s => s - 1)}
          style={{ width: 34, height: 34, borderRadius: "50%", background: "#F3F4F6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#4B5563" }}>‹</button>
        <div style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 800, color: "#1F2937" }}>
          {["Organizar cumpleaños", "Organizadores", "El regalo"][step]}
        </div>
        <div style={{ width: 34 }} />
      </div>

      <StepHeader step={step} total={3} />

      {error && (
        <div style={{ margin: "12px 20px 0", background: "#FEE2E2", color: "#B91C1C", borderRadius: 10, padding: "10px 14px", fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto" }}>
        {step === 0 && (
          <Step1
            friend={friend}
            title={title} setTitle={setTitle}
            privacyMode={privacyMode} setPrivacyMode={setPrivacyMode}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <Step2
            profile={profile}
            coOrganizers={coOrganizers} setCoOrganizers={setCoOrganizers}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <Step3
            giftData={giftData} setGiftData={setGiftData}
            onSave={handleSave}
            onBack={() => setStep(1)}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}

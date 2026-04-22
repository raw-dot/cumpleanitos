import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { COLORS } from "../utils/constants";

/**
 * OrganizeBirthdayPage — Wizard de 3 pasos + pantalla de compartir
 * Paso 1: Nombre + Fecha + Edad (unificado)
 * Paso 2: Regalo (siempre aporte, sugerencias de tipo)
 * Paso 3: Resumen + sorpresa/ver
 * Share: Compartir por redes sociales
 */

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MONTHS_LOWER = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

const GIFT_SUGGESTIONS = [
  { icon: "📦", label: "Producto" },
  { icon: "🎭", label: "Experiencia" },
  { icon: "💰", label: "Plata para algo" },
  { icon: "✈️", label: "Viaje" },
  { icon: "🎉", label: "Fiesta de cumple" },
  { icon: "👗", label: "Renovar outfit" },
];

const BUDGET_IDEAS = [
  { icon: "👗", text: "Renovar outfit" },
  { icon: "🎭", text: "Show para 2 personas" },
  { icon: "🍽️", text: "Cena con amigos" },
  { icon: "💆", text: "Spa / masajes" },
  { icon: "🛒", text: "Elegir en MercadoLibre" },
];

const SHARE_CHANNELS = [
  { id: "whatsapp", icon: "💬", label: "WhatsApp", color: "#25D366", bg: "#DCFCE7" },
  { id: "instagram", icon: "📸", label: "Instagram", color: "#E1306C", bg: "#FCE7F3" },
  { id: "tiktok", icon: "🎵", label: "TikTok", color: "#010101", bg: "#F3F4F6" },
  { id: "linkedin", icon: "💼", label: "LinkedIn", color: "#0A66C2", bg: "#DBEAFE" },
];

// ── Helpers ──
function calcEstimatedYear(month, age) {
  if (!month || !age) return null;
  return new Date().getFullYear() - parseInt(age);
}

function calcDaysUntil(day, month) {
  if (!month) return null;
  const now = new Date();
  const d = parseInt(day || 1);
  const m = parseInt(month) - 1;
  let next = new Date(now.getFullYear(), m, d);
  if (next <= now) next = new Date(now.getFullYear() + 1, m, d);
  return Math.ceil((next - now) / 86400000);
}

function formatDateText(day, month) {
  if (!month) return null;
  const d = parseInt(day || 1);
  const m = parseInt(month) - 1;
  const now = new Date();
  let next = new Date(now.getFullYear(), m, d);
  if (next <= now) next = new Date(now.getFullYear() + 1, m, d);
  const days = Math.ceil((next - now) / 86400000);
  return `🎂 ${d} de ${MONTHS_LOWER[m]} · en ${days} días`;
}

// ── Styles ──
const S = {
  page: { maxWidth: 480, margin: "0 auto", padding: 0 },
  header: { display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}` },
  backBtn: { width: 36, height: 36, borderRadius: "50%", border: "none", background: "#F3F4F6", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" },
  title: { fontWeight: 700, fontSize: 17, color: COLORS.text },
  body: { padding: "12px 20px 20px" },
  h2: { fontSize: 22, fontWeight: 800, color: COLORS.text, margin: "8px 0 4px" },
  sub: { fontSize: 14, color: COLORS.textLight, margin: "0 0 20px" },
  label: { fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 },
  optLabel: { fontWeight: 400, color: COLORS.textLight, textTransform: "none" },
  input: { width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 16, color: COLORS.text, outline: "none", fontWeight: 500, boxSizing: "border-box", fontFamily: "inherit" },
  inputBig: { width: "100%", padding: 16, borderRadius: 12, border: `1.5px solid ${COLORS.primary}`, fontSize: 36, fontWeight: 800, textAlign: "center", color: COLORS.primary, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  dateInput: { flex: 1, padding: 14, borderRadius: 12, border: `1.5px solid ${COLORS.primary}`, fontSize: 22, fontWeight: 700, textAlign: "center", color: COLORS.text, outline: "none", fontFamily: "inherit" },
  select: { flex: 2, padding: 14, borderRadius: 12, border: `1.5px solid ${COLORS.primary}`, fontSize: 15, fontWeight: 600, background: "#fff", outline: "none", fontFamily: "inherit" },
  cta: (disabled) => ({
    width: "100%", padding: 16, borderRadius: 16, border: "none",
    background: disabled ? "#E5E7EB" : `linear-gradient(135deg, ${COLORS.primary}, #6D28D9)`,
    color: disabled ? COLORS.textLight : "#fff", fontWeight: 700, fontSize: 16,
    cursor: disabled ? "default" : "pointer", boxShadow: disabled ? "none" : "0 4px 20px rgba(124,58,237,0.2)",
    fontFamily: "inherit",
  }),
  ctaGreen: { width: "100%", padding: 16, borderRadius: 16, border: "none", background: "linear-gradient(135deg, #10B981, #059669)", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: "inherit" },
  ctaOrange: { width: "100%", padding: 16, borderRadius: 16, border: "none", background: "linear-gradient(135deg, #F97316, #EA580C)", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: "inherit" },
  chip: (sel) => ({
    padding: "10px 14px", borderRadius: 999, border: `1.5px solid ${sel ? COLORS.primary : "#E5E7EB"}`,
    background: sel ? "#EDE9FE" : "#fff", color: sel ? COLORS.primary : "#6B7280",
    fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit",
  }),
  infoBox: (bg) => ({ padding: "10px 14px", background: bg, borderRadius: 12, display: "flex", alignItems: "center", gap: 8, marginTop: 8 }),
  card: (hl) => ({ background: "#fff", borderRadius: 16, padding: 14, border: hl ? `2px solid ${COLORS.primary}` : "1px solid #E5E7EB", boxShadow: hl ? "0 4px 24px rgba(124,58,237,0.12)" : "none" }),
  tipBox: (bg) => ({ padding: "12px 14px", background: bg || "#FEF3C7", borderRadius: 12, fontSize: 13, color: "#6B7280", display: "flex", gap: 8, lineHeight: 1.4, marginTop: 12 }),
  progress: (step, total) => ({
    display: "flex", alignItems: "center", gap: 8, padding: "12px 20px 0",
  }),
  progressPill: { background: "#EDE9FE", color: COLORS.primary, fontWeight: 700, fontSize: 12, padding: "4px 10px", borderRadius: 999 },
  progressBar: { flex: 1, height: 6, background: "#E5E7EB", borderRadius: 999, overflow: "hidden" },
  progressFill: (pct) => ({ width: `${pct}%`, height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${COLORS.primary}, #F97316)`, transition: "width 0.4s" }),
  footer: { padding: "12px 20px 16px" },
};

// ── Sub-components ──
function WizardHeader({ title, onBack }) {
  return (
    <div style={S.header}>
      {onBack && <button onClick={onBack} style={S.backBtn}>‹</button>}
      <span style={S.title}>{title}</span>
    </div>
  );
}

function WizardProgress({ step, total }) {
  return (
    <div style={S.progress(step, total)}>
      <span style={S.progressPill}>Paso {step} de {total}</span>
      <div style={S.progressBar}><div style={S.progressFill((step / total) * 100)} /></div>
    </div>
  );
}

// ── PASO 1: Nombre + Fecha + Edad ──
function Step1({ data, setData, onNext, onBack }) {
  const estYear = calcEstimatedYear(data.birthday_month, data.estimated_age);
  const daysUntil = calcDaysUntil(data.birthday_day, data.birthday_month);

  return (
    <>
      <WizardHeader title="Organizar cumpleaños" onBack={onBack} />
      <WizardProgress step={1} total={3} />
      <div style={S.body}>
        <h2 style={S.h2}>¿A quién le festejamos? 🥳</h2>
        <p style={S.sub}>Cargá los datos de tu amigo/a — lo que no sepas lo completa después</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Nombre */}
          <div>
            <label style={S.label}>Nombre / Apodo</label>
            <input style={S.input} value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="Ej: Carla, Sofi, El Gordo..." />
          </div>

          {/* Fecha */}
          <div>
            <label style={S.label}>¿Cuándo cumple? <span style={S.optLabel}>(opcional)</span></label>
            <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
              <input style={S.dateInput} value={data.birthday_day} onChange={e => setData({...data, birthday_day: e.target.value})} placeholder="Día" type="number" inputMode="numeric" min="1" max="31" />
              <select style={{...S.select, color: data.birthday_month ? COLORS.primary : COLORS.textLight}} value={data.birthday_month} onChange={e => setData({...data, birthday_month: e.target.value})}>
                <option value="">Mes</option>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Edad */}
          <div>
            <label style={S.label}>¿Cuántos años cumple? <span style={S.optLabel}>(opcional)</span></label>
            <p style={{ fontSize: 12, color: COLORS.textLight, margin: "0 0 6px" }}>Si no lo sabés exacto, poné tu mejor estimación 🔮</p>
            <input style={S.inputBig} value={data.estimated_age} onChange={e => setData({...data, estimated_age: e.target.value})} placeholder="Ej: 40" type="number" inputMode="numeric" />
          </div>

          {estYear && (
            <div style={S.infoBox("#EDE9FE")}>
              <span style={{ fontSize: 16 }}>📅</span>
              <span style={{ fontWeight: 700, color: COLORS.primary, fontSize: 14 }}>Año estimado: {estYear}</span>
              <span style={{ fontSize: 11, color: COLORS.textLight, marginLeft: "auto" }}>{data.name || "Tu amigo/a"} lo valida</span>
            </div>
          )}
          {daysUntil && (
            <div style={S.infoBox("#FED7AA")}>
              <span style={{ fontSize: 16 }}>⏳</span>
              <span style={{ fontWeight: 700, color: "#F97316", fontSize: 14 }}>¡Faltan {daysUntil} días!</span>
            </div>
          )}
        </div>
      </div>
      <div style={S.footer}>
        <button style={S.cta(!data.name)} disabled={!data.name} onClick={onNext}>Siguiente →</button>
      </div>
    </>
  );
}

// ── PASO 2A: Sabe qué regalar ──
function Step2A({ data, setData, onNext, onBack, onHelp }) {
  return (
    <>
      <WizardHeader title="Organizar cumpleaños" onBack={onBack} />
      <WizardProgress step={2} total={3} />
      <div style={S.body}>
        <h2 style={S.h2}>¿Qué le querés regalar? 🎁</h2>
        <p style={S.sub}>{data.name || "Tu amigo/a"} va a poder aprobarlo o pedir que lo cambien</p>

        {/* Suggestion chips */}
        <label style={S.label}>¿Qué tipo de regalo?</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {GIFT_SUGGESTIONS.map(s => (
            <button key={s.label} onClick={() => setData({...data, gift_suggestion: s.label})} style={S.chip(data.gift_suggestion === s.label)}>
              <span>{s.icon}</span>{s.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={S.label}>Título del regalo</label>
            <input style={S.input} value={data.gift_title} onChange={e => setData({...data, gift_title: e.target.value})} placeholder="Ej: Auriculares Sony, Cena para 2..." />
          </div>
          <div>
            <label style={S.label}>Monto objetivo $</label>
            <input
              style={S.input}
              value={data.gift_amount_display || ""}
              onChange={e => {
                const raw = e.target.value.replace(/\./g, "").replace(/\D/g, "");
                const formatted = raw ? parseInt(raw, 10).toLocaleString("es-AR") : "";
                setData({...data, gift_amount: raw, gift_amount_display: formatted});
              }}
              placeholder="Ej: 150.000"
              inputMode="numeric"
            />
          </div>
          <div>
            <label style={S.label}>Link del producto <span style={S.optLabel}>(opcional)</span></label>
            <input style={S.input} value={data.gift_url} onChange={e => setData({...data, gift_url: e.target.value})} placeholder="mercadolibre.com/..." />
          </div>
        </div>

        <button onClick={onHelp} style={{
          marginTop: 20, padding: 14, width: "100%", border: "1.5px dashed #D1D5DB",
          borderRadius: 12, background: "transparent", cursor: "pointer",
          color: COLORS.primary, fontWeight: 600, fontSize: 14, fontFamily: "inherit",
        }}>🤔 No sé qué regalar — Necesito ayuda</button>
      </div>
      <div style={S.footer}>
        <button style={S.cta(!data.gift_title || !data.gift_amount)} disabled={!data.gift_title || !data.gift_amount} onClick={onNext}>Siguiente →</button>
      </div>
    </>
  );
}

// ── PASO 2B: No sabe, flujo guiado ──
function Step2B({ data, setData, onNext, onBack }) {
  const [people, setPeople] = useState("");
  const [amount, setAmount] = useState("");
  const [sel, setSel] = useState(null);
  const budget = people && amount ? parseInt(people) * parseInt(amount) : 0;

  const ideas = [...BUDGET_IDEAS, { icon: "📦", text: `Producto de ~$${budget ? budget.toLocaleString("es-AR") : "..."}` }];

  return (
    <>
      <WizardHeader title="Organizar cumpleaños" onBack={onBack} />
      <WizardProgress step={2} total={3} />
      <div style={S.body}>
        <h2 style={S.h2}>Te ayudamos a elegir 💡</h2>
        <p style={S.sub}>Estimemos un presupuesto entre todos</p>

        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>¿Cuántos regalan?</label>
            <input style={S.input} value={people} onChange={e => setPeople(e.target.value)} placeholder="Ej: 10" type="number" inputMode="numeric" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Aporte c/u $</label>
            <input style={S.input} value={amount} onChange={e => setAmount(e.target.value)} placeholder="Ej: 5000" type="number" inputMode="numeric" />
          </div>
        </div>

        {budget > 0 && (
          <>
            <div style={{ padding: 16, background: "#D1FAE5", borderRadius: 12, textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>Presupuesto estimado</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#10B981" }}>${budget.toLocaleString("es-AR")}</div>
            </div>
            <label style={S.label}>Ideas para ese presupuesto</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ideas.map((s, i) => (
                <div key={i} onClick={() => {
                  setSel(i);
                  setData({...data, gift_title: s.text, gift_amount: String(budget), gift_amount_display: budget.toLocaleString("es-AR"), gift_suggestion: s.text, estimated_budget: budget, estimated_contributors: parseInt(people), estimated_per_person: parseInt(amount)});
                }} style={{
                  padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                  border: `1.5px solid ${sel === i ? COLORS.primary : "#E5E7EB"}`,
                  background: sel === i ? "#EDE9FE" : "#fff",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: sel === i ? COLORS.primary : COLORS.text }}>{s.text}</span>
                  {sel === i && <span style={{ marginLeft: "auto", color: COLORS.primary, fontWeight: 700 }}>✓</span>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div style={S.footer}>
        <button style={S.cta(!data.gift_title)} disabled={!data.gift_title} onClick={onNext}>Siguiente →</button>
      </div>
    </>
  );
}

// ── PASO 3: Resumen + modo sorpresa/ver ──
function Step3({ data, setData, onSubmit, onBack, saving, profile }) {
  const [mode, setMode] = useState(null);
  const dateText = formatDateText(data.birthday_day, data.birthday_month);

  return (
    <>
      <WizardHeader title="Organizar cumpleaños" onBack={onBack} />
      <WizardProgress step={3} total={3} />
      <div style={S.body}>
        <h2 style={S.h2}>¡Último paso! 🚀</h2>

        {/* Cumpleañero */}
        <label style={S.label}>Cumpleañero/a</label>
        <div style={{ margin: "6px 0 16px", padding: 14, borderRadius: 12, background: "linear-gradient(135deg, #EDE9FE, #DDD6FE)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#F97316", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#fff", fontWeight: 700 }}>
            {data.name ? data.name[0].toUpperCase() : "?"}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.primary }}>{data.name || "..."}</div>
            {dateText && <div style={{ fontSize: 12, color: "#6B7280" }}>{dateText}</div>}
          </div>
        </div>

        {/* Regalo */}
        <label style={S.label}>Regalo</label>
        <div style={{ margin: "6px 0 16px", padding: 14, borderRadius: 12, border: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🎁</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{data.gift_title || "..."}</div>
            {data.gift_suggestion && <div style={{ fontSize: 12, color: COLORS.textLight }}>{data.gift_suggestion}</div>}
          </div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#F97316" }}>
            ${parseInt(data.gift_amount || 0).toLocaleString("es-AR")}
          </div>
        </div>

        {/* Organizador */}
        <label style={S.label}>Organizador</label>
        <div style={{ margin: "6px 0 20px", padding: 12, borderRadius: 12, border: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#F97316", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff", fontWeight: 700 }}>
            {profile?.name ? profile.name[0].toUpperCase() : "T"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{profile?.name || "Vos"}</div>
            <div style={{ fontSize: 12, color: "#F97316", fontWeight: 600 }}>Organizador principal</div>
          </div>
          <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: "#F97316", background: "#FED7AA" }}>Principal</span>
        </div>

        {/* Surprise mode */}
        <label style={S.label}>¿{data.name || "Tu amigo/a"} sabe del regalo?</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "8px 0" }}>
          <div onClick={() => setMode("surprise")} style={{
            padding: 14, borderRadius: 12, cursor: "pointer",
            border: `2px solid ${mode === "surprise" ? "#F97316" : "#E5E7EB"}`,
            background: mode === "surprise" ? "#FED7AA" : "#fff",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>🎁</span>
            <div><div style={{ fontWeight: 700, fontSize: 14 }}>Sorpresa</div><div style={{ fontSize: 12, color: COLORS.textLight }}>No sabe nada hasta el día</div></div>
            {mode === "surprise" && <span style={{ marginLeft: "auto", fontSize: 18, color: "#F97316" }}>✓</span>}
          </div>
          <div onClick={() => setMode("ask")} style={{
            padding: 14, borderRadius: 12, cursor: "pointer",
            border: `2px solid ${mode === "ask" ? "#10B981" : "#E5E7EB"}`,
            background: mode === "ask" ? "#D1FAE5" : "#fff",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>✅</span>
            <div><div style={{ fontWeight: 700, fontSize: 14 }}>Lo consulto primero</div><div style={{ fontSize: 12, color: COLORS.textLight }}>Le pregunto qué quiere</div></div>
            {mode === "ask" && <span style={{ marginLeft: "auto", fontSize: 18, color: "#10B981" }}>✓</span>}
          </div>
        </div>
      </div>
      <div style={S.footer}>
        <button style={S.cta(!mode || saving)} disabled={!mode || saving} onClick={() => {
          setData(prev => ({...prev, surprise_mode: mode === "surprise"}));
          onSubmit(mode === "surprise");
        }}>
          {saving ? "Creando..." : "Crear evento →"}
        </button>
      </div>
    </>
  );
}

// ── SHARE: Compartir por redes ──
function ShareStep({ data, eventData, session, onDone }) {
  const inviteUrl = `${window.location.origin}/invite/${eventData?.invitation_token || "xxx"}`;

  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareWhatsApp = () => {
    const text = `🎉 ¡Te están organizando un regalo de cumpleaños!\n\nEntrá acá para ver los detalles: ${inviteUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    logShare("whatsapp");
  };

  const shareGeneric = (channel) => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    logShare(channel);
  };

  const logShare = async (channel) => {
    if (!eventData?.id) return;
    try {
      // Marcar evento como invitation_sent
      await supabase
        .from("gift_events")
        .update({ status: "invitation_sent" })
        .eq("id", eventData.id);

      if (session) {
        await supabase.from("event_invitations").insert({
          gift_event_id: eventData.id,
          channel,
          sent_to: data.name || "",
          sent_by: session.user.id,
        });
      }
    } catch (e) {
      console.error("Error logging share:", e);
    }
  };

  return (
    <>
      <WizardHeader title="" />
      <div style={{ ...S.body, textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.text, margin: "0 0 6px" }}>¡Cumple creado! 🎂</h1>
        <p style={{ fontSize: 14, color: COLORS.textLight, margin: "0 0 24px" }}>
          Ahora compartile el link a <strong style={{ color: COLORS.primary }}>{data.name || "tu amigo/a"}</strong> para que
          {data.surprise_mode
            ? " sepa que le están organizando algo. ¡Sorpresa!"
            : " elija si quiere ver el regalo, pedir otro, y valide sus datos."}
        </p>

        {/* Share buttons */}
        <label style={{...S.label, textAlign: "left"}}>Compartir por</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {SHARE_CHANNELS.map(ch => (
            <button key={ch.id} onClick={() => ch.id === "whatsapp" ? shareWhatsApp() : shareGeneric(ch.id)} style={{
              padding: "16px 12px", borderRadius: 14, border: "none",
              background: ch.bg, cursor: "pointer", display: "flex",
              flexDirection: "column", alignItems: "center", gap: 8, fontFamily: "inherit",
            }}>
              <span style={{ fontSize: 28 }}>{ch.icon}</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: ch.color }}>{ch.label}</span>
            </button>
          ))}
        </div>

        {/* Copy link */}
        <div style={{ padding: "12px 14px", borderRadius: 12, border: "1.5px dashed #D1D5DB", display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ flex: 1, fontSize: 12, color: COLORS.textLight, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {inviteUrl}
          </span>
          <button onClick={copyLink} style={{
            padding: "8px 14px", borderRadius: 8, border: "none",
            background: copied ? "#10B981" : COLORS.primary, color: "#fff", fontWeight: 700,
            fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "background 0.2s",
          }}>{copied ? "✓ Copiado" : "Copiar"}</button>
        </div>

        {/* Tracker */}
        <div style={{ textAlign: "left", marginBottom: 16 }}>
          <label style={S.label}>¿Qué sigue?</label>
          <div style={{ margin: "10px 0", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { text: "Cumple creado ✓", done: true, color: "#10B981" },
              { text: `Compartir link con ${data.name || "el cumpleañero"}`, done: false, color: "#F59E0B" },
              { text: `${data.name || "El cumpleañero"} valida sus datos`, done: false, color: "#D1D5DB" },
              { text: "El regalo se activa 🚀", done: false, color: "#D1D5DB" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: s.done ? 600 : 400, color: s.done ? COLORS.text : COLORS.textLight }}>
                  {s.done && "✓ "}{s.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={S.tipBox("#FEF3C7")}>
          <span>💡</span>
          <span>Una vez que {data.name || "tu amigo/a"} confirme, vas a poder compartir el link de aportes con todos.</span>
        </div>
      </div>
      <div style={S.footer}>
        <button style={S.cta(false)} onClick={onDone}>Ver mis eventos</button>
      </div>
    </>
  );
}

// ── MY EVENTS: Lista de eventos del organizador ──
function MyEvents({ events, loading, onContinueDraft, onDeleteEvent }) {
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: COLORS.textLight }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎂</div>
        Cargando eventos...
      </div>
    );
  }

  const statusLabel = (s) => {
    if (s === "active" || s === "collecting") return { text: "✓ Aprobado", color: "#059669", bg: "#D1FAE5" };
    if (s === "validated") return { text: "✓ Aprobado", color: "#059669", bg: "#D1FAE5" };
    if (s === "gift_change_requested") return { text: "⚠ Pidió cambio", color: "#D97706", bg: "#FEF3C7" };
    if (s === "invitation_sent") return { text: "📨 Enviado — Pendiente", color: "#2563EB", bg: "#DBEAFE" };
    if (s === "pending_validation") return { text: "👀 Viendo regalo", color: "#7C3AED", bg: "#EDE9FE" };
    return { text: "Borrador", color: "#B45309", bg: "#FEF3C7" };
  };

  return (
    <div>
      {events.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ color: COLORS.textLight, fontSize: 15 }}>Todavía no organizaste ningún cumpleaños</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px" }}>
          {events.map(ev => {
            const isDraft = ev.status === "draft";
            const isSent = ev.status === "invitation_sent" || ev.status === "pending_validation";
            const isApproved = ev.status === "active" || ev.status === "collecting" || ev.status === "validated";
            const isChangeRequested = ev.status === "gift_change_requested";
            const isScheduled = isApproved || isChangeRequested;
            const sl = statusLabel(ev.status);
            return (
              <div key={ev.id} style={{ ...S.card(false), overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: isDraft ? "#E5E7EB" : "#F97316", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: isDraft ? "#9CA3AF" : "#fff", fontWeight: 700, flexShrink: 0 }}>
                    {ev.friend_name ? ev.friend_name[0].toUpperCase() : "?"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
                    <div style={{ fontSize: 12, color: COLORS.textLight }}>{ev.friend_name}</div>
                  </div>
                  <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: sl.color, background: sl.bg, flexShrink: 0 }}>{sl.text}</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, paddingTop: 10, borderTop: "1px solid #F3F4F6" }}>
                  {isDraft && (
                    <button onClick={() => onContinueDraft(ev)} style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "none", background: COLORS.primary, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                      ✏️ Continuar carga
                    </button>
                  )}
                  {isApproved && (
                    <div style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: "#F0FDF4", border: "1px solid #BBF7D0", fontSize: 12, color: "#059669", fontWeight: 600, textAlign: "center" }}>
                      🎂 {ev.friend_name} aprobó · Ver regalo →
                    </div>
                  )}
                  {isChangeRequested && (
                    <div style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: "#FFFBEB", border: "1px solid #FCD34D", fontSize: 12, color: "#D97706", fontWeight: 600, textAlign: "center" }}>
                      💬 {ev.friend_name} pidió cambiar el regalo
                    </div>
                  )}
                  {isSent && (
                    <div style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: "#EFF6FF", border: "1px solid #BFDBFE", fontSize: 12, color: "#2563EB", fontWeight: 600, textAlign: "center" }}>
                      📨 Link enviado — esperando que {ev.friend_name} confirme
                    </div>
                  )}
                  <button onClick={() => onDeleteEvent(ev)} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #FECACA", background: "#FEF2F2", color: "#EF4444", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── HOME: Pantalla principal con CTA ──
function HomeView({ onStart, eventCount, events, loadingEvents, onContinueDraft, onDeleteEvent }) {
  return (
    <>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, #8B5CF6 0%, #A78BFA 50%, ${COLORS.primary} 100%)`,
        padding: "32px 20px 48px", textAlign: "center",
      }}>
        <div style={{ color: "#FDE68A", fontSize: 14, letterSpacing: 12, marginBottom: 12 }}>★ ★ ★ ★ ★</div>
        <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
          Celebrá los cumpleaños<br /><span style={{ color: "#F97316" }}>de tus amigos</span>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, margin: "12px 0 28px" }}>
          Organizá el mejor regalo grupal<br />y sorprendelos entre todos.
        </p>

        {/* Big button */}
        <div onClick={onStart} style={{ cursor: "pointer", display: "inline-block" }}>
          <div style={{
            width: 140, height: 140, borderRadius: "50%", margin: "0 auto",
            background: "radial-gradient(circle, #F97316 40%, #EA580C 100%)",
            boxShadow: "0 0 0 16px rgba(249,115,22,0.2), 0 0 0 32px rgba(249,115,22,0.1), 0 8px 32px rgba(0,0,0,0.2)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 36, marginBottom: 4 }}>🎂</span>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>EMPEZAR</span>
          </div>
        </div>

        {/* Counter */}
        <div style={{
          margin: "24px auto 0", background: "rgba(255,255,255,0.15)",
          borderRadius: 12, padding: "12px 24px", display: "inline-flex",
          alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: "#F97316" }}>{eventCount}</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>cumpleaños organizados</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{eventCount === 0 ? "¡Organizá el primero!" : "Seguí sumando"}</div>
          </div>
        </div>
      </div>

      {/* Events list */}
      {eventCount > 0 && (
        <div style={{ padding: "20px 0" }}>
          <div style={{ padding: "0 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={S.label}>Mis eventos</label>
          </div>
          <MyEvents events={events} loading={loadingEvents} onContinueDraft={onContinueDraft} onDeleteEvent={onDeleteEvent} />
        </div>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
function OrganizeBirthdayPage({ session, profile, navigate }) {
  const [step, setStep] = useState("home");
  const [data, setData] = useState({
    name: "", birthday_day: "", birthday_month: "", estimated_age: "",
    gift_title: "", gift_amount: "", gift_amount_display: "", gift_url: "", gift_suggestion: "",
    surprise_mode: null, estimated_budget: null, estimated_contributors: null, estimated_per_person: null,
  });
  const [saving, setSaving] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [draftFriendId, setDraftFriendId] = useState(null);
  const [draftEventId, setDraftEventId] = useState(null);

  useEffect(() => {
    if (!session) return;
    loadEvents();
    // Refrescar cuando el usuario vuelve a la pestaña (ej: después de ver la landing)
    const onVisible = () => { if (document.visibilityState === "visible") loadEvents(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [session]);

  const loadEvents = async () => {
    try {
      const { data: orgData } = await supabase
        .from("event_organizers")
        .select("gift_event_id")
        .eq("profile_id", session.user.id);

      if (orgData && orgData.length > 0) {
        const eventIds = orgData.map(o => o.gift_event_id);
        const { data: eventsData } = await supabase
          .from("gift_events")
          .select("*, friend_preregisters(name, birthday_day, birthday_month)")
          .in("id", eventIds)
          .order("created_at", { ascending: false });

        setEvents((eventsData || []).map(e => ({
          ...e,
          friend_name: e.friend_preregisters?.name || "Sin nombre",
          birthday_day: e.friend_preregisters?.birthday_day,
          birthday_month: e.friend_preregisters?.birthday_month,
        })));
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error("Error loading events:", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Guardar borrador al terminar paso 1
  const handleStep1Next = async () => {
    if (!session || !data.name) { setStep("step2a"); return; }
    try {
      const userId = session.user.id;
      const estYear = calcEstimatedYear(data.birthday_month, data.estimated_age);
      const eventTitle = data.estimated_age
        ? `Los ${data.estimated_age} de ${data.name} 🎉`
        : `El cumple de ${data.name} 🎉`;

      if (draftFriendId && draftEventId) {
        await supabase.from("friend_preregisters").update({
          name: data.name,
          birthday_day: data.birthday_day ? parseInt(data.birthday_day) : null,
          birthday_month: data.birthday_month ? parseInt(data.birthday_month) : null,
          estimated_next_age: data.estimated_age ? parseInt(data.estimated_age) : null,
          estimated_birth_year: estYear,
        }).eq("id", draftFriendId);
        await supabase.from("gift_events").update({ title: eventTitle }).eq("id", draftEventId);
      } else {
        const { data: friendData, error: friendErr } = await supabase
          .from("friend_preregisters")
          .insert({
            created_by: userId, name: data.name,
            birthday_day: data.birthday_day ? parseInt(data.birthday_day) : null,
            birthday_month: data.birthday_month ? parseInt(data.birthday_month) : null,
            estimated_next_age: data.estimated_age ? parseInt(data.estimated_age) : null,
            estimated_birth_year: estYear, status: "pending",
          }).select().single();
        if (friendErr) throw friendErr;

        const { data: evData, error: evErr } = await supabase
          .from("gift_events")
          .insert({
            friend_preregister_id: friendData.id,
            title: eventTitle, status: "draft", surprise_mode: false,
          }).select().single();
        if (evErr) throw evErr;

        await supabase.from("event_organizers").insert({
          gift_event_id: evData.id, profile_id: userId, role: "primary", status: "active",
        });

        setDraftFriendId(friendData.id);
        setDraftEventId(evData.id);
        loadEvents();
      }
    } catch (err) {
      console.error("Error guardando borrador:", err);
    }
    setStep("step2a");
  };

  // Eliminar evento desde la agenda
  const handleDeleteEvent = async (ev) => {
    if (!window.confirm(`¿Eliminar el evento de ${ev.friend_name}?`)) return;
    try {
      await supabase.from("gift_events").delete().eq("id", ev.id);
      if (ev.friend_preregister_id) {
        await supabase.from("friend_preregisters").delete().eq("id", ev.friend_preregister_id);
      }
      setEvents(prev => prev.filter(e => e.id !== ev.id));
      if (ev.id === draftEventId) { setDraftFriendId(null); setDraftEventId(null); }
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    }
  };

  // Continuar un borrador desde la agenda — restaura todos los datos
  const handleContinueDraft = async (ev) => {
    setDraftFriendId(ev.friend_preregister_id);
    setDraftEventId(ev.id);

    // Restaurar datos del amigo
    const restored = {
      name: ev.friend_name,
      birthday_day: ev.birthday_day ? String(ev.birthday_day) : "",
      birthday_month: ev.birthday_month ? String(ev.birthday_month) : "",
      estimated_age: ev.birthday_month ? String(ev.estimated_next_age || "") : "",
      gift_title: "", gift_amount: "", gift_amount_display: "", gift_url: "", gift_suggestion: "",
      surprise_mode: null, estimated_budget: null, estimated_contributors: null, estimated_per_person: null,
    };

    // Buscar gift_option guardado previamente
    try {
      const { data: opts } = await supabase
        .from("gift_options")
        .select("*")
        .eq("gift_event_id", ev.id)
        .limit(1);
      if (opts && opts.length > 0) {
        const opt = opts[0];
        const rawAmount = opt.amount ? String(Math.round(opt.amount)) : "";
        restored.gift_title = opt.title || "";
        restored.gift_amount = rawAmount;
        restored.gift_amount_display = rawAmount ? parseInt(rawAmount).toLocaleString("es-AR") : "";
        restored.gift_url = opt.product_url || "";
        restored.gift_suggestion = opt.category || "";
      }
    } catch (e) {
      console.error("Error cargando gift_option del borrador:", e);
    }

    setData(restored);
    // Si ya tiene regalo cargado, ir al paso 3 directamente
    setStep(restored.gift_title ? "step3" : "step2a");
  };

  // Completar el evento (paso 3)
  const handleSubmit = async (isSurprise) => {
    if (!session) return;
    setSaving(true);
    try {
      const userId = session.user.id;
      const estYear = calcEstimatedYear(data.birthday_month, data.estimated_age);
      const eventTitle = data.estimated_age
        ? `Los ${data.estimated_age} de ${data.name} 🎉`
        : `El cumple de ${data.name} 🎉`;

      if (draftFriendId && draftEventId) {
        await supabase.from("friend_preregisters").update({
          name: data.name,
          birthday_day: data.birthday_day ? parseInt(data.birthday_day) : null,
          birthday_month: data.birthday_month ? parseInt(data.birthday_month) : null,
          estimated_next_age: data.estimated_age ? parseInt(data.estimated_age) : null,
          estimated_birth_year: estYear,
        }).eq("id", draftFriendId);

        const { data: evData, error: evErr } = await supabase
          .from("gift_events")
          .update({
            title: eventTitle,
            status: isSurprise ? "active" : "draft",
            surprise_mode: isSurprise,
            estimated_budget: data.estimated_budget || null,
            estimated_contributors: data.estimated_contributors || null,
            estimated_per_person: data.estimated_per_person || null,
            activated_at: isSurprise ? new Date().toISOString() : null,
          }).eq("id", draftEventId).select().single();
        if (evErr) throw evErr;

        const { error: optErr } = await supabase.from("gift_options").insert({
          gift_event_id: draftEventId, title: data.gift_title,
          amount: data.gift_amount ? parseFloat(data.gift_amount) : null,
          category: data.gift_suggestion || null, product_url: data.gift_url || null,
          gift_type: "contribution", proposed_by: userId,
        });
        if (optErr) throw optErr;
        setEventData(evData);
      } else {
        const { data: friendData, error: friendErr } = await supabase
          .from("friend_preregisters")
          .insert({
            created_by: userId, name: data.name,
            birthday_day: data.birthday_day ? parseInt(data.birthday_day) : null,
            birthday_month: data.birthday_month ? parseInt(data.birthday_month) : null,
            estimated_next_age: data.estimated_age ? parseInt(data.estimated_age) : null,
            estimated_birth_year: estYear, status: "pending",
          }).select().single();
        if (friendErr) throw friendErr;

        const { data: evData, error: evErr } = await supabase
          .from("gift_events")
          .insert({
            friend_preregister_id: friendData.id, title: eventTitle,
            status: isSurprise ? "active" : "draft", surprise_mode: isSurprise,
            estimated_budget: data.estimated_budget || null,
            estimated_contributors: data.estimated_contributors || null,
            estimated_per_person: data.estimated_per_person || null,
            activated_at: isSurprise ? new Date().toISOString() : null,
          }).select().single();
        if (evErr) throw evErr;

        const { error: optErr } = await supabase.from("gift_options").insert({
          gift_event_id: evData.id, title: data.gift_title,
          amount: data.gift_amount ? parseFloat(data.gift_amount) : null,
          category: data.gift_suggestion || null, product_url: data.gift_url || null,
          gift_type: "contribution", proposed_by: userId,
        });
        if (optErr) throw optErr;

        await supabase.from("event_organizers").insert({
          gift_event_id: evData.id, profile_id: userId, role: "primary", status: "active",
        });
        setEventData(evData);
      }

      setStep("share");
      await loadEvents();
    } catch (err) {
      console.error("Error creating event:", err);
      alert("Error al crear el evento: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const resetWizard = () => {
    setData({
      name: "", birthday_day: "", birthday_month: "", estimated_age: "",
      gift_title: "", gift_amount: "", gift_amount_display: "", gift_url: "", gift_suggestion: "",
      surprise_mode: null, estimated_budget: null, estimated_contributors: null, estimated_per_person: null,
    });
    setEventData(null);
    setDraftFriendId(null);
    setDraftEventId(null);
    setStep("home");
  };

  if (!session) return null;

  return (
    <div style={S.page}>
      {step === "home" && (
        <HomeView
          onStart={() => setStep("step1")}
          eventCount={events.length}
          events={events}
          loadingEvents={loadingEvents}
          onContinueDraft={handleContinueDraft}
          onDeleteEvent={handleDeleteEvent}
        />
      )}
      {step === "step1" && <Step1 data={data} setData={setData} onNext={handleStep1Next} onBack={() => setStep("home")} />}
      {step === "step2a" && <Step2A data={data} setData={setData} onNext={() => setStep("step3")} onBack={() => setStep("step1")} onHelp={() => setStep("step2b")} />}
      {step === "step2b" && <Step2B data={data} setData={setData} onNext={() => setStep("step3")} onBack={() => setStep("step2a")} />}
      {step === "step3" && <Step3 data={data} setData={setData} onSubmit={handleSubmit} onBack={() => setStep("step2a")} saving={saving} profile={profile} />}
      {step === "share" && <ShareStep data={data} eventData={eventData} session={session} onDone={resetWizard} />}
    </div>
  );
}

export default OrganizeBirthdayPage;

import { useState } from "react";
import { COLORS } from "../shared";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );
  return isMobile;
}

// ─── DATA MOCK (reemplazar con queries reales en siguiente iteración) ─────────
const MOCK_BDAYS = [
  { id: 1, name: "Martina López",  initials: "ML", group: "Universidad",  days: 0,  age: 28, status: "sin_regalo",  amount: null },
  { id: 2, name: "Vale Morales",   initials: "VM", group: "Salidas",      days: 0,  age: 26, status: "en_armado",   amount: null },
  { id: 3, name: "Juan Pérez",     initials: "JP", group: "Club",         days: 1,  age: 31, status: "en_armado",   amount: 18500 },
  { id: 4, name: "Lucas Gómez",    initials: "LG", group: "Viajes",       days: 5,  age: null, status: "sin_regalo", amount: null },
  { id: 5, name: "Sofía Ríos",     initials: "SR", group: "Infancia",     days: 6,  age: null, status: "sin_regalo", amount: null },
  { id: 6, name: "Pablo Vera",     initials: "PV", group: "Universidad",  days: 18, age: null, status: "sin_regalo", amount: null },
];

const MOCK_GROUPS = [
  { id: 1, icon: "🎒", name: "Universidad", count: 14, bdays: "2 cumples este mes" },
  { id: 2, icon: "⚽", name: "Club",         count: 8,  bdays: "1 esta semana" },
  { id: 3, icon: "✈️", name: "Viajes",       count: 6,  bdays: "1 esta semana" },
  { id: 4, icon: "🌱", name: "Infancia",     count: 5,  bdays: "Próximo en 6 días" },
  { id: 5, icon: "🎉", name: "Salidas",      count: 11, bdays: "Cumple hoy" },
];

const MOCK_SUGERIDOS = [
  { id: 1, initials: "CT", name: "Camila Torres",  reason: "Por Martina · 3 en común",    bday: "14 de agosto",    color: "#FCE7F3", textColor: "#9D174D" },
  { id: 2, initials: "NF", name: "Nico Fernández", reason: "Club de Juan · 2 en común",   bday: "3 de septiembre", color: "#DBEAFE", textColor: "#1E40AF" },
  { id: 3, initials: "PS", name: "Paula Sánchez",  reason: "Viajes con Lucas · 2 en común", bday: "20 de octubre",  color: "#FEF3C7", textColor: "#92400E" },
  { id: 4, initials: "FQ", name: "Fede Quiroga",   reason: "2 amigos en común",           bday: "8 de noviembre",  color: "#D1FAE5", textColor: "#065F46" },
];

const MOCK_ACTIVIDAD = [
  { id: 1, text: "Juan Pérez cumple mañana sin regalo organizado", time: "hace 2 horas", color: COLORS.accent },
  { id: 2, text: "Sofía se sumó al regalo grupal de Martina",      time: "hace 5 horas", color: COLORS.primary },
  { id: 3, text: "El regalo de Valen llegó a la meta 🎉",          time: "ayer",         color: COLORS.success },
  { id: 4, text: "Lucas te invitó como gestor del cumple de Fran", time: "ayer",         color: COLORS.primary },
];

const AVATAR_COLORS = [
  { bg: "#EDE9FE", text: "#5B21B6" },
  { bg: "#FEF3C7", text: "#92400E" },
  { bg: "#DBEAFE", text: "#1E40AF" },
  { bg: "#D1FAE5", text: "#065F46" },
  { bg: "#FCE7F3", text: "#9D174D" },
];

function avatarStyle(idx) {
  const c = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  return { background: c.bg, color: c.text };
}

function dayLabel(days) {
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  if (days <= 7)  return "Esta semana";
  return "Este mes";
}

function statusDot(status) {
  if (status === "en_armado") return COLORS.accent;
  if (status === "activo")    return COLORS.success;
  return "#D1D5DB";
}

function statusText(status, amount) {
  if (status === "en_armado" && amount)
    return `En armado · $${amount.toLocaleString("es-AR")} recaudados`;
  if (status === "en_armado") return "Regalo en armado";
  if (status === "activo")    return "Recibiendo aportes";
  return "Sin regalo iniciado";
}

function ctaLabel(status) {
  if (status === "en_armado" || status === "activo") return "Ver regalo →";
  return "Organizar →";
}

// ─── COMPONENTES BASE ─────────────────────────────────────────────────────────
function Avatar({ initials, idx, size = 42 }) {
  const s = avatarStyle(idx);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: s.background, color: s.color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.33, fontWeight: 700, flexShrink: 0,
    }}>{initials}</div>
  );
}

function Badge({ children, type }) {
  const styles = {
    today:    { background: "#FEF3C7", color: "#92400E" },
    tomorrow: { background: "#EDE9FE", color: "#5B21B6" },
    days:     { background: "#F3F4F6", color: COLORS.textLight },
  };
  const s = styles[type] || styles.days;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 9px",
      borderRadius: 999, display: "inline-block", ...s,
    }}>{children}</span>
  );
}

function badgeType(days) {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return "days";
}

function badgeText(days) {
  if (days === 0) return "¡Hoy!";
  if (days === 1) return "Mañana";
  if (days <= 7)  return `En ${days} días`;
  return `En ${days} días`;
}

function accentColor(days) {
  if (days === 0) return COLORS.accent;
  if (days === 1) return COLORS.primary;
  return COLORS.border;
}

// ─── BIRTHDAY CARD ────────────────────────────────────────────────────────────
function BdayCard({ item, idx }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "#fff", borderRadius: 14,
        border: `1px solid ${COLORS.border}`,
        borderLeft: `3px solid ${accentColor(item.days)}`,
        padding: "13px 15px",
        display: "flex", alignItems: "center", gap: 11,
        cursor: "pointer",
        boxShadow: hov ? "0 4px 16px rgba(0,0,0,0.07)" : "none",
        transform: hov ? "translateY(-1px)" : "none",
        transition: "box-shadow 0.15s, transform 0.15s",
      }}
    >
      <Avatar initials={item.initials} idx={idx} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.name}
        </div>
        <div style={{ fontSize: 11.5, color: COLORS.textLight, marginTop: 2 }}>
          {item.group}{item.age ? ` · ${item.age} años` : ""}
        </div>
        <div style={{ fontSize: 11, color: COLORS.textLight, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusDot(item.status), flexShrink: 0 }} />
          {statusText(item.status, item.amount)}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ marginBottom: 5 }}>
          <Badge type={badgeType(item.days)}>{badgeText(item.days)}</Badge>
        </div>
        <div style={{ fontSize: 12, color: COLORS.primary, fontWeight: 700, cursor: "pointer" }}>
          {ctaLabel(item.status)}
        </div>
      </div>
    </div>
  );
}

// ─── PANEL ACOPLABLE ──────────────────────────────────────────────────────────
function Panel({ id, icon, title, badge, badgeColor, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${COLORS.border}`,
      borderRadius: 14,
      overflow: "hidden",
      marginBottom: 12,
    }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px",
          cursor: "pointer",
          borderBottom: open ? `1px solid ${COLORS.border}` : "none",
          userSelect: "none",
        }}
        onMouseEnter={e => e.currentTarget.style.background = COLORS.bg}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 15 }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{title}</span>
          {badge != null && (
            <span style={{
              background: badgeColor || COLORS.primary,
              color: "#fff", fontSize: 10, fontWeight: 700,
              borderRadius: 999, padding: "1px 7px", minWidth: 18, textAlign: "center",
            }}>{badge}</span>
          )}
        </div>
        <span style={{
          fontSize: 11, color: COLORS.textLight, fontWeight: 700,
          transform: open ? "rotate(0deg)" : "rotate(-90deg)",
          transition: "transform 0.2s",
          display: "inline-block",
        }}>▾</span>
      </div>
      {open && <div>{children}</div>}
    </div>
  );
}

// ─── SIDEBAR IZQUIERDA ────────────────────────────────────────────────────────
function LeftSidebar({ navigate, page }) {
  const items = [
    { icon: "🏠", label: "Inicio",      key: "home" },
    { icon: "👥", label: "Mis amigos",  key: "friends" },
    { icon: "🎂", label: "Cumpleaños",  key: "bdays",   badge: 3 },
    { icon: "🗂️", label: "Grupos",      key: "groups" },
    { icon: "🔔", label: "Actividad",   key: "notif",   badge: 2 },
  ];

  return (
    <div style={{
      width: 200, flexShrink: 0,
      background: "#fff",
      border: `1px solid ${COLORS.border}`,
      borderRadius: 14,
      padding: "12px 8px",
      position: "sticky", top: 80,
      alignSelf: "flex-start",
    }}>
      {items.map(item => {
        const active = page ? item.key === page : item.key === "home";
        return (
          <div
            key={item.key}
            onClick={() => navigate(item.key)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 10px", borderRadius: 10,
              cursor: "pointer", marginBottom: 2,
              background: active ? "#EDE9FE" : "transparent",
              color: active ? COLORS.primary : COLORS.textLight,
              fontWeight: active ? 700 : 500,
              fontSize: 13.5,
              transition: "background 0.12s",
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = COLORS.bg; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (
              <span style={{
                background: active ? COLORS.primary : COLORS.accent,
                color: "#fff", fontSize: 10, fontWeight: 700,
                borderRadius: 999, padding: "1px 6px",
              }}>{item.badge}</span>
            )}
          </div>
        );
      })}

      {/* Separador + CTA agregar amigos */}
      <div style={{ height: 1, background: COLORS.border, margin: "10px 4px" }} />
      <div
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "9px 10px", borderRadius: 10, cursor: "pointer",
          color: COLORS.primary, fontWeight: 700, fontSize: 13,
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#EDE9FE"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>➕</span>
        Agregar amigos
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function LoggedHomePage({ profile, navigate, page }) {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState("todos");

  const firstName = (profile?.name || "").split(" ")[0] || "vos";

  // Agrupar cumpleaños por sección
  const sections = [
    { key: "hoy",     label: "Hoy",          items: MOCK_BDAYS.filter(b => b.days === 0) },
    { key: "manana",  label: "Mañana",        items: MOCK_BDAYS.filter(b => b.days === 1) },
    { key: "semana",  label: "Esta semana",   items: MOCK_BDAYS.filter(b => b.days > 1 && b.days <= 7) },
    { key: "mes",     label: "Este mes",      items: MOCK_BDAYS.filter(b => b.days > 7) },
  ].filter(s => s.items.length > 0);

  const filteredSections = filter === "todos" ? sections :
    filter === "hoy"    ? sections.filter(s => s.key === "hoy") :
    filter === "semana" ? sections.filter(s => s.key === "hoy" || s.key === "manana" || s.key === "semana") :
    filter === "mes"    ? sections :
    sections;

  // ─── MOBILE ───────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ background: COLORS.bg, paddingBottom: 80 }}>

        {/* Greeting */}
        <div style={{ padding: "20px 16px 0" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text, letterSpacing: -0.4 }}>
            Hola, {firstName} 👋
          </div>
          <div style={{ fontSize: 13, color: COLORS.textLight, marginTop: 3 }}>
            Tenés 3 cumpleaños esta semana
          </div>
        </div>

        {/* CTA Banner */}
        <div style={{ margin: "14px 16px 0", background: COLORS.primary, borderRadius: 16, padding: "16px 18px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 3 }}>
            Hacé crecer tu red
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 12 }}>
            Invitá amigos para no perderte ningún cumple
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
            {["Contactos", "WhatsApp", "Instagram"].map(p => (
              <span key={p} style={{
                background: "rgba(255,255,255,0.18)", borderRadius: 999,
                padding: "4px 11px", fontSize: 12, color: "#fff",
              }}>{p}</span>
            ))}
          </div>
          <button onClick={() => navigate("friends")} style={{
            background: "#fff", color: COLORS.primary,
            border: "none", borderRadius: 10, padding: "9px 16px",
            fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%",
          }}>+ Agregar / Invitar amigos</button>
        </div>

        {/* Próximos cumpleaños */}
        <div style={{ padding: "20px 16px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Próximos cumpleaños</div>
            <div style={{ fontSize: 12.5, color: COLORS.primary, fontWeight: 700 }}>Ver todos →</div>
          </div>

          {/* Filters scroll horizontal */}
          <div style={{ display: "flex", gap: 7, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
            {[
              { key: "todos", label: "Todos" },
              { key: "hoy",   label: "Hoy" },
              { key: "semana",label: "Esta semana" },
              { key: "mes",   label: "Este mes" },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  flexShrink: 0, fontSize: 12.5, padding: "5px 14px",
                  borderRadius: 999, border: `1px solid ${filter === f.key ? COLORS.primary : COLORS.border}`,
                  background: filter === f.key ? COLORS.primary : "#fff",
                  color: filter === f.key ? "#fff" : COLORS.textLight,
                  fontWeight: 600, cursor: "pointer",
                }}
              >{f.label}</button>
            ))}
          </div>

          {filteredSections.map(section => (
            <div key={section.key}>
              <div style={{
                fontSize: 10.5, fontWeight: 700, color: COLORS.textLight,
                letterSpacing: "0.07em", textTransform: "uppercase",
                marginBottom: 8, marginTop: 14,
              }}>{section.label}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {section.items.map((item, i) => (
                  <BdayCard key={item.id} item={item} idx={i} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Grupos */}
        <div style={{ padding: "20px 16px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Tus grupos</div>
            <div style={{ fontSize: 12.5, color: COLORS.primary, fontWeight: 700 }}>Gestionar →</div>
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
            {MOCK_GROUPS.map(g => (
              <div key={g.id} style={{
                background: "#fff", borderRadius: 14,
                border: `1px solid ${COLORS.border}`,
                padding: "12px 14px", minWidth: 110, flexShrink: 0, cursor: "pointer",
              }}>
                <div style={{ fontSize: 20, marginBottom: 5 }}>{g.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{g.name}</div>
                <div style={{ fontSize: 11, color: COLORS.textLight, marginTop: 2 }}>{g.count} amigos</div>
                <div style={{ fontSize: 11, color: COLORS.primary, marginTop: 4, fontWeight: 600 }}>{g.bdays}</div>
              </div>
            ))}
            <div style={{
              background: "transparent", borderRadius: 14,
              border: `1.5px dashed ${COLORS.border}`,
              padding: "12px 14px", minWidth: 90, flexShrink: 0,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 4, cursor: "pointer",
            }}>
              <div style={{ fontSize: 20, color: COLORS.textLight }}>+</div>
              <div style={{ fontSize: 11, color: COLORS.textLight, fontWeight: 700 }}>Nuevo</div>
            </div>
          </div>
        </div>

        {/* Sugeridos mobile */}
        <div style={{ padding: "20px 16px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Quizás los conocés</div>
            <div style={{ fontSize: 12.5, color: COLORS.primary, fontWeight: 700 }}>Ver más →</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, background: "#fff", borderRadius: 14, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
            {MOCK_SUGERIDOS.map((s, i) => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 14px",
                borderBottom: i < MOCK_SUGERIDOS.length - 1 ? `1px solid ${COLORS.border}` : "none",
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: s.color, color: s.textColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, flexShrink: 0,
                }}>{s.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.textLight, marginTop: 1 }}>{s.reason}</div>
                  <div style={{ fontSize: 11, color: COLORS.primary, marginTop: 1, fontWeight: 600 }}>🎂 {s.bday}</div>
                </div>
                <button style={{
                  fontSize: 11.5, fontWeight: 700,
                  color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`,
                  borderRadius: 999, padding: "4px 10px",
                  background: "transparent", cursor: "pointer", flexShrink: 0,
                }}>+ Agregar</button>
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  }

  // ─── DESKTOP ──────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 20px" }}>

      {/* Greeting */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: COLORS.text, margin: 0 }}>
          Hola, {firstName} 👋
        </h1>
        <p style={{ fontSize: 13, color: COLORS.textLight, marginTop: 3, marginBottom: 0 }}>
          Tenés 3 cumpleaños esta semana
        </p>
      </div>

      {/* 3 columnas */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

        {/* ── COLUMNA IZQUIERDA ── */}
        <LeftSidebar navigate={navigate} page={page} />

        {/* ── MAIN ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* CTA Banner */}
          <div style={{
            background: COLORS.primary, borderRadius: 18,
            padding: "18px 22px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
            marginBottom: 24,
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 3 }}>
                Hacé crecer tu red de amigos
              </div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.75)", marginBottom: 10 }}>
                Importá contactos o invitá para no perderte ningún cumpleaños
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {["Contactos", "WhatsApp", "Instagram", "Invitar por link"].map(p => (
                  <span key={p} style={{
                    background: "rgba(255,255,255,0.18)", borderRadius: 999,
                    padding: "4px 11px", fontSize: 12, color: "#fff",
                    display: "flex", alignItems: "center", gap: 5,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.6)", display: "inline-block" }} />
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <button style={{
              background: "#fff", color: COLORS.primary,
              fontSize: 13, fontWeight: 700, border: "none",
              borderRadius: 10, padding: "10px 18px",
              cursor: "pointer", whiteSpace: "nowrap",
            }} onClick={() => navigate("friends")}>+ Agregar / Invitar amigos</button>
          </div>

          {/* Sección próximos cumpleaños */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>Próximos cumpleaños</div>
            <div style={{ fontSize: 12.5, color: COLORS.primary, fontWeight: 700, cursor: "pointer" }}>Ver todos →</div>
          </div>

          {/* Filtros */}
          <div style={{ display: "flex", gap: 7, marginBottom: 16 }}>
            {[
              { key: "todos", label: "Todos" },
              { key: "hoy",   label: "Hoy" },
              { key: "semana",label: "Esta semana" },
              { key: "mes",   label: "Este mes" },
              { key: "grupo", label: "Por grupo ▾" },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  fontSize: 12.5, padding: "5px 14px",
                  borderRadius: 999,
                  border: `1px solid ${filter === f.key ? COLORS.primary : COLORS.border}`,
                  background: filter === f.key ? COLORS.primary : "#fff",
                  color: filter === f.key ? "#fff" : COLORS.textLight,
                  fontWeight: 600, cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >{f.label}</button>
            ))}
          </div>

          {/* Grid de cumpleaños */}
          <div style={{ marginBottom: 28 }}>
            {filteredSections.map(section => (
              <div key={section.key}>
                <div style={{
                  fontSize: 10.5, fontWeight: 700, color: COLORS.textLight,
                  letterSpacing: "0.07em", textTransform: "uppercase",
                  margin: "14px 0 8px",
                }}>{section.label}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {section.items.map((item, i) => (
                    <BdayCard key={item.id} item={item} idx={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Grupos */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>Tus grupos</div>
            <div style={{ fontSize: 12.5, color: COLORS.primary, fontWeight: 700, cursor: "pointer" }}>Gestionar →</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {MOCK_GROUPS.map(g => (
              <div key={g.id} style={{
                background: "#fff", borderRadius: 14,
                border: `1px solid ${COLORS.border}`,
                padding: "13px 11px", cursor: "pointer",
                transition: "box-shadow 0.15s, transform 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 3px 12px rgba(0,0,0,0.07)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ fontSize: 20, marginBottom: 5 }}>{g.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{g.name}</div>
                <div style={{ fontSize: 11, color: COLORS.textLight, marginTop: 2 }}>{g.count} amigos</div>
                <div style={{ fontSize: 11, color: COLORS.primary, marginTop: 4, fontWeight: 600 }}>{g.bdays}</div>
              </div>
            ))}
            <div style={{
              borderRadius: 14, border: `1.5px dashed ${COLORS.border}`,
              background: "transparent", padding: "13px 11px",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 4, cursor: "pointer",
            }}>
              <div style={{ fontSize: 22, color: COLORS.textLight }}>+</div>
              <div style={{ fontSize: 11.5, color: COLORS.textLight, fontWeight: 700 }}>Nuevo grupo</div>
            </div>
          </div>

        </div>{/* /main */}

        {/* ── PANELES DERECHOS ── */}
        <div style={{ width: 280, flexShrink: 0 }}>

          <Panel icon="⚡" title="Alertas" badge={1} badgeColor={COLORS.accent} defaultOpen={true}>
            <div style={{
              margin: "8px 14px 10px",
              background: "#FFFBEB", border: "1px solid #FDE68A",
              borderRadius: 10, padding: "9px 12px",
              display: "flex", gap: 8, alignItems: "flex-start",
              fontSize: 12, color: "#92400E", lineHeight: 1.45,
            }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
              <span><strong>Juan cumple mañana</strong> y todavía no tiene regalo organizado. ¿Lo organizás vos?</span>
            </div>
          </Panel>

          <Panel icon="✨" title="Quizás los conocés" badge={4} defaultOpen={true}>
            {MOCK_SUGERIDOS.map((s, i) => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 16px",
                borderBottom: i < MOCK_SUGERIDOS.length - 1 ? `1px solid ${COLORS.border}` : "none",
                transition: "background 0.12s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.bg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: s.color, color: s.textColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, flexShrink: 0,
                }}>{s.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.textLight, marginTop: 1, lineHeight: 1.4 }}>{s.reason}</div>
                  <div style={{ fontSize: 11, color: COLORS.primary, marginTop: 1, fontWeight: 600 }}>🎂 {s.bday}</div>
                </div>
                <button style={{
                  fontSize: 11.5, fontWeight: 700,
                  color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`,
                  borderRadius: 999, padding: "4px 10px",
                  background: "transparent", cursor: "pointer", flexShrink: 0,
                  transition: "all 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = COLORS.primary; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = COLORS.primary; }}
                >+ Agregar</button>
              </div>
            ))}
          </Panel>

          <Panel icon="🕐" title="Actividad reciente" defaultOpen={true}>
            {MOCK_ACTIVIDAD.map((a, i) => (
              <div key={a.id} style={{ display: "flex", gap: 10, padding: "8px 16px" }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.bg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, marginTop: 4, flexShrink: 0 }} />
                  {i < MOCK_ACTIVIDAD.length - 1 && <div style={{ width: 1, flex: 1, background: COLORS.border, marginTop: 5 }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: 6 }}>
                  <div style={{ fontSize: 12.5, color: COLORS.textLight, lineHeight: 1.5 }}
                    dangerouslySetInnerHTML={{ __html: a.text.replace(/<strong>/g, `<strong style="color:${COLORS.text};font-weight:700">`) }}
                  />
                  <div style={{ fontSize: 11, color: COLORS.textLight, opacity: 0.7, marginTop: 1 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </Panel>

        </div>{/* /paneles derechos */}

      </div>{/* /3 columnas */}
    </div>
  );
}

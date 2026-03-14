import { useState } from "react";

const COLORS = {
  primary: "#7C3AED", primaryDark: "#5B21B6", accent: "#F59E0B",
  bg: "#F5F5F7", card: "#FFFFFF", text: "#1F2937", textLight: "#6B7280",
  border: "#E5E7EB", success: "#10B981", error: "#EF4444",
};

const INITIAL_MANAGED = [
  {
    id: 1, initials: "LR", name: "Laura Rodríguez", date: "25 jul · en 18 días",
    gift: "Auriculares Sony WH-1000", raised: 31000, goal: 50000,
    gradient: ["#F59E0B","#D97706"],
    checklist: [
      { id: 1, label: "WhatsApp amigos", done: true, tags: ["Mari ✓", "Caro ✓", "Fer ✓"] },
      { id: 2, label: "Instagram stories", done: true, tags: ["Enviado ✓"] },
      { id: 3, label: "TikTok", done: false, tags: [] },
      { id: 4, label: "Familia por chat", done: false, tags: [] },
    ],
  },
  {
    id: 2, initials: "JP", name: "Juan Pérez", date: "3 ago · en 27 días",
    gift: "Experiencia gastronómica", raised: 8000, goal: 40000,
    gradient: ["#10B981","#059669"],
    checklist: [
      { id: 1, label: "WhatsApp amigos del trabajo", done: false, tags: [] },
      { id: 2, label: "Instagram", done: false, tags: [] },
      { id: 3, label: "TikTok", done: false, tags: [] },
    ],
  },
];

function ProgressBar({ pct, gradient }) {
  return (
    <div style={{ height: 6, background: "#F3F4F6", borderRadius: 3, margin: "0 14px 6px" }}>
      <div style={{ height: "100%", width: pct + "%", borderRadius: 3, background: `linear-gradient(90deg,${gradient[0]},${gradient[1]})` }} />
    </div>
  );
}

function GiftCard({ gift, onToggle }) {
  const pct = Math.round((gift.raised / gift.goal) * 100);
  const badgeColor = pct >= 60 ? { bg: "#FEF3C7", color: "#D97706" } : { bg: "#FEE2E2", color: COLORS.error };

  return (
    <div style={{ background: "#fff", margin: "0 12px 12px", borderRadius: 14, border: "1px solid " + COLORS.border, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px 6px" }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg,${gift.gradient[0]},${gift.gradient[1]})`, color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{gift.initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.text }}>{gift.name}</div>
          <div style={{ fontSize: 11, color: COLORS.textLight }}>🎂 {gift.date}</div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: badgeColor.bg, color: badgeColor.color }}>{pct}%</span>
      </div>
      <div style={{ padding: "0 14px 4px", fontSize: 11, color: COLORS.textLight }}>🎯 {gift.gift}</div>
      <ProgressBar pct={pct} gradient={gift.gradient} />
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 14px 8px", fontSize: 11, color: COLORS.textLight }}>
        <span>${gift.raised.toLocaleString("es-AR")}</span>
        <span><b style={{ color: COLORS.text }}>${gift.goal.toLocaleString("es-AR")}</b> meta</span>
      </div>

      {/* Checklist */}
      <div style={{ padding: "8px 14px 12px", borderTop: "1px solid #F3F4F6" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 6 }}>Progreso de difusión</div>
        {gift.checklist.map(item => (
          <div key={item.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "3px 0" }}>
              <button onClick={() => onToggle(gift.id, item.id)} style={{
                width: 16, height: 16, borderRadius: 4,
                border: item.done ? "none" : "1.5px solid #D1D5DB",
                background: item.done ? COLORS.success : "transparent",
                color: "#fff", fontSize: 10, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
              }}>{item.done ? "✓" : ""}</button>
              <span style={{ fontSize: 11, color: item.done ? "#9CA3AF" : COLORS.text, textDecoration: item.done ? "line-through" : "none" }}>{item.label}</span>
            </div>
            {item.tags.length > 0 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginLeft: 23, marginBottom: 2 }}>
                {item.tags.map((t, i) => (
                  <span key={i} style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: item.done ? "#D1FAE5" : "#F3F4F6", color: item.done ? "#065F46" : "#6B7280" }}>{t}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ManageGiftsPage({ onBack }) {
  const [managed, setManaged] = useState(INITIAL_MANAGED);

  const handleToggle = (giftId, itemId) => {
    setManaged(prev => prev.map(g =>
      g.id === giftId ? { ...g, checklist: g.checklist.map(c => c.id === itemId ? { ...c, done: !c.done } : c) } : g
    ));
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", paddingBottom: 80 }}>
      <div style={{ background: "#fff", borderBottom: "1px solid " + COLORS.border, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 20, color: COLORS.primary, fontWeight: 800, cursor: "pointer", padding: "2px 8px 2px 0" }}>‹</button>
        <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.text, flex: 1 }}>Gestionar regalos</span>
        <button style={{ background: COLORS.primary, color: "#fff", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Nuevo</button>
      </div>

      <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", padding: "12px 16px 6px" }}>
        Activos · {managed.length}
      </div>

      {managed.map(g => <GiftCard key={g.id} gift={g} onToggle={handleToggle} />)}
    </div>
  );
}

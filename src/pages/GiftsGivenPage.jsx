const COLORS = {
  primary: "#7C3AED", primaryDark: "#5B21B6", accent: "#F59E0B",
  bg: "#F5F5F7", card: "#FFFFFF", text: "#1F2937", textLight: "#6B7280",
  border: "#E5E7EB", success: "#10B981",
};

const ACTIVE_GIFTS = [
  { id: 1, initials: "SO", name: "Sofía Ortega", date: "15 jul · en 8 días", gift: "Nintendo Switch", amount: 5000, raised: 39000, goal: 50000, gradient: ["#7C3AED","#5B21B6"] },
  { id: 2, initials: "MV", name: "Matías Vargas", date: "22 ago · en 46 días", gift: "Zapatillas Nike", amount: 3500, raised: 24500, goal: 70000, gradient: ["#F59E0B","#D97706"] },
];

const HISTORY = [
  { id: 3, initials: "AL", name: "Ana López", date: "Julio 2024", amount: 4000 },
  { id: 4, initials: "CM", name: "Carlos Méndez", date: "Mayo 2024", amount: 6000 },
  { id: 5, initials: "RS", name: "Romina Sosa", date: "Marzo 2024", amount: 3000 },
];

function ProgressBar({ pct, gradient }) {
  return (
    <div style={{ height: 6, background: "#F3F4F6", borderRadius: 3, margin: "0 14px 8px" }}>
      <div style={{ height: "100%", width: pct + "%", borderRadius: 3, background: `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})` }} />
    </div>
  );
}

function StatusBadge({ pct }) {
  if (pct >= 80) return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#D1FAE5", color: "#065F46" }}>¡Casi!</span>;
  if (pct >= 50) return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#FEF3C7", color: "#D97706" }}>{pct}%</span>;
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#F3F4F6", color: "#6B7280" }}>{pct}%</span>;
}

export default function GiftsGivenPage({ onBack }) {
  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", paddingBottom: 80 }}>
      <div style={{ background: "#fff", borderBottom: "1px solid " + COLORS.border, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 20, color: COLORS.primary, fontWeight: 800, cursor: "pointer", padding: "2px 8px 2px 0" }}>‹</button>
        <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>Regalos que hice</span>
      </div>

      {/* Active */}
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", padding: "12px 16px 6px" }}>
        Activos · {ACTIVE_GIFTS.length}
      </div>
      {ACTIVE_GIFTS.map(g => {
        const pct = Math.round((g.raised / g.goal) * 100);
        return (
          <div key={g.id} style={{ background: "#fff", margin: "0 12px 10px", borderRadius: 14, border: "1px solid " + COLORS.border, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px 6px" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${g.gradient[0]}, ${g.gradient[1]})`, color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{g.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.text }}>{g.name}</div>
                <div style={{ fontSize: 11, color: COLORS.textLight }}>🎂 {g.date}</div>
              </div>
              <StatusBadge pct={pct} />
            </div>
            <div style={{ padding: "0 14px 5px", fontSize: 11, color: COLORS.textLight }}>💸 Aporté ${g.amount.toLocaleString("es-AR")} · {g.gift}</div>
            <ProgressBar pct={pct} gradient={g.gradient} />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0 14px 12px", fontSize: 11, color: COLORS.textLight }}>
              <span>${g.raised.toLocaleString("es-AR")} de ${g.goal.toLocaleString("es-AR")}</span>
              <span style={{ fontWeight: 700, color: pct >= 80 ? COLORS.success : COLORS.textLight }}>{pct}% completado</span>
            </div>
          </div>
        );
      })}

      {/* History */}
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", padding: "12px 16px 6px" }}>
        Historial · {HISTORY.length}
      </div>
      <div style={{ background: "#fff", margin: "0 12px", borderRadius: 14, border: "1px solid " + COLORS.border, overflow: "hidden" }}>
        {HISTORY.map((h, i) => (
          <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: i < HISTORY.length - 1 ? "1px solid #F3F4F6" : "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#F0FDF9", color: COLORS.success, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✓</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{h.name}</div>
              <div style={{ fontSize: 11, color: COLORS.textLight }}>{h.date} · ${h.amount.toLocaleString("es-AR")} aportados</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

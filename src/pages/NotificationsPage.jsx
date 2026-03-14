import { useState } from "react";

const COLORS = {
  primary: "#7C3AED", text: "#1F2937", textLight: "#6B7280",
  border: "#E5E7EB", bg: "#F5F5F7",
};

const INITIAL_NOTIFS = [
  { id: 1, dot: "#7C3AED", text: "Laura sumó $5.000 a tu regalo 🎉", time: "Hace 2 hs", read: false, bg: "#F5F0FF", day: "Hoy" },
  { id: 2, dot: "#10B981", text: "Caro empezó a gestionar tu regalo 🛍️", time: "Hace 4 hs", read: false, bg: "#F5F0FF", day: "Hoy" },
  { id: 3, dot: "#F59E0B", text: "Tu cumple es en 12 días · ¿Tu regalo está listo? 🎂", time: "Hace 6 hs", read: false, bg: "#FFFBEB", day: "Hoy" },
  { id: 4, dot: "#7C3AED", text: "Fer López sumó $3.000 a tu regalo", time: "18:30", read: true, bg: "#fff", day: "Ayer" },
  { id: 5, dot: "#EF4444", text: "El regalo de Juan que gestionás necesita más difusión 📣", time: "10:00", read: true, bg: "#fff", day: "Ayer" },
  { id: 6, dot: "#10B981", text: "Sofía alcanzó el 75% de su meta 🎉", time: "08:15", read: true, bg: "#fff", day: "Ayer" },
  { id: 7, dot: "#7C3AED", text: "Matías dejó un comentario en tu lista de deseos", time: "07:00", read: true, bg: "#fff", day: "Ayer" },
];

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(INITIAL_NOTIFS);

  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true, bg: "#fff" })));
  const unread = notifs.filter(n => !n.read).length;

  const days = [...new Set(notifs.map(n => n.day))];

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", paddingBottom: 80 }}>
      <div style={{ background: "#fff", borderBottom: "1px solid " + COLORS.border, padding: "12px 16px", display: "flex", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.text, flex: 1 }}>
          Notificaciones {unread > 0 && <span style={{ fontSize: 12, background: COLORS.primary, color: "#fff", borderRadius: 20, padding: "1px 8px", marginLeft: 6 }}>{unread}</span>}
        </span>
        {unread > 0 && (
          <button onClick={markAllRead} style={{ fontSize: 12, color: COLORS.primary, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Leer todo</button>
        )}
      </div>

      {days.map(day => (
        <div key={day}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", padding: "12px 16px 4px" }}>{day}</div>
          {notifs.filter(n => n.day === day).map(n => (
            <div key={n.id} onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true, bg: "#fff" } : x))}
              style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", background: n.bg, borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: n.read ? "transparent" : n.dot, border: n.read ? "2px solid " + COLORS.border : "none", flexShrink: 0, marginTop: 4 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.4, margin: "0 0 3px", fontWeight: n.read ? 400 : 600 }}>{n.text}</p>
                <p style={{ fontSize: 11, color: COLORS.textLight, margin: 0 }}>{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      ))}

      {notifs.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: COLORS.textLight }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
          <p style={{ fontWeight: 700, fontSize: 16, color: COLORS.text }}>Sin notificaciones</p>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";

const COLORS = {
  primary: "#7C3AED", text: "#1F2937", textLight: "#6B7280",
  border: "#E5E7EB", bg: "#F5F5F7",
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "Ahora";
  if (diff < 3600) return `Hace ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff/3600)} hs`;
  if (diff < 172800) return "Ayer";
  return new Date(dateStr).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function dayLabel(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  return new Date(dateStr).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short" });
}

export default function NotificationsPage({ session }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadingTimeoutRef = useRef(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current); };
  }, []);

  useEffect(() => {
    if (session?.user?.id) loadNotifications();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && mountedRef.current && loadingTimeoutRef.current) loadNotifications();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [session]);

  const loadNotifications = async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    loadingTimeoutRef.current = setTimeout(() => { if (mountedRef.current) setLoading(false); }, 6000);
    try {
      const userId = session.user.id;
      const items = [];

      // 1. Aportes recibidos en mi campaña
      const { data: myCamp } = await supabase
        .from("gift_campaigns")
        .select("id, title")
        .eq("birthday_person_id", userId)
        .eq("status", "active")
        .limit(1).maybeSingle();

      if (myCamp) {
        const { data: contribs } = await supabase
          .from("contributions")
          .select("amount, gifter_name, created_at")
          .eq("campaign_id", myCamp.id)
          .order("created_at", { ascending: false })
          .limit(10);

        (contribs || []).forEach(c => {
          items.push({
            id: `contrib-${c.created_at}`,
            dot: "#7C3AED", bg: "#F5F0FF",
            text: `${c.gifter_name || "Alguien"} aportó $${parseFloat(c.amount).toLocaleString("es-AR")} a tu regalo 🎉`,
            time: c.created_at, read: false,
          });
        });
      }

      // 2. Amigos nuevos — tabla friends no disponible en esta versión

      // 3. Recordatorio cumpleaños
      const { data: prof } = await supabase
        .from("profiles")
        .select("birthday")
        .eq("id", userId).maybeSingle();

      if (prof?.birthday) {
        const bday = new Date(prof.birthday);
        const now = new Date();
        const thisYear = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
        if (thisYear < now) thisYear.setFullYear(now.getFullYear() + 1);
        const daysUntil = Math.ceil((thisYear - now) / 86400000);
        if (daysUntil <= 30 && daysUntil > 0) {
          items.push({
            id: "bday-reminder",
            dot: "#F59E0B", bg: "#FFFBEB",
            text: `Tu cumpleaños es en ${daysUntil} días · ¿Cargaste tu regalo? 🎂`,
            time: new Date().toISOString(), read: false,
          });
        }
      }

      // 4. Aportes a campañas que gestiono
      const { data: managed } = await supabase
        .from("gift_campaigns")
        .select("id, title, birthday_person:profiles!gift_campaigns_birthday_person_id_fkey(name)")
        .eq("manager_id", userId)
        .eq("status", "active");

      if (managed?.length) {
        for (const camp of managed) {
          const { data: mContribs } = await supabase
            .from("contributions")
            .select("amount, gifter_name, created_at")
            .eq("campaign_id", camp.id)
            .order("created_at", { ascending: false })
            .limit(3);
          (mContribs || []).forEach(c => {
            items.push({
              id: `managed-${camp.id}-${c.created_at}`,
              dot: "#3B82F6", bg: "#EFF6FF",
              text: `${c.gifter_name || "Alguien"} aportó al regalo de ${camp.birthday_person?.name || "tu gestionado"} 🛍️`,
              time: c.created_at, read: false,
            });
          });
        }
      }

      // Ordenar por fecha
      items.sort((a, b) => new Date(b.time) - new Date(a.time));
      setNotifs(items);
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true, bg: "#fff" })));
  const markRead = (id) => setNotifs(n => n.map(x => x.id === id ? { ...x, read: true, bg: "#fff" } : x));
  const unread = notifs.filter(n => !n.read).length;

  // Agrupar por día
  const grouped = notifs.reduce((acc, n) => {
    const label = dayLabel(n.time);
    if (!acc[label]) acc[label] = [];
    acc[label].push(n);
    return acc;
  }, {});

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", paddingBottom: 80 }}>
      <div style={{ background: "#fff", borderBottom: "1px solid " + COLORS.border, padding: "12px 16px", display: "flex", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.text, flex: 1 }}>
          Notificaciones
          {unread > 0 && <span style={{ fontSize: 12, background: COLORS.primary, color: "#fff", borderRadius: 20, padding: "1px 8px", marginLeft: 6 }}>{unread}</span>}
        </span>
        {unread > 0 && (
          <button onClick={markAllRead} style={{ fontSize: 12, color: COLORS.primary, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Leer todo</button>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: COLORS.textLight }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
          <p style={{ fontSize: 13 }}>Cargando notificaciones...</p>
        </div>
      )}

      {!loading && notifs.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: COLORS.textLight }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
          <p style={{ fontWeight: 700, fontSize: 16, color: COLORS.text, marginBottom: 6 }}>Todo al día</p>
          <p style={{ fontSize: 14 }}>No tenés notificaciones nuevas</p>
        </div>
      )}

      {!loading && Object.entries(grouped).map(([day, items]) => (
        <div key={day}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", padding: "12px 16px 4px" }}>{day}</div>
          {items.map(n => (
            <div key={n.id} onClick={() => markRead(n.id)}
              style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", background: n.bg, borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: n.read ? "transparent" : n.dot, border: n.read ? "2px solid " + COLORS.border : "none", flexShrink: 0, marginTop: 4 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.4, margin: "0 0 3px", fontWeight: n.read ? 400 : 600 }}>{n.text}</p>
                <p style={{ fontSize: 11, color: COLORS.textLight, margin: 0 }}>{timeAgo(n.time)}</p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

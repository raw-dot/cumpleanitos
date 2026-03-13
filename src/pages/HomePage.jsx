import { useState, useEffect } from "react";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

const COLORS = {
  primary: "#7C3AED", primaryDark: "#5B21B6", accent: "#F59E0B",
  bg: "#FAFAFA", card: "#FFFFFF", text: "#1F2937", textLight: "#6B7280", border: "#E5E7EB",
};

const ROLES_DATA = [
  { icon: "🎂", title: "Cumpleañero", desc: "Armá tu lista de deseos y recibí regalos fácil", color: "#7C3AED", bg: "#F5F0FF" },
  { icon: "🎁", title: "Regalador", desc: "Encontrá el regalo perfecto y sorprendé", color: "#10B981", bg: "#F0FDF9" },
  { icon: "🛍️", title: "Gestor", desc: "Organizá regalos para los cumpleaños de todos", color: "#F59E0B", bg: "#FFFBEB" },
];

const STEPS = [
  { n: "1", label: "Creá tu perfil gratis", desc: "Registrate y armá tu lista de deseos en minutos" },
  { n: "2", label: "Compartí tu lista", desc: "Enviá el link a tus amigos y familiares" },
  { n: "3", label: "Recibí tus regalos", desc: "Transferencias directas, sin comisiones ocultas" },
];

const FEATURES = [
  { icon: "🎂", title: "Creá tu perfil de cumpleaños", desc: "Registrate, completá tu lista de deseos y compartí tu link." },
  { icon: "🎁", title: "Recibí regalos de tus amigos", desc: "Tus amigos eligen qué regalarte y te transfieren directo." },
  { icon: "🗂️", title: "Organizá regalos para tus amigos", desc: "Como gestor, podés crear regalos para los cumpleaños de todos." },
];

export default function HomePage({ onRegister, onExplore }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ background: COLORS.bg }}>

      {/* HERO */}
      <div style={{
        background: isMobile
          ? "linear-gradient(180deg, #EDE9FF 0%, #F5F0FF 60%, #FAFAFA 100%)"
          : "linear-gradient(180deg, #7C3AED08 0%, transparent 100%)",
        padding: isMobile ? "40px 20px 36px" : "90px 20px 70px",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 14px", borderRadius: 20,
          background: "rgba(124,58,237,0.12)", color: "#7C3AED",
          fontSize: 13, fontWeight: 700, marginBottom: 18,
        }}>
          🎉 La plataforma de regalos más linda de Argentina
        </div>
        <h1 style={{
          fontSize: isMobile ? 40 : 56, fontWeight: 900, color: COLORS.text,
          margin: "0 0 14px", lineHeight: 1.1, letterSpacing: isMobile ? -1.5 : -2,
        }}>
          Regalá un{" "}
          <span style={{ background: "linear-gradient(135deg, #7C3AED, #F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            cumpleanito
          </span>
          <br />como nunca antes
        </h1>
        <p style={{ fontSize: isMobile ? 15 : 20, color: COLORS.textLight, maxWidth: isMobile ? 300 : 520, margin: "0 auto 28px", lineHeight: 1.6 }}>
          Creá tu regalo, armá tu lista y recibí transferencias directas.
        </p>
        <div style={{
          display: "flex", flexDirection: "row", gap: 12,
          justifyContent: "center", alignItems: "center",
          flexWrap: "wrap", maxWidth: 420, margin: "0 auto",
          padding: isMobile ? "0" : "0",
        }}>
          <button onClick={onRegister} style={{
            flex: isMobile ? "1 1 140px" : "none", minWidth: isMobile ? 140 : 200,
            padding: "14px 20px",
            background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
            color: "#fff", border: "none", borderRadius: 14,
            fontSize: 15, fontWeight: 800, cursor: "pointer",
            boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
          }}>Crear mi perfil 🙌</button>
          <button onClick={onExplore} style={{
            flex: isMobile ? "1 1 120px" : "none", minWidth: isMobile ? 120 : 160,
            padding: "14px 20px", background: "transparent",
            color: "#7C3AED", border: "2px solid #7C3AED",
            borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer",
          }}>Explorar</button>
        </div>
      </div>

      {/* ROLES */}
      <div style={{ padding: isMobile ? "28px 0" : "60px 20px" }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: isMobile ? "0 20px 14px" : "0 0 24px",
          maxWidth: 1000, margin: "0 auto",
        }}>
          <h2 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, color: COLORS.text, margin: 0 }}>
            Todo lo que necesitás
          </h2>
          {isMobile && (
            <span onClick={onExplore} style={{ fontSize: 14, color: "#7C3AED", fontWeight: 700, cursor: "pointer" }}>
              Ver más →
            </span>
          )}
        </div>
        {isMobile ? (
          <div style={{
            display: "flex", gap: 14, padding: "4px 20px 20px",
            overflowX: "auto", scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch", scrollbarWidth: "none",
          }}>
            {ROLES_DATA.map((r, i) => (
              <div key={i} style={{
                flexShrink: 0, width: 170, background: r.bg,
                borderRadius: 20, padding: "20px 18px",
                border: "1.5px solid " + r.color + "25",
                scrollSnapAlign: "start",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}>
                <div style={{ fontSize: 38, marginBottom: 12 }}>{r.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: COLORS.text, marginBottom: 6 }}>{r.title}</div>
                <div style={{ fontSize: 13, color: COLORS.textLight, lineHeight: 1.5 }}>{r.desc}</div>
              </div>
            ))}
            <div style={{ flexShrink: 0, width: 4 }} />
          </div>
        ) : (
          <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {ROLES_DATA.map((r, i) => (
              <div key={i} style={{ padding: 28, borderRadius: 16, background: r.bg, border: "2px solid " + r.color + "20", textAlign: "center" }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>{r.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 17, color: COLORS.text, marginBottom: 8 }}>{r.title}</div>
                <div style={{ fontSize: 14, color: COLORS.textLight }}>{r.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CÓMO FUNCIONA */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "0 20px 40px" : "60px 20px" }}>
        <h2 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, margin: "0 0 " + (isMobile ? 16 : 40) + "px", color: COLORS.text }}>
          ¿Cómo funciona?
        </h2>
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 14,
                background: COLORS.card, borderRadius: 16, padding: "16px 18px",
                boxShadow: "0 2px 12px rgba(124,58,237,0.07)", border: "1px solid #E5E7EB",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(124,58,237,0.12)", color: "#7C3AED",
                  fontSize: 20, fontWeight: 900,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid rgba(124,58,237,0.25)",
                }}>{s.n}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: COLORS.text, marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 13, color: COLORS.textLight, lineHeight: 1.4 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 24 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: "linear-gradient(135deg, #7C3AED, #F59E0B)",
                  color: "#fff", fontSize: 22, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
                }}>{s.n}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 13, color: COLORS.textLight, lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ textAlign: "center", marginTop: isMobile ? 28 : 48 }}>
          <button onClick={onRegister} style={{
            width: isMobile ? "100%" : "auto", padding: "15px 32px",
            background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
            color: "#fff", border: "none", borderRadius: 14,
            fontSize: 16, fontWeight: 800, cursor: "pointer",
            boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
          }}>Empezar ahora 🎂</button>
        </div>
      </div>

      {/* FEATURES DESKTOP */}
      {!isMobile && (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "60px 20px" }}>
          <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: 800, marginBottom: 8, color: COLORS.text }}>Todo lo que necesitás</h2>
          <p style={{ textAlign: "center", color: COLORS.textLight, marginBottom: 40 }}>Tres roles, una sola plataforma</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 24 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ background: COLORS.card, borderRadius: 16, padding: 28, textAlign: "center", border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 44, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: COLORS.text }}>{f.title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: COLORS.textLight, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
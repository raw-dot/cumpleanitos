import { COLORS, Button, Card } from "../shared";

const ROLES_DATA = [
  { icon: "🎂", title: "Cumpleañero", desc: "Armá tu lista de deseos y recibí regalos fácil", color: COLORS.primary },
  { icon: "🎁", title: "Regalador", desc: "Encontrá el regalo perfecto y sorprendé", color: "#10B981" },
  { icon: "🛍️", title: "Gestor", desc: "Organizá regalos para los cumpleaños de todos", color: COLORS.accent },
];

const STEPS = [
  { n: "1", label: "Creá tu perfil gratis", desc: "Registrate y armá tu lista de deseos en minutos" },
  { n: "2", label: "Compartí tu lista", desc: "Enviá el link a tus amigos y familiares" },
  { n: "3", label: "Recibí tus regalos", desc: "Transferencias directas, sin comisiones ocultas" },
];

const FEATURES = [
  { icon: "🎂", title: "Creá tu perfil de cumpleaños", desc: "Registrate, completá tu lista de deseos y compartí tu link con tus amigos." },
  { icon: "🎁", title: "Recibí regalos de tus amigos", desc: "Tus amigos eligen qué regalarte y te transfieren directo. Sin complicaciones." },
  { icon: "🗂️", title: "Organizá regalos para tus amigos", desc: "Como gestor, podés crear regalos para los cumpleaños de todos tus amigos." },
];

export default function HomePage({ onRegister, onExplore }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div>
      <div style={{
        textAlign: "center",
        padding: isMobile ? "48px 20px 40px" : "90px 20px 70px",
        background: \`linear-gradient(180deg, \${COLORS.primary}08 0%, transparent 100%)\`
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 16px", borderRadius: 20,
          background: COLORS.primary + "12", color: COLORS.primary,
          fontSize: 13, fontWeight: 600, marginBottom: 20
        }}>
          🎉 La plataforma de regalos más linda de Argentina
        </div>
        <h1 style={{
          fontSize: isMobile ? 36 : 54,
          fontWeight: 900, color: COLORS.text,
          margin: "0 0 16px", letterSpacing: isMobile ? -1 : -2, lineHeight: 1.1
        }}>
          Regalá un{" "}
          <span style={{
            background: \`linear-gradient(135deg, \${COLORS.primary}, \${COLORS.accent})\`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            cumpleanito
          </span>
          <br />como nunca antes
        </h1>
        <p style={{
          fontSize: isMobile ? 15 : 20, color: COLORS.textLight,
          maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.6
        }}>
          Creá tu regalo, armá tu lista y recibí transferencias directas.
        </p>
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 12, justifyContent: "center", alignItems: "center",
          padding: isMobile ? "0 16px" : 0
        }}>
          <Button size="lg" onClick={onRegister} style={{ width: isMobile ? "100%" : "auto", minHeight: 52 }}>
            Crear mi perfil 🙌
          </Button>
          <Button variant="outline" size="lg" onClick={onExplore} style={{ width: isMobile ? "100%" : "auto", minHeight: 52 }}>
            Explorar
          </Button>
        </div>
      </div>

      <div style={{ padding: isMobile ? "32px 0" : "60px 20px" }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: isMobile ? "0 20px 16px" : "0 0 24px",
          maxWidth: 1000, margin: "0 auto"
        }}>
          <h2 style={{ fontSize: isMobile ? 20 : 30, fontWeight: 800, color: COLORS.text, margin: 0 }}>
            Todo lo que necesitás
          </h2>
          {isMobile && (
            <span style={{ fontSize: 13, color: COLORS.primary, fontWeight: 700, cursor: "pointer" }} onClick={onExplore}>
              Ver más →
            </span>
          )}
        </div>
        {isMobile ? (
          <div style={{
            display: "flex", gap: 12, padding: "4px 20px 16px",
            overflowX: "auto", scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch", scrollbarWidth: "none"
          }}>
            {ROLES_DATA.map((r, i) => (
              <div key={i} style={{
                flexShrink: 0, width: 160, background: COLORS.card,
                borderRadius: 18, padding: "20px 16px",
                border: \`2px solid \${r.color}20\`,
                scrollSnapAlign: "start",
                boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
              }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>{r.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 14, color: r.color, marginBottom: 6 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: COLORS.textLight, lineHeight: 1.4 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {ROLES_DATA.map((r, i) => (
              <div key={i} style={{ padding: 28, borderRadius: 16, background: COLORS.card, border: \`2px solid \${r.color}20\`, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{r.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: r.color, marginBottom: 6 }}>{r.title}</div>
                <div style={{ fontSize: 13, color: COLORS.textLight }}>{r.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "16px 20px 40px" : "60px 20px" }}>
        <h2 style={{ fontSize: isMobile ? 20 : 30, fontWeight: 800, marginBottom: isMobile ? 20 : 40, color: COLORS.text }}>
          ¿Cómo funciona?
        </h2>
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 14,
                background: COLORS.card, borderRadius: 14, padding: "14px 16px",
                boxShadow: "0 2px 8px rgba(124,58,237,0.08)"
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  background: \`linear-gradient(135deg, \${COLORS.primary}, \${COLORS.accent})\`,
                  color: "#fff", fontSize: 18, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>{s.n}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text, marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: COLORS.textLight, lineHeight: 1.4 }}>{s.desc}</div>
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
                  background: \`linear-gradient(135deg, \${COLORS.primary}, \${COLORS.accent})\`,
                  color: "#fff", fontSize: 22, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px"
                }}>{s.n}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 13, color: COLORS.textLight, lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ textAlign: "center", marginTop: isMobile ? 28 : 48 }}>
          <Button size="lg" onClick={onRegister} style={{ width: isMobile ? "100%" : "auto", minHeight: 52 }}>
            Empezar ahora 🎂
          </Button>
        </div>
      </div>

      {!isMobile && (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "60px 20px" }}>
          <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: 800, marginBottom: 8, color: COLORS.text }}>
            Todo lo que necesitás
          </h2>
          <p style={{ textAlign: "center", color: COLORS.textLight, marginBottom: 40 }}>Tres roles, una sola plataforma</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 24 }}>
            {FEATURES.map((f, i) => (
              <Card key={i} style={{ padding: 28, textAlign: "center" }}>
                <div style={{ fontSize: 44, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: COLORS.text }}>{f.title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: COLORS.textLight, lineHeight: 1.6 }}>{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

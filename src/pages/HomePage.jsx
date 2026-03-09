import { COLORS, Button, Card, Badge } from "../shared";

const FEATURES = [
  { icon: "🎂", title: "Creá tu perfil de cumpleaños", desc: "Registrate, completá tu lista de deseos y compartí tu link con tus amigos." },
  { icon: "🎁", title: "Recibí regalos de tus amigos", desc: "Tus amigos eligen qué regalarte y te transfieren directo. Sin complicaciones." },
  { icon: "🗂️", title: "Organizá regalos para tus amigos", desc: "Como gestor, podés crear campañas de regalo para los cumpleaños de todos tus amigos." },
];

const STEPS = [
  { n: "1", label: "Registrate", desc: "Elegí tu rol y creá tu cuenta en 2 minutos." },
  { n: "2", label: "Armá tu lista", desc: "Agregá los regalos que te gustarían y fijá una meta." },
  { n: "3", label: "Compartí tu link", desc: "Mandalo por WhatsApp, Instagram o donde quieras." },
  { n: "4", label: "¡Recibí regalos!", desc: "Tus amigos contribuyen y te transfieren directo." },
];

export default function HomePage({ onRegister, onExplore }) {
  return (
    <div>
      {/* ── Hero ── */}
      <div style={{ textAlign: "center", padding: "90px 20px 70px", background: `linear-gradient(180deg, ${COLORS.primary}08 0%, transparent 100%)` }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 20, background: COLORS.primary + "12", color: COLORS.primary, fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
          🎉 La plataforma de regalos de cumpleaños más linda de Argentina
        </div>
        <h1 style={{ fontSize: 54, fontWeight: 900, color: COLORS.text, margin: "0 0 20px", letterSpacing: -2, lineHeight: 1.05 }}>
          Regalá un{" "}
          <span style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            cumpleanito
          </span>
          <br />como nunca antes
        </h1>
        <p style={{ fontSize: 20, color: COLORS.textLight, maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.6 }}>
          Creá tu campaña de cumpleaños, armá tu lista de deseos y recibí regalos de tus amigos con transferencias directas. Sin comisiones ocultas.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Button size="lg" onClick={onRegister}>Crear mi perfil gratis 🎂</Button>
          <Button variant="outline" size="lg" onClick={onExplore}>Explorar perfiles</Button>
        </div>
      </div>

      {/* ── Features ── */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "60px 20px" }}>
        <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: 800, marginBottom: 8, color: COLORS.text }}>
          Todo lo que necesitás
        </h2>
        <p style={{ textAlign: "center", color: COLORS.textLight, marginBottom: 40 }}>Tres roles, una sola plataforma</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {FEATURES.map((f, i) => (
            <Card key={i} style={{ padding: 28, textAlign: "center" }}>
              <div style={{ fontSize: 44, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: COLORS.text }}>{f.title}</h3>
              <p style={{ margin: 0, fontSize: 14, color: COLORS.textLight, lineHeight: 1.6 }}>{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Roles ── */}
      <div style={{ background: `linear-gradient(135deg, ${COLORS.primary}08 0%, ${COLORS.accent}06 100%)`, padding: "60px 20px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8, color: COLORS.text }}>Tres roles, un solo objetivo</h2>
          <p style={{ color: COLORS.textLight, marginBottom: 40 }}>Elegí cómo querés participar</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
            {[
              { icon: "🎂", title: "Cumpleañero", desc: "Creá tu lista y recibí regalos", color: COLORS.primary },
              { icon: "🎁", title: "Gestor", desc: "Organizá regalos para tus amigos", color: COLORS.manager },
              { icon: "💝", title: "Regalador", desc: "Regalale a quien quieras", color: COLORS.accent },
            ].map((r, i) => (
              <div key={i} style={{ padding: 28, borderRadius: 16, background: COLORS.card, border: `2px solid ${r.color}20`, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{r.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: r.color, marginBottom: 6 }}>{r.title}</div>
                <div style={{ fontSize: 13, color: COLORS.textLight }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── How it works ── */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 20px" }}>
        <h2 style={{ textAlign: "center", fontSize: 30, fontWeight: 800, marginBottom: 40, color: COLORS.text }}>
          ¿Cómo funciona?
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, color: "#fff", fontSize: 22, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                {s.n}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 13, color: COLORS.textLight, lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <Button size="lg" onClick={onRegister}>Empezar ahora 🎂</Button>
        </div>
      </div>
    </div>
  );
}

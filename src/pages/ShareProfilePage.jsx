const COLORS = {
  primary: "#7C3AED", primaryDark: "#5B21B6",
  bg: "#F5F5F7", card: "#FFFFFF", text: "#1F2937", textLight: "#6B7280",
  border: "#E5E7EB",
};

export default function ShareProfilePage({ profile, onBack, onViewProfile }) {
  const url = `${window.location.origin}?u=${profile?.username}`;

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    alert("¡Link copiado!");
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({ title: "Mi cumpleaños en Cumpleanitos", url });
    } else {
      copyLink();
    }
  };

  const sections = [
    { icon: "🎂", title: "Mi regalo de cumpleaños", sub: "Evolución del aporte en tiempo real", actions: [{ label: "Ver como lo ven", primary: true, action: () => onViewProfile(profile?.username) }, { label: "Editar", primary: false, action: onBack }] },
    { icon: "📋", title: "Lista de deseos", sub: "Regalos directos · nuevos o usados", actions: [{ label: "Ver lista", primary: true, action: onBack }, { label: "Editar", primary: false, action: onBack }] },
    { icon: "🛍️", title: "Regalos que gestiono", sub: "Personas a las que les organizo el cumple", actions: [{ label: "Ver gestiones", primary: true, action: onBack }] },
  ];

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", paddingBottom: 80 }}>
      <div style={{ background: "#fff", borderBottom: "1px solid " + COLORS.border, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 20, color: COLORS.primary, fontWeight: 800, cursor: "pointer", padding: "2px 8px 2px 0" }}>‹</button>
        <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>Compartir mi perfil</span>
      </div>

      {/* Link box */}
      <div style={{ background: "#F5F0FF", margin: "12px", borderRadius: 14, padding: "16px", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: COLORS.textLight, marginBottom: 4 }}>Tu link público</p>
        <p style={{ fontSize: 15, fontWeight: 800, color: COLORS.primary, marginBottom: 14 }}>cumpleanitos.com/@{profile?.username}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={copyLink} style={{ flex: 1, padding: "11px", background: COLORS.primary, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>📋 Copiar link</button>
          <button onClick={shareNative} style={{ flex: 1, padding: "11px", background: COLORS.primaryDark, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>↗ Compartir</button>
        </div>
      </div>

      {/* Sections */}
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", padding: "4px 16px 8px" }}>
        Qué ven tus amigos
      </div>
      {sections.map((s, i) => (
        <div key={i} style={{ background: "#fff", margin: "0 12px 10px", borderRadius: 14, border: "1px solid " + COLORS.border, overflow: "hidden" }}>
          <div style={{ padding: "13px 14px 10px", borderBottom: "1px solid #F3F4F6" }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: COLORS.text, marginBottom: 3 }}>{s.icon} {s.title}</p>
            <p style={{ fontSize: 12, color: COLORS.textLight, margin: 0 }}>{s.sub}</p>
          </div>
          <div style={{ display: "flex", gap: 8, padding: "10px 14px" }}>
            {s.actions.map((a, j) => (
              <button key={j} onClick={a.action} style={{
                flex: 1, padding: "9px 6px",
                background: a.primary ? COLORS.primary : "#F3F4F6",
                color: a.primary ? "#fff" : "#374151",
                border: "none", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>{a.label}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

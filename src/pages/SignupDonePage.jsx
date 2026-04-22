import { COLORS } from "../utils/constants";

const S = {
  page: { maxWidth: 480, margin: "0 auto", padding: 0 },
  cta: (disabled) => ({
    width: "100%", padding: 14, borderRadius: 14, border: "none",
    background: disabled ? "#E5E7EB" : `linear-gradient(135deg, ${COLORS.primary}, #6D28D9)`,
    color: disabled ? "#9CA3AF" : "#fff", fontWeight: 700, fontSize: 14,
    cursor: disabled ? "default" : "pointer", fontFamily: "inherit",
  }),
  ctaGray: {
    width: "100%", padding: 14, borderRadius: 14, border: "none",
    background: "#F3F4F6", color: "#374151", fontWeight: 700, fontSize: 14,
    cursor: "pointer", fontFamily: "inherit",
  },
  tipBox: (bg) => ({
    padding: "10px 12px", background: bg || "#FEF3C7", borderRadius: 10,
    fontSize: 12, color: "#6B7280", lineHeight: 1.5,
    display: "flex", gap: 8, alignItems: "flex-start", marginTop: 16,
  }),
};

export default function SignupDonePage({ event, giftOptions, isSurprise }) {
  if (!event) return null;

  if (isSurprise) {
    return (
      <div style={S.page}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px", textAlign: "center", minHeight: "60vh" }}>
          <div style={{ width: 100, height: 100, borderRadius: "50%", background: "#FED7AA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, marginBottom: 20 }}>🎁</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>¡Modo sorpresa activado!</h1>
          <p style={{ fontSize: 14, color: COLORS.textLight, margin: "0 0 20px", lineHeight: 1.5 }}>No vas a ver nada del regalo hasta tu cumple.<br/>¡Confiá en tus amigos!</p>
          <div style={S.tipBox("#FEF3C7")}>
            <span>💡</span>
            <span>Tus amigos ya pueden empezar a aportar. Te avisamos cuando esté todo listo.</span>
          </div>
          <div style={{ width: "100%", marginTop: 24 }}>
            <button style={S.cta(false)} onClick={() => (window.location.href = "/perfil")}>Ir a mi perfil →</button>
          </div>
          <div style={{ padding: "10px 12px", background: "rgba(255,193,7,0.1)", borderRadius: 10, fontSize: 12, color: "#6B7280", lineHeight: 1.5, display: "flex", gap: 8, alignItems: "flex-start", marginTop: 12 }}>
            <span>ℹ️</span>
            <span>El día de tu cumple se revelan todos los detalles. ¡Mantené el suspenso!</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center", minHeight: "60vh" }}>
        <div style={{ width: 100, height: 100, borderRadius: "50%", background: "linear-gradient(135deg, #10B981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, marginBottom: 20, boxShadow: "0 8px 24px rgba(16,185,129,0.35)" }}>🎂</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>¡Ya sos parte de<br/>cumpleanitos!</h1>
        <p style={{ fontSize: 14, color: COLORS.textLight, margin: "0 0 20px", lineHeight: 1.5 }}>Desde acá podés ver tu regalo y editar lo que querás</p>

        {giftOptions && giftOptions.length > 0 && (
          <div style={{ width: "100%", background: "#fff", borderRadius: 12, padding: 12, marginBottom: 16, border: `1px solid ${COLORS.border}`, textAlign: "left" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Tu regalo</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>🎁</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{giftOptions[0]?.title || "Tu regalo"}</div>
                {giftOptions[0]?.amount && <div style={{ fontSize: 12, fontWeight: 700, color: "#F97316" }}>${parseFloat(giftOptions[0].amount).toLocaleString("es-AR")}</div>}
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, background: "#D1FAE5", color: "#059669", padding: "3px 8px", borderRadius: 999 }}>Aprobado ✓</span>
            </div>
          </div>
        )}

        <div style={{ width: "100%", marginBottom: 12 }}>
          <button style={S.cta(false)} onClick={() => (window.location.href = `/regalo/${event?.id}`)}>Ver mi regalo completo →</button>
        </div>
        <div style={{ width: "100%", marginBottom: 16 }}>
          <button style={S.ctaGray} onClick={() => (window.location.href = "/perfil")}>Ir a mi perfil</button>
        </div>
        <div style={S.tipBox("rgba(124, 58, 237, 0.05)")}>
          <span>ℹ️</span>
          <span>Tu regalo está publicado. Tus amigos ya pueden aportar. Completá tu perfil desde Configuración.</span>
        </div>
      </div>
    </div>
  );
}

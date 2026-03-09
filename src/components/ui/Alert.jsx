import { COLORS, ALERT_TYPES } from "../../utils/constants";

/**
 * Componente Alert para mostrar mensajes
 */
function Alert({ message, type = "error", onDismiss }) {
  if (!message) return null;

  const colors = {
    error: {
      bg: "#FEF2F2",
      border: "#FECACA",
      text: COLORS.error,
      icon: "❌",
    },
    success: {
      bg: COLORS.successLight,
      border: "#A7F3D0",
      text: "#065F46",
      icon: "✅",
    },
    warning: {
      bg: "#FFFBEB",
      border: "#FCD34D",
      text: "#92400E",
      icon: "⚠️",
    },
    info: {
      bg: "#EFF6FF",
      border: "#BAE6FD",
      text: "#0C4A6E",
      icon: "ℹ️",
    },
  };

  const c = colors[type] || colors.error;

  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 10,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        fontSize: 14,
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span>{c.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            color: c.text,
            cursor: "pointer",
            fontSize: 16,
            padding: 0,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default Alert;

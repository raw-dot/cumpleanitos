import { COLORS } from "../../utils/constants";

/**
 * Componente Button reutilizable
 * @param {React.ReactNode} children - Contenido del botón
 * @param {string} variant - Estilo del botón (primary, secondary, outline, ghost, accent, google)
 * @param {string} size - Tamaño (sm, md, lg)
 * @param {Function} onClick - Función a ejecutar al clickear
 * @param {object} style - Estilos adicionales inline
 * @param {boolean} disabled - Si el botón está deshabilitado
 * @param {string} className - Clases CSS adicionales
 */
function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  style = {},
  disabled = false,
  className = "",
  ...props
}) {
  const base = {
    border: "none",
    borderRadius: 12,
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 600,
    transition: "all 0.2s",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    opacity: disabled ? 0.5 : 1,
  };

  const sizes = {
    sm: { padding: "8px 16px", fontSize: 13 },
    md: { padding: "12px 24px", fontSize: 15 },
    lg: { padding: "16px 32px", fontSize: 17 },
  };

  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
      color: "#fff",
    },
    secondary: {
      background: COLORS.border,
      color: COLORS.text,
    },
    outline: {
      background: "transparent",
      border: `2px solid ${COLORS.primary}`,
      color: COLORS.primary,
    },
    ghost: {
      background: "transparent",
      color: COLORS.textLight,
    },
    accent: {
      background: `linear-gradient(135deg, ${COLORS.accent}, #D97706)`,
      color: "#fff",
    },
    google: {
      background: "#fff",
      border: `1px solid ${COLORS.border}`,
      color: COLORS.text,
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        ...base,
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;

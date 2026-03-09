import { COLORS } from "../../utils/constants";

/**
 * Componente Badge para etiquetas pequeñas
 */
function Badge({ children, color = COLORS.primary, variant = "filled" }) {
  const styles = {
    filled: {
      background: color + "15",
      color: color,
      border: "none",
    },
    outline: {
      background: "transparent",
      color: color,
      border: `1px solid ${color}`,
    },
    solid: {
      background: color,
      color: "#fff",
      border: "none",
    },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        ...styles[variant],
      }}
    >
      {children}
    </span>
  );
}

export default Badge;

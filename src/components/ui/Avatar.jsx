import { COLORS } from "../../utils/constants";

/**
 * Componente Avatar para mostrar foto de perfil o iniciales
 */
function Avatar({ initials, size = 48, src, onClick, style = {} }) {
  const baseStyle = {
    width: size,
    height: size,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700,
    fontSize: size * 0.35,
    flexShrink: 0,
    cursor: onClick ? "pointer" : "default",
    overflow: "hidden",
    ...style,
  };

  // Si hay imagen, mostrarla
  if (src) {
    return (
      <img
        onClick={onClick}
        src={src}
        alt="avatar"
        style={{ ...baseStyle, objectFit: "cover" }}
      />
    );
  }

  // Si no hay imagen, mostrar iniciales con gradiente
  return (
    <div
      onClick={onClick}
      style={{
        ...baseStyle,
        background: `linear-gradient(135deg, ${COLORS.primaryLight}, ${COLORS.primary})`,
      }}
    >
      {initials}
    </div>
  );
}

export default Avatar;

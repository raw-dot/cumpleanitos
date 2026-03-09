import { COLORS } from "../../utils/constants";

/**
 * Componente Card para agrupar contenido
 */
function Card({ children, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: COLORS.card,
        borderRadius: 16,
        border: `1px solid ${COLORS.border}`,
        padding: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        transition: "all 0.2s",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default Card;

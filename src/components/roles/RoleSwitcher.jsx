import { useRole } from "../../hooks/useRole";
import { COLORS, ROLES } from "../../utils/constants";
import Badge from "../ui/Badge";

/**
 * Componente para switchear roles
 * Muestra rol actual como un badge
 */
function RoleSwitcher({ compact = false }) {
  const { currentRole, switchRole, loading } = useRole();

  const getRoleLabel = (role) => {
    return role === ROLES.BIRTHDAY_PERSON ? "Cumpleañero 🎂" : "Gestor de Regalos 🎁";
  };

  const getRoleColor = (role) => {
    return role === ROLES.BIRTHDAY_PERSON ? COLORS.primary : COLORS.accent;
  };

  if (!currentRole) return null;

  if (compact) {
    // Versión compacta (solo muestra el rol como badge)
    return (
      <Badge
        color={getRoleColor(currentRole)}
        variant="filled"
        style={{
          display: "inline-flex",
          gap: 4,
          fontSize: 12,
        }}
      >
        {currentRole === ROLES.BIRTHDAY_PERSON ? "🎂" : "🎁"}
        {currentRole === ROLES.BIRTHDAY_PERSON ? "Cumpleañero" : "Gestor"}
      </Badge>
    );
  }

  // Versión expandida (permite cambiar rol)
  return (
    <div style={{ padding: "16px 0" }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: COLORS.textLight,
          marginBottom: 12,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        Tu Rol
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexDirection: "column",
        }}
      >
        {/* Opción Birthday Person */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 8,
            cursor: "pointer",
            background:
              currentRole === ROLES.BIRTHDAY_PERSON ? `${COLORS.primary}15` : "transparent",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => {
            if (currentRole !== ROLES.BIRTHDAY_PERSON) {
              e.currentTarget.style.background = COLORS.bg;
            }
          }}
          onMouseLeave={(e) => {
            if (currentRole !== ROLES.BIRTHDAY_PERSON) {
              e.currentTarget.style.background = "transparent";
            }
          }}
        >
          <input
            type="radio"
            name="role"
            value={ROLES.BIRTHDAY_PERSON}
            checked={currentRole === ROLES.BIRTHDAY_PERSON}
            onChange={() => switchRole(ROLES.BIRTHDAY_PERSON)}
            disabled={loading}
            style={{ cursor: "pointer" }}
          />
          <span
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: currentRole === ROLES.BIRTHDAY_PERSON ? 600 : 500,
              color: COLORS.text,
            }}
          >
            🎂 Cumpleañero
          </span>
          <span style={{ fontSize: 12, color: COLORS.textLight }}>
            Recibe regalos
          </span>
        </label>

        {/* Opción Gift Manager */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 8,
            cursor: "pointer",
            background:
              currentRole === ROLES.GIFT_MANAGER ? `${COLORS.accent}15` : "transparent",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => {
            if (currentRole !== ROLES.GIFT_MANAGER) {
              e.currentTarget.style.background = COLORS.bg;
            }
          }}
          onMouseLeave={(e) => {
            if (currentRole !== ROLES.GIFT_MANAGER) {
              e.currentTarget.style.background = "transparent";
            }
          }}
        >
          <input
            type="radio"
            name="role"
            value={ROLES.GIFT_MANAGER}
            checked={currentRole === ROLES.GIFT_MANAGER}
            onChange={() => switchRole(ROLES.GIFT_MANAGER)}
            disabled={loading}
            style={{ cursor: "pointer" }}
          />
          <span
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: currentRole === ROLES.GIFT_MANAGER ? 600 : 500,
              color: COLORS.text,
            }}
          >
            🎁 Gestor de Regalos
          </span>
          <span style={{ fontSize: 12, color: COLORS.textLight }}>
            Organiza amigos
          </span>
        </label>
      </div>

      {loading && (
        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            color: COLORS.textLight,
            textAlign: "center",
          }}
        >
          Guardando cambios...
        </div>
      )}
    </div>
  );
}

export default RoleSwitcher;

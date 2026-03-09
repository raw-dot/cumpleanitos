import { COLORS } from "../../utils/constants";
import Button from "../ui/Button";

/**
 * Dropdown menu que aparece al clickear el avatar
 * Opciones: Mi perfil, Mis amigos, Configuración, Cambiar rol, Logout
 */
function UserMenuDropdown({
  profile,
  currentRole,
  onProfileClick,
  onFriendsClick,
  onSettingsClick,
  onRoleSwitch,
  onLogout,
}) {
  const getRoleLabel = (role) => {
    return role === "birthday_person" ? "Yo (cumpleañero)" : "Gestor de regalos";
  };

  const getRoleEmoji = (role) => {
    return role === "birthday_person" ? "🎂" : "🎁";
  };

  const otherRole = currentRole === "birthday_person" ? "gift_manager" : "birthday_person";

  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        right: 0,
        marginTop: 8,
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: 1000,
        minWidth: 220,
        overflow: "hidden",
      }}
    >
      {/* Header con nombre de usuario */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${COLORS.border}`,
          fontSize: 13,
          color: COLORS.textLight,
        }}
      >
        <div style={{ fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>
          {profile?.name || "Usuario"}
        </div>
        <div style={{ fontSize: 12 }}>@{profile?.username || "username"}</div>
      </div>

      {/* Opción: Mi perfil */}
      <button
        onClick={onProfileClick}
        style={{
          width: "100%",
          padding: "12px 16px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
          fontSize: 14,
          color: COLORS.text,
          display: "flex",
          alignItems: "center",
          gap: 10,
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => (e.target.style.background = COLORS.bg)}
        onMouseLeave={(e) => (e.target.style.background = "transparent")}
      >
        <span>👤</span> Mi perfil
      </button>

      {/* Opción: Mis amigos (solo si es gift_manager) */}
      {currentRole === "gift_manager" && (
        <button
          onClick={onFriendsClick}
          style={{
            width: "100%",
            padding: "12px 16px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            textAlign: "left",
            fontSize: 14,
            color: COLORS.text,
            display: "flex",
            alignItems: "center",
            gap: 10,
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.background = COLORS.bg)}
          onMouseLeave={(e) => (e.target.style.background = "transparent")}
        >
          <span>👥</span> Mis amigos
        </button>
      )}

      {/* Opción: Configuración */}
      <button
        onClick={onSettingsClick}
        style={{
          width: "100%",
          padding: "12px 16px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
          fontSize: 14,
          color: COLORS.text,
          display: "flex",
          alignItems: "center",
          gap: 10,
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => (e.target.style.background = COLORS.bg)}
        onMouseLeave={(e) => (e.target.style.background = "transparent")}
      >
        <span>⚙️</span> Configuración
      </button>

      {/* Separador */}
      <div style={{ height: 1, background: COLORS.border, margin: "8px 0" }} />

      {/* Sección de Roles */}
      <div
        style={{
          padding: "8px 16px",
          fontSize: 12,
          color: COLORS.textLight,
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        Cambiar rol
      </div>

      {/* Rol Actual */}
      <button
        onClick={() => {}}
        style={{
          width: "100%",
          padding: "10px 16px",
          border: "none",
          background: `${COLORS.primary}15`,
          cursor: "default",
          textAlign: "left",
          fontSize: 13,
          color: COLORS.primary,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontWeight: 600,
        }}
      >
        <span>✓</span> {getRoleEmoji(currentRole)} {getRoleLabel(currentRole)}
      </button>

      {/* Rol Alternativo (clickeable) */}
      <button
        onClick={() => onRoleSwitch(otherRole)}
        style={{
          width: "100%",
          padding: "10px 16px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
          fontSize: 13,
          color: COLORS.text,
          display: "flex",
          alignItems: "center",
          gap: 8,
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => (e.target.style.background = COLORS.bg)}
        onMouseLeave={(e) => (e.target.style.background = "transparent")}
      >
        <span>○</span> {getRoleEmoji(otherRole)} {getRoleLabel(otherRole)}
      </button>

      {/* Separador */}
      <div style={{ height: 1, background: COLORS.border, margin: "8px 0" }} />

      {/* Botón Logout */}
      <button
        onClick={onLogout}
        style={{
          width: "100%",
          padding: "12px 16px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
          fontSize: 14,
          color: COLORS.error,
          display: "flex",
          alignItems: "center",
          gap: 10,
          transition: "background 0.2s",
          fontWeight: 600,
        }}
        onMouseEnter={(e) => (e.target.style.background = "#FEF2F2")}
        onMouseLeave={(e) => (e.target.style.background = "transparent")}
      >
        <span>🚪</span> Logout
      </button>
    </div>
  );
}

export default UserMenuDropdown;

import { COLORS } from "../../utils/constants";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

/**
 * Página de configuración del usuario
 */
function SettingsPage({ profile, session }) {
  if (!profile || !session) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
        <p>Debes estar logueado para ver esta página</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
          Configuración
        </h1>
        <p style={{ fontSize: 16, color: COLORS.textLight }}>
          Personaliza tu experiencia en cumpleanitos
        </p>
      </div>

      {/* Cuenta */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          Cuenta
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            fontSize: 14,
          }}
        >
          <div>
            <div style={{ color: COLORS.textLight, marginBottom: 4 }}>
              Email
            </div>
            <div style={{ fontWeight: 600 }}>{session.user.email}</div>
          </div>
          <div>
            <div style={{ color: COLORS.textLight, marginBottom: 4 }}>
              ID de Usuario
            </div>
            <div style={{ fontWeight: 600, fontSize: 12, fontFamily: "monospace" }}>
              {session.user.id.slice(0, 12)}...
            </div>
          </div>
          <div>
            <div style={{ color: COLORS.textLight, marginBottom: 4 }}>
              Nombre
            </div>
            <div style={{ fontWeight: 600 }}>{profile.name}</div>
          </div>
          <div>
            <div style={{ color: COLORS.textLight, marginBottom: 4 }}>
              Usuario
            </div>
            <div style={{ fontWeight: 600 }}>@{profile.username}</div>
          </div>
        </div>
      </Card>

      {/* Privacidad */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          Privacidad
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: 12,
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>Perfil Público</div>
              <div style={{ fontSize: 13, color: COLORS.textLight }}>
                Otros usuarios pueden ver tu perfil
              </div>
            </div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                defaultChecked={true}
                style={{
                  width: 20,
                  height: 20,
                  cursor: "pointer",
                  accentColor: COLORS.primary,
                }}
              />
            </label>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: 12,
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>Mostrar Cumpleaños</div>
              <div style={{ fontSize: 13, color: COLORS.textLight }}>
                Permitir que otros vean tu fecha de cumpleaños
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                defaultChecked={true}
                style={{
                  width: 20,
                  height: 20,
                  cursor: "pointer",
                  accentColor: COLORS.primary,
                }}
              />
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600 }}>
                Mostrar Alias de Pago
              </div>
              <div style={{ fontSize: 13, color: COLORS.textLight }}>
                Permitir que otros vean tu alias para regalos
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                defaultChecked={profile.payment_visible_to_givers !== false}
                style={{
                  width: 20,
                  height: 20,
                  cursor: "pointer",
                  accentColor: COLORS.primary,
                }}
              />
            </label>
          </div>
        </div>
      </Card>

      {/* Notificaciones */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          Notificaciones
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: 12,
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>Recordatorios de Cumpleaños</div>
              <div style={{ fontSize: 13, color: COLORS.textLight }}>
                Recibe recordatorios 7 días antes
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                defaultChecked={true}
                style={{
                  width: 20,
                  height: 20,
                  cursor: "pointer",
                  accentColor: COLORS.primary,
                }}
              />
            </label>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: 12,
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>Notificaciones de Regalos</div>
              <div style={{ fontSize: 13, color: COLORS.textLight }}>
                Recibe notificaciones cuando alguien te regala
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                defaultChecked={true}
                style={{
                  width: 20,
                  height: 20,
                  cursor: "pointer",
                  accentColor: COLORS.primary,
                }}
              />
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600 }}>Newsletter</div>
              <div style={{ fontSize: 13, color: COLORS.textLight }}>
                Recibe tips y noticias sobre cumpleanitos
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                defaultChecked={false}
                style={{
                  width: 20,
                  height: 20,
                  cursor: "pointer",
                  accentColor: COLORS.primary,
                }}
              />
            </label>
          </div>
        </div>
      </Card>

      {/* Peligro */}
      <Card
        style={{
          marginBottom: 24,
          border: `1px solid ${COLORS.error}`,
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: COLORS.error }}>
          Zona Peligrosa
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Cambiar Contraseña</div>
            <Button variant="secondary" size="sm">
              Cambiar contraseña
            </Button>
          </div>

          <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: COLORS.error }}>
              Eliminar Cuenta
            </div>
            <p style={{ fontSize: 13, color: COLORS.textLight, marginBottom: 12 }}>
              Esta acción es irreversible. Se eliminarán todos tus datos,
              perfiles y regalos.
            </p>
            <Button
              variant="primary"
              size="sm"
              style={{
                background: COLORS.error,
              }}
            >
              Eliminar mi cuenta
            </Button>
          </div>
        </div>
      </Card>

      {/* Soporte */}
      <div style={{ textAlign: "center", paddingTop: 24 }}>
        <p style={{ color: COLORS.textLight, marginBottom: 16 }}>
          ¿Necesitas ayuda?
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Button variant="outline" size="sm">
            📧 Contactar Soporte
          </Button>
          <Button variant="outline" size="sm">
            📚 Ver Documentación
          </Button>
          <Button variant="outline" size="sm">
            🐛 Reportar Bug
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;

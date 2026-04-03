import { useState } from "react";
import { COLORS } from "../../utils/constants";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import Alert from "../ui/Alert";
import { getInitials, truncate } from "../../utils/formatters";
import { formatBirthday, getAge } from "../../utils/dateHelpers";
import { getRealAlias } from "../../utils/paymentAliasHelpers";

/**
 * Página de perfil personal del usuario
 * Permite editar foto, bio, alias de pago, etc
 */
function MyProfilePage({ profile, session }) {
  const [activeTab, setActiveTab] = useState("info");
  const [bio, setBio] = useState(profile?.bio || "");
  const [paymentAlias, setPaymentAlias] = useState(profile?.payment_alias || "");
  const [paymentMethod, setPaymentMethod] = useState(profile?.payment_method || "mercadopago");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const tabs = [
    { id: "info", label: "Información", icon: "👤" },
    { id: "photo", label: "Foto", icon: "📸" },
    { id: "payment", label: "Alias de Pago", icon: "💳" },
    { id: "progress", label: "Progreso", icon: "📊" },
  ];

  const calculateProgress = () => {
    let completed = 0;
    const items = 5;
    if (profile?.avatar_url) completed++;
    if (profile?.bio) completed++;
    if (profile?.payment_alias) completed++;
    if (profile?.name) completed++;
    if (profile?.birthday) completed++;
    return Math.round((completed / items) * 100);
  };

  if (!profile || !session) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
        <Alert message="Debes estar logueado para ver esta página" type="error" />
      </div>
    );
  }

  const progress = calculateProgress();
  const age = getAge(profile.birthday);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      {message && (
        <Alert
          message={message}
          type={message.includes("Error") ? "error" : "success"}
          onDismiss={() => setMessage("")}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
          Mi Perfil
        </h1>
        <p style={{ fontSize: 16, color: COLORS.textLight }}>
          Completa tu perfil para tener la mejor experiencia
        </p>
      </div>

      {/* Profile Card */}
      <Card style={{ marginBottom: 24, display: "flex", gap: 24, alignItems: "flex-start" }}>
        <div>
          <Avatar
            initials={getInitials(profile.name)}
            size={80}
            src={profile?.avatar_url}
          />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>
            {profile.name}
          </h2>
          <p style={{ fontSize: 14, color: COLORS.textLight, margin: "0 0 12px" }}>
            @{profile.username}
          </p>
          <div style={{ display: "flex", gap: 16, fontSize: 13, color: COLORS.textLight }}>
            <span>🎂 {age} años</span>
            <span>📅 {formatBirthday(profile.birthday)}</span>
            {profile.payment_alias && (
              <span>💳 {truncate(getRealAlias(profile.payment_alias), 20)}</span>
            )}
          </div>
        </div>
      </Card>

      {/* Progress Bar */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span style={{ fontWeight: 600 }}>Perfil Completado</span>
            <span style={{ fontWeight: 700, color: COLORS.primary }}>
              {progress}%
            </span>
          </div>
          <div
            style={{
              height: 8,
              background: COLORS.border,
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})`,
                width: `${progress}%`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Foto de Perfil", completed: !!profile.avatar_url },
            { label: "Bio/Descripción", completed: !!profile.bio },
            { label: "Alias de Pago", completed: !!profile.payment_alias },
            { label: "Nombre Completo", completed: !!profile.name },
            { label: "Cumpleaños", completed: !!profile.birthday },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
              }}
            >
              <span style={{ fontSize: 16 }}>
                {item.completed ? "✅" : "⭕"}
              </span>
              <span style={{ color: item.completed ? COLORS.success : COLORS.textLight }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "12px 16px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? COLORS.primary : COLORS.textLight,
                borderBottom:
                  activeTab === tab.id ? `3px solid ${COLORS.primary}` : "none",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) e.target.style.color = COLORS.text;
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) e.target.style.color = COLORS.textLight;
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <Card>
          {activeTab === "info" && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                Información Personal
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 8,
                      color: COLORS.textLight,
                    }}
                  >
                    Nombre Completo
                  </label>
                  <Input
                    placeholder="Tu nombre"
                    value={profile.name}
                    disabled
                  />
                  <p style={{ fontSize: 12, color: COLORS.textLight, marginTop: 4 }}>
                    Para cambiar tu nombre, contacta con soporte
                  </p>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 8,
                      color: COLORS.textLight,
                    }}
                  >
                    Bio / Descripción
                  </label>
                  <Textarea
                    placeholder="Cuéntanos sobre ti..."
                    value={bio}
                    onChange={setBio}
                    rows={4}
                  />
                  <p style={{ fontSize: 12, color: COLORS.textLight, marginTop: 4 }}>
                    {bio.length}/500 caracteres
                  </p>
                </div>

                <Button
                  onClick={() => setMessage("Bio actualizada (feature en desarrollo)")}
                >
                  Guardar Cambios
                </Button>
              </div>
            </div>
          )}

          {activeTab === "photo" && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                Foto de Perfil
              </h3>
              <div style={{ textAlign: "center", padding: 32 }}>
                <Avatar
                  initials={getInitials(profile.name)}
                  size={120}
                  src={profile?.avatar_url}
                />
                <p style={{ marginTop: 16, color: COLORS.textLight }}>
                  Feature de upload en desarrollo 🚀
                </p>
              </div>
            </div>
          )}

          {activeTab === "payment" && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                Alias de Pago
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 8,
                      color: COLORS.textLight,
                    }}
                  >
                    Método de Pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: `1px solid ${COLORS.border}`,
                      fontSize: 15,
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="mercadopago">💳 Mercado Pago</option>
                    <option value="bank">🏦 Transferencia Bancaria</option>
                    <option value="wallet">📱 Billetera Digital</option>
                    <option value="other">💰 Otro</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 8,
                      color: COLORS.textLight,
                    }}
                  >
                    {paymentMethod === "mercadopago"
                      ? "Alias Mercado Pago"
                      : paymentMethod === "bank"
                      ? "CBU o Alias Bancario"
                      : "Alias o Identificador"}
                  </label>
                  <Input
                    placeholder={
                      paymentMethod === "mercadopago"
                        ? "alias@mercadopago"
                        : paymentMethod === "bank"
                        ? "Tu CBU o alias"
                        : "Tu identificador"
                    }
                    value={paymentAlias}
                    onChange={setPaymentAlias}
                  />
                </div>

                <Button onClick={() => setMessage("Alias de pago actualizado (feature en desarrollo)")}>
                  Guardar Alias
                </Button>
              </div>
            </div>
          )}

          {activeTab === "progress" && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                Tu Progreso
              </h3>
              <div style={{ fontSize: 14, color: COLORS.textLight }}>
                <p style={{ marginBottom: 12 }}>
                  Completa todos los elementos de tu perfil para tener la mejor
                  experiencia en cumpleanitos.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { label: "Foto de Perfil", completed: !!profile.avatar_url, hint: "Sube una foto para que te reconozcan" },
                    { label: "Bio", completed: !!profile.bio, hint: "Cuéntale a otros sobre ti" },
                    { label: "Alias de Pago", completed: !!profile.payment_alias, hint: "Necesario para recibir regalos" },
                    { label: "Nombre Completo", completed: !!profile.name, hint: "Ya completado" },
                    { label: "Cumpleaños", completed: !!profile.birthday, hint: "Ya completado" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: 12,
                        borderRadius: 8,
                        background: item.completed ? COLORS.successLight : COLORS.bg,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>
                        {item.completed ? "✅" : "⭕"}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.textLight }}>
                          {item.hint}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default MyProfilePage;

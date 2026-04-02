import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, Button, Input, Alert } from "../shared";

export default function CompleteProfilePage({ user, suggestedUsername, onComplete }) {
  const [username, setUsername] = useState(suggestedUsername || "");
  const [birthday, setBirthday] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);

  // Extract name and email from Google user
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || "Usuario";
  const email = user?.email || "";

  // Auto-suggest username from email when component mounts
  useEffect(() => {
    if (!username && email) {
      const suggested = email
        .split("@")[0]
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9_]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")
        .slice(0, 20);
      setUsername(suggested);
    }
  }, [email]);

  // Check username availability on change
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from("profiles").select("username").eq("username", username).single();
      setUsernameAvailable(!data);
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const getAge = (b) => {
    const today = new Date();
    const bday = new Date(b + "T00:00:00");
    let age = today.getFullYear() - bday.getFullYear();
    const m = today.getMonth() - bday.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) age--;
    return age;
  };

  const getDaysToBirthday = (b) => {
    const today = new Date();
    const bday = new Date(b + "T00:00:00");
    const next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    if (next < today) next.setFullYear(today.getFullYear() + 1);
    return Math.ceil((next - today) / 86400000);
  };

  const handleSubmit = async () => {
    if (!username || !birthday || !phone) {
      setError("Completá todos los campos");
      return;
    }

    if (username.length < 3) {
      setError("El nombre de usuario debe tener al menos 3 caracteres");
      return;
    }

    const age = getAge(birthday);
    if (age < 13) {
      setError("Debes tener al menos 13 años");
      return;
    }

    if (phone.replace(/\D/g, "").length < 10) {
      setError("El teléfono debe tener al menos 10 dígitos");
      return;
    }

    if (!usernameAvailable) {
      setError("Ese nombre de usuario ya está en uso");
      return;
    }

    setLoading(true);
    setError("");

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        username,
        birthday,
        phone,
        age,
        days_to_birthday: getDaysToBirthday(birthday),
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Reload profile and complete onboarding
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setLoading(false);
    if (onComplete && updatedProfile) {
      onComplete(updatedProfile);
    }
  };

  const initials = name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "48px 20px", minHeight: "100vh" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 16, color: COLORS.textLight, marginBottom: 12 }}>
          2 · Vuelve de Google
        </div>
      </div>

      <div style={{
        background: COLORS.cardBg,
        borderRadius: 16,
        border: `1px solid ${COLORS.border}`,
        padding: 28,
      }}>
        {/* Avatar circle */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: COLORS.primary,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 500,
            color: "white",
          }}>
            {initials}
          </div>
        </div>

        {/* Welcome text */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{
            fontSize: 22,
            fontWeight: 500,
            color: COLORS.text,
            margin: "0 0 8px",
          }}>
            Bienvenid{name.endsWith("a") ? "a" : "o"}, {name.split(" ")[0]}
          </h1>
          <p style={{ fontSize: 14, color: COLORS.textLight, margin: 0 }}>
            Completá tu perfil para que tus<br />amigos puedan regalarte
          </p>
        </div>

        {/* Google badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          justifyContent: "center",
          marginBottom: 24,
          padding: "10px 16px",
          background: COLORS.bg,
          borderRadius: 8,
          maxWidth: "fit-content",
          marginLeft: "auto",
          marginRight: "auto",
          border: `1px solid ${COLORS.border}`,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
            <path fill="#4285F4" d="M15.68 8.18c0-.57-.05-1.13-.14-1.68H8v3.17h4.31a3.68 3.68 0 01-1.6 2.42v2.06h2.59c1.52-1.4 2.38-3.46 2.38-5.97z"/>
            <path fill="#34A853" d="M8 16c2.16 0 3.97-.72 5.29-1.94l-2.59-2.01c-.72.48-1.63.77-2.7.77-2.08 0-3.84-1.4-4.47-3.29H.84v2.08A8 8 0 008 16z"/>
            <path fill="#FBBC05" d="M3.53 9.53a4.78 4.78 0 010-3.06V4.39H.84a8 8 0 000 7.22l2.69-2.08z"/>
            <path fill="#EA4335" d="M8 3.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A7.68 7.68 0 008 0 8 8 0 00.84 4.39l2.69 2.08C4.16 4.58 5.92 3.18 8 3.18z"/>
          </svg>
          <span style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>
            Registrado con Google
          </span>
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: COLORS.border, marginBottom: 20 }} />

        <Alert message={error} type="error" />

        {/* Form fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Name (readonly) */}
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: 12,
              background: COLORS.bg,
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
            }}>
              <span style={{ color: COLORS.success, fontSize: 14 }}>✓</span>
              <span style={{ fontSize: 15, color: COLORS.text, flex: 1 }}>{name}</span>
            </div>
            <p style={{ fontSize: 11, color: COLORS.textLight, margin: "4px 0 0 2px" }}>
              Importado de Google
            </p>
          </div>

          {/* Email (readonly) */}
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: 12,
              background: COLORS.bg,
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
            }}>
              <span style={{ color: COLORS.success, fontSize: 14 }}>✓</span>
              <span style={{ fontSize: 15, color: COLORS.text, flex: 1 }}>{email}</span>
            </div>
            <p style={{ fontSize: 11, color: COLORS.textLight, margin: "4px 0 0 2px" }}>
              Importado de Google
            </p>
          </div>

          {/* Separator */}
          <div style={{ height: 1, background: COLORS.border, margin: "8px 0" }} />

          {/* Username (editable) */}
          <div>
            <label style={{
              fontSize: 13,
              color: COLORS.textLight,
              display: "block",
              marginBottom: 6,
            }}>
              Nombre de usuario
            </label>
            <Input
              placeholder="ej: mariag"
              value={username}
              onChange={v => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            />
            <div style={{ marginTop: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: 11, color: COLORS.textLight, margin: 0 }}>
                cumpleanitos.com/@{username}
              </p>
              {username && username.length >= 3 && (
                <span style={{
                  fontSize: 11,
                  color: usernameAvailable ? COLORS.success : COLORS.error,
                  fontWeight: 500,
                }}>
                  {usernameAvailable === null ? "Verificando..." : usernameAvailable ? "✓ Disponible" : "✗ No disponible"}
                </span>
              )}
            </div>
          </div>

          {/* Birthday */}
          <div>
            <label style={{
              fontSize: 13,
              color: COLORS.textLight,
              display: "block",
              marginBottom: 6,
            }}>
              Fecha de cumpleaños
            </label>
            <Input type="date" value={birthday} onChange={setBirthday} />
          </div>

          {/* Age/days badge */}
          {birthday && (
            <div style={{
              padding: 12,
              background: COLORS.primaryLight + "15",
              borderRadius: 8,
              fontSize: 13,
              color: COLORS.text,
              textAlign: "center",
            }}>
              📅 {getAge(birthday)} años - Próximo cumple en {getDaysToBirthday(birthday)} días
            </div>
          )}

          {/* Phone */}
          <div>
            <label style={{
              fontSize: 13,
              color: COLORS.textLight,
              display: "block",
              marginBottom: 6,
            }}>
              Teléfono celular
            </label>
            <Input
              placeholder="ej: +54 9 11 2345 6789"
              value={phone}
              onChange={setPhone}
            />
          </div>

          {/* Submit button */}
          <Button
            size="lg"
            style={{ width: "100%", marginTop: 8 }}
            disabled={loading || !username || !birthday || !phone || !usernameAvailable}
            onClick={handleSubmit}
          >
            {loading ? "Guardando..." : "Guardar y entrar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

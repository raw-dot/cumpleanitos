import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { COLORS } from "../../shared";

export default function GoogleOnboardingModal({ user, initialUsername, onComplete }) {
  const [username, setUsername] = useState(initialUsername || "");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const email = user?.email || "";
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || email.split("@")[0];
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

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

  const handleSave = async () => {
    if (!username.trim()) { setError("El nombre de usuario es obligatorio"); return; }
    if (!phone.trim()) { setError("El teléfono es obligatorio"); return; }
    if (!birthday) { setError("La fecha de cumpleaños es obligatoria"); return; }
    if (phone.replace(/\D/g, "").length < 10) { setError("El teléfono debe tener al menos 10 dígitos"); return; }

    setLoading(true);
    setError("");

    // Verificar username único
    const { data: existing } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username.trim())
      .neq("id", user.id)
      .single();

    if (existing) { setError("Ese nombre de usuario ya está en uso"); setLoading(false); return; }

    const age = getAge(birthday);
    const days_to_birthday = getDaysToBirthday(birthday);

    // RESETEAR datos si el usuario fue eliminado previamente
    const { error: err } = await supabase.from("profiles").upsert({
      id: user.id,
      username: username.trim(),
      phone: phone.trim(),
      birthday,
      age,
      days_to_birthday,
      name,
      deleted_at: null,        // Resetear soft delete
      is_active: true,         // Reactivar usuario
    }, { onConflict: "id" });

    if (err) { setError(err.message); setLoading(false); return; }

    onComplete();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: "1rem",
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "1.75rem",
        width: "100%", maxWidth: 360,
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: COLORS.primary, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 600, margin: "0 auto 10px",
          }}>{initials}</div>
          <p style={{ fontSize: 17, fontWeight: 600, margin: "0 0 6px", color: COLORS.text }}>
            Bienvenido, {name.split(" ")[0]}
          </p>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "#EEEDFE", color: "#3C3489",
            fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20,
          }}>
            <svg width="12" height="12" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.66 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Registrado con Google
          </div>
        </div>

        <div style={{ height: 1, background: COLORS.border, marginBottom: "1.25rem" }} />

        <p style={{ fontSize: 13, color: COLORS.textLight, margin: "0 0 1.25rem", lineHeight: 1.5 }}>
          Completá tu perfil para que tus amigos puedan regalarte en tu cumple.
        </p>

        {error && (
          <div style={{ background: "#FEF2F2", color: "#991B1B", fontSize: 13, padding: "10px 12px", borderRadius: 8, marginBottom: 14 }}>
            {error}
          </div>
        )}

        {/* Username */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: COLORS.textLight, display: "block", marginBottom: 5 }}>
            Nombre de usuario
          </label>
          <input
            style={{ width: "100%", padding: "9px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
            value={username}
            onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
          />
          <p style={{ fontSize: 11, color: COLORS.textLight, margin: "4px 0 0" }}>
            cumpleanitos.com/@{username || "tuusuario"}
          </p>
        </div>

        {/* Teléfono */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: COLORS.textLight, display: "block", marginBottom: 5 }}>
            Teléfono celular
          </label>
          <input
            type="tel"
            placeholder="+54 9 11 2345 6789"
            style={{ width: "100%", padding: "9px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>

        {/* Cumpleaños */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: COLORS.textLight, display: "block", marginBottom: 5 }}>
            Fecha de cumpleaños
          </label>
          <input
            type="date"
            style={{ width: "100%", padding: "9px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
            value={birthday}
            onChange={e => setBirthday(e.target.value)}
          />
        </div>

        {/* Email readonly */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: COLORS.textLight, display: "block", marginBottom: 5 }}>
            Email (importado de Google)
          </label>
          <input
            type="email"
            value={email}
            disabled
            style={{ width: "100%", padding: "9px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, boxSizing: "border-box", opacity: 0.5, background: "#F9FAFB" }}
          />
        </div>

        {/* Botón */}
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            width: "100%", padding: 13,
            background: loading ? "#A78BFA" : COLORS.primary,
            color: "#fff", border: "none", borderRadius: 10,
            fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Guardando..." : "Guardar y entrar"}
        </button>

        <p style={{ fontSize: 11, color: COLORS.textLight, textAlign: "center", margin: "12px 0 0", lineHeight: 1.5 }}>
          Podés actualizar estos datos en cualquier momento desde Configuración
        </p>
      </div>
    </div>
  );
}

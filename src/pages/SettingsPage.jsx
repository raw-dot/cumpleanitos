import { useState } from "react";
import { supabase } from "../supabaseClient";

const COLORS = {
  primary: "#7C3AED", primaryDark: "#5B21B6", accent: "#F59E0B",
  bg: "#F5F5F7", text: "#1F2937", textLight: "#6B7280",
  border: "#E5E7EB", error: "#EF4444", success: "#10B981",
};

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
}

export default function SettingsPage({ profile, session, onBack, onProfileUpdated }) {
  const [name, setName] = useState(profile?.name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [role, setRole] = useState(profile?.role || "celebrant");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const roleOptions = [
    { key: "celebrant", icon: "🎂", label: "Cumpleañero" },
    { key: "gifter", icon: "🎁", label: "Regalador" },
    { key: "manager", icon: "🛍️", label: "Gestor" },
  ];

  const handleSave = async () => {
    setSaving(true); setError("");
    const { error: e } = await supabase.from("profiles").update({ name, username, bio, role }).eq("id", session.user.id);
    setSaving(false);
    if (e) { setError("Error al guardar. Intentá de nuevo."); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (onProfileUpdated) onProfileUpdated({ ...profile, name, username, bio, role });
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid " + COLORS.border, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 20, color: COLORS.primary, fontWeight: 800, cursor: "pointer", padding: "2px 8px 2px 0" }}>‹</button>
        <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.text, flex: 1 }}>Configuración</span>
        <button onClick={handleSave} disabled={saving} style={{ background: saved ? COLORS.success : COLORS.primary, color: "#fff", border: "none", borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Guardando..." : saved ? "¡Guardado! ✓" : "Guardar"}
        </button>
      </div>

      {/* Avatar */}
      <div style={{ background: "#F5F5F7", padding: "24px 16px 16px", textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, color: "#fff", fontSize: 26, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", border: "3px solid #fff", boxShadow: "0 4px 16px rgba(124,58,237,0.25)" }}>
          {getInitials(name)}
        </div>
        <button style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, background: "#F5F0FF", border: "none", borderRadius: 20, padding: "5px 16px", cursor: "pointer" }}>Cambiar foto</button>
      </div>

      {/* Datos */}
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", padding: "12px 16px 6px" }}>Datos personales</div>
      <div style={{ background: "#fff", margin: "0 12px", borderRadius: 14, border: "1px solid " + COLORS.border, padding: "14px", display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { label: "Nombre completo", value: name, setter: setName, placeholder: "Tu nombre" },
          { label: "Usuario", value: username, setter: setUsername, placeholder: "@usuario" },
          { label: "Bio", value: bio, setter: setBio, placeholder: "Contá algo de vos..." },
        ].map(f => (
          <div key={f.label}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textLight, marginBottom: 5 }}>{f.label}</div>
            <input value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder}
              style={{ width: "100%", padding: "11px 13px", border: "1.5px solid " + COLORS.border, borderRadius: 10, fontSize: 14, color: COLORS.text, outline: "none", background: "#fff" }} />
          </div>
        ))}
      </div>

      {/* Rol */}
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", padding: "14px 16px 6px" }}>Mi rol activo</div>
      <div style={{ display: "flex", gap: 8, padding: "0 12px", background: "transparent" }}>
        {roleOptions.map(r => (
          <button key={r.key} onClick={() => setRole(r.key)} style={{
            flex: 1, padding: "12px 4px", borderRadius: 12,
            border: "2px solid " + (role === r.key ? COLORS.primary : COLORS.border),
            background: role === r.key ? COLORS.primary + "12" : "#fff",
            color: role === r.key ? COLORS.primary : COLORS.textLight,
            fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "center",
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{r.icon}</div>
            {r.label}
          </button>
        ))}
      </div>

      {/* Seguridad */}
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", padding: "14px 16px 6px" }}>Seguridad</div>
      <div style={{ background: "#fff", margin: "0 12px", borderRadius: 14, border: "1px solid " + COLORS.border, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔑</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, flex: 1 }}>Cambiar contraseña</span>
          <span style={{ fontSize: 16, color: "#D1D5DB" }}>›</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px" }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📧</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{session?.user?.email}</div>
            <div style={{ fontSize: 11, color: COLORS.success }}>Email verificado ✓</div>
          </div>
        </div>
      </div>

      {error && <div style={{ margin: "10px 12px", padding: "10px 14px", background: "#FEF2F2", borderRadius: 10, fontSize: 13, color: COLORS.error, fontWeight: 600 }}>{error}</div>}

      <div style={{ padding: "14px 12px" }}>
        <button onClick={handleSave} disabled={saving} style={{ width: "100%", padding: "14px", background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

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
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [coverUrl, setCoverUrl] = useState(profile?.cover_url || "");
  const [coverGradient, setCoverGradient] = useState(profile?.cover_gradient || "");
  const [coverPos, setCoverPos] = useState(profile?.cover_position || "50% 50%");
  const [avatarPos, setAvatarPos] = useState(profile?.avatar_position || "50% 50%");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [repositioning, setRepositioning] = useState(null); // "cover" | "avatar" | null
  const [dragStart, setDragStart] = useState(null);
  const [error, setError] = useState("");

  const uploadFile = async (file, folder) => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${session.user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("cumple-images")
      .upload(path, file, { upsert: true });
    if (upErr) { setError("Error subiendo imagen: " + upErr.message); return null; }
    const { data: { publicUrl } } = supabase.storage
      .from("cumple-images")
      .getPublicUrl(path);
    return publicUrl;
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    const url = await uploadFile(file, "avatars");
    if (url) {
      setAvatarUrl(url);
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", session.user.id);
      if (onProfileUpdated) onProfileUpdated({ ...profile, name, username, bio, avatar_url: url, cover_url: coverUrl });
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    const url = await uploadFile(file, "covers");
    if (url) {
      setCoverUrl(url);
      setCoverGradient("");
      await supabase.from("profiles").update({ cover_url: url, cover_gradient: "" }).eq("id", session.user.id);
      if (onProfileUpdated) onProfileUpdated({ ...profile, name, username, bio, avatar_url: avatarUrl, cover_url: url, cover_gradient: "" });
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleSave = async () => {
    setSaving(true); setError("");
    const { error: e } = await supabase
      .from("profiles")
      .update({ name, username, bio, cover_position: coverPos, avatar_position: avatarPos, cover_gradient: coverGradient })
      .eq("id", session.user.id);
    setSaving(false);
    if (e) { setError("Error al guardar. Intentá de nuevo."); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    if (onProfileUpdated) onProfileUpdated({ ...profile, name, username, bio, avatar_url: avatarUrl, cover_url: coverUrl });
  };

  // Gradientes predefinidos para la portada
  const coverGradients = [
    "linear-gradient(135deg, #7C3AED, #F59E0B)",
    "linear-gradient(135deg, #10B981, #3B82F6)",
    "linear-gradient(135deg, #EF4444, #F59E0B)",
    "linear-gradient(135deg, #1F2937, #7C3AED)",
    "linear-gradient(135deg, #EC4899, #8B5CF6)",
  ];

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", paddingBottom: 90 }}>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid " + COLORS.border, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 20, color: COLORS.primary, fontWeight: 800, cursor: "pointer", padding: "2px 8px 2px 0" }}>‹</button>
        <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.text, flex: 1 }}>Configuración</span>
        <button onClick={handleSave} disabled={saving || uploading} style={{
          background: saved ? COLORS.success : COLORS.primary, color: "#fff", border: "none",
          borderRadius: 20, padding: "7px 18px", fontSize: 13, fontWeight: 700,
          cursor: "pointer", opacity: (saving || uploading) ? 0.7 : 1,
        }}>
          {saving ? "Guardando..." : saved ? "¡Listo! ✓" : "Guardar"}
        </button>
      </div>

      {/* Portada editable */}
      <div style={{ position: "relative" }}>
        <div style={{
          height: 110,
          background: coverUrl ? "url(" + coverUrl + ") center/cover no-repeat" : "linear-gradient(135deg, #7C3AED, #F59E0B)",
          position: "relative",
        }}>
          <label htmlFor="cover-input" style={{
            position: "absolute", bottom: 8, right: 10,
            background: "rgba(0,0,0,0.5)", color: "#fff",
            borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 700,
            cursor: uploading ? "wait" : "pointer",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            {uploading ? "⏳" : "✏️"} Cambiar portada
          </label>
          <input id="cover-input" type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverChange} />
        </div>

        {/* Avatar sobre portada con recentrado */}
        <div style={{ position: "absolute", bottom: -38, left: "50%", transform: "translateX(-50%)", zIndex: 2 }}>
          <div style={{ position: "relative" }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" style={{
                  width: 76, height: 76, borderRadius: "50%", objectFit: "cover",
                  objectPosition: avatarPos,
                  border: "3px solid #fff", boxShadow: "0 4px 16px rgba(124,58,237,0.3)", display: "block",
                  cursor: repositioning === "avatar" ? "grabbing" : "default",
                }}
                onMouseDown={repositioning === "avatar" ? (e) => setDragStart({ x: e.clientX, y: e.clientY, pos: avatarPos }) : undefined}
                onMouseMove={repositioning === "avatar" && dragStart ? (e) => {
                  const dx = ((e.clientX - dragStart.x) / 76) * -100;
                  const dy = ((e.clientY - dragStart.y) / 76) * -100;
                  const [ox, oy] = dragStart.pos.split(" ").map(p => parseFloat(p));
                  setAvatarPos(`${Math.max(0,Math.min(100,ox+dx)).toFixed(0)}% ${Math.max(0,Math.min(100,oy+dy)).toFixed(0)}%`);
                } : undefined}
                onMouseUp={() => { if (repositioning === "avatar") setDragStart(null); }}
                onTouchStart={repositioning === "avatar" ? (e) => setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY, pos: avatarPos }) : undefined}
                onTouchMove={repositioning === "avatar" && dragStart ? (e) => {
                  const dx = ((e.touches[0].clientX - dragStart.x) / 76) * -100;
                  const dy = ((e.touches[0].clientY - dragStart.y) / 76) * -100;
                  const [ox, oy] = dragStart.pos.split(" ").map(p => parseFloat(p));
                  setAvatarPos(`${Math.max(0,Math.min(100,ox+dx)).toFixed(0)}% ${Math.max(0,Math.min(100,oy+dy)).toFixed(0)}%`);
                } : undefined}
                onTouchEnd={() => { if (repositioning === "avatar") setDragStart(null); }}
                />
              : <div style={{ width: 76, height: 76, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, color: "#fff", fontSize: 28, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #fff", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}>
                  {getInitials(name)}
                </div>
            }
            <div style={{ position: "absolute", bottom: -2, right: -2, display: "flex", flexDirection: "column", gap: 2 }}>
              <label htmlFor="avatar-input" style={{
                width: 22, height: 22, borderRadius: "50%",
                background: COLORS.primary, color: "#fff",
                fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid #fff", cursor: "pointer",
              }}>✏️</label>
              {avatarUrl && (
                <button onClick={() => setRepositioning(r => r === "avatar" ? null : "avatar")} style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "#1F2937", color: "#fff",
                  fontSize: 9, fontWeight: 700, border: "2px solid #fff", cursor: "pointer",
                }}>⊹</button>
              )}
            </div>
            <input id="avatar-input" type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
          </div>
        </div>
      </div>

      {/* Espaciador para el avatar */}
      <div style={{ height: 52, background: COLORS.bg }} />

      {/* Gradientes rápidos para portada */}
      <div style={{ padding: "0 14px 12px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Portada rápida</div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          {coverGradients.map((g, i) => (
            <button key={i} onClick={() => { setCoverGradient(g); setCoverUrl(""); }} style={{
              width: 56, height: 34, borderRadius: 8,
              border: coverGradient === g ? "2.5px solid " + COLORS.primary : "2px solid " + COLORS.border,
              background: g, cursor: "pointer", flexShrink: 0,
              boxShadow: coverGradient === g ? "0 0 0 2px " + COLORS.primary + "40" : "none",
            }} title="Seleccionar gradiente" />
          ))}
        </div>
      </div>

      {/* Datos personales */}
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", padding: "4px 16px 8px" }}>Datos personales</div>
      <div style={{ background: "#fff", margin: "0 12px", borderRadius: 14, border: "1px solid " + COLORS.border, padding: "14px", display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { label: "Nombre completo", value: name, setter: setName, placeholder: "Tu nombre" },
          { label: "Usuario", value: username, setter: setUsername, placeholder: "usuario (sin @)" },
          { label: "Bio", value: bio, setter: setBio, placeholder: "Contá algo de vos..." },
        ].map(f => (
          <div key={f.label}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textLight, marginBottom: 5 }}>{f.label}</div>
            <input
              value={f.value}
              onChange={e => f.setter(e.target.value)}
              placeholder={f.placeholder}
              style={{ width: "100%", padding: "11px 13px", border: "1.5px solid " + COLORS.border, borderRadius: 10, fontSize: 14, color: COLORS.text, outline: "none", background: "#fff" }}
            />
          </div>
        ))}
      </div>

      {/* Seguridad */}
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", padding: "16px 16px 8px" }}>Seguridad</div>
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

      {error && (
        <div style={{ margin: "10px 12px", padding: "10px 14px", background: "#FEF2F2", borderRadius: 10, fontSize: 13, color: COLORS.error, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div style={{ padding: "16px 12px" }}>
        <button onClick={handleSave} disabled={saving || uploading} style={{
          width: "100%", padding: "14px",
          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
          color: "#fff", border: "none", borderRadius: 12,
          fontSize: 15, fontWeight: 700, cursor: "pointer",
          boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
          opacity: (saving || uploading) ? 0.7 : 1,
        }}>
          {saving ? "Guardando..." : uploading ? "Subiendo imagen..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

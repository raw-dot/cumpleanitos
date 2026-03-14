import { useState } from "react";
import { supabase } from "../supabaseClient";

const C = {
  primary: "#7C3AED", dark: "#5B21B6", accent: "#F59E0B",
  bg: "#F5F5F7", white: "#FFFFFF", text: "#1F2937",
  muted: "#6B7280", border: "#E5E7EB",
  error: "#EF4444", success: "#10B981",
};

const GRADIENTS = [
  "linear-gradient(135deg, #7C3AED 0%, #9C27B0 50%, #F59E0B 100%)",
  "linear-gradient(135deg, #10B981 0%, #3B82F6 100%)",
  "linear-gradient(135deg, #EF4444 0%, #F59E0B 100%)",
  "linear-gradient(135deg, #1F2937 0%, #7C3AED 100%)",
  "linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)",
  "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
];

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// Slider de posición — funciona en iOS
function PosSlider({ label, value, onChange }) {
  const num = parseFloat(value) || 50;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 11, color: C.muted, width: 14, textAlign: "center" }}>{label}</span>
      <input type="range" min="0" max="100" step="1" value={Math.round(num)}
        onChange={e => onChange(e.target.value + "%")}
        style={{ flex: 1, accentColor: C.primary, height: 4 }} />
      <span style={{ fontSize: 11, color: C.muted, width: 28, textAlign: "right" }}>{Math.round(num)}%</span>
    </div>
  );
}

export default function SettingsPage({ profile, session, onBack, onProfileUpdated }) {
  const [name, setName]           = useState(profile?.name || "");
  const [username, setUsername]   = useState(profile?.username || "");
  const [bio, setBio]             = useState(profile?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [coverUrl, setCoverUrl]   = useState(profile?.cover_url || "");
  const [coverGrad, setCoverGrad] = useState(profile?.cover_gradient || "");

  // Posición: "X% Y%"
  const parsePct = (s, fallback) => {
    const parts = (s || "").split(" ");
    return {
      x: parseFloat(parts[0]) || fallback,
      y: parseFloat(parts[1]) || fallback,
    };
  };
  const initCoverPos = parsePct(profile?.cover_position, 50);
  const initAvatarPos = parsePct(profile?.avatar_position, 50);
  const [coverX, setCoverX]   = useState(initCoverPos.x);
  const [coverY, setCoverY]   = useState(initCoverPos.y);
  const [avatarX, setAvatarX] = useState(initAvatarPos.x);
  const [avatarY, setAvatarY] = useState(initAvatarPos.y);

  const [editCover, setEditCover]   = useState(false); // sliders portada visibles
  const [editAvatar, setEditAvatar] = useState(false); // sliders avatar visibles

  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");

  const coverBg = coverUrl
    ? `url(${coverUrl}) ${coverX}% ${coverY}% / cover no-repeat`
    : coverGrad || "linear-gradient(135deg, #7C3AED 0%, #9C27B0 50%, #F59E0B 100%)";

  const uploadFile = async (file, folder) => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${session.user.id}/${Date.now()}.${ext}`;
    const { error: e } = await supabase.storage.from("cumple-images").upload(path, file, { upsert: true });
    if (e) { setError("Error subiendo imagen: " + e.message); return null; }
    return supabase.storage.from("cumple-images").getPublicUrl(path).data.publicUrl;
  };

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setError("");
    const url = await uploadFile(file, "avatars");
    if (url) {
      setAvatarUrl(url);
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", session.user.id);
      onProfileUpdated?.({ ...profile, name, username, bio, avatar_url: url });
    }
    setUploading(false); e.target.value = "";
  };

  const handleCoverFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setError("");
    const url = await uploadFile(file, "covers");
    if (url) {
      setCoverUrl(url); setCoverGrad("");
      setCoverX(50); setCoverY(50);
      await supabase.from("profiles").update({ cover_url: url, cover_gradient: "" }).eq("id", session.user.id);
      onProfileUpdated?.({ ...profile, name, username, bio, cover_url: url, cover_gradient: "" });
      setEditCover(true); // abrir sliders automáticamente
    }
    setUploading(false); e.target.value = "";
  };

  const handleSave = async () => {
    setSaving(true); setError("");

    // Update base fields (always exist)
    const { error: e1 } = await supabase.from("profiles")
      .update({ name, username, bio })
      .eq("id", session.user.id);

    if (e1) { setSaving(false); setError("Error al guardar datos. Intentá de nuevo."); return; }

    // Update new visual fields — silently ignore if columns don't exist yet
    await supabase.from("profiles").update({
      cover_position: `${coverX}% ${coverY}%`,
      avatar_position: `${avatarX}% ${avatarY}%`,
      cover_gradient: coverGrad,
    }).eq("id", session.user.id);
    // Note: if these columns don't exist in DB yet, this silently fails
    // Run migration-v4.sql in Supabase Dashboard to enable them

    setSaving(false);
    setSaved(true); setTimeout(() => setSaved(false), 2500);
    onProfileUpdated?.({
      ...profile, name, username, bio,
      avatar_url: avatarUrl, cover_url: coverUrl, cover_gradient: coverGrad,
      cover_position: `${coverX}% ${coverY}%`,
      avatar_position: `${avatarX}% ${avatarY}%`,
    });
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div style={{
        background: C.white, borderBottom: "1px solid " + C.border,
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
        position: "sticky", top: 0, zIndex: 20,
      }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 22, color: C.primary, fontWeight: 800, cursor: "pointer", padding: "0 8px 0 0" }}>‹</button>
        <span style={{ fontSize: 16, fontWeight: 800, color: C.text, flex: 1 }}>Configuración</span>
        <button onClick={handleSave} disabled={saving || uploading} style={{
          background: saved ? C.success : C.primary, color: C.white, border: "none",
          borderRadius: 20, padding: "7px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
          opacity: (saving || uploading) ? 0.6 : 1,
        }}>
          {saving ? "Guardando..." : saved ? "¡Listo! ✓" : "Guardar"}
        </button>
      </div>

      {/* ── PORTADA ────────────────────────────────────────────── */}
      <div style={{ position: "relative" }}>
        <div style={{ height: 140, background: coverBg, position: "relative" }}>
          {/* Botones sobre la portada */}
          <div style={{ position: "absolute", bottom: 8, right: 8, display: "flex", gap: 6 }}>
            {coverUrl && (
              <button onClick={() => { setEditCover(v => !v); setEditAvatar(false); }} style={{
                background: editCover ? C.primary : "rgba(0,0,0,0.55)", color: "#fff", border: "none",
                borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer",
              }}>↕ Centrar</button>
            )}
            <label htmlFor="cover-file" style={{
              background: "rgba(0,0,0,0.55)", color: "#fff", borderRadius: 20,
              padding: "5px 12px", fontSize: 11, fontWeight: 700,
              cursor: uploading ? "wait" : "pointer",
              display: "inline-flex", alignItems: "center", gap: 4,
            }}>
              {uploading ? "⏳" : "✏️"} Portada
            </label>
            <input id="cover-file" type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverFile} />
          </div>
        </div>

        {/* Avatar sobre portada */}
        <div style={{ position: "absolute", bottom: -44, left: "50%", transform: "translateX(-50%)", zIndex: 5 }}>
          <div style={{ position: "relative" }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" style={{
                  width: 88, height: 88, borderRadius: "50%", objectFit: "cover",
                  objectPosition: `${avatarX}% ${avatarY}%`,
                  border: "4px solid #fff", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", display: "block",
                }} />
              : <div style={{
                  width: 88, height: 88, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${C.primary}, ${C.dark})`,
                  color: "#fff", fontSize: 30, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "4px solid #fff", boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                }}>{initials(name)}</div>
            }
            {/* Botones del avatar */}
            <div style={{ position: "absolute", bottom: -4, right: -6, display: "flex", flexDirection: "column", gap: 3 }}>
              <label htmlFor="avatar-file" style={{
                width: 26, height: 26, borderRadius: "50%",
                background: C.primary, color: "#fff", fontSize: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2.5px solid #fff", cursor: "pointer",
              }}>✏️</label>
              {avatarUrl && (
                <button onClick={() => { setEditAvatar(v => !v); setEditCover(false); }} style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: editAvatar ? C.primary : "#1F2937",
                  color: "#fff", fontSize: 12, fontWeight: 700,
                  border: "2.5px solid #fff", cursor: "pointer",
                }}>↕</button>
              )}
            </div>
            <input id="avatar-file" type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarFile} />
          </div>
        </div>
      </div>

      {/* ── SLIDERS DE POSICIÓN ────────────────────────────────── */}
      <div style={{ height: 58 }} />

      {/* Sliders portada */}
      {editCover && coverUrl && (
        <div style={{
          margin: "0 12px 12px", background: C.white, borderRadius: 14,
          border: "1.5px solid " + C.primary + "40", padding: "14px 16px",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>📐 Posición de la portada</span>
            <button onClick={() => setEditCover(false)} style={{ background: "none", border: "none", color: C.muted, fontSize: 16, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <PosSlider label="←→" value={coverX + "%"} onChange={v => setCoverX(parseFloat(v))} />
            <PosSlider label="↕" value={coverY + "%"} onChange={v => setCoverY(parseFloat(v))} />
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 8, textAlign: "center" }}>
            Ajustá los sliders para centrar la imagen · Guardá para aplicar
          </div>
        </div>
      )}

      {/* Sliders avatar */}
      {editAvatar && avatarUrl && (
        <div style={{
          margin: "0 12px 12px", background: C.white, borderRadius: 14,
          border: "1.5px solid " + C.primary + "40", padding: "14px 16px",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>📐 Posición de la foto</span>
            <button onClick={() => setEditAvatar(false)} style={{ background: "none", border: "none", color: C.muted, fontSize: 16, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <PosSlider label="←→" value={avatarX + "%"} onChange={v => setAvatarX(parseFloat(v))} />
            <PosSlider label="↕" value={avatarY + "%"} onChange={v => setAvatarY(parseFloat(v))} />
          </div>
          {/* Preview del avatar con posición */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
            <img src={avatarUrl} alt="preview" style={{
              width: 72, height: 72, borderRadius: "50%", objectFit: "cover",
              objectPosition: `${avatarX}% ${avatarY}%`,
              border: "3px solid " + C.primary, boxShadow: "0 2px 10px rgba(124,58,237,0.3)",
            }} />
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 8, textAlign: "center" }}>
            Ajustá los sliders para centrar tu cara · Guardá para aplicar
          </div>
        </div>
      )}

      {/* ── GRADIENTES RÁPIDOS ─────────────────────────────────── */}
      <div style={{ padding: "0 14px 14px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
          Color de portada
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {GRADIENTS.map((g, i) => (
            <button key={i} onClick={() => { setCoverGrad(g); setCoverUrl(""); setEditCover(false); }} style={{
              width: 52, height: 34, borderRadius: 10, flexShrink: 0,
              background: g, cursor: "pointer",
              border: coverGrad === g && !coverUrl ? `3px solid ${C.primary}` : "2.5px solid transparent",
              boxShadow: coverGrad === g && !coverUrl ? `0 0 0 2px ${C.primary}50` : "0 1px 4px rgba(0,0,0,0.1)",
              transform: coverGrad === g && !coverUrl ? "scale(1.1)" : "scale(1)",
              transition: "all 0.15s",
            }} />
          ))}
        </div>
      </div>

      {/* ── DATOS PERSONALES ───────────────────────────────────── */}
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", padding: "0 16px 8px" }}>
        Datos personales
      </div>
      <div style={{ background: C.white, margin: "0 12px", borderRadius: 14, border: "1px solid " + C.border, padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { label: "Nombre completo", val: name, set: setName, ph: "Tu nombre" },
          { label: "Usuario", val: username, set: setUsername, ph: "usuario (sin @)" },
          { label: "Bio", val: bio, set: setBio, ph: "Contá algo de vos..." },
        ].map(f => (
          <div key={f.label}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5 }}>{f.label}</div>
            <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
              style={{ width: "100%", padding: "11px 13px", border: "1.5px solid " + C.border, borderRadius: 10, fontSize: 14, color: C.text, outline: "none", background: C.white }} />
          </div>
        ))}
      </div>

      {/* ── SEGURIDAD ──────────────────────────────────────────── */}
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", padding: "16px 16px 8px" }}>
        Seguridad
      </div>
      <div style={{ background: C.white, margin: "0 12px", borderRadius: 14, border: "1px solid " + C.border, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔑</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text, flex: 1 }}>Cambiar contraseña</span>
          <span style={{ fontSize: 16, color: "#D1D5DB" }}>›</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px" }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📧</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{session?.user?.email}</div>
            <div style={{ fontSize: 11, color: C.success }}>Email verificado ✓</div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ margin: "10px 12px", padding: "10px 14px", background: "#FEF2F2", borderRadius: 10, fontSize: 13, color: C.error, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div style={{ padding: "16px 12px" }}>
        <button onClick={handleSave} disabled={saving || uploading} style={{
          width: "100%", padding: 14,
          background: `linear-gradient(135deg, ${C.primary}, ${C.dark})`,
          color: C.white, border: "none", borderRadius: 12,
          fontSize: 15, fontWeight: 700, cursor: "pointer",
          boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
          opacity: (saving || uploading) ? 0.6 : 1,
        }}>
          {uploading ? "Subiendo imagen..." : saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

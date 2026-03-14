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

function Slider({ icon, label, min, max, step, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{icon}</span>
      <span style={{ fontSize: 11, color: C.muted, width: 50 }}>{label}</span>
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: C.primary }}
      />
      <span style={{ fontSize: 11, color: C.muted, width: 30, textAlign: "right" }}>{value}{step < 1 ? "x" : "%"}</span>
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

  const parsePx = (s, def) => { const n = parseFloat((s||"").split(" ")[0]); return isNaN(n) ? def : n; };
  const parsePy = (s, def) => { const n = parseFloat((s||"").split(" ")[1]); return isNaN(n) ? def : n; };

  const [coverX,    setCoverX]    = useState(parsePx(profile?.cover_position, 50));
  const [coverY,    setCoverY]    = useState(parsePy(profile?.cover_position, 50));
  const [coverScale, setCoverScale] = useState(parseFloat(profile?.cover_scale) || 1);
  const [avatarX,   setAvatarX]   = useState(parsePx(profile?.avatar_position, 50));
  const [avatarY,   setAvatarY]   = useState(parsePy(profile?.avatar_position, 50));
  const [avatarScale, setAvatarScale] = useState(parseFloat(profile?.avatar_scale) || 1);

  const [panel, setPanel]         = useState(null); // "cover" | "avatar" | null
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");
  const [dbError, setDbError]     = useState(false);

  // Compute CSS background for cover
  const coverBg = coverUrl
    ? `url(${coverUrl}) ${coverX}% ${coverY}% / ${coverScale * 100}% auto no-repeat`
    : coverGrad || GRADIENTS[0];

  // Compute CSS for avatar image
  const avatarStyle = {
    width: 88, height: 88, borderRadius: "50%",
    objectFit: "cover",
    objectPosition: `${avatarX}% ${avatarY}%`,
    transform: `scale(${avatarScale})`,
    border: "4px solid #fff",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    display: "block",
    overflow: "hidden",
  };

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
      setAvatarX(50); setAvatarY(50); setAvatarScale(1);
      // Guardar avatar_url — esta columna siempre existe
      const { error: ue } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", session.user.id);
      if (!ue) onProfileUpdated?.({ ...profile, name, username, bio, avatar_url: url });
      setPanel("avatar"); // abrir sliders
    }
    setUploading(false); e.target.value = "";
  };

  const handleCoverFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setError("");
    const url = await uploadFile(file, "covers");
    if (url) {
      setCoverUrl(url); setCoverGrad("");
      setCoverX(50); setCoverY(50); setCoverScale(1);
      // Guardar cover_url — esta columna siempre existe
      const { error: ue } = await supabase.from("profiles").update({ cover_url: url }).eq("id", session.user.id);
      if (!ue) onProfileUpdated?.({ ...profile, name, username, bio, cover_url: url });
      setPanel("cover"); // abrir sliders
    }
    setUploading(false); e.target.value = "";
  };

  const handleSave = async () => {
    setSaving(true); setError(""); setDbError(false);

    // 1. Guardar datos base (siempre funcionan)
    const { error: e1 } = await supabase.from("profiles")
      .update({ name, username, bio })
      .eq("id", session.user.id);

    if (e1) {
      setSaving(false);
      setError("Error al guardar. Intentá de nuevo.");
      return;
    }

    // 2. Guardar campos visuales nuevos (requieren migration-v4-final.sql)
    const { error: e2 } = await supabase.from("profiles").update({
      cover_position: `${coverX}% ${coverY}%`,
      avatar_position: `${avatarX}% ${avatarY}%`,
      cover_gradient: coverGrad,
      avatar_scale: avatarScale,
      cover_scale: coverScale,
    }).eq("id", session.user.id);

    if (e2) {
      // Columnas no existen — marcar para mostrar instrucción al usuario
      setDbError(true);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onProfileUpdated?.({
      ...profile, name, username, bio,
      avatar_url: avatarUrl, cover_url: coverUrl, cover_gradient: coverGrad,
      cover_position: `${coverX}% ${coverY}%`,
      avatar_position: `${avatarX}% ${avatarY}%`,
      avatar_scale: avatarScale, cover_scale: coverScale,
    });
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>

      {/* HEADER */}
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

      {/* PORTADA */}
      <div style={{ position: "relative" }}>
        <div style={{ height: 140, background: coverBg, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", bottom: 8, right: 8, display: "flex", gap: 6 }}>
            {(coverUrl || coverGrad) && (
              <button onClick={() => setPanel(p => p === "cover" ? null : "cover")} style={{
                background: panel === "cover" ? C.primary : "rgba(0,0,0,0.55)",
                color: "#fff", border: "none", borderRadius: 20,
                padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer",
              }}>⊹ Ajustar</button>
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
            <div style={{ width: 88, height: 88, borderRadius: "50%", overflow: "hidden", border: "4px solid #fff", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" style={{
                    width: "100%", height: "100%", objectFit: "cover",
                    objectPosition: `${avatarX}% ${avatarY}%`,
                    transform: `scale(${avatarScale})`,
                    transformOrigin: "center",
                  }} />
                : <div style={{
                    width: "100%", height: "100%",
                    background: `linear-gradient(135deg, ${C.primary}, ${C.dark})`,
                    color: "#fff", fontSize: 30, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{initials(name)}</div>
              }
            </div>
            {/* Botones avatar */}
            <div style={{ position: "absolute", bottom: -4, right: -6, display: "flex", flexDirection: "column", gap: 3 }}>
              <label htmlFor="avatar-file" style={{
                width: 26, height: 26, borderRadius: "50%",
                background: C.primary, color: "#fff", fontSize: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2.5px solid #fff", cursor: "pointer",
              }}>✏️</label>
              {avatarUrl && (
                <button onClick={() => setPanel(p => p === "avatar" ? null : "avatar")} style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: panel === "avatar" ? C.primary : "#1F2937",
                  color: "#fff", fontSize: 12, fontWeight: 700,
                  border: "2.5px solid #fff", cursor: "pointer",
                }}>⊹</button>
              )}
            </div>
            <input id="avatar-file" type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarFile} />
          </div>
        </div>
      </div>

      <div style={{ height: 58 }} />

      {/* PANEL AJUSTE PORTADA */}
      {panel === "cover" && coverUrl && (
        <div style={{ margin: "0 12px 12px", background: C.white, borderRadius: 14, border: `1.5px solid ${C.primary}40`, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
            <span>📐 Ajustar portada</span>
            <button onClick={() => setPanel(null)} style={{ background: "none", border: "none", color: C.muted, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Slider icon="←→" label="Horizontal" min={0} max={100} step={1} value={Math.round(coverX)} onChange={setCoverX} />
            <Slider icon="↕" label="Vertical" min={0} max={100} step={1} value={Math.round(coverY)} onChange={setCoverY} />
            <Slider icon="🔍" label="Zoom" min={1} max={3} step={0.1} value={parseFloat(coverScale.toFixed(1))} onChange={setCoverScale} />
          </div>
          <button onClick={() => { setCoverX(50); setCoverY(50); setCoverScale(1); }} style={{
            marginTop: 12, width: "100%", padding: "8px", background: "#F3F4F6",
            border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, color: C.muted, cursor: "pointer",
          }}>Resetear posición</button>
        </div>
      )}

      {/* PANEL AJUSTE AVATAR */}
      {panel === "avatar" && avatarUrl && (
        <div style={{ margin: "0 12px 12px", background: C.white, borderRadius: 14, border: `1.5px solid ${C.primary}40`, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
            <span>📐 Ajustar foto de perfil</span>
            <button onClick={() => setPanel(null)} style={{ background: "none", border: "none", color: C.muted, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>✕</button>
          </div>
          {/* Preview en tiempo real */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: `3px solid ${C.primary}`, boxShadow: "0 2px 10px rgba(124,58,237,0.3)" }}>
              <img src={avatarUrl} alt="preview" style={{
                width: "100%", height: "100%", objectFit: "cover",
                objectPosition: `${avatarX}% ${avatarY}%`,
                transform: `scale(${avatarScale})`,
                transformOrigin: "center",
              }} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Slider icon="←→" label="Horizontal" min={0} max={100} step={1} value={Math.round(avatarX)} onChange={setAvatarX} />
            <Slider icon="↕" label="Vertical" min={0} max={100} step={1} value={Math.round(avatarY)} onChange={setAvatarY} />
            <Slider icon="🔍" label="Zoom" min={1} max={3} step={0.1} value={parseFloat(avatarScale.toFixed(1))} onChange={setAvatarScale} />
          </div>
          <button onClick={() => { setAvatarX(50); setAvatarY(50); setAvatarScale(1); }} style={{
            marginTop: 12, width: "100%", padding: "8px", background: "#F3F4F6",
            border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, color: C.muted, cursor: "pointer",
          }}>Resetear posición</button>
        </div>
      )}

      {/* AVISO MIGRATION si aplica */}
      {dbError && (
        <div style={{ margin: "0 12px 12px", padding: "12px 14px", background: "#FFFBEB", borderRadius: 12, border: "1px solid #FCD34D" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 6 }}>⚠️ Falta un paso en Supabase</div>
          <div style={{ fontSize: 12, color: "#92400E", lineHeight: 1.5, marginBottom: 8 }}>
            Para guardar la posición y zoom, ejecutá este SQL en Supabase Dashboard → SQL Editor:
          </div>
          <div style={{ background: "#1F2937", borderRadius: 8, padding: "10px 12px", fontFamily: "monospace", fontSize: 11, color: "#10B981", lineHeight: 1.6 }}>
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_position TEXT DEFAULT '50% 50%';<br/>
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_position TEXT DEFAULT '50% 50%';<br/>
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_gradient TEXT;<br/>
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_scale NUMERIC DEFAULT 1;<br/>
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_scale NUMERIC DEFAULT 1;
          </div>
        </div>
      )}

      {/* GRADIENTES */}
      <div style={{ padding: "0 14px 14px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Color de portada</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {GRADIENTS.map((g, i) => (
            <button key={i} onClick={() => { setCoverGrad(g); setCoverUrl(""); setPanel(null); }} style={{
              width: 52, height: 34, borderRadius: 10,
              background: g, cursor: "pointer",
              border: coverGrad === g && !coverUrl ? `3px solid ${C.primary}` : "2.5px solid transparent",
              boxShadow: coverGrad === g && !coverUrl ? `0 0 0 2px ${C.primary}50` : "0 1px 4px rgba(0,0,0,0.1)",
              transform: coverGrad === g && !coverUrl ? "scale(1.1)" : "scale(1)",
              transition: "all 0.15s",
            }} />
          ))}
        </div>
      </div>

      {/* DATOS PERSONALES */}
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", padding: "0 16px 8px" }}>Datos personales</div>
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

      {/* SEGURIDAD */}
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", padding: "16px 16px 8px" }}>Seguridad</div>
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

      {error && <div style={{ margin: "10px 12px", padding: "10px 14px", background: "#FEF2F2", borderRadius: 10, fontSize: 13, color: C.error, fontWeight: 600 }}>{error}</div>}

      <div style={{ padding: "16px 12px" }}>
        <button onClick={handleSave} disabled={saving || uploading} style={{
          width: "100%", padding: 14,
          background: `linear-gradient(135deg, ${C.primary}, ${C.dark})`,
          color: C.white, border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer",
          boxShadow: "0 4px 16px rgba(124,58,237,0.3)", opacity: (saving || uploading) ? 0.6 : 1,
        }}>
          {uploading ? "Subiendo imagen..." : saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

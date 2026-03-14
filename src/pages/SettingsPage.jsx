import { useState, useRef } from "react";
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

// Componente de reposicionamiento con drag
function DragReposition({ onDone, children }) {
  const ref = useRef(null);
  const drag = useRef(null);

  const getXY = (e) => {
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX, y: t.clientY };
  };

  const onStart = (e) => {
    e.preventDefault();
    const { x, y } = getXY(e);
    drag.current = { startX: x, startY: y };
  };

  const onMove = (e) => {
    if (!drag.current || !ref.current) return;
    e.preventDefault();
    const { x, y } = getXY(e);
    const dx = x - drag.current.startX;
    const dy = y - drag.current.startY;
    drag.current.startX = x;
    drag.current.startY = y;
    // Emit position change via custom event
    ref.current.dispatchEvent(new CustomEvent("poschange", { detail: { dx, dy }, bubbles: true }));
  };

  const onEnd = () => { drag.current = null; };

  return (
    <div ref={ref} onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd}
      onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
      style={{ position: "relative", cursor: "grab", userSelect: "none", touchAction: "none" }}>
      {/* Overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 10,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
        background: "rgba(0,0,0,0.45)",
        borderRadius: "inherit",
      }}>
        <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, background: "rgba(0,0,0,0.5)", padding: "6px 16px", borderRadius: 20 }}>
          ↕ Arrastrá para recentrar
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDone(); }} style={{
          background: C.primary, color: "#fff", border: "none",
          borderRadius: 20, padding: "6px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer",
        }}>Listo ✓</button>
      </div>
      {children}
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
  const [coverPos, setCoverPos]   = useState(profile?.cover_position || "50% 50%");
  const [avatarPos, setAvatarPos] = useState(profile?.avatar_position || "50% 50%");

  const [mode, setMode]           = useState(null); // "cover" | "avatar" | null
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");

  // Escuchar eventos de drag para la portada
  const coverRef = useRef(null);
  const avatarRef = useRef(null);

  const handleCoverPosChange = (e) => {
    const { dx, dy } = e.detail;
    setCoverPos(prev => {
      const [px, py] = prev.split(" ").map(v => parseFloat(v));
      const nx = Math.max(0, Math.min(100, px - (dx / 3)));
      const ny = Math.max(0, Math.min(100, py - (dy / 3)));
      return `${nx.toFixed(1)}% ${ny.toFixed(1)}%`;
    });
  };

  const handleAvatarPosChange = (e) => {
    const { dx, dy } = e.detail;
    setAvatarPos(prev => {
      const [px, py] = prev.split(" ").map(v => parseFloat(v));
      const nx = Math.max(0, Math.min(100, px - (dx / 1.5)));
      const ny = Math.max(0, Math.min(100, py - (dy / 1.5)));
      return `${nx.toFixed(1)}% ${ny.toFixed(1)}%`;
    });
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
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", session.user.id);
      onProfileUpdated?.({ ...profile, name, username, bio, avatar_url: url, cover_url: coverUrl, cover_gradient: coverGrad });
    }
    setUploading(false); e.target.value = "";
  };

  const handleCoverFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setError("");
    const url = await uploadFile(file, "covers");
    if (url) {
      setCoverUrl(url); setCoverGrad("");
      await supabase.from("profiles").update({ cover_url: url, cover_gradient: "" }).eq("id", session.user.id);
      onProfileUpdated?.({ ...profile, name, username, bio, avatar_url: avatarUrl, cover_url: url, cover_gradient: "" });
    }
    setUploading(false); e.target.value = "";
  };

  const handleSave = async () => {
    setSaving(true); setError("");
    const { error: e } = await supabase.from("profiles").update({
      name, username, bio,
      cover_position: coverPos, avatar_position: avatarPos,
      cover_gradient: coverGrad,
    }).eq("id", session.user.id);
    setSaving(false);
    if (e) { setError("Error al guardar. Intentá de nuevo."); return; }
    setSaved(true); setTimeout(() => setSaved(false), 2500);
    onProfileUpdated?.({ ...profile, name, username, bio, avatar_url: avatarUrl, cover_url: coverUrl, cover_gradient: coverGrad, cover_position: coverPos, avatar_position: avatarPos });
  };

  // Calcular el background de la portada
  const coverBg = coverUrl
    ? `url(${coverUrl}) ${coverPos}/cover no-repeat`
    : coverGrad
    ? coverGrad
    : "linear-gradient(135deg, #7C3AED 0%, #9C27B0 50%, #F59E0B 100%)";

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
          borderRadius: 20, padding: "7px 20px", fontSize: 13, fontWeight: 700,
          cursor: "pointer", opacity: (saving || uploading) ? 0.6 : 1,
          transition: "background 0.2s",
        }}>
          {saving ? "Guardando..." : saved ? "¡Listo! ✓" : "Guardar"}
        </button>
      </div>

      {/* ── PORTADA ────────────────────────────────────────────── */}
      <div style={{ position: "relative" }}>

        {/* La portada — con drag si está en modo reposición */}
        {mode === "cover" ? (
          <DragReposition onDone={() => setMode(null)}>
            <div ref={coverRef} onPosChange={handleCoverPosChange}
              style={{ height: 140, background: coverBg, width: "100%" }}
              onMouseDown={(e) => { coverRef._drag = { x: e.clientX, y: e.clientY }; }}
              onMouseMove={(e) => {
                if (!coverRef._drag) return;
                const dx = e.clientX - coverRef._drag.x;
                const dy = e.clientY - coverRef._drag.y;
                coverRef._drag = { x: e.clientX, y: e.clientY };
                setCoverPos(prev => {
                  const [px, py] = prev.split(" ").map(v => parseFloat(v));
                  return `${Math.max(0,Math.min(100, px - dx/3)).toFixed(1)}% ${Math.max(0,Math.min(100, py - dy/3)).toFixed(1)}%`;
                });
              }}
              onMouseUp={() => { coverRef._drag = null; }}
              onTouchStart={(e) => { coverRef._drag = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
              onTouchMove={(e) => {
                if (!coverRef._drag) return;
                const dx = e.touches[0].clientX - coverRef._drag.x;
                const dy = e.touches[0].clientY - coverRef._drag.y;
                coverRef._drag = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                setCoverPos(prev => {
                  const [px, py] = prev.split(" ").map(v => parseFloat(v));
                  return `${Math.max(0,Math.min(100, px - dx/3)).toFixed(1)}% ${Math.max(0,Math.min(100, py - dy/3)).toFixed(1)}%`;
                });
              }}
              onTouchEnd={() => { coverRef._drag = null; }}
            />
          </DragReposition>
        ) : (
          <div style={{ height: 140, background: coverBg, position: "relative" }}>
            {/* Botones en la portada */}
            <div style={{ position: "absolute", bottom: 8, right: 8, display: "flex", gap: 6 }}>
              {(coverUrl || coverGrad) && (
                <button onClick={() => setMode("cover")} style={{
                  background: "rgba(0,0,0,0.55)", color: "#fff", border: "none",
                  borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                }}>↕ Centrar</button>
              )}
              <label htmlFor="cover-file" style={{
                background: "rgba(0,0,0,0.55)", color: "#fff",
                borderRadius: 8, padding: "5px 11px", fontSize: 11, fontWeight: 700,
                cursor: uploading ? "wait" : "pointer",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                {uploading ? "⏳" : "✏️"} Portada
              </label>
              <input id="cover-file" type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverFile} />
            </div>
          </div>
        )}

        {/* Avatar centrado sobre portada */}
        <div style={{ position: "absolute", bottom: -44, left: "50%", transform: "translateX(-50%)", zIndex: 5 }}>
          <div style={{ position: "relative" }}>
            {/* La foto de avatar */}
            {mode === "avatar" ? (
              <div style={{ position: "relative" }}>
                <img src={avatarUrl} alt="avatar" style={{
                  width: 88, height: 88, borderRadius: "50%", objectFit: "cover",
                  objectPosition: avatarPos,
                  border: "4px solid #fff", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", display: "block",
                  cursor: "grab", userSelect: "none", touchAction: "none",
                }}
                onMouseDown={(e) => { avatarRef._drag = { x: e.clientX, y: e.clientY }; e.preventDefault(); }}
                onMouseMove={(e) => {
                  if (!avatarRef._drag) return;
                  const dx = e.clientX - avatarRef._drag.x;
                  const dy = e.clientY - avatarRef._drag.y;
                  avatarRef._drag = { x: e.clientX, y: e.clientY };
                  setAvatarPos(prev => {
                    const [px, py] = prev.split(" ").map(v => parseFloat(v));
                    return `${Math.max(0,Math.min(100, px - dx/1.2)).toFixed(1)}% ${Math.max(0,Math.min(100, py - dy/1.2)).toFixed(1)}%`;
                  });
                }}
                onMouseUp={() => { avatarRef._drag = null; }}
                onTouchStart={(e) => { avatarRef._drag = { x: e.touches[0].clientX, y: e.touches[0].clientY }; e.preventDefault(); }}
                onTouchMove={(e) => {
                  if (!avatarRef._drag) return;
                  const dx = e.touches[0].clientX - avatarRef._drag.x;
                  const dy = e.touches[0].clientY - avatarRef._drag.y;
                  avatarRef._drag = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                  setAvatarPos(prev => {
                    const [px, py] = prev.split(" ").map(v => parseFloat(v));
                    return `${Math.max(0,Math.min(100, px - dx/1.2)).toFixed(1)}% ${Math.max(0,Math.min(100, py - dy/1.2)).toFixed(1)}%`;
                  });
                }}
                onTouchEnd={() => { avatarRef._drag = null; }}
                />
                {/* Overlay de reposición en avatar */}
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: "rgba(0,0,0,0.45)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 2,
                }}>
                  <span style={{ color: "#fff", fontSize: 9, fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>↕</span>
                </div>
                <button onClick={() => setMode(null)} style={{
                  position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)",
                  background: C.primary, color: "#fff", border: "none",
                  borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700,
                  cursor: "pointer", whiteSpace: "nowrap",
                }}>Listo ✓</button>
              </div>
            ) : avatarUrl ? (
              <img src={avatarUrl} alt="avatar" style={{
                width: 88, height: 88, borderRadius: "50%", objectFit: "cover",
                objectPosition: avatarPos,
                border: "4px solid #fff", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", display: "block",
              }} />
            ) : (
              <div style={{
                width: 88, height: 88, borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.primary}, ${C.dark})`,
                color: "#fff", fontSize: 30, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "4px solid #fff", boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              }}>{initials(name)}</div>
            )}

            {/* Botones del avatar — solo cuando NO está en modo reposición */}
            {mode !== "avatar" && (
              <div style={{ position: "absolute", bottom: -2, right: -4, display: "flex", flexDirection: "column", gap: 3 }}>
                <label htmlFor="avatar-file" style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: C.primary, color: "#fff", fontSize: 11,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2.5px solid #fff", cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(124,58,237,0.4)",
                }}>✏️</label>
                {avatarUrl && (
                  <button onClick={() => setMode("avatar")} style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: "#1F2937", color: "#fff", fontSize: 10, fontWeight: 700,
                    border: "2.5px solid #fff", cursor: "pointer",
                  }}>↕</button>
                )}
              </div>
            )}
            <input id="avatar-file" type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarFile} />
          </div>
        </div>
      </div>

      {/* Espaciador */}
      <div style={{ height: 58 }} />

      {/* ── GRADIENTES RÁPIDOS ─────────────────────────────────── */}
      <div style={{ padding: "0 14px 14px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
          Color de portada
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
          {GRADIENTS.map((g, i) => (
            <button key={i} onClick={() => { setCoverGrad(g); setCoverUrl(""); }} style={{
              width: 52, height: 32, borderRadius: 8, flexShrink: 0,
              background: g, cursor: "pointer",
              border: coverGrad === g && !coverUrl ? `3px solid ${C.primary}` : "2px solid transparent",
              outline: coverGrad === g && !coverUrl ? `2px solid ${C.primary}40` : "none",
              transform: coverGrad === g && !coverUrl ? "scale(1.08)" : "scale(1)",
              transition: "transform 0.15s, border 0.15s",
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

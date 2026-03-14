import { useState, useRef, useEffect, useCallback } from "react";
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

// Parsear visual prefs guardadas en payment_alias como JSON
function parseVisual(paymentAlias) {
  try {
    if (!paymentAlias) return {};
    if (paymentAlias.startsWith("{")) return JSON.parse(paymentAlias);
    return {}; // si es un alias real, no tocamos nada
  } catch { return {}; }
}
function serializeVisual(alias, visual) {
  // Si el alias original no era un JSON, lo preservamos en el objeto
  const orig = (alias && !alias.startsWith("{")) ? alias : null;
  return JSON.stringify({ ...visual, _alias: orig });
}
function getRealAlias(paymentAlias) {
  try {
    if (!paymentAlias) return "";
    if (paymentAlias.startsWith("{")) {
      const d = JSON.parse(paymentAlias);
      return d._alias || "";
    }
    return paymentAlias;
  } catch { return paymentAlias || ""; }
}

// Hook de drag que funciona en iOS y desktop
function useDrag({ onDelta, active }) {
  const last = useRef(null);

  const getPoint = (e) => {
    if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  };

  const onStart = useCallback((e) => {
    if (!active) return;
    e.preventDefault();
    e.stopPropagation();
    last.current = getPoint(e);
  }, [active]);

  const onMove = useCallback((e) => {
    if (!active || !last.current) return;
    e.preventDefault();
    e.stopPropagation();
    const pt = getPoint(e);
    const dx = pt.x - last.current.x;
    const dy = pt.y - last.current.y;
    last.current = pt;
    onDelta(dx, dy);
  }, [active, onDelta]);

  const onEnd = useCallback(() => { last.current = null; }, []);

  return { onMouseDown: onStart, onMouseMove: onMove, onMouseUp: onEnd, onMouseLeave: onEnd,
           onTouchStart: onStart, onTouchMove: onMove, onTouchEnd: onEnd };
}

// Componente de imagen arrastrable
function DraggableImage({ src, x, y, scale, onChange, size, radius, active, border, shadow }) {
  const handleDelta = useCallback((dx, dy) => {
    onChange(prev => ({
      x: Math.max(0, Math.min(100, prev.x - (dx / size) * 100 * scale)),
      y: Math.max(0, Math.min(100, prev.y - (dy / size) * 100 * scale)),
    }));
  }, [onChange, size, scale]);

  const dragHandlers = useDrag({ onDelta: handleDelta, active });

  return (
    <div style={{
      width: size, height: size, borderRadius: radius, overflow: "hidden",
      border, boxShadow: shadow,
      cursor: active ? "grab" : "default",
      flexShrink: 0,
      touchAction: active ? "none" : "auto",
      userSelect: "none",
    }} {...(active ? dragHandlers : {})}>
      <img src={src} alt="" style={{
        width: `${scale * 100}%`,
        height: `${scale * 100}%`,
        objectFit: "cover",
        objectPosition: `${x}% ${y}%`,
        transform: `translate(${(50 - x) * (scale - 1) * 0.5}%, ${(50 - y) * (scale - 1) * 0.5}%)`,
        pointerEvents: "none",
        display: "block",
      }} />
    </div>
  );
}

// Componente de portada arrastrable
function DraggableCover({ url, gradient, x, y, scale, onChange, active, height }) {
  const ref = useRef(null);
  const handleDelta = useCallback((dx, dy) => {
    if (!ref.current) return;
    const w = ref.current.offsetWidth;
    const h = height;
    onChange(prev => ({
      x: Math.max(0, Math.min(100, prev.x - (dx / w) * 100)),
      y: Math.max(0, Math.min(100, prev.y - (dy / h) * 100)),
    }));
  }, [onChange, height]);

  const dragHandlers = useDrag({ onDelta: handleDelta, active });

  const bg = url
    ? `url(${url}) ${x}% ${y}% / ${Math.round(scale * 100)}% auto no-repeat`
    : gradient || GRADIENTS[0];

  return (
    <div ref={ref} style={{
      height, width: "100%", background: bg,
      cursor: active ? "grab" : "default",
      touchAction: active ? "none" : "auto",
      userSelect: "none",
      position: "relative",
    }} {...(active ? dragHandlers : {})} />
  );
}

export default function SettingsPage({ profile, session, onBack, onProfileUpdated }) {
  const visual = parseVisual(profile?.payment_alias);

  const [name,     setName]     = useState(profile?.name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio,      setBio]      = useState(profile?.bio || "");
  const [realAlias, setRealAlias] = useState(getRealAlias(profile?.payment_alias));

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [coverUrl,  setCoverUrl]  = useState(profile?.cover_url || "");
  const [coverGrad, setCoverGrad] = useState(visual.coverGrad || "");

  const [coverPos,  setCoverPos]  = useState({ x: visual.cx ?? 50, y: visual.cy ?? 50 });
  const [coverScale, setCoverScale] = useState(visual.cs ?? 1);
  const [avatarPos,  setAvatarPos] = useState({ x: visual.ax ?? 50, y: visual.ay ?? 50 });
  const [avatarScale, setAvatarScale] = useState(visual.as ?? 1);

  const [panel,    setPanel]    = useState(null); // "cover"|"avatar"|null
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,    setError]    = useState("");

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
      setAvatarUrl(url); setAvatarPos({ x: 50, y: 50 }); setAvatarScale(1);
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", session.user.id);
      setPanel("avatar");
    }
    setUploading(false); e.target.value = "";
  };

  const handleCoverFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setError("");
    const url = await uploadFile(file, "covers");
    if (url) {
      setCoverUrl(url); setCoverGrad(""); setCoverPos({ x: 50, y: 50 }); setCoverScale(1);
      await supabase.from("profiles").update({ cover_url: url }).eq("id", session.user.id);
      setPanel("cover");
    }
    setUploading(false); e.target.value = "";
  };

  const handleSave = async () => {
    setSaving(true); setError("");

    // Serializar visual prefs en payment_alias
    const visualData = serializeVisual(
      realAlias,
      { cx: coverPos.x, cy: coverPos.y, cs: coverScale,
        ax: avatarPos.x, ay: avatarPos.y, as: avatarScale,
        coverGrad: coverGrad }
    );

    const { error: e } = await supabase.from("profiles").update({
      name, username, bio, payment_alias: visualData,
    }).eq("id", session.user.id);

    setSaving(false);
    if (e) { setError("Error al guardar: " + e.message); return; }
    setSaved(true); setTimeout(() => setSaved(false), 2500);
    onProfileUpdated?.({
      ...profile, name, username, bio,
      avatar_url: avatarUrl, cover_url: coverUrl,
      payment_alias: visualData,
    });
  };

  const coverBg = coverUrl
    ? `url(${coverUrl}) ${coverPos.x}% ${coverPos.y}% / ${Math.round(coverScale * 100)}% auto no-repeat`
    : coverGrad || GRADIENTS[0];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 90 }}>

      {/* HEADER */}
      <div style={{ background: C.white, borderBottom: "1px solid " + C.border, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 22, color: C.primary, fontWeight: 800, cursor: "pointer", padding: "0 8px 0 0" }}>‹</button>
        <span style={{ fontSize: 16, fontWeight: 800, color: C.text, flex: 1 }}>Configuración</span>
        <button onClick={handleSave} disabled={saving || uploading} style={{ background: saved ? C.success : C.primary, color: C.white, border: "none", borderRadius: 20, padding: "7px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: (saving || uploading) ? 0.6 : 1 }}>
          {saving ? "Guardando..." : saved ? "¡Listo! ✓" : "Guardar"}
        </button>
      </div>

      {/* PORTADA */}
      <div style={{ position: "relative" }}>
        {/* Cover draggable */}
        <div style={{ height: 140, width: "100%", background: coverBg, overflow: "hidden", position: "relative",
          cursor: panel === "cover" ? "grab" : "default",
          touchAction: panel === "cover" ? "none" : "auto",
          userSelect: "none",
        }}
          onMouseDown={panel === "cover" ? (e) => { e._drag = true; e.currentTarget._last = { x: e.clientX, y: e.clientY }; } : undefined}
          onMouseMove={panel === "cover" ? (e) => {
            if (!e.currentTarget._last) return;
            const dx = e.clientX - e.currentTarget._last.x;
            const dy = e.clientY - e.currentTarget._last.y;
            e.currentTarget._last = { x: e.clientX, y: e.clientY };
            setCoverPos(p => ({ x: Math.max(0, Math.min(100, p.x - dx / 3)), y: Math.max(0, Math.min(100, p.y - dy / 3)) }));
          } : undefined}
          onMouseUp={panel === "cover" ? (e) => { e.currentTarget._last = null; } : undefined}
          onTouchStart={panel === "cover" ? (e) => { e.preventDefault(); e.currentTarget._last = { x: e.touches[0].clientX, y: e.touches[0].clientY }; } : undefined}
          onTouchMove={panel === "cover" ? (e) => {
            e.preventDefault();
            if (!e.currentTarget._last) return;
            const dx = e.touches[0].clientX - e.currentTarget._last.x;
            const dy = e.touches[0].clientY - e.currentTarget._last.y;
            e.currentTarget._last = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            setCoverPos(p => ({ x: Math.max(0, Math.min(100, p.x - dx / 3)), y: Math.max(0, Math.min(100, p.y - dy / 3)) }));
          } : undefined}
          onTouchEnd={panel === "cover" ? (e) => { e.currentTarget._last = null; } : undefined}
        >
          {panel === "cover" && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, background: "rgba(0,0,0,0.5)", padding: "5px 14px", borderRadius: 20 }}>✋ Arrastrá para mover</span>
            </div>
          )}
          {panel !== "cover" && (
            <div style={{ position: "absolute", bottom: 8, right: 8, display: "flex", gap: 6 }}>
              {coverUrl && (
                <button onClick={() => setPanel(p => p === "cover" ? null : "cover")} style={{ background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  ✋ Mover
                </button>
              )}
              <label htmlFor="cover-file" style={{ background: "rgba(0,0,0,0.55)", color: "#fff", borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: uploading ? "wait" : "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                {uploading ? "⏳" : "✏️"} Portada
              </label>
              <input id="cover-file" type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverFile} />
            </div>
          )}
          {panel === "cover" && (
            <button onClick={() => setPanel(null)} style={{ position: "absolute", top: 8, right: 8, background: C.primary, color: "#fff", border: "none", borderRadius: 20, padding: "5px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              Listo ✓
            </button>
          )}
        </div>

        {/* Avatar sobre portada */}
        <div style={{ position: "absolute", bottom: -44, left: "50%", transform: "translateX(-50%)", zIndex: 5 }}>
          <div style={{ position: "relative" }}>
            {/* Avatar — arrastrable cuando panel==="avatar" */}
            <div style={{
              width: 88, height: 88, borderRadius: "50%", overflow: "hidden",
              border: "4px solid #fff", boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              cursor: panel === "avatar" ? "grab" : "default",
              touchAction: panel === "avatar" ? "none" : "auto",
              userSelect: "none",
              position: "relative",
            }}
              onMouseDown={panel === "avatar" ? (e) => { e.currentTarget._last = { x: e.clientX, y: e.clientY }; e.preventDefault(); } : undefined}
              onMouseMove={panel === "avatar" ? (e) => {
                if (!e.currentTarget._last) return;
                const dx = e.clientX - e.currentTarget._last.x;
                const dy = e.clientY - e.currentTarget._last.y;
                e.currentTarget._last = { x: e.clientX, y: e.clientY };
                setAvatarPos(p => ({ x: Math.max(0, Math.min(100, p.x - dx * 1.5)), y: Math.max(0, Math.min(100, p.y - dy * 1.5)) }));
              } : undefined}
              onMouseUp={panel === "avatar" ? (e) => { e.currentTarget._last = null; } : undefined}
              onTouchStart={panel === "avatar" ? (e) => { e.preventDefault(); e.currentTarget._last = { x: e.touches[0].clientX, y: e.touches[0].clientY }; } : undefined}
              onTouchMove={panel === "avatar" ? (e) => {
                e.preventDefault();
                if (!e.currentTarget._last) return;
                const dx = e.touches[0].clientX - e.currentTarget._last.x;
                const dy = e.touches[0].clientY - e.currentTarget._last.y;
                e.currentTarget._last = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                setAvatarPos(p => ({ x: Math.max(0, Math.min(100, p.x - dx * 1.5)), y: Math.max(0, Math.min(100, p.y - dy * 1.5)) }));
              } : undefined}
              onTouchEnd={panel === "avatar" ? (e) => { e.currentTarget._last = null; } : undefined}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" style={{
                    width: `${avatarScale * 100}%`, height: `${avatarScale * 100}%`,
                    objectFit: "cover",
                    objectPosition: `${avatarPos.x}% ${avatarPos.y}%`,
                    display: "block", pointerEvents: "none",
                  }} />
                : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${C.primary}, ${C.dark})`, color: "#fff", fontSize: 28, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{initials(name)}</div>
              }
              {panel === "avatar" && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <span style={{ fontSize: 18 }}>✋</span>
                </div>
              )}
            </div>

            {/* Botones del avatar */}
            {panel !== "avatar" ? (
              <div style={{ position: "absolute", bottom: -4, right: -6, display: "flex", flexDirection: "column", gap: 3 }}>
                <label htmlFor="avatar-file" style={{ width: 26, height: 26, borderRadius: "50%", background: C.primary, color: "#fff", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", border: "2.5px solid #fff", cursor: "pointer" }}>✏️</label>
                {avatarUrl && (
                  <button onClick={() => setPanel("avatar")} style={{ width: 26, height: 26, borderRadius: "50%", background: "#1F2937", color: "#fff", fontSize: 11, fontWeight: 700, border: "2.5px solid #fff", cursor: "pointer" }}>✋</button>
                )}
              </div>
            ) : (
              <button onClick={() => setPanel(null)} style={{ position: "absolute", bottom: -24, left: "50%", transform: "translateX(-50%)", background: C.primary, color: "#fff", border: "none", borderRadius: 20, padding: "3px 12px", fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                Listo ✓
              </button>
            )}
            <input id="avatar-file" type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarFile} />
          </div>
        </div>
      </div>

      <div style={{ height: 58 }} />

      {/* PANEL ZOOM */}
      {(panel === "cover" || panel === "avatar") && (
        <div style={{ margin: "0 12px 12px", background: C.white, borderRadius: 14, border: `1.5px solid ${C.primary}40`, padding: "12px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>🔍 Zoom {panel === "cover" ? "portada" : "foto"}</span>
            <button onClick={() => { if (panel === "cover") { setCoverPos({ x: 50, y: 50 }); setCoverScale(1); } else { setAvatarPos({ x: 50, y: 50 }); setAvatarScale(1); } }} style={{ background: "none", border: "none", color: C.muted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Resetear</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12 }}>−</span>
            <input type="range" min="1" max="3" step="0.05"
              value={panel === "cover" ? coverScale : avatarScale}
              onChange={e => panel === "cover" ? setCoverScale(parseFloat(e.target.value)) : setAvatarScale(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: C.primary }}
            />
            <span style={{ fontSize: 12 }}>+</span>
            <span style={{ fontSize: 11, color: C.muted, width: 32 }}>{((panel === "cover" ? coverScale : avatarScale) * 100).toFixed(0)}%</span>
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 8, textAlign: "center" }}>
            Arrastrá la imagen arriba para moverla · Guardá para aplicar
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
          { label: "Alias de pago (Mercado Pago)", val: realAlias, set: setRealAlias, ph: "tu.alias" },
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
        <button onClick={handleSave} disabled={saving || uploading} style={{ width: "100%", padding: 14, background: `linear-gradient(135deg, ${C.primary}, ${C.dark})`, color: C.white, border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(124,58,237,0.3)", opacity: (saving || uploading) ? 0.6 : 1 }}>
          {uploading ? "Subiendo imagen..." : saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

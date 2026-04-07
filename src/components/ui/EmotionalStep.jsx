import { useState, useRef, useEffect } from "react";
import { COLORS } from "../../utils/constants";

/**
 * EmotionalStep — paso opcional de mensaje emocional al regalar
 * Incluye: texto, foto (modal), video (modal + trimmer simulado)
 * Fase 1: upload a Supabase Storage. Texto siempre visible antes del cumple.
 * Fotos y videos bloqueados hasta la fecha del cumple.
 */

// ── Modal overlay ──────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, width: "100%", maxWidth: 460,
          overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "18px 20px", borderBottom: `1px solid ${COLORS.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%", border: "none",
              background: COLORS.border, cursor: "pointer", fontSize: 18,
              color: COLORS.textLight, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >×</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Tab switcher dentro del modal ──────────────────────────────────────────
function ModalTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            flex: 1, padding: "10px 8px", borderRadius: 10,
            border: `1px solid ${active === t.id ? COLORS.primary : COLORS.border}`,
            background: active === t.id ? COLORS.primary : COLORS.bg,
            color: active === t.id ? "#fff" : COLORS.textLight,
            fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Zona de upload simulada ────────────────────────────────────────────────
function UploadZone({ icon, title, subtitle, accent }) {
  return (
    <div style={{
      border: `2px dashed ${accent || "#DDD6FE"}`,
      borderRadius: 14, padding: "28px 20px", textAlign: "center",
      background: accent ? "#FFF7ED" : "#FAFAFA", marginBottom: 16, cursor: "pointer",
    }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: COLORS.textLight, lineHeight: 1.5 }}>{subtitle}</div>
    </div>
  );
}

// ── Modal de foto ──────────────────────────────────────────────────────────
function FotoModal({ open, onClose, onConfirm }) {
  const [tab, setTab] = useState("subir");
  return (
    <Modal open={open} onClose={onClose} title="Agregar foto 📷">
      <ModalTabs
        tabs={[{ id: "subir", label: "📁 Subir archivo" }, { id: "camara", label: "📸 Sacar foto" }]}
        active={tab}
        onChange={setTab}
      />
      {tab === "subir" && (
        <UploadZone
          icon="🖼️"
          title="Arrastrá o tocá para subir"
          subtitle={"JPG, PNG, WEBP · máx. 10 MB\nSolo 1 foto por regalo"}
        />
      )}
      {tab === "camara" && (
        <UploadZone
          icon="📸"
          title="Usar cámara"
          subtitle="Tomá la foto directo desde tu cámara"
          accent="#86EFAC"
        />
      )}
      <button
        onClick={() => { onConfirm({ name: tab === "camara" ? "foto_camara.jpg" : "foto_cumple.jpg", type: "foto" }); onClose(); }}
        style={{
          width: "100%", padding: 14, borderRadius: 12,
          background: COLORS.primary, color: "#fff", border: "none",
          fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 10,
        }}
      >
        Confirmar foto →
      </button>
      <button
        onClick={onClose}
        style={{
          width: "100%", padding: 11, borderRadius: 12, background: "transparent",
          color: COLORS.textLight, border: `1px solid ${COLORS.border}`, fontSize: 14, cursor: "pointer",
        }}
      >
        Cancelar
      </button>
    </Modal>
  );
}

// ── Modal de video ─────────────────────────────────────────────────────────
function VideoModal({ open, onClose, onConfirm }) {
  const [tab, setTab] = useState("subir");
  // Simula un video de 45s para mostrar el trimmer
  const [clipStart, setClipStart] = useState(0);
  const [clipEnd, setClipEnd] = useState(27);
  const videoDuration = 45;
  const needsTrim = videoDuration > 30;
  const clipDuration = clipEnd - clipStart;
  const clipValid = clipDuration > 0 && clipDuration <= 30;

  const formatSec = (s) => {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, "0")}`;
  };

  return (
    <Modal open={open} onClose={onClose} title="Agregar video 🎬">
      <ModalTabs
        tabs={[{ id: "subir", label: "📁 Subir archivo" }, { id: "grabar", label: "🔴 Grabar" }]}
        active={tab}
        onChange={setTab}
      />

      {tab === "subir" && (
        <>
          <UploadZone
            icon="🎥"
            title="Arrastrá o tocá para subir"
            subtitle={"MP4, MOV · hasta 60 seg · máx. 100 MB\nVideos de +30s requieren recorte"}
          />

          {/* Trimmer — visible porque el video simulado dura 45s */}
          {needsTrim && (
            <div style={{
              background: "#FFFBEB", border: `1px solid #FDE68A`,
              borderRadius: 12, padding: 14, marginBottom: 14,
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                marginBottom: 12, fontSize: 13, color: "#92400E", fontWeight: 600,
              }}>
                ⚠️ El video dura {formatSec(videoDuration)} — elegí un clip de hasta 30 seg
              </div>

              <div style={{ fontSize: 12, color: COLORS.text, fontWeight: 600, marginBottom: 8 }}>
                Inicio del clip
              </div>
              <input
                type="range" min={0} max={videoDuration - 1} value={clipStart} step={1}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  setClipStart(v);
                  if (clipEnd - v > 30) setClipEnd(v + 30);
                  if (clipEnd <= v) setClipEnd(v + 1);
                }}
                style={{ width: "100%", accentColor: COLORS.primary, marginBottom: 8 }}
              />

              <div style={{ fontSize: 12, color: COLORS.text, fontWeight: 600, marginBottom: 8 }}>
                Fin del clip
              </div>
              <input
                type="range" min={clipStart + 1} max={Math.min(clipStart + 30, videoDuration)} value={clipEnd} step={1}
                onChange={(e) => setClipEnd(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: COLORS.primary, marginBottom: 10 }}
              />

              {/* Visual timeline bar */}
              <div style={{
                height: 32, background: "#F3F4F6", borderRadius: 6,
                border: `1px solid ${COLORS.border}`, position: "relative", overflow: "hidden", marginBottom: 8,
              }}>
                <div style={{
                  position: "absolute",
                  left: `${(clipStart / videoDuration) * 100}%`,
                  width: `${((clipEnd - clipStart) / videoDuration) * 100}%`,
                  height: "100%",
                  background: `${COLORS.primary}33`,
                  borderLeft: `2.5px solid ${COLORS.primary}`,
                  borderRight: `2.5px solid ${COLORS.primary}`,
                }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textLight, marginBottom: 4 }}>
                <span>{formatSec(clipStart)}</span>
                <span style={{ color: clipValid ? COLORS.primary : COLORS.error, fontWeight: 600 }}>
                  {clipValid ? `✓ ${clipDuration}s seleccionados` : `⚠️ ${clipDuration}s — máx. 30s`}
                </span>
                <span>{formatSec(clipEnd)} / {formatSec(videoDuration)}</span>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              if (!clipValid) return;
              onConfirm({ name: "video_cumple.mp4", type: "video", clipStart, clipEnd, clipDuration });
              onClose();
            }}
            disabled={!clipValid}
            style={{
              width: "100%", padding: 14, borderRadius: 12,
              background: clipValid ? COLORS.primary : COLORS.border,
              color: clipValid ? "#fff" : COLORS.textLight,
              border: "none", fontSize: 15, fontWeight: 700,
              cursor: clipValid ? "pointer" : "not-allowed", marginBottom: 10,
            }}
          >
            {clipValid ? `Confirmar clip (${clipDuration}s) →` : "Ajustá el clip a máx. 30s"}
          </button>
          <button
            onClick={onClose}
            style={{
              width: "100%", padding: 11, borderRadius: 12, background: "transparent",
              color: COLORS.textLight, border: `1px solid ${COLORS.border}`, fontSize: 14, cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        </>
      )}

      {tab === "grabar" && (
        <>
          <UploadZone
            icon="🔴"
            title="Listo para grabar"
            subtitle="Grabación de hasta 30 seg directo desde la cámara"
            accent="#FDBA74"
          />
          <button
            onClick={() => { onConfirm({ name: "video_grabado.mp4", type: "video", clipStart: 0, clipEnd: 18, clipDuration: 18 }); onClose(); }}
            style={{
              width: "100%", padding: 14, borderRadius: 12,
              background: COLORS.primary, color: "#fff", border: "none",
              fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 10,
            }}
          >
            Usar este video →
          </button>
          <button
            onClick={onClose}
            style={{
              width: "100%", padding: 11, borderRadius: 12, background: "transparent",
              color: COLORS.textLight, border: `1px solid ${COLORS.border}`, fontSize: 14, cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        </>
      )}
    </Modal>
  );
}

// ── Preview de archivo adjunto ─────────────────────────────────────────────
function AttachedPreview({ file, onRemove }) {
  const isVideo = file.type === "video";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "#F5F0FF", border: `1px solid #DDD6FE`,
      borderRadius: 10, padding: "10px 14px", marginTop: 10,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 8, background: "#C4B5FD",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
      }}>
        {isVideo ? "🎬" : "📷"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: "#5B21B6", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {file.name}
        </div>
        <div style={{ fontSize: 11, color: COLORS.textLight, marginTop: 2 }}>
          {isVideo
            ? `Clip de ${file.clipDuration}s seleccionado ✓`
            : "Lista para el cumple 🎉"}
        </div>
      </div>
      <button
        onClick={onRemove}
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 12, color: COLORS.error, fontWeight: 600, flexShrink: 0,
        }}
      >
        Quitar
      </button>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export default function EmotionalStep({ value, onChange, birthdayDate }) {
  const [fotoModal, setFotoModal] = useState(false);
  const [videoModal, setVideoModal] = useState(false);

  const MAX_CHARS = 280;
  const remaining = MAX_CHARS - (value.message || "").length;

  // Formatear fecha del cumple para el badge
  const birthdayLabel = (() => {
    if (!birthdayDate) return "el día del cumple";
    try {
      const d = new Date(birthdayDate + "T12:00:00");
      return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
    } catch { return "el día del cumple"; }
  })();

  return (
    <div>
      {/* Banner informativo */}
      <div style={{
        background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)",
        border: `1px solid #DDD6FE`, borderRadius: 14,
        padding: "14px 16px", marginBottom: 20,
        display: "flex", alignItems: "flex-start", gap: 12,
      }}>
        <span style={{ fontSize: 24, flexShrink: 0, marginTop: 1 }}>🎁</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#5B21B6", marginBottom: 3 }}>
            Hacé tu regalo más especial
          </div>
          <div style={{ fontSize: 12, color: "#7C3AED", lineHeight: 1.5 }}>
            Los mensajes se ven antes del cumple. Las fotos y videos se revelan el{" "}
            <strong>{birthdayLabel}</strong>.
          </div>
        </div>
      </div>

      {/* Mensaje de texto */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 6 }}>
          Mensaje <span style={{ fontSize: 11, opacity: 0.7 }}>(visible antes del cumple)</span>
        </label>
        <textarea
          value={value.message || ""}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) {
              onChange({ ...value, message: e.target.value });
            }
          }}
          placeholder="Escribile algo lindo..."
          rows={3}
          style={{
            width: "100%", padding: "12px 14px", borderRadius: 12,
            border: `1px solid ${COLORS.border}`, fontSize: 15,
            outline: "none", resize: "vertical", fontFamily: "inherit",
            boxSizing: "border-box", background: COLORS.bg,
          }}
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
        />
        <div style={{
          fontSize: 11, color: remaining < 40 ? COLORS.error : COLORS.textLight,
          textAlign: "right", marginTop: 4,
        }}>
          {remaining} / {MAX_CHARS}
        </div>
      </div>

      {/* Foto y Video */}
      <div>
        <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 6 }}>
          Foto o video
        </label>
        {/* Badge de bloqueo */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: COLORS.bg, border: `1px solid ${COLORS.border}`,
          borderRadius: 20, padding: "3px 10px", fontSize: 11, color: COLORS.textLight, marginBottom: 10,
        }}>
          🔒 Se revelan el {birthdayLabel}
        </div>

        {/* Botones de media */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {/* Foto */}
          <button
            onClick={() => setFotoModal(true)}
            style={{
              padding: "14px 8px", borderRadius: 12,
              border: `1px solid ${value.foto ? COLORS.primary : COLORS.border}`,
              background: value.foto ? "#F5F0FF" : COLORS.bg,
              cursor: "pointer", textAlign: "center",
              color: value.foto ? COLORS.primary : COLORS.textLight,
              fontSize: 13, fontWeight: 600, transition: "all 0.15s",
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 5 }}>📷</div>
            {value.foto ? "✓ Foto agregada" : "Agregar foto"}
          </button>

          {/* Video */}
          <button
            onClick={() => setVideoModal(true)}
            style={{
              padding: "14px 8px", borderRadius: 12,
              border: `1px solid ${value.video ? COLORS.primary : COLORS.border}`,
              background: value.video ? "#F5F0FF" : COLORS.bg,
              cursor: "pointer", textAlign: "center",
              color: value.video ? COLORS.primary : COLORS.textLight,
              fontSize: 13, fontWeight: 600, transition: "all 0.15s",
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 5 }}>🎬</div>
            {value.video ? "✓ Video agregado" : "Agregar video"}
          </button>
        </div>

        {/* Previews adjuntos */}
        {value.foto && (
          <AttachedPreview
            file={value.foto}
            onRemove={() => onChange({ ...value, foto: null })}
          />
        )}
        {value.video && (
          <AttachedPreview
            file={value.video}
            onRemove={() => onChange({ ...value, video: null })}
          />
        )}
      </div>

      {/* Modales */}
      <FotoModal
        open={fotoModal}
        onClose={() => setFotoModal(false)}
        onConfirm={(file) => onChange({ ...value, foto: file })}
      />
      <VideoModal
        open={videoModal}
        onClose={() => setVideoModal(false)}
        onConfirm={(file) => onChange({ ...value, video: file })}
      />
    </div>
  );
}

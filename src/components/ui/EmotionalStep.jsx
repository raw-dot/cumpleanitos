import { useState, useRef, useEffect } from "react";
import { COLORS } from "../../utils/constants";

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
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16 }}>
      <div onClick={(e)=>e.stopPropagation()} style={{ background:"#fff",borderRadius:20,width:"100%",maxWidth:460,boxShadow:"0 24px 60px rgba(0,0,0,0.25)",maxHeight:"90vh",overflowY:"auto" }}>
        <div style={{ padding:"18px 20px",borderBottom:`1px solid ${COLORS.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"#fff",zIndex:1 }}>
          <span style={{ fontSize:16,fontWeight:700,color:COLORS.text }}>{title}</span>
          <button onClick={onClose} style={{ width:32,height:32,borderRadius:"50%",border:"none",background:COLORS.border,cursor:"pointer",fontSize:18,color:COLORS.textLight,display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
        </div>
        <div style={{ padding:20 }}>{children}</div>
      </div>
    </div>
  );
}

function ModalTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:"flex",gap:8,marginBottom:16 }}>
      {tabs.map((t) => (
        <button key={t.id} onClick={()=>onChange(t.id)} style={{ flex:1,padding:"10px 8px",borderRadius:10,border:`1px solid ${active===t.id?COLORS.primary:COLORS.border}`,background:active===t.id?COLORS.primary:COLORS.bg,color:active===t.id?"#fff":COLORS.textLight,fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.15s" }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function PrimaryBtn({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width:"100%",padding:14,borderRadius:12,background:disabled?COLORS.border:COLORS.primary,color:disabled?COLORS.textLight:"#fff",border:"none",fontSize:15,fontWeight:700,cursor:disabled?"not-allowed":"pointer",marginBottom:10 }}>
      {children}
    </button>
  );
}
function SecondaryBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ width:"100%",padding:11,borderRadius:12,background:"transparent",color:COLORS.textLight,border:`1px solid ${COLORS.border}`,fontSize:14,cursor:"pointer" }}>
      {children}
    </button>
  );
}

// ── Modal FOTO ─────────────────────────────────────────────────────────────
function FotoModal({ open, onClose, onConfirm }) {
  const [tab, setTab] = useState("subir");
  const [preview, setPreview] = useState(null);
  const [fileObj, setFileObj] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const cameraRef = useRef(null);

  const handleClose = () => { setPreview(null); setFileObj(null); setError(""); setTab("subir"); onClose(); };

  const processFile = (file) => {
    setError("");
    if (!file) return;
    const valid = ["image/jpeg","image/jpg","image/png","image/webp","image/gif","image/heic","image/heif"];
    if (!file.type.startsWith("image/")) { setError("Formato no válido. Usá JPG, PNG o WEBP."); return; }
    if (file.size > 10*1024*1024) { setError("La foto no puede superar 10 MB."); return; }
    setFileObj(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleConfirm = () => {
    if (!fileObj) return;
    onConfirm({ name: fileObj.name, type: "foto", file: fileObj, previewUrl: preview });
    handleClose();
  };

  const isMobile = typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
  const DropZone = ({ inputR, capture }) => (
    <>
      <input ref={inputR} type="file" accept={capture ? "image/*" : "image/jpeg,image/jpg,image/png,image/webp,image/heic"} capture={capture && isMobile ? "environment" : undefined} style={{ display:"none" }} onChange={(e)=>processFile(e.target.files?.[0])} />
      {!preview ? (
        <div
          onClick={()=>inputR.current?.click()}
          onDrop={(e)=>{e.preventDefault();processFile(e.dataTransfer.files?.[0]);}}
          onDragOver={(e)=>e.preventDefault()}
          style={{ border:`2px dashed ${capture?"#86EFAC":"#DDD6FE"}`,borderRadius:14,padding:"32px 20px",textAlign:"center",background:capture?"#F0FDF4":"#FAFAFA",marginBottom:16,cursor:"pointer" }}
        >
          <div style={{ fontSize:36,marginBottom:10 }}>{capture?"📸":"🖼️"}</div>
          <div style={{ fontSize:15,fontWeight:600,color:COLORS.text,marginBottom:4 }}>{capture?"Abrir cámara":"Tocá para elegir una foto"}</div>
          <div style={{ fontSize:12,color:COLORS.textLight,lineHeight:1.5 }}>{capture?"Tocá para usar la cámara del dispositivo":"JPG, PNG, WEBP · máx. 10 MB"}</div>
        </div>
      ) : (
        <div style={{ marginBottom:16 }}>
          <img src={preview} alt="preview" style={{ width:"100%",borderRadius:12,maxHeight:220,objectFit:"cover",display:"block" }} />
          <button onClick={()=>{setPreview(null);setFileObj(null);}} style={{ background:"none",border:"none",color:COLORS.error,cursor:"pointer",fontSize:13,marginTop:8 }}>× Cambiar foto</button>
        </div>
      )}
    </>
  );

  return (
    <Modal open={open} onClose={handleClose} title="Agregar foto 📷">
      <ModalTabs tabs={[{id:"subir",label:"📁 Subir archivo"},{id:"camara",label:"📸 Sacar foto"}]} active={tab} onChange={(t)=>{setTab(t);setPreview(null);setFileObj(null);setError("");}} />
      {tab==="subir" && <DropZone inputR={inputRef} />}
      {tab==="camara" && <DropZone inputR={cameraRef} capture="environment" />}
      {error && <div style={{ color:COLORS.error,fontSize:13,marginBottom:10 }}>⚠️ {error}</div>}
      <PrimaryBtn onClick={handleConfirm} disabled={!fileObj}>{fileObj?"Confirmar foto →":"Elegí una foto primero"}</PrimaryBtn>
      <SecondaryBtn onClick={handleClose}>Cancelar</SecondaryBtn>
    </Modal>
  );
}

// ── Modal VIDEO ─────────────────────────────────────────────────────────────
function VideoModal({ open, onClose, onConfirm }) {
  const [tab, setTab] = useState("subir");
  const [fileObj, setFileObj] = useState(null);
  const [preview, setPreview] = useState(null);
  const [duration, setDuration] = useState(null);
  const [clipStart, setClipStart] = useState(0);
  const [clipEnd, setClipEnd] = useState(30);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const cameraRef = useRef(null);

  const handleClose = () => { setFileObj(null);setPreview(null);setDuration(null);setClipStart(0);setClipEnd(30);setError("");setTab("subir");onClose(); };

  const processVideo = (file) => {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("video/")) { setError("Formato no válido. Usá MP4 o MOV."); return; }
    if (file.size > 100*1024*1024) { setError("El video no puede superar 100 MB."); return; }
    const url = URL.createObjectURL(file);
    const tmp = document.createElement("video");
    tmp.preload = "metadata";
    tmp.onloadedmetadata = () => {
      const dur = Math.round(tmp.duration);
      if (dur > 60) { setError("El video supera 60 segundos. Elegí uno más corto."); URL.revokeObjectURL(url); return; }
      setDuration(dur); setClipStart(0); setClipEnd(Math.min(30,dur)); setFileObj(file); setPreview(url);
    };
    tmp.onerror = ()=>setError("No se pudo leer el video. Probá con otro archivo.");
    tmp.src = url;
  };

  const isMobileDevice = typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
  const needsTrim = duration !== null && duration > 30;
  const clipDuration = clipEnd - clipStart;
  const clipValid = clipDuration > 0 && clipDuration <= 30;
  const fmt = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  const handleConfirm = () => {
    if (!fileObj || !clipValid) return;
    onConfirm({ name:fileObj.name, type:"video", file:fileObj, previewUrl:preview, clipStart, clipEnd, clipDuration });
    handleClose();
  };

  const isMobile = typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
  const DropZone = ({ inputR, capture }) => (
    <>
      <input ref={inputR} type="file" accept="video/mp4,video/quicktime,video/webm,video/*" capture={capture && isMobile ? "environment" : undefined} style={{ display:"none" }} onChange={(e)=>processVideo(e.target.files?.[0])} />
      {!preview ? (
        <div
          onClick={()=>inputR.current?.click()}
          onDrop={(e)=>{e.preventDefault();processVideo(e.dataTransfer.files?.[0]);}}
          onDragOver={(e)=>e.preventDefault()}
          style={{ border:`2px dashed ${capture?"#FDBA74":"#DDD6FE"}`,borderRadius:14,padding:"32px 20px",textAlign:"center",background:capture?"#FFF7ED":"#FAFAFA",marginBottom:16,cursor:"pointer" }}
        >
          <div style={{ fontSize:36,marginBottom:10 }}>{capture?(isMobile?"🔴":"📂"):"🎥"}</div>
          <div style={{ fontSize:15,fontWeight:600,color:COLORS.text,marginBottom:4 }}>{capture?(isMobile?"Grabar video":"Subir video"):"Tocá para elegir un video"}</div>
          <div style={{ fontSize:12,color:COLORS.textLight,lineHeight:1.5 }}>{capture?(isMobile?"Hasta 60 seg desde la cámara":"Seleccioná un video de tu computadora"):"MP4, MOV · hasta 60 seg · máx. 100 MB"}</div>
        </div>
      ) : (
        <div style={{ marginBottom:12 }}>
          <video src={preview} controls style={{ width:"100%",borderRadius:12,maxHeight:180,background:"#000",display:"block" }} />
          <button onClick={()=>{setPreview(null);setFileObj(null);setDuration(null);}} style={{ background:"none",border:"none",color:COLORS.error,cursor:"pointer",fontSize:13,marginTop:6 }}>× Cambiar video</button>
        </div>
      )}
    </>
  );

  return (
    <Modal open={open} onClose={handleClose} title="Agregar video 🎬">
      <ModalTabs tabs={[{id:"subir",label:"📁 Subir archivo"},{id:"grabar",label:isMobileDevice?"🔴 Grabar":"📂 Otro archivo"}]} active={tab} onChange={(t)=>{setTab(t);setPreview(null);setFileObj(null);setDuration(null);setError("");}} />
      {tab==="subir" && <DropZone inputR={inputRef} />}
      {tab==="grabar" && <DropZone inputR={cameraRef} capture="environment" />}

      {/* Trimmer — solo si dura más de 30s */}
      {preview && needsTrim && (
        <div style={{ background:"#FFFBEB",border:`1px solid #FDE68A`,borderRadius:12,padding:14,marginBottom:14 }}>
          <div style={{ fontSize:13,color:"#92400E",fontWeight:600,marginBottom:12 }}>⚠️ El video dura {fmt(duration)} — elegí un clip de hasta 30 seg</div>
          <div style={{ fontSize:12,color:COLORS.text,fontWeight:600,marginBottom:6 }}>Inicio: {fmt(clipStart)}</div>
          <input type="range" min={0} max={duration-1} value={clipStart} step={1}
            onChange={(e)=>{ const v=parseInt(e.target.value); setClipStart(v); if(clipEnd-v>30)setClipEnd(v+30); if(clipEnd<=v)setClipEnd(Math.min(v+1,duration)); }}
            style={{ width:"100%",accentColor:COLORS.primary,marginBottom:10 }} />
          <div style={{ fontSize:12,color:COLORS.text,fontWeight:600,marginBottom:6 }}>Fin: {fmt(clipEnd)}</div>
          <input type="range" min={clipStart+1} max={Math.min(clipStart+30,duration)} value={clipEnd} step={1}
            onChange={(e)=>setClipEnd(parseInt(e.target.value))}
            style={{ width:"100%",accentColor:COLORS.primary,marginBottom:10 }} />
          <div style={{ height:28,background:"#F3F4F6",borderRadius:6,border:`1px solid ${COLORS.border}`,position:"relative",overflow:"hidden",marginBottom:8 }}>
            <div style={{ position:"absolute",left:`${(clipStart/duration)*100}%`,width:`${((clipEnd-clipStart)/duration)*100}%`,height:"100%",background:`${COLORS.primary}33`,borderLeft:`2.5px solid ${COLORS.primary}`,borderRight:`2.5px solid ${COLORS.primary}` }} />
          </div>
          <div style={{ fontSize:11,color:clipValid?COLORS.primary:COLORS.error,fontWeight:600,textAlign:"center" }}>
            {clipValid?`✓ ${clipDuration}s seleccionados`:`⚠️ ${clipDuration}s — máx. 30s`}
          </div>
        </div>
      )}

      {/* Confirmación si el video es corto */}
      {preview && !needsTrim && duration!==null && (
        <div style={{ background:"#F0FDF4",border:`1px solid #86EFAC`,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#166534",fontWeight:600 }}>
          ✓ Video de {duration}s — listo para adjuntar
        </div>
      )}

      {error && <div style={{ color:COLORS.error,fontSize:13,marginBottom:12 }}>⚠️ {error}</div>}
      <PrimaryBtn onClick={handleConfirm} disabled={!fileObj||!clipValid}>
        {!fileObj?"Elegí un video primero":!clipValid?"Ajustá el clip a máx. 30s":`Confirmar clip (${clipDuration}s) →`}
      </PrimaryBtn>
      <SecondaryBtn onClick={handleClose}>Cancelar</SecondaryBtn>
    </Modal>
  );
}

// ── Preview adjunto ─────────────────────────────────────────────────────────
function AttachedPreview({ file, onRemove }) {
  const isVideo = file.type === "video";
  return (
    <div style={{ display:"flex",alignItems:"center",gap:10,background:"#F5F0FF",border:`1px solid #DDD6FE`,borderRadius:10,padding:"10px 14px",marginTop:10 }}>
      {file.previewUrl
        ? isVideo
          ? <video src={file.previewUrl} style={{ width:40,height:40,borderRadius:8,objectFit:"cover",flexShrink:0 }} muted />
          : <img src={file.previewUrl} alt="" style={{ width:40,height:40,borderRadius:8,objectFit:"cover",flexShrink:0 }} />
        : <div style={{ width:40,height:40,borderRadius:8,background:"#C4B5FD",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>{isVideo?"🎬":"📷"}</div>
      }
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontSize:13,color:"#5B21B6",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{file.name}</div>
        <div style={{ fontSize:11,color:COLORS.textLight,marginTop:2 }}>{isVideo?`Clip de ${file.clipDuration}s seleccionado ✓`:"Lista para el cumple 🎉"}</div>
      </div>
      <button onClick={onRemove} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:COLORS.error,fontWeight:600,flexShrink:0 }}>Quitar</button>
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export default function EmotionalStep({ value, onChange, birthdayDate }) {
  const [fotoModal, setFotoModal] = useState(false);
  const [videoModal, setVideoModal] = useState(false);
  const MAX_CHARS = 280;
  const remaining = MAX_CHARS - (value.message||"").length;

  const birthdayLabel = (() => {
    if (!birthdayDate) return "el día del cumple";
    try { const d=new Date(birthdayDate+"T12:00:00"); return d.toLocaleDateString("es-AR",{day:"numeric",month:"short"}); }
    catch { return "el día del cumple"; }
  })();

  return (
    <div>
      {/* Banner */}
      <div style={{ background:"linear-gradient(135deg,#F5F3FF,#EDE9FE)",border:`1px solid #DDD6FE`,borderRadius:14,padding:"14px 16px",marginBottom:20,display:"flex",alignItems:"flex-start",gap:12 }}>
        <span style={{ fontSize:24,flexShrink:0,marginTop:1 }}>🎁</span>
        <div>
          <div style={{ fontSize:14,fontWeight:700,color:"#5B21B6",marginBottom:3 }}>Hacé tu regalo más especial</div>
          <div style={{ fontSize:12,color:"#7C3AED",lineHeight:1.5 }}>Los mensajes se ven antes del cumple. Las fotos y videos se revelan el <strong>{birthdayLabel}</strong>.</div>
        </div>
      </div>

      {/* Texto */}
      <div style={{ marginBottom:18 }}>
        <label style={{ fontSize:13,color:COLORS.textLight,display:"block",marginBottom:6 }}>Mensaje <span style={{ fontSize:11,opacity:.7 }}>(visible antes del cumple)</span></label>
        <textarea value={value.message||""} onChange={(e)=>{ if(e.target.value.length<=MAX_CHARS) onChange({...value,message:e.target.value}); }} placeholder="Escribile algo lindo..." rows={3}
          style={{ width:"100%",padding:"12px 14px",borderRadius:12,border:`1px solid ${COLORS.border}`,fontSize:15,outline:"none",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box",background:COLORS.bg }}
          onFocus={(e)=>e.target.style.borderColor=COLORS.primary} onBlur={(e)=>e.target.style.borderColor=COLORS.border} />
        <div style={{ fontSize:11,color:remaining<40?COLORS.error:COLORS.textLight,textAlign:"right",marginTop:4 }}>{remaining} / {MAX_CHARS}</div>
      </div>

      {/* Botones foto/video */}
      <div>
        <label style={{ fontSize:13,color:COLORS.textLight,display:"block",marginBottom:6 }}>Foto o video</label>
        <div style={{ display:"inline-flex",alignItems:"center",gap:5,background:COLORS.bg,border:`1px solid ${COLORS.border}`,borderRadius:20,padding:"3px 10px",fontSize:11,color:COLORS.textLight,marginBottom:10 }}>
          🔒 Se revelan el {birthdayLabel}
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <button onClick={()=>setFotoModal(true)} style={{ padding:"14px 8px",borderRadius:12,border:`1px solid ${value.foto?COLORS.primary:COLORS.border}`,background:value.foto?"#F5F0FF":COLORS.bg,cursor:"pointer",textAlign:"center",color:value.foto?COLORS.primary:COLORS.textLight,fontSize:13,fontWeight:600,transition:"all 0.15s" }}>
            <div style={{ fontSize:22,marginBottom:5 }}>📷</div>
            {value.foto?"✓ Foto agregada":"Agregar foto"}
          </button>
          <button onClick={()=>setVideoModal(true)} style={{ padding:"14px 8px",borderRadius:12,border:`1px solid ${value.video?COLORS.primary:COLORS.border}`,background:value.video?"#F5F0FF":COLORS.bg,cursor:"pointer",textAlign:"center",color:value.video?COLORS.primary:COLORS.textLight,fontSize:13,fontWeight:600,transition:"all 0.15s" }}>
            <div style={{ fontSize:22,marginBottom:5 }}>🎬</div>
            {value.video?"✓ Video agregado":"Agregar video"}
          </button>
        </div>
        {value.foto && <AttachedPreview file={value.foto} onRemove={()=>onChange({...value,foto:null})} />}
        {value.video && <AttachedPreview file={value.video} onRemove={()=>onChange({...value,video:null})} />}
      </div>

      <FotoModal open={fotoModal} onClose={()=>setFotoModal(false)} onConfirm={(f)=>onChange({...value,foto:f})} />
      <VideoModal open={videoModal} onClose={()=>setVideoModal(false)} onConfirm={(f)=>onChange({...value,video:f})} />
    </div>
  );
}

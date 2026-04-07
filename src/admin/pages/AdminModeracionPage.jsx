import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import { ensureAdminSession } from "../adminFetch";

const C = {
  primary: "#7C3AED", primaryBg: "#EDE9FE", primaryLight: "#A78BFA",
  accent:  "#F59E0B", accentBg:  "#FEF3C7",
  success: "#10B981", successBg: "#D1FAE5",
  error:   "#EF4444", errorBg:   "#FEE2E2",
  warn:    "#F97316", warnBg:    "#FFF7ED",
  text:    "#1F2937", textLight: "#6B7280", textMuted: "#9CA3AF",
  border:  "#E5E7EB", surface:   "#FFFFFF", bg: "#F3F4F6",
};

const fmtDate = (s) => s ? new Date(s).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—";
const flagWords = ["odio","estafa","fraude","spam","http","www.",".com","whatsapp","telegram","puta","mierda","pelotud"];
const isFlagged = (msg) => msg && flagWords.some(w => msg.toLowerCase().includes(w));

function useModeracion() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await ensureAdminSession();

      // Intentar con columnas emocionales, fallback sin ellas
      let contribsRaw = [];
      const r1 = await supabase.from("contributions")
        .select("id, campaign_id, gifter_name, gifter_id, message, amount, created_at, is_anonymous, anonymous, emotional_foto_url, emotional_video_url")
        .order("created_at", { ascending: false });
      if (r1.error) {
        const r1b = await supabase.from("contributions")
          .select("id, campaign_id, gifter_name, gifter_id, message, amount, created_at, is_anonymous, anonymous")
          .order("created_at", { ascending: false });
        contribsRaw = r1b.data || [];
      } else {
        contribsRaw = r1.data || [];
      }

      const [r2, r3, r4] = await Promise.all([
        supabase.from("profiles").select("id, username, name, bio, avatar_url, email, is_active, created_at, role").order("created_at", { ascending: false }),
        supabase.from("gift_campaigns").select("id, title, description, image_url, birthday_person_id, birthday_person_name, status, created_at").order("created_at", { ascending: false }),
        supabase.from("gift_items").select("id, campaign_id, name, description, image_url, price, created_at").order("created_at", { ascending: false }),
      ]);

      const profiles  = r2.data || [];
      const campaigns = r3.data || [];
      const items     = r4.data || [];
      const profMap = {}; profiles.forEach(p => { profMap[p.id] = p; });
      const campMap = {}; campaigns.forEach(c => { campMap[c.id] = c; });

      setData({
        mensajes: contribsRaw.map(c => ({ ...c, campaign: campMap[c.campaign_id] || {}, gifterProfile: c.gifter_id ? profMap[c.gifter_id] : null })),
        perfiles: profiles,
        campanas: campaigns.map(c => ({ ...c, profile: profMap[c.birthday_person_id] || {} })),
        regalos:  items.map(i => ({ ...i, campaign: campMap[i.campaign_id] || {} })),
      });
    } catch (e) {
      console.error("Moderacion load error:", e);
      setData({ mensajes: [], perfiles: [], campanas: [], regalos: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const clearMessage    = async (id) => { const { error } = await supabase.from("contributions").update({ message: null }).eq("id", id); if (error) { showToast("Error", "error"); return; } setData(p => ({ ...p, mensajes: p.mensajes.map(c => c.id === id ? { ...c, message: null } : c) })); showToast("Mensaje eliminado"); };
  const clearMedia      = async (id) => { const { error } = await supabase.from("contributions").update({ emotional_foto_url: null, emotional_video_url: null }).eq("id", id); if (error) { showToast("Error", "error"); return; } setData(p => ({ ...p, mensajes: p.mensajes.map(c => c.id === id ? { ...c, emotional_foto_url: null, emotional_video_url: null } : c) })); showToast("Media eliminada"); };
  const disableUser     = async (id) => { const { error } = await supabase.from("profiles").update({ is_active: false }).eq("id", id); if (error) { showToast("Error", "error"); return; } setData(p => ({ ...p, perfiles: p.perfiles.map(u => u.id === id ? { ...u, is_active: false } : u) })); showToast("Usuario deshabilitado"); };
  const clearBio        = async (id) => { const { error } = await supabase.from("profiles").update({ bio: null }).eq("id", id); if (error) { showToast("Error", "error"); return; } setData(p => ({ ...p, perfiles: p.perfiles.map(u => u.id === id ? { ...u, bio: null } : u) })); showToast("Bio eliminada"); };
  const clearCampDesc   = async (id) => { const { error } = await supabase.from("gift_campaigns").update({ description: null }).eq("id", id); if (error) { showToast("Error", "error"); return; } setData(p => ({ ...p, campanas: p.campanas.map(c => c.id === id ? { ...c, description: null } : c) })); showToast("Descripción eliminada"); };
  const clearItemDesc   = async (id) => { const { error } = await supabase.from("gift_items").update({ description: null }).eq("id", id); if (error) { showToast("Error", "error"); return; } setData(p => ({ ...p, regalos: p.regalos.map(i => i.id === id ? { ...i, description: null } : i) })); showToast("Descripción eliminada"); };
  const pauseCampaign   = async (id) => { const { error } = await supabase.from("gift_campaigns").update({ status: "inactive" }).eq("id", id); if (error) { showToast("Error", "error"); return; } setData(p => ({ ...p, campanas: p.campanas.map(c => c.id === id ? { ...c, status: "inactive" } : c) })); showToast("Campaña pausada"); };

  return { data, loading, toast, load, clearMessage, clearMedia, disableUser, clearBio, clearCampDesc, clearItemDesc, pauseCampaign };
}

function Toast({ toast }) {
  if (!toast) return null;
  return <div style={{ position:"fixed", bottom:24, right:24, zIndex:1000, background:toast.type==="error"?C.error:C.primary, color:"#fff", borderRadius:8, padding:"10px 16px", fontSize:13, fontWeight:500 }}>{toast.type==="error"?"✕ ":"✓ "}{toast.msg}</div>;
}

function ActionBtn({ label, color=C.error, onClick, confirm: msg }) {
  return <button onClick={() => { if (msg && !window.confirm(msg)) return; onClick(); }} style={{ padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:600, border:`0.5px solid ${color}`, color, background:"transparent", cursor:"pointer", whiteSpace:"nowrap" }}>{label}</button>;
}

function Card({ children, flagged }) {
  return <div style={{ background:C.surface, border:`0.5px solid ${flagged?C.warn:C.border}`, borderLeft:flagged?`3px solid ${C.warn}`:`0.5px solid ${C.border}`, borderRadius:10, padding:14, display:"flex", flexDirection:"column", gap:8 }}>{children}</div>;
}

function Meta({ label, value }) {
  return <span style={{ fontSize:11, color:C.textMuted }}>{label}: <span style={{ color:C.textLight, fontWeight:500 }}>{value}</span></span>;
}

function Search({ value, onChange, placeholder }) {
  return (
    <div style={{ position:"relative" }}>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ width:"100%", padding:"7px 28px 7px 12px", border:`0.5px solid ${C.border}`, borderRadius:7, fontSize:13, color:C.text, background:C.bg, boxSizing:"border-box" }} />
      {value && <button onClick={()=>onChange("")} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:12, color:C.textMuted }}>✕</button>}
    </div>
  );
}

function Av({ name, size=32 }) {
  return <div style={{ width:size, height:size, borderRadius:"50%", background:C.primaryBg, color:C.primary, fontSize:size*0.35, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{(name||"?").slice(0,2).toUpperCase()}</div>;
}

function Empty({ text="Sin contenido para revisar" }) {
  return <div style={{ background:C.surface, border:`0.5px solid ${C.border}`, borderRadius:10, padding:"48px 32px", textAlign:"center" }}><div style={{ fontSize:28, marginBottom:10 }}>✓</div><div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:4 }}>{text}</div><div style={{ fontSize:12, color:C.textMuted }}>No hay elementos en esta sección.</div></div>;
}

function StatCard({ label, value, color, active, onClick }) {
  return (
    <div onClick={onClick} style={{ background:active?color+"22":C.surface, border:`${active?"2px":"0.5px"} solid ${active?color:C.border}`, borderRadius:10, padding:"12px 16px", cursor:"pointer", display:"flex", flexDirection:"column", gap:4, minWidth:110, transition:"all 0.15s" }}>
      <span style={{ fontSize:22, fontWeight:700, color }}>{value}</span>
      <span style={{ fontSize:11, color:active?color:C.textMuted, fontWeight:active?600:400 }}>{label}</span>
    </div>
  );
}

// ── TAB MENSAJES ──────────────────────────────────────────────────────────────
function TabMensajes({ mensajes, onClearMessage, onClearMedia, onDisableUser }) {
  const [search, setSearch] = useState("");
  const [fil, setFil] = useState("todos");

  const withFoto  = mensajes.filter(c => c.emotional_foto_url);
  const withVideo = mensajes.filter(c => c.emotional_video_url);
  const withMsg   = mensajes.filter(c => c.message && c.message.trim());
  const withRevision = mensajes.filter(c => isFlagged(c.message));
  const sinIssues = mensajes.filter(c => !isFlagged(c.message) && !c.emotional_foto_url && !c.emotional_video_url);

  const stats = [
    { id:"todos",    label:"Aportes totales",  value:mensajes.length,       color:C.text     },
    { id:"fotos",    label:"Con imagen",        value:withFoto.length,       color:C.primary  },
    { id:"videos",   label:"Con video",         value:withVideo.length,      color:C.primary  },
    { id:"mensajes", label:"Con mensaje",       value:withMsg.length,        color:C.textLight},
    { id:"revision", label:"Posible revisión",  value:withRevision.length,   color:C.warn     },
    { id:"ok",       label:"Sin issues",        value:sinIssues.length,      color:C.success  },
  ];

  const pool = fil==="fotos"?withFoto : fil==="videos"?withVideo : fil==="mensajes"?withMsg : fil==="revision"?withRevision : fil==="ok"?sinIssues : mensajes;
  const filtered = pool.filter(c => { const q=search.toLowerCase(); return !q||c.message?.toLowerCase().includes(q)||c.gifter_name?.toLowerCase().includes(q)||c.campaign?.birthday_person_name?.toLowerCase().includes(q); });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        {stats.map(s => <StatCard key={s.id} label={s.label} value={s.value} color={s.color} active={fil===s.id} onClick={()=>setFil(fil===s.id?"todos":s.id)} />)}
      </div>
      <div style={{ background:C.surface, border:`0.5px solid ${C.border}`, borderRadius:10, padding:"12px 16px" }}>
        <Search value={search} onChange={setSearch} placeholder="Buscar por mensaje, regalador o cumpleañero…" />
      </div>
      {filtered.length===0 ? <Empty text="Sin aportes en este filtro" /> : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ fontSize:11, color:C.textMuted, padding:"0 2px" }}>{filtered.length} resultado{filtered.length!==1?"s":""} — del más reciente al más antiguo</div>
          {filtered.map(c => {
            const isAnon=c.is_anonymous||c.anonymous, hasFoto=!!c.emotional_foto_url, hasVid=!!c.emotional_video_url, hasMsg=!!(c.message&&c.message.trim()), flagged=isFlagged(c.message);
            return (
              <Card key={c.id} flagged={flagged}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                  <Av name={isAnon?"?":c.gifter_name} size={30} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:6 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{isAnon?"Anónimo":(c.gifter_name||"Sin nombre")}</span>
                      <span style={{ fontSize:11, color:C.textMuted }}>→</span>
                      <span style={{ fontSize:12, color:C.primary }}>{c.campaign?.birthday_person_name||"—"}</span>
                      {flagged  && <span style={{ fontSize:9, fontWeight:700, background:C.warnBg, color:C.warn, padding:"2px 6px", borderRadius:4 }}>REVISAR</span>}
                      {hasFoto  && <span style={{ fontSize:9, fontWeight:700, background:C.primaryBg, color:C.primary, padding:"2px 6px", borderRadius:4 }}>📷 FOTO</span>}
                      {hasVid   && <span style={{ fontSize:9, fontWeight:700, background:C.primaryBg, color:C.primary, padding:"2px 6px", borderRadius:4 }}>🎬 VIDEO</span>}
                    </div>
                    {hasMsg && <div style={{ fontSize:13, color:C.text, lineHeight:1.5, background:C.bg, borderRadius:7, padding:"8px 10px", fontStyle:"italic", marginBottom:(hasFoto||hasVid)?8:0 }}>"{c.message}"</div>}
                    {hasFoto && <img src={c.emotional_foto_url} alt="foto" style={{ maxWidth:"100%", maxHeight:140, borderRadius:8, objectFit:"cover", display:"block", marginBottom:hasVid?6:0 }} onError={e=>{e.target.style.display="none";}} />}
                    {hasVid  && <video src={c.emotional_video_url} controls style={{ maxWidth:"100%", maxHeight:140, borderRadius:8, background:"#000", display:"block" }} />}
                    {!hasMsg&&!hasFoto&&!hasVid && <div style={{ fontSize:12, color:C.textMuted, fontStyle:"italic" }}>Sin contenido adicional</div>}
                    <div style={{ display:"flex", gap:12, marginTop:6, flexWrap:"wrap" }}>
                      <Meta label="Fecha" value={fmtDate(c.created_at)} />
                      <Meta label="Monto" value={`$${Math.round(c.amount||0).toLocaleString("es-AR")}`} />
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                    {hasMsg            && <ActionBtn label="Borrar msg"   color={C.error} onClick={()=>onClearMessage(c.id)} confirm="¿Eliminar este mensaje?" />}
                    {(hasFoto||hasVid) && <ActionBtn label="Borrar media" color={C.warn}  onClick={()=>onClearMedia(c.id)}   confirm="¿Eliminar foto/video?" />}
                    {!isAnon&&c.gifter_id && <ActionBtn label="Deshabilitar" color={C.warn} onClick={()=>onDisableUser(c.gifter_id)} confirm="¿Deshabilitar al usuario?" />}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── TAB PERFILES ──────────────────────────────────────────────────────────────
function TabPerfiles({ perfiles, onClearBio, onDisableUser }) {
  const [search, setSearch] = useState("");
  const [fil, setFil] = useState("todos");
  const withBio=perfiles.filter(p=>p.bio&&p.bio.trim()), withAv=perfiles.filter(p=>p.avatar_url), inactive=perfiles.filter(p=>p.is_active===false);
  const stats=[{id:"todos",label:"Total",value:perfiles.length,color:C.text},{id:"bio",label:"Con bio",value:withBio.length,color:C.primary},{id:"avatar",label:"Con avatar",value:withAv.length,color:C.success},{id:"inactive",label:"Inactivos",value:inactive.length,color:C.warn}];
  const pool=fil==="bio"?withBio:fil==="avatar"?withAv:fil==="inactive"?inactive:perfiles;
  const filtered=pool.filter(p=>{const q=search.toLowerCase();return !q||p.name?.toLowerCase().includes(q)||p.username?.toLowerCase().includes(q)||p.email?.toLowerCase().includes(q);});
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>{stats.map(s=><StatCard key={s.id} label={s.label} value={s.value} color={s.color} active={fil===s.id} onClick={()=>setFil(fil===s.id?"todos":s.id)} />)}</div>
      <div style={{ background:C.surface, border:`0.5px solid ${C.border}`, borderRadius:10, padding:"12px 16px" }}><Search value={search} onChange={setSearch} placeholder="Buscar perfil…" /></div>
      {filtered.length===0?<Empty text="Sin perfiles en este filtro" />:(
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {filtered.map(p=>(
            <Card key={p.id}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                {p.avatar_url?<img src={p.avatar_url} alt="" style={{ width:36,height:36,borderRadius:"50%",objectFit:"cover",flexShrink:0 }} />:<Av name={p.name||p.username} size={36} />}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                    <span style={{ fontSize:13,fontWeight:600,color:C.text }}>{p.name||"Sin nombre"}</span>
                    <span style={{ fontSize:12,color:C.primary }}>@{p.username||"—"}</span>
                    <span style={{ fontSize:10,padding:"1px 6px",borderRadius:9999,background:p.is_active===false?C.errorBg:C.successBg,color:p.is_active===false?C.error:C.success,fontWeight:600 }}>{p.is_active===false?"inactivo":"activo"}</span>
                  </div>
                  {p.bio&&<div style={{ fontSize:12,color:C.textLight,lineHeight:1.5,background:C.bg,borderRadius:7,padding:"6px 10px",fontStyle:"italic",marginBottom:4 }}>"{p.bio}"</div>}
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}><Meta label="Email" value={p.email||"—"} /><Meta label="Rol" value={p.role||"—"} /><Meta label="Desde" value={fmtDate(p.created_at)} /></div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                  {p.bio&&<ActionBtn label="Borrar bio" color={C.error} onClick={()=>onClearBio(p.id)} confirm="¿Eliminar la bio?" />}
                  {p.is_active!==false&&<ActionBtn label="Deshabilitar" color={C.warn} onClick={()=>onDisableUser(p.id)} confirm="¿Deshabilitar?" />}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TAB CAMPAÑAS ─────────────────────────────────────────────────────────────
function TabCampanas({ campanas, onClearDesc, onPause }) {
  const [search, setSearch] = useState("");
  const [fil, setFil] = useState("todos");
  const withDesc=campanas.filter(c=>c.description&&c.description.trim()), activas=campanas.filter(c=>c.status==="active");
  const stats=[{id:"todos",label:"Total",value:campanas.length,color:C.text},{id:"desc",label:"Con descripción",value:withDesc.length,color:C.primary},{id:"active",label:"Activas",value:activas.length,color:C.success}];
  const pool=fil==="desc"?withDesc:fil==="active"?activas:campanas;
  const filtered=pool.filter(c=>{const q=search.toLowerCase();return !q||c.birthday_person_name?.toLowerCase().includes(q)||c.title?.toLowerCase().includes(q)||c.profile?.username?.toLowerCase().includes(q);});
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>{stats.map(s=><StatCard key={s.id} label={s.label} value={s.value} color={s.color} active={fil===s.id} onClick={()=>setFil(fil===s.id?"todos":s.id)} />)}</div>
      <div style={{ background:C.surface, border:`0.5px solid ${C.border}`, borderRadius:10, padding:"12px 16px" }}><Search value={search} onChange={setSearch} placeholder="Buscar campaña o cumpleañero…" /></div>
      {filtered.length===0?<Empty text="Sin campañas en este filtro" />:(
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {filtered.map(c=>(
            <Card key={c.id}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                {c.image_url?<img src={c.image_url} alt="" style={{ width:48,height:48,borderRadius:8,objectFit:"cover",flexShrink:0,border:`0.5px solid ${C.border}` }} />:<div style={{ width:48,height:48,borderRadius:8,background:C.primaryBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>🎂</div>}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                    <span style={{ fontSize:13,fontWeight:600,color:C.text }}>{c.birthday_person_name||"—"}</span>
                    <span style={{ fontSize:12,color:C.primary }}>@{c.profile?.username||"—"}</span>
                    <span style={{ fontSize:10,padding:"1px 6px",borderRadius:9999,background:c.status==="active"?C.successBg:C.bg,color:c.status==="active"?C.success:C.textMuted,fontWeight:600 }}>{c.status}</span>
                  </div>
                  {c.title&&<div style={{ fontSize:12,color:C.textLight,marginBottom:4 }}>📌 {c.title}</div>}
                  {c.description&&<div style={{ fontSize:12,color:C.textLight,lineHeight:1.5,background:C.bg,borderRadius:7,padding:"7px 10px",fontStyle:"italic",marginBottom:4 }}>"{c.description}"</div>}
                  <Meta label="Creada" value={fmtDate(c.created_at)} />
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                  {c.description&&<ActionBtn label="Borrar desc." color={C.error} onClick={()=>onClearDesc(c.id)} confirm="¿Eliminar la descripción?" />}
                  {c.status==="active"&&<ActionBtn label="Pausar" color={C.warn} onClick={()=>onPause(c.id)} confirm="¿Pausar esta campaña?" />}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TAB REGALOS ──────────────────────────────────────────────────────────────
function TabRegalos({ regalos, onClearDesc }) {
  const [search, setSearch] = useState("");
  const [fil, setFil] = useState("todos");
  const withDesc=regalos.filter(i=>i.description&&i.description.trim()), withImg=regalos.filter(i=>i.image_url);
  const stats=[{id:"todos",label:"Total",value:regalos.length,color:C.text},{id:"desc",label:"Con descripción",value:withDesc.length,color:C.primary},{id:"img",label:"Con imagen",value:withImg.length,color:C.success}];
  const pool=fil==="desc"?withDesc:fil==="img"?withImg:regalos;
  const filtered=pool.filter(i=>{const q=search.toLowerCase();return !q||i.name?.toLowerCase().includes(q)||i.campaign?.birthday_person_name?.toLowerCase().includes(q);});
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>{stats.map(s=><StatCard key={s.id} label={s.label} value={s.value} color={s.color} active={fil===s.id} onClick={()=>setFil(fil===s.id?"todos":s.id)} />)}</div>
      <div style={{ background:C.surface, border:`0.5px solid ${C.border}`, borderRadius:10, padding:"12px 16px" }}><Search value={search} onChange={setSearch} placeholder="Buscar regalo o cumpleañero…" /></div>
      {filtered.length===0?<Empty text="Sin regalos en este filtro" />:(
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {filtered.map(item=>(
            <Card key={item.id}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                {item.image_url?<img src={item.image_url} alt="" style={{ width:44,height:44,borderRadius:8,objectFit:"cover",flexShrink:0,border:`0.5px solid ${C.border}` }} />:<div style={{ width:44,height:44,borderRadius:8,background:C.primaryBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>🎁</div>}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                    <span style={{ fontSize:13,fontWeight:600,color:C.text }}>{item.name||"Sin nombre"}</span>
                    {item.price>0&&<span style={{ fontSize:12,color:C.success,fontWeight:600 }}>${Math.round(item.price).toLocaleString("es-AR")}</span>}
                    <span style={{ fontSize:11,color:C.primary }}>de {item.campaign?.birthday_person_name||"—"}</span>
                  </div>
                  {item.description&&<div style={{ fontSize:12,color:C.textLight,lineHeight:1.5,background:C.bg,borderRadius:7,padding:"7px 10px",fontStyle:"italic",marginBottom:4 }}>"{item.description}"</div>}
                  <Meta label="Agregado" value={fmtDate(item.created_at)} />
                </div>
                {item.description&&<ActionBtn label="Borrar desc." color={C.error} onClick={()=>onClearDesc(item.id)} confirm="¿Eliminar la descripción?" />}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdminModeracionPage() {
  const { data, loading, toast, load, clearMessage, clearMedia, disableUser, clearBio, clearCampDesc, clearItemDesc, pauseCampaign } = useModeracion();
  const [activeTab, setActiveTab] = useState("mensajes");
  const mensajes=data?.mensajes||[], perfiles=data?.perfiles||[], campanas=data?.campanas||[], regalos=data?.regalos||[];
  const TABS=[{id:"mensajes",label:"Mensajes",count:mensajes.length},{id:"perfiles",label:"Perfiles",count:perfiles.length},{id:"campanas",label:"Campañas",count:campanas.length},{id:"regalos",label:"Regalos",count:regalos.length}];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Toast toast={toast} />
      <div style={{ display:"flex", alignItems:"center", background:C.surface, border:`0.5px solid ${C.border}`, borderRadius:10, padding:4, alignSelf:"flex-start", flexWrap:"wrap", gap:2 }}>
        {TABS.map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{ padding:"7px 16px", borderRadius:7, border:"none", cursor:"pointer", fontSize:13, background:activeTab===tab.id?C.primaryBg:"transparent", color:activeTab===tab.id?C.primary:C.textLight, fontWeight:activeTab===tab.id?600:400, display:"flex", alignItems:"center", gap:6 }}>
            {tab.label}
            <span style={{ fontSize:10, fontWeight:700, padding:"1px 5px", borderRadius:9999, background:activeTab===tab.id?C.primary:C.bg, color:activeTab===tab.id?"#fff":C.textMuted }}>{loading?"…":tab.count}</span>
          </button>
        ))}
        <div style={{ flex:1, minWidth:16 }} />
        <button onClick={load} style={{ padding:"7px 12px", borderRadius:7, border:`0.5px solid ${C.border}`, background:"transparent", fontSize:12, color:C.textLight, cursor:"pointer" }}>↻</button>
      </div>
      {loading
        ? <div style={{ background:C.surface, border:`0.5px solid ${C.border}`, borderRadius:10, padding:32, textAlign:"center", color:C.textMuted, fontSize:13 }}><div style={{ fontSize:24, marginBottom:8 }}>⟳</div>Cargando contenido…</div>
        : <>
            {activeTab==="mensajes" && <TabMensajes mensajes={mensajes} onClearMessage={clearMessage} onClearMedia={clearMedia} onDisableUser={disableUser} />}
            {activeTab==="perfiles" && <TabPerfiles perfiles={perfiles} onClearBio={clearBio} onDisableUser={disableUser} />}
            {activeTab==="campanas" && <TabCampanas campanas={campanas} onClearDesc={clearCampDesc} onPause={pauseCampaign} />}
            {activeTab==="regalos"  && <TabRegalos  regalos={regalos}   onClearDesc={clearItemDesc} />}
          </>
      }
    </div>
  );
}

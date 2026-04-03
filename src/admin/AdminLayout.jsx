import { useState } from "react";
import { useIsMobile } from "./useAdminBreakpoint";
import { COLORS } from "../utils/constants";

const A = {
  primary:      COLORS.primary,
  primaryLight: COLORS.primaryLight,
  primaryBg:    "#EDE9FE",
  accent:       COLORS.accent,
  accentBg:     "#FEF3C7",
  bg:           "#F3F4F6",
  surface:      "#FFFFFF",
  border:       COLORS.border,
  text:         COLORS.text,
  textLight:    COLORS.textLight,
  textMuted:    "#9CA3AF",
};

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "Principal",
    items: [
      { id: "dashboard",   label: "Dashboard",   icon: IconGrid   },
      { id: "usuarios",    label: "Usuarios",     icon: IconUsers  },
      { id: "cumpleanos",  label: "Cumpleaños",   icon: IconCal,   badge: null },
      { id: "regalos",     label: "Regalos",      icon: IconGift   },
    ],
  },
  {
    label: "Negocio",
    items: [
      { id: "finanzas",    label: "Finanzas",     icon: IconChart  },
      { id: "analytics",   label: "Analytics",    icon: IconClock  },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { id: "alertas",     label: "Alertas",      icon: IconStar,  badge: 3, badgeType: "accent" },
      { id: "moderacion",  label: "Moderación",   icon: IconInfo   },
      { id: "configuracion",label: "Configuración",icon: IconSettings },
    ],
  },
];

// Bottom nav: los 5 más importantes para mobile
const BOTTOM_NAV = [
  { id: "dashboard",  label: "Inicio",    icon: IconGrid    },
  { id: "usuarios",   label: "Usuarios",  icon: IconUsers   },
  { id: "cumpleanos", label: "Cumples",   icon: IconCal     },
  { id: "regalos",    label: "Regalos",   icon: IconGift    },
  { id: "finanzas",   label: "Finanzas",  icon: IconChart   },
];

const PAGE_TITLES = {
  dashboard: "Dashboard", usuarios: "Usuarios", cumpleanos: "Cumpleaños",
  regalos: "Regalos", finanzas: "Finanzas", analytics: "Analytics",
  alertas: "Alertas", moderacion: "Moderación", configuracion: "Configuración",
};

// ─── LAYOUT PRINCIPAL ─────────────────────────────────────────────────────────
export default function AdminLayout({ activePage, onNavigate, profile, onExit, children }) {
  const isMobile  = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [showMenu, setShowMenu]   = useState(false); // menú completo en mobile

  if (isMobile) {
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100dvh", background:A.bg, fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflow:"hidden" }}>

        {/* ── TOPBAR MOBILE ── */}
        <header style={{ background:A.surface, borderBottom:`0.5px solid ${A.border}`, padding:"0 16px", height:52, display:"flex", alignItems:"center", gap:10, flexShrink:0, position:"sticky", top:0, zIndex:100 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flex:1 }}>
            <div style={{ width:26, height:26, background:A.primary, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>🎂</div>
            <span style={{ fontSize:14, fontWeight:600, color:A.text }}>
              {PAGE_TITLES[activePage] || "Admin"}
            </span>
          </div>

          {/* Botón menú completo */}
          <button onClick={() => setShowMenu(true)} style={{ width:34, height:34, borderRadius:8, border:`0.5px solid ${A.border}`, background:"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke={A.textLight} strokeWidth="1.5">
              <path d="M2 4h12M2 8h12M2 12h12"/>
            </svg>
          </button>

          {/* Avatar */}
          <div style={{ width:30, height:30, borderRadius:"50%", background:A.primary, color:"#fff", fontSize:11, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {profile?.username ? profile.username.slice(0,2).toUpperCase() : "AD"}
          </div>
        </header>

        {/* ── CONTENIDO MOBILE ── */}
        <main style={{ flex:1, overflowY:"auto", padding:16, paddingBottom:80 }}>
          {children}
        </main>

        {/* ── BOTTOM NAV ── */}
        <nav style={{ position:"fixed", bottom:0, left:0, right:0, height:60, background:A.surface, borderTop:`0.5px solid ${A.border}`, display:"flex", alignItems:"stretch", zIndex:100 }}>
          {BOTTOM_NAV.map(item => {
            const isActive = activePage === item.id;
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => onNavigate(item.id)} style={{
                flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                gap:3, border:"none", background:"transparent", cursor:"pointer",
                color: isActive ? A.primary : A.textMuted,
              }}>
                <Icon size={20} color={isActive ? A.primary : A.textMuted} />
                <span style={{ fontSize:9, fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
                {isActive && <div style={{ position:"absolute", bottom:0, width:32, height:2, background:A.primary, borderRadius:"2px 2px 0 0" }} />}
              </button>
            );
          })}
        </nav>

        {/* ── MENÚ COMPLETO (DRAWER MOBILE) ── */}
        {showMenu && (
          <div style={{ position:"fixed", inset:0, zIndex:500 }}>
            <div onClick={() => setShowMenu(false)} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.4)" }}/>
            <div style={{ position:"absolute", right:0, top:0, bottom:0, width:"75%", maxWidth:300, background:A.surface, display:"flex", flexDirection:"column", overflowY:"auto" }}>
              {/* Header drawer */}
              <div style={{ padding:"18px 16px 12px", borderBottom:`0.5px solid ${A.border}`, display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:26, height:26, background:A.primary, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🎂</div>
                <span style={{ fontSize:14, fontWeight:600, color:A.text, flex:1 }}>Cumpleañitos Admin</span>
                <button onClick={() => setShowMenu(false)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:A.textMuted }}>✕</button>
              </div>

              {/* Nav sections */}
              <div style={{ flex:1, padding:12 }}>
                {NAV_SECTIONS.map(section => (
                  <div key={section.label} style={{ marginBottom:8 }}>
                    <div style={{ fontSize:9, fontWeight:600, color:A.textMuted, textTransform:"uppercase", letterSpacing:"0.08em", padding:"0 8px", marginBottom:4 }}>
                      {section.label}
                    </div>
                    {section.items.map(item => {
                      const isActive = activePage === item.id;
                      const Icon = item.icon;
                      return (
                        <button key={item.id} onClick={() => { onNavigate(item.id); setShowMenu(false); }} style={{
                          display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 8px",
                          borderRadius:8, border:"none",
                          background: isActive ? A.primaryBg : "transparent",
                          color: isActive ? A.primary : A.textLight,
                          fontWeight: isActive ? 600 : 400,
                          fontSize:13, cursor:"pointer", marginBottom:1,
                        }}>
                          <Icon size={16} color={isActive ? A.primary : A.textLight}/>
                          <span style={{ flex:1, textAlign:"left" }}>{item.label}</span>
                          {item.badge && (
                            <span style={{ background: item.badgeType==="accent" ? A.accent : A.primary, color:"#fff", fontSize:10, fontWeight:600, padding:"1px 6px", borderRadius:9999 }}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Footer drawer */}
              <div style={{ padding:12, borderTop:`0.5px solid ${A.border}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 8px 12px" }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background:A.primary, color:"#fff", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {profile?.username ? profile.username.slice(0,2).toUpperCase() : "AD"}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:A.text }}>{profile?.name || profile?.username || "Admin"}</div>
                    <div style={{ fontSize:10, color:A.textMuted }}>Administrador</div>
                  </div>
                </div>
                <button onClick={onExit} style={{ width:"100%", padding:"9px 0", borderRadius:8, border:`0.5px solid ${A.border}`, background:"transparent", color:A.textLight, fontSize:13, cursor:"pointer" }}>
                  ↗ Salir al sitio
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── DESKTOP ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", height:"100vh", background:A.bg, fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflow:"hidden" }}>

      {/* Sidebar desktop */}
      <aside style={{ width: collapsed ? 56 : 220, flexShrink:0, background:A.surface, borderRight:`0.5px solid ${A.border}`, display:"flex", flexDirection:"column", transition:"width 0.2s ease", overflow:"hidden" }}>
        <div style={{ padding: collapsed ? "18px 0" : "18px 20px 16px", borderBottom:`0.5px solid ${A.border}`, display:"flex", alignItems:"center", justifyContent: collapsed ? "center" : "flex-start", gap:10, flexShrink:0 }}>
          <div style={{ width:28, height:28, background:A.primary, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>🎂</div>
          {!collapsed && (
            <div style={{ display:"flex", alignItems:"center", gap:6, overflow:"hidden" }}>
              <span style={{ fontSize:14, fontWeight:600, color:A.text, whiteSpace:"nowrap" }}>Cumpleañitos</span>
              <span style={{ fontSize:9, fontWeight:600, color:A.primary, background:A.primaryBg, padding:"2px 6px", borderRadius:4 }}>ADMIN</span>
            </div>
          )}
        </div>

        <nav style={{ flex:1, overflowY:"auto", padding: collapsed ? "12px 6px" : "12px" }}>
          {NAV_SECTIONS.map(section => (
            <div key={section.label} style={{ marginBottom:8 }}>
              {!collapsed && (
                <div style={{ fontSize:9, fontWeight:600, color:A.textMuted, textTransform:"uppercase", letterSpacing:"0.08em", padding:"0 8px", marginBottom:4 }}>
                  {section.label}
                </div>
              )}
              {section.items.map(item => {
                const isActive = activePage === item.id;
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => onNavigate(item.id)} title={collapsed ? item.label : undefined} style={{
                    display:"flex", alignItems:"center", gap:10, width:"100%",
                    padding: collapsed ? "9px 0" : "9px 8px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    borderRadius:8, border:"none",
                    background: isActive ? A.primaryBg : "transparent",
                    color: isActive ? A.primary : A.textLight,
                    fontWeight: isActive ? 600 : 400,
                    fontSize:13, cursor:"pointer", marginBottom:1, whiteSpace:"nowrap", overflow:"hidden",
                  }}
                  onMouseEnter={e => { if(!isActive) e.currentTarget.style.background = A.bg; }}
                  onMouseLeave={e => { if(!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <Icon size={16} color={isActive ? A.primary : A.textLight}/>
                    {!collapsed && <span style={{ flex:1, textAlign:"left" }}>{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span style={{ background: item.badgeType==="accent" ? A.accent : A.primary, color:"#fff", fontSize:10, fontWeight:600, padding:"1px 6px", borderRadius:9999 }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ borderTop:`0.5px solid ${A.border}`, padding: collapsed ? "12px 6px" : "12px", flexShrink:0 }}>
          {!collapsed && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 8px", marginBottom:6 }}>
              <div style={{ width:30, height:30, borderRadius:"50%", background:A.primary, color:"#fff", fontSize:11, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {profile?.username ? profile.username.slice(0,2).toUpperCase() : "AD"}
              </div>
              <div style={{ overflow:"hidden" }}>
                <div style={{ fontSize:12, fontWeight:600, color:A.text, whiteSpace:"nowrap", textOverflow:"ellipsis", overflow:"hidden" }}>
                  {profile?.username || "admin"}
                </div>
                <div style={{ fontSize:10, color:A.textMuted }}>Administrador</div>
              </div>
            </div>
          )}
          <div style={{ display:"flex", gap:6, justifyContent: collapsed ? "center" : "flex-start" }}>
            <button onClick={() => setCollapsed(c => !c)} style={{ width:32, height:32, borderRadius:7, border:`0.5px solid ${A.border}`, background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:A.textLight, fontSize:13 }}>
              {collapsed ? "→" : "←"}
            </button>
            {!collapsed && (
              <button onClick={onExit} style={{ height:32, padding:"0 10px", borderRadius:7, border:`0.5px solid ${A.border}`, background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", gap:5, color:A.textLight, fontSize:11 }}>
                <span>↗</span> Salir
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main desktop */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <header style={{ background:A.surface, borderBottom:`0.5px solid ${A.border}`, padding:"0 24px", height:52, display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <span style={{ fontSize:15, fontWeight:600, color:A.text, flex:1 }}>{PAGE_TITLES[activePage] || "Dashboard"}</span>
          <select style={{ fontSize:12, color:A.textLight, border:`0.5px solid ${A.border}`, borderRadius:7, padding:"5px 10px", background:A.bg, cursor:"pointer" }}>
            <option>Último mes</option>
            <option>Últimos 7 días</option>
            <option>Últimos 90 días</option>
          </select>
          <button style={{ width:32, height:32, borderRadius:7, border:`0.5px solid ${A.border}`, background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:A.textLight, fontSize:14 }} title="Actualizar">↻</button>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:13, fontWeight:500, color:A.textLight }}>{profile?.name || profile?.username || "Admin"}</span>
            <div style={{ width:30, height:30, borderRadius:"50%", background:A.primary, color:"#fff", fontSize:11, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {profile?.username ? profile.username.slice(0,2).toUpperCase() : "AD"}
            </div>
          </div>
        </header>
        <main style={{ flex:1, overflowY:"auto", padding:24, background:A.bg }}>
          {children}
        </main>
      </div>
    </div>
  );
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
function IconGrid({ size=16, color="currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>;
}
function IconUsers({ size=16, color="currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5"><circle cx="8" cy="6" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>;
}
function IconCal({ size=16, color="currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5"><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M5 3V1.5M11 3V1.5M2 7h12"/></svg>;
}
function IconGift({ size=16, color="currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5"><rect x="2" y="6" width="12" height="9" rx="1"/><path d="M2 9h12M8 6V15"/><path d="M8 6C8 6 6 4 5 4s-2 1-2 2 1 1 2 1h3z"/><path d="M8 6C8 6 10 4 11 4s2 1 2 2-1 1-2 1H8z"/></svg>;
}
function IconChart({ size=16, color="currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5"><path d="M2 12L5 8L8 10L11 5L14 7"/></svg>;
}
function IconClock({ size=16, color="currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>;
}
function IconStar({ size=16, color="currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5"><path d="M8 2L9.5 6H14L10.5 8.5L12 13L8 10.5L4 13L5.5 8.5L2 6H6.5Z"/></svg>;
}
function IconInfo({ size=16, color="currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5h.01M8 7v4"/></svg>;
}
function IconSettings({ size=16, color="currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5"><circle cx="8" cy="8" r="2.5"/><path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.4 3.4l.7.7M11.9 11.9l.7.7M3.4 12.6l.7-.7M11.9 4.1l.7-.7"/></svg>;
}

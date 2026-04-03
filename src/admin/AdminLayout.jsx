import { useState } from "react";
import { COLORS } from "../utils/constants";

// ─── PALETA ADMIN ─────────────────────────────────────────────────────────────
const A = {
  primary:      COLORS.primary,       // #7C3AED
  primaryLight: COLORS.primaryLight,  // #A78BFA
  primaryBg:    "#EDE9FE",
  accent:       COLORS.accent,        // #F59E0B
  accentBg:     "#FEF3C7",
  bg:           "#F3F4F6",
  surface:      "#FFFFFF",
  border:       COLORS.border,        // #E5E7EB
  text:         COLORS.text,          // #1F2937
  textLight:    COLORS.textLight,     // #6B7280
  textMuted:    "#9CA3AF",
  success:      COLORS.success,       // #10B981
  error:        COLORS.error,         // #EF4444
};

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "Principal",
    items: [
      { id: "dashboard",   label: "Dashboard",   icon: IconGrid },
      { id: "usuarios",    label: "Usuarios",    icon: IconUsers },
      { id: "cumpleanos",  label: "Cumpleaños",  icon: IconCalendar, badge: null, badgeType: "primary" },
      { id: "regalos",     label: "Regalos",     icon: IconGift },
    ],
  },
  {
    label: "Negocio",
    items: [
      { id: "finanzas",  label: "Finanzas",  icon: IconChart },
      { id: "analytics", label: "Analytics", icon: IconClock },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { id: "alertas",       label: "Alertas",       icon: IconStar,     badge: 3, badgeType: "accent" },
      { id: "moderacion",    label: "Moderación",    icon: IconInfo },
      { id: "configuracion", label: "Configuración", icon: IconSettings },
    ],
  },
];

// ─── ADMIN LAYOUT ─────────────────────────────────────────────────────────────
export default function AdminLayout({ activePage, onNavigate, profile, onExit, children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: A.bg,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      overflow: "hidden",
    }}>
      {/* ── SIDEBAR ── */}
      <aside style={{
        width: collapsed ? 56 : 220,
        flexShrink: 0,
        background: A.surface,
        borderRight: `0.5px solid ${A.border}`,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? "18px 0" : "18px 20px 16px",
          borderBottom: `0.5px solid ${A.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: 10,
          flexShrink: 0,
        }}>
          <div style={{
            width: 28, height: 28,
            background: A.primary,
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, flexShrink: 0,
          }}>🎂</div>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: A.text, whiteSpace: "nowrap" }}>
                Cumpleañitos
              </span>
              <span style={{
                fontSize: 9, fontWeight: 600, color: A.primary,
                background: A.primaryBg, padding: "2px 6px",
                borderRadius: 4, whiteSpace: "nowrap",
              }}>ADMIN</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: collapsed ? "12px 6px" : "12px" }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} style={{ marginBottom: 8 }}>
              {!collapsed && (
                <div style={{
                  fontSize: 9, fontWeight: 600, color: A.textMuted,
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  padding: "0 8px", marginBottom: 4,
                }}>
                  {section.label}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = activePage === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={collapsed ? item.label : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: collapsed ? "9px 0" : "9px 8px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      borderRadius: 8,
                      border: "none",
                      background: isActive ? A.primaryBg : "transparent",
                      color: isActive ? A.primary : A.textLight,
                      fontWeight: isActive ? 600 : 400,
                      fontSize: 13,
                      cursor: "pointer",
                      marginBottom: 1,
                      transition: "background 0.15s",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = A.bg; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <Icon size={16} color={isActive ? A.primary : A.textLight} />
                    {!collapsed && <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span style={{
                        background: item.badgeType === "accent" ? A.accent : A.primary,
                        color: "#fff",
                        fontSize: 10, fontWeight: 600,
                        padding: "1px 6px", borderRadius: 9999,
                        lineHeight: 1.4,
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom: usuario + collapse */}
        <div style={{
          borderTop: `0.5px solid ${A.border}`,
          padding: collapsed ? "12px 6px" : "12px",
          flexShrink: 0,
        }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", marginBottom: 6 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: A.primary, color: "#fff",
                fontSize: 11, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {profile?.username ? profile.username.slice(0, 2).toUpperCase() : "AD"}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: A.text, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                  {profile?.username || "admin"}
                </div>
                <div style={{ fontSize: 10, color: A.textMuted }}>Administrador</div>
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 6, justifyContent: collapsed ? "center" : "flex-start" }}>
            <button
              onClick={() => setCollapsed(c => !c)}
              title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
              style={{
                width: 32, height: 32, borderRadius: 7,
                border: `0.5px solid ${A.border}`, background: "transparent",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: A.textLight, fontSize: 13,
              }}
            >
              {collapsed ? "→" : "←"}
            </button>
            {!collapsed && (
              <button
                onClick={onExit}
                title="Salir del admin"
                style={{
                  height: 32, padding: "0 10px", borderRadius: 7,
                  border: `0.5px solid ${A.border}`, background: "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center",
                  gap: 5, color: A.textLight, fontSize: 11,
                }}
              >
                <span>↗</span> Salir
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <header style={{
          background: A.surface,
          borderBottom: `0.5px solid ${A.border}`,
          padding: "0 24px",
          height: 52,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: A.text, flex: 1 }}>
            {PAGE_TITLES[activePage] || "Dashboard"}
          </span>

          {/* Selector período */}
          <select
            style={{
              fontSize: 12, color: A.textLight,
              border: `0.5px solid ${A.border}`,
              borderRadius: 7, padding: "5px 10px",
              background: A.bg, cursor: "pointer",
            }}
          >
            <option>Último mes</option>
            <option>Últimos 7 días</option>
            <option>Últimos 90 días</option>
          </select>

          {/* Refresh */}
          <button
            style={{
              width: 32, height: 32, borderRadius: 7,
              border: `0.5px solid ${A.border}`, background: "transparent",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: A.textLight, fontSize: 14,
            }}
            title="Actualizar"
          >
            ↻
          </button>

          {/* Avatar + nombre */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: A.textLight }}>
              {profile?.name || profile?.username || "Admin"}
            </span>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: A.primary, color: "#fff",
              fontSize: 11, fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {profile?.username ? profile.username.slice(0, 2).toUpperCase() : "AD"}
            </div>
          </div>
        </header>

        {/* Contenido de página */}
        <main style={{
          flex: 1,
          overflowY: "auto",
          padding: 24,
          background: A.bg,
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}

// ─── TÍTULOS ──────────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard:     "Dashboard",
  usuarios:      "Usuarios",
  cumpleanos:    "Cumpleaños",
  regalos:       "Regalos",
  finanzas:      "Finanzas",
  analytics:     "Analytics",
  alertas:       "Alertas",
  moderacion:    "Moderación",
  configuracion: "Configuración",
};

// ─── ICONOS SVG ───────────────────────────────────────────────────────────────
function IconGrid({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
      <rect x="1" y="1" width="6" height="6" rx="1"/>
      <rect x="9" y="1" width="6" height="6" rx="1"/>
      <rect x="1" y="9" width="6" height="6" rx="1"/>
      <rect x="9" y="9" width="6" height="6" rx="1"/>
    </svg>
  );
}

function IconUsers({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
      <circle cx="8" cy="6" r="3"/>
      <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
    </svg>
  );
}

function IconCalendar({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="11" rx="1.5"/>
      <path d="M5 3V1.5M11 3V1.5M2 7h12"/>
    </svg>
  );
}

function IconGift({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
      <rect x="2" y="6" width="12" height="9" rx="1"/>
      <path d="M2 9h12M8 6V15"/>
      <path d="M8 6C8 6 6 4 5 4s-2 1-2 2 1 1 2 1h3z"/>
      <path d="M8 6C8 6 10 4 11 4s2 1 2 2-1 1-2 1H8z"/>
    </svg>
  );
}

function IconChart({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M2 12L5 8L8 10L11 5L14 7"/>
      <path d="M12 3h3v3"/>
    </svg>
  );
}

function IconClock({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
      <circle cx="8" cy="8" r="6"/>
      <path d="M8 5v3l2 2"/>
    </svg>
  );
}

function IconStar({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M8 2L9.5 6H14L10.5 8.5L12 13L8 10.5L4 13L5.5 8.5L2 6H6.5Z"/>
    </svg>
  );
}

function IconInfo({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
      <circle cx="8" cy="8" r="6"/>
      <path d="M8 5h.01M8 7v4"/>
    </svg>
  );
}

function IconSettings({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
      <circle cx="8" cy="8" r="2.5"/>
      <path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.4 3.4l.7.7M11.9 11.9l.7.7M3.4 12.6l.7-.7M11.9 4.1l.7-.7"/>
    </svg>
  );
}

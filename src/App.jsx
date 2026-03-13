import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import { COLORS, Logo, Button, Avatar, getInitials, ROLES } from "./shared";
import AuthPage from "./pages/AuthPage";
import CelebrantDashboard from "./pages/CelebrantDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import ExplorePage from "./pages/ExplorePage";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/HomePage";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar({ page, setPage, session, profile, onLogout, onRoleSwitch, onViewLanding }) {
  const [showMenu, setShowMenu] = useState(false);
  const isMobile = useIsMobile();
  const role = profile?.role;

  const copyProfileLink = () => {
    navigator.clipboard.writeText(window.location.origin + "?u=" + profile?.username);
    setShowMenu(false);
  };

  const menuItems = [
    { icon: "🎂", label: "Mi regalo", action: () => { setPage("dashboard"); setShowMenu(false); } },
    { icon: "⚙️", label: "Configuración", action: () => { setPage("settings"); setShowMenu(false); } },
    { icon: "🔗", label: "Compartir mi perfil", action: copyProfileLink },
    { icon: "🚪", label: "Cerrar sesión", action: () => { onLogout(); setShowMenu(false); }, color: COLORS.error },
  ];

  return (
    <nav style={{
      background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid " + COLORS.border,
      padding: "12px 0", position: "sticky", top: 0, zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        padding: isMobile ? "0 16px" : "0 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <div onClick={() => setPage("home")} style={{ cursor: "pointer", flexShrink: 0 }}>
          <Logo size={isMobile ? 20 : 24} />
        </div>

        {/* Desktop nav */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Button variant={page === "explore" ? "outline" : "ghost"} size="sm" onClick={() => setPage("explore")}>Explorar</Button>
            {session ? (
              <>
                {role === "manager" ? (
                  <Button variant={page === "dashboard" ? "outline" : "ghost"} size="sm" onClick={() => setPage("dashboard")}>🎁 Mis regalos</Button>
                ) : (
                  <Button variant={page === "profile" ? "outline" : "ghost"} size="sm" onClick={onViewLanding}>🎂 Mi cumple</Button>
                )}
                <div style={{ position: "relative", marginLeft: 4, display: "flex", alignItems: "center", gap: 2 }}>
                  <div onClick={() => { setPage("settings"); setShowMenu(false); }}
                    style={{ cursor: "pointer", borderRadius: "50%", border: "2px solid transparent", transition: "border 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.border = "2px solid " + COLORS.primary}
                    onMouseLeave={e => e.currentTarget.style.border = "2px solid transparent"}>
                    <Avatar initials={profile ? getInitials(profile.name) : "?"} size={36} />
                  </div>
                  <button onClick={() => setShowMenu(v => !v)} style={{
                    background: "none", border: "none", cursor: "pointer", padding: "4px 6px",
                    color: COLORS.textLight, fontSize: 14, lineHeight: 1, borderRadius: 4,
                    fontWeight: 700,
                  }}>▾</button>
                  {showMenu && (
                    <>
                      <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setShowMenu(false)} />
                      <div style={{
                        position: "absolute", right: 0, top: "calc(100% + 10px)",
                        background: "#fff", borderRadius: 16, border: "1px solid " + COLORS.border,
                        boxShadow: "0 10px 40px rgba(0,0,0,0.14)", minWidth: 230, zIndex: 200, overflow: "hidden",
                      }}>
                        <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid " + COLORS.border, display: "flex", alignItems: "center", gap: 12 }}>
                          <Avatar initials={profile ? getInitials(profile.name) : "?"} size={38} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{profile?.name}</div>
                            <div style={{ fontSize: 12, color: COLORS.textLight }}>@{profile?.username}</div>
                          </div>
                        </div>
                        <div style={{ padding: "10px 14px 12px", borderBottom: "1px solid " + COLORS.border }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textLight, marginBottom: 8, textTransform: "uppercase" }}>Cambiar rol</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            {Object.entries(ROLES).map(([roleKey, roleData]) => (
                              <button key={roleKey} onClick={() => { onRoleSwitch(roleKey); setShowMenu(false); }} style={{
                                flex: 1, padding: "8px 6px", borderRadius: 8,
                                border: "2px solid " + (role === roleKey ? roleData.color : COLORS.border),
                                background: role === roleKey ? roleData.color + "15" : "transparent",
                                color: role === roleKey ? roleData.color : COLORS.textLight,
                                cursor: "pointer", fontSize: 11, fontWeight: role === roleKey ? 700 : 500,
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                              }}>
                                <span style={{ fontSize: 16 }}>{roleData.icon}</span>
                                <span>{roleData.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        {menuItems.map((item, i) => (
                          <button key={i} onClick={item.action} style={{
                            display: "flex", alignItems: "center", gap: 12, width: "100%",
                            padding: "13px 18px", border: "none",
                            borderBottom: i < menuItems.length - 1 ? "1px solid " + COLORS.border : "none",
                            background: "none", cursor: "pointer", fontSize: 14,
                            color: item.color || COLORS.text, textAlign: "left", fontWeight: 500,
                          }}
                            onMouseEnter={e => e.currentTarget.style.background = COLORS.bg}
                            onMouseLeave={e => e.currentTarget.style.background = "none"}>
                            <span style={{ fontSize: 18, width: 22, textAlign: "center" }}>{item.icon}</span>
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => setPage("login")}>Iniciar sesión</Button>
                <Button variant="accent" size="sm" onClick={() => setPage("register")}>Registrarse gratis</Button>
              </>
            )}
          </div>
        )}

        {/* Mobile nav — compacto */}
        {isMobile && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {session ? (
              <div onClick={() => setPage("perfil")} style={{ cursor: "pointer" }}>
                <Avatar initials={profile ? getInitials(profile.name) : "?"} size={34} />
              </div>
            ) : (
              <>
                <button onClick={() => setPage("login")} style={{
                  background: "transparent", border: "1.5px solid " + COLORS.primary,
                  color: COLORS.primary, borderRadius: 9999,
                  padding: "8px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>Ingresar</button>
                <button onClick={() => setPage("register")} style={{
                  background: COLORS.accent, border: "none", color: "#fff", borderRadius: 9999,
                  padding: "8px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(245,158,11,0.35)",
                }}>Registrarse</button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

// ─── PANTALLA PERFIL MOBILE ────────────────────────────────────────────────
function ProfileScreen({ profile, session, setPage, onLogout, onViewLanding }) {
  const role = profile?.role;

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.origin + "?u=" + profile?.username);
  };

  const spaceCards = [
    {
      icon: "🎂", title: "Mi regalo", sub: "Mi campaña de cumpleaños",
      color: COLORS.primary, bg: "#F5F0FF", action: () => onViewLanding(),
    },
    {
      icon: "📋", title: "Lista de deseos", sub: "Cosas que me pueden regalar",
      color: COLORS.accent, bg: "#FFFBEB", action: () => setPage("dashboard"),
    },
    {
      icon: "🎁", title: "Regalos que hice", sub: "A quienes les regalé",
      color: "#10B981", bg: "#F0FDF9", action: () => setPage("dashboard"),
    },
    {
      icon: "🛍️", title: "Gestionar regalos", sub: "Cumpleaños que organizo",
      color: "#3B82F6", bg: "#EFF6FF", action: () => setPage("dashboard"),
    },
  ];

  const accountItems = [
    { icon: "⚙️", label: "Configuración", sub: "Editar perfil y datos", bg: "#F3F4F6", action: () => setPage("settings") },
    { icon: "🔗", label: "Compartir mi perfil", sub: "Link de cumpleaños público", bg: "#F3F4F6", action: copyLink },
    { icon: "🚪", label: "Cerrar sesión", sub: null, bg: "#FEF2F2", danger: true, action: onLogout },
  ];

  const roleLabel = role === "manager" ? "Gestor" : role === "gifter" ? "Regalador" : "Cumpleañero";
  const roleIcon = role === "manager" ? "🛍️" : role === "gifter" ? "🎁" : "🎂";

  return (
    <div style={{ background: "#F5F5F7", minHeight: "100vh", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(160deg, #EDE9FF 0%, #F5F0FF 100%)",
        padding: "28px 20px 20px", textAlign: "center",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "linear-gradient(135deg, " + COLORS.primary + ", " + COLORS.primaryDark + ")",
          color: "#fff", fontSize: 26, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 12px", border: "3px solid #fff",
          boxShadow: "0 4px 16px rgba(124,58,237,0.25)",
        }}>
          {profile ? getInitials(profile.name) : "?"}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text }}>{profile?.name}</div>
        <div style={{ fontSize: 13, color: COLORS.textLight, margin: "3px 0 10px" }}>@{profile?.username}</div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "5px 14px", background: COLORS.primary + "18",
          borderRadius: 20, fontSize: 12, fontWeight: 700, color: COLORS.primary,
        }}>
          {roleIcon} {roleLabel}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", background: "#fff", borderBottom: "1px solid " + COLORS.border }}>
        {[
          { n: "$0", l: "Recibido" },
          { n: "0", l: "Aportes" },
          { n: "0", l: "Seguidores" },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, padding: "12px 4px", textAlign: "center",
            borderRight: i < 2 ? "1px solid " + COLORS.border : "none",
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text }}>{s.n}</div>
            <div style={{ fontSize: 10, color: COLORS.textLight }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* MI ESPACIO — Cards 2x2 */}
      <div style={{ padding: "16px 14px 4px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
          Mi espacio
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {spaceCards.map((card, i) => (
            <button key={i} onClick={card.action} style={{
              background: "#fff", borderRadius: 16, padding: "16px 14px 12px",
              border: "1px solid " + COLORS.border,
              borderBottom: "3px solid " + card.color,
              cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "flex-start", gap: 6, textAlign: "left",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: card.bg, display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 22,
              }}>{card.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.text, lineHeight: 1.2 }}>{card.title}</div>
              <div style={{ fontSize: 11, color: COLORS.textLight, lineHeight: 1.3 }}>{card.sub}</div>
              <div style={{ fontSize: 12, color: card.color, alignSelf: "flex-end", fontWeight: 700 }}>›</div>
            </button>
          ))}
        </div>
      </div>

      {/* CUENTA */}
      <div style={{ padding: "16px 14px 4px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
          Cuenta
        </div>
        <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid " + COLORS.border }}>
          {accountItems.map((item, i) => (
            <button key={i} onClick={item.action} style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%",
              padding: "14px 16px",
              borderBottom: i < accountItems.length - 1 ? "1px solid #F3F4F6" : "none",
              background: "none", cursor: "pointer", border: "none",
              borderBottom: i < accountItems.length - 1 ? "1px solid #F3F4F6" : "none",
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, background: item.bg,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0,
              }}>{item.icon}</div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: item.danger ? COLORS.error : COLORS.text }}>{item.label}</div>
                {item.sub && <div style={{ fontSize: 11, color: COLORS.textLight }}>{item.sub}</div>}
              </div>
              <div style={{ fontSize: 16, color: "#D1D5DB" }}>›</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ page, setPage, profile, onViewLanding }) {
  const isMobile = useIsMobile();
  if (!isMobile) return null;
  const role = profile?.role;
  const items = [
    { icon: "🏠", label: "Inicio", key: "home", action: () => setPage("home") },
    { icon: "🔍", label: "Explorar", key: "explore", action: () => setPage("explore") },
    { icon: "🎁", label: "Mis listas", key: "dashboard", action: () => role === "manager" ? setPage("dashboard") : onViewLanding() },
    { icon: "🔔", label: "Notif.", key: "notif", action: () => setPage("notif") },
    { icon: "👤", label: "Perfil", key: "perfil", action: () => setPage("perfil") },
  ];
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, height: 70,
      background: "#fff", borderTop: "1px solid " + COLORS.border,
      display: "flex", alignItems: "stretch",
      boxShadow: "0 -4px 24px rgba(124,58,237,0.10)", zIndex: 200,
    }}>
      {items.map((item) => {
        const active = page === item.key;
        return (
          <button key={item.key} onClick={item.action} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 3, background: "none", border: "none", cursor: "pointer", padding: "8px 0",
          }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: active ? 800 : 500, color: active ? COLORS.primary : COLORS.textLight }}>
              {item.label}
            </span>
            {active && <div style={{ width: 5, height: 5, background: COLORS.primary, borderRadius: "50%", marginTop: -1 }} />}
          </button>
        );
      })}
    </nav>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer({ isMobile }) {
  return (
    <footer style={{
      borderTop: "1px solid " + COLORS.border,
      padding: isMobile ? "32px 20px 24px" : "36px 20px",
      textAlign: "center", marginTop: 40,
      paddingBottom: isMobile ? 90 : 36,
    }}>
      <Logo size={22} />
      <p style={{ fontSize: 13, color: COLORS.textLight, marginTop: 12, marginBottom: 0 }}>
        Hecho con 💜 en Argentina · © 2026 Cumpleanitos
      </p>
    </footer>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileTarget, setProfileTarget] = useState(null);
  const loginNavigatedRef = useRef(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const u = params.get("u");
    const c = params.get("c");
    if (u) { setProfileTarget({ username: u }); setPage("profile"); }
    else if (c) { setProfileTarget({ campaignId: c }); setPage("profile"); }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) loadProfile(s.user.id);
      setLoading(false);
    }).catch(() => setLoading(false));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (s) {
        if (event === "SIGNED_IN" && !loginNavigatedRef.current) {
          loginNavigatedRef.current = true;
          loadProfile(s.user.id).then(data => {
            const params = new URLSearchParams(window.location.search);
            if (!params.get("u") && !params.get("c")) {
              if (data?.role === "manager") setPage("dashboard");
              else if (data?.role === "gifter") setPage("explore");
              else if (data?.username) viewProfile(data.username);
              else setPage("dashboard");
            }
          });
        } else { loadProfile(s.user.id); }
      } else { loginNavigatedRef.current = false; setProfile(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) setProfile(data);
    return data;
  };

  const handleAuth = async (user) => {
    const data = await loadProfile(user.id);
    if (data?.role === "manager") { setPage("dashboard"); return; }
    if (data?.role === "gifter") { setPage("explore"); return; }
    if (data?.username) viewProfile(data.username);
    else setPage("dashboard");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null); setProfile(null); setPage("home");
    window.history.replaceState({}, "", window.location.pathname);
  };

  const viewProfile = (username) => { setProfileTarget({ username }); setPage("profile"); };

  const handleRoleSwitch = async (newRole) => {
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", session.user.id);
    if (!error) { setProfile(prev => ({ ...prev, role: newRole })); setPage("dashboard"); }
  };

  if (loading) {
    return (
      <div style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", color: COLORS.textLight, fontSize: 16,
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎂</div>
          Cargando...
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case "home": return <HomePage onRegister={() => setPage("register")} onExplore={() => setPage("explore")} />;
      case "explore": return <ExplorePage onViewProfile={viewProfile} />;
      case "perfil":
        if (!session) return <AuthPage initialMode="login" onAuth={handleAuth} />;
        return (
          <ProfileScreen
            profile={profile} session={session} setPage={setPage}
            onLogout={handleLogout}
            onViewLanding={() => profile?.username ? viewProfile(profile.username) : setPage("dashboard")}
          />
        );
      case "notif":
        return (
          <div style={{ padding: "20px", textAlign: "center", color: COLORS.textLight, paddingBottom: 80 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            <p>No tenés notificaciones nuevas</p>
          </div>
        );
      case "login":
      case "register":
        if (session) {
          if (profile?.role === "manager") return <ManagerDashboard profile={profile} session={session} />;
          if (profile?.role === "gifter") return <ExplorePage onViewProfile={viewProfile} />;
          return <CelebrantDashboard profile={profile} session={session} defaultTab="campaign" />;
        }
        return <AuthPage initialMode={page} onAuth={handleAuth} />;
      case "dashboard":
        if (!session) return <AuthPage initialMode="login" onAuth={handleAuth} />;
        if (profile?.role === "gifter") return <ExplorePage onViewProfile={viewProfile} />;
        if (profile?.role === "manager") return <ManagerDashboard profile={profile} session={session} />;
        return <CelebrantDashboard profile={profile} session={session} defaultTab="campaign" onViewLanding={() => viewProfile(profile?.username)} />;
      case "settings":
        if (!session) return <AuthPage initialMode="login" onAuth={handleAuth} />;
        if (profile?.role === "gifter") return <ExplorePage onViewProfile={viewProfile} />;
        if (profile?.role === "manager") return <ManagerDashboard profile={profile} session={session} />;
        return <CelebrantDashboard profile={profile} session={session} defaultTab="settings" onViewLanding={() => viewProfile(profile?.username)} />;
      case "profile":
        return <ProfilePage username={profileTarget?.username} campaignId={profileTarget?.campaignId} currentSession={session} currentProfile={profile} />;
      default:
        return <HomePage onRegister={() => setPage("register")} onExplore={() => setPage("explore")} />;
    }
  };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: COLORS.bg, minHeight: "100vh", color: COLORS.text }}>
      <Navbar
        page={page} setPage={setPage} session={session} profile={profile}
        onLogout={handleLogout} onRoleSwitch={handleRoleSwitch}
        onViewLanding={() => profile?.username ? viewProfile(profile.username) : setPage("dashboard")}
      />
      <main style={{ paddingBottom: isMobile && session ? 70 : 0 }}>
        {renderPage()}
      </main>
      {page !== "perfil" && <Footer isMobile={isMobile} />}
      {session && (
        <BottomNav
          page={page} setPage={setPage} profile={profile}
          onViewLanding={() => profile?.username ? viewProfile(profile.username) : setPage("dashboard")}
        />
      )}
    </div>
  );
}
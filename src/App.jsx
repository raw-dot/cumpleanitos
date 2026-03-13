import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import { COLORS, Logo, Button, Avatar, getInitials, ROLES } from "./shared";
import AuthPage from "./pages/AuthPage";
import CelebrantDashboard from "./pages/CelebrantDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import ExplorePage from "./pages/ExplorePage";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/HomePage";

// ─── HOOK MOBILE ──────────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
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
    navigator.clipboard.writeText(\`\${window.location.origin}?u=\${profile?.username}\`);
    setShowMenu(false);
  };

  const menuItems = [
    { icon: "⚙️", label: "Configuración de cuenta", action: () => { setPage("settings"); setShowMenu(false); } },
    { icon: "🔗", label: "Compartir mi cumpleaños", action: copyProfileLink },
    { icon: "🎂", label: "Gestionar cumpleaños", action: () => { setPage("dashboard"); setShowMenu(false); } },
    { icon: "🚪", label: "Cerrar sesión", action: () => { onLogout(); setShowMenu(false); }, color: COLORS.error },
  ];

  return (
    <nav style={{
      background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)",
      borderBottom: \`1px solid \${COLORS.border}\`,
      padding: isMobile ? "10px 0" : "12px 0",
      position: "sticky", top: 0, zIndex: 100
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        padding: isMobile ? "0 16px" : "0 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12
      }}>
        {/* Logo */}
        <div onClick={() => setPage("home")} style={{ cursor: "pointer", flexShrink: 0 }}>
          <Logo size={isMobile ? 20 : 24} />
        </div>

        {/* Desktop nav */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <Button variant={page === "explore" ? "outline" : "ghost"} size="sm" onClick={() => setPage("explore")}>
              Explorar
            </Button>
            {session ? (
              <>
                {role === "manager" ? (
                  <Button variant={page === "dashboard" ? "outline" : "ghost"} size="sm" onClick={() => setPage("dashboard")}>
                    🎁 Mis regalos
                  </Button>
                ) : (
                  <Button variant={page === "profile" ? "outline" : "ghost"} size="sm" onClick={onViewLanding}>
                    🎂 Mi cumple
                  </Button>
                )}
                <div style={{ position: "relative", marginLeft: 4, display: "flex", alignItems: "center", gap: 2 }}>
                  <div onClick={() => { setPage("settings"); setShowMenu(false); }} title="Editar mi perfil"
                    style={{ cursor: "pointer", borderRadius: "50%", border: "2px solid transparent", transition: "border 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.border = \`2px solid \${COLORS.primary}\`}
                    onMouseLeave={e => e.currentTarget.style.border = "2px solid transparent"}
                  >
                    <Avatar initials={profile ? getInitials(profile.name) : "?"} size={36} />
                  </div>
                  <button onClick={() => setShowMenu(v => !v)} style={{
                    background: "none", border: "none", cursor: "pointer", padding: "4px 2px",
                    color: COLORS.textLight, fontSize: 11, lineHeight: 1, borderRadius: 4
                  }}>▾</button>
                  {showMenu && (
                    <>
                      <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setShowMenu(false)} />
                      <div style={{
                        position: "absolute", right: 0, top: "calc(100% + 10px)",
                        background: "#fff", borderRadius: 16, border: \`1px solid \${COLORS.border}\`,
                        boxShadow: "0 10px 40px rgba(0,0,0,0.14)", minWidth: 230, zIndex: 200, overflow: "hidden"
                      }}>
                        <div style={{ padding: "16px 18px 12px", borderBottom: \`1px solid \${COLORS.border}\`, display: "flex", alignItems: "center", gap: 12 }}>
                          <Avatar initials={profile ? getInitials(profile.name) : "?"} size={38} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{profile?.name}</div>
                            <div style={{ fontSize: 12, color: COLORS.textLight }}>@{profile?.username}</div>
                          </div>
                        </div>
                        <div style={{ padding: "12px 18px", borderBottom: \`1px solid \${COLORS.border}\` }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textLight, marginBottom: 10, textTransform: "uppercase" }}>Mi Rol</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            {Object.entries(ROLES).map(([roleKey, roleData]) => (
                              <button key={roleKey} onClick={() => { onRoleSwitch(roleKey); setShowMenu(false); }} style={{
                                flex: 1, padding: "8px 10px", borderRadius: 8,
                                border: \`2px solid \${role === roleKey ? roleData.color : COLORS.border}\`,
                                background: role === roleKey ? roleData.color + "15" : "transparent",
                                color: role === roleKey ? roleData.color : COLORS.textLight,
                                cursor: "pointer", fontSize: 12, fontWeight: role === roleKey ? 700 : 500,
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 4
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
                            borderBottom: i < menuItems.length - 1 ? \`1px solid \${COLORS.border}\` : "none",
                            background: "none", cursor: "pointer", fontSize: 14,
                            color: item.color || COLORS.text, textAlign: "left", fontWeight: 500
                          }}
                            onMouseEnter={e => e.currentTarget.style.background = COLORS.bg}
                            onMouseLeave={e => e.currentTarget.style.background = "none"}
                          >
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
              <>
                <div onClick={() => { setPage("settings"); }} style={{ cursor: "pointer", borderRadius: "50%" }}>
                  <Avatar initials={profile ? getInitials(profile.name) : "?"} size={34} />
                </div>
              </>
            ) : (
              <>
                <button onClick={() => setPage("login")} style={{
                  background: "transparent", border: \`1.5px solid \${COLORS.primary}\`,
                  color: COLORS.primary, borderRadius: 9999, padding: "7px 16px",
                  fontSize: 13, fontWeight: 700, cursor: "pointer"
                }}>Ingresar</button>
                <button onClick={() => setPage("register")} style={{
                  background: COLORS.accent, border: "none",
                  color: "#fff", borderRadius: 9999, padding: "7px 16px",
                  fontSize: 13, fontWeight: 700, cursor: "pointer"
                }}>Registrarse</button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

// ─── BOTTOM NAVIGATION (solo mobile, solo usuarios logueados) ─────────────────
function BottomNav({ page, setPage, profile, onViewLanding }) {
  const isMobile = useIsMobile();
  if (!isMobile) return null;

  const role = profile?.role;

  const items = [
    { icon: "🏠", label: "Inicio", pageKey: "home", action: () => setPage("home") },
    { icon: "🔍", label: "Explorar", pageKey: "explore", action: () => setPage("explore") },
    {
      icon: "🎁",
      label: role === "manager" ? "Mis regalos" : "Mi cumple",
      pageKey: "dashboard",
      action: () => role === "manager" ? setPage("dashboard") : onViewLanding()
    },
    { icon: "🔔", label: "Notif.", pageKey: "notif", action: () => {} },
    { icon: "👤", label: "Perfil", pageKey: "settings", action: () => setPage("settings") },
  ];

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      height: 64, background: "#fff",
      borderTop: \`1px solid \${COLORS.border}\`,
      display: "flex", alignItems: "flex-start", padding: "8px 4px 0",
      boxShadow: "0 -4px 20px rgba(124,58,237,0.08)",
      zIndex: 100
    }}>
      {items.map((item, i) => {
        const active = page === item.pageKey;
        return (
          <button key={i} onClick={item.action} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            gap: 3, background: "none", border: "none", cursor: "pointer", padding: "2px 0"
          }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: active ? COLORS.primary : COLORS.textLight }}>
              {item.label}
            </span>
            {active && <div style={{ width: 4, height: 4, background: COLORS.primary, borderRadius: "50%", marginTop: -1 }} />}
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
      borderTop: \`1px solid \${COLORS.border}\`,
      padding: "36px 20px",
      textAlign: "center",
      marginTop: 60,
      paddingBottom: isMobile ? 80 : 36
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
        minHeight: "100vh", color: COLORS.textLight, fontSize: 16
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
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: COLORS.bg, minHeight: "100vh", color: COLORS.text
    }}>
      <Navbar
        page={page} setPage={setPage} session={session} profile={profile}
        onLogout={handleLogout} onRoleSwitch={handleRoleSwitch}
        onViewLanding={() => profile?.username ? viewProfile(profile.username) : setPage("dashboard")}
      />
      <main style={{ paddingBottom: isMobile ? 64 : 0 }}>
        {renderPage()}
      </main>
      <Footer isMobile={isMobile} />
      {session && (
        <BottomNav
          page={page} setPage={setPage} profile={profile}
          onViewLanding={() => profile?.username ? viewProfile(profile.username) : setPage("dashboard")}
        />
      )}
    </div>
  );
}

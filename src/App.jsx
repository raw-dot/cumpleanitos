import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { COLORS, Logo, Button, Avatar, getInitials } from "./shared";
import AuthPage from "./pages/AuthPage";
import CelebrantDashboard from "./pages/CelebrantDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import ExplorePage from "./pages/ExplorePage";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/HomePage";

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar({ page, setPage, session, profile, onLogout }) {
  const role = profile?.role;
  return (
    <nav style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${COLORS.border}`, padding: "12px 0", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div onClick={() => setPage("home")} style={{ cursor: "pointer", flexShrink: 0 }}>
          <Logo />
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <Button variant={page === "explore" ? "outline" : "ghost"} size="sm" onClick={() => setPage("explore")}>
            Explorar
          </Button>

          {session ? (
            <>
              {role === "manager" ? (
                <Button variant={page === "dashboard" ? "outline" : "ghost"} size="sm" onClick={() => setPage("dashboard")}>
                  🎁 Mis campañas
                </Button>
              ) : (
                <Button variant={page === "dashboard" ? "outline" : "ghost"} size="sm" onClick={() => setPage("dashboard")}>
                  🎂 Mi cumple
                </Button>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 4 }}>
                <div onClick={() => setPage("dashboard")} style={{ cursor: "pointer" }}>
                  <Avatar initials={profile ? getInitials(profile.name) : "?"} size={34} />
                </div>
                <Button variant="ghost" size="sm" onClick={onLogout} style={{ color: COLORS.error, fontSize: 12 }}>
                  Salir
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setPage("login")}>Iniciar sesión</Button>
              <Button variant="accent" size="sm" onClick={() => setPage("register")}>Registrarse gratis</Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${COLORS.border}`, padding: "36px 20px", textAlign: "center", marginTop: 60 }}>
      <Logo size={22} />
      <p style={{ fontSize: 13, color: COLORS.textLight, marginTop: 12, marginBottom: 0 }}>
        Hecho con 💜 en Argentina · © 2026 Cumpleanitos
      </p>
    </footer>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileTarget, setProfileTarget] = useState(null);

  // ── Parse URL params on load ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const u = params.get("u");
    const c = params.get("c");
    if (u) { setProfileTarget({ username: u }); setPage("profile"); }
    else if (c) { setProfileTarget({ campaignId: c }); setPage("profile"); }
  }, []);

  // ── Auth listener ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) loadProfile(s.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        loadProfile(s.user.id);
        const params = new URLSearchParams(window.location.search);
        if (!params.get("u") && !params.get("c")) setPage("dashboard");
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) setProfile(data);
  };

  const handleAuth = (user) => {
    loadProfile(user.id);
    setPage("dashboard");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setPage("home");
    window.history.replaceState({}, "", window.location.pathname);
  };

  const viewProfile = (username) => {
    setProfileTarget({ username });
    setPage("profile");
  };

  // ── Render ──
  if (loading) {
    return (
      <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: COLORS.textLight, fontSize: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎂</div>
          Cargando...
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case "home":
        return <HomePage onRegister={() => setPage("register")} onExplore={() => setPage("explore")} />;

      case "explore":
        return <ExplorePage onViewProfile={viewProfile} />;

      case "login":
      case "register":
        return <AuthPage initialMode={page} onAuth={handleAuth} />;

      case "dashboard":
        if (!session) return <AuthPage initialMode="login" onAuth={handleAuth} />;
        if (profile?.role === "manager") {
          return <ManagerDashboard profile={profile} session={session} />;
        }
        return <CelebrantDashboard profile={profile} session={session} />;

      case "profile":
        return (
          <ProfilePage
            username={profileTarget?.username}
            campaignId={profileTarget?.campaignId}
            currentSession={session}
          />
        );

      default:
        return <HomePage onRegister={() => setPage("register")} onExplore={() => setPage("explore")} />;
    }
  };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: COLORS.bg, minHeight: "100vh", color: COLORS.text }}>
      <Navbar
        page={page}
        setPage={setPage}
        session={session}
        profile={profile}
        onLogout={handleLogout}
      />
      <main>{renderPage()}</main>
      <Footer />
    </div>
  );
}

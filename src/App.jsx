import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// Imports de utilidades y constantes
import { COLORS, GIFT_AMOUNTS, ROLES } from "./utils/constants";
import { getInitials, formatUsername, isValidEmail } from "./utils/formatters";
import {
  getAge,
  getDaysToBirthday,
  daysUntilBirthday,
  formatBirthday,
  timeAgo,
} from "./utils/dateHelpers";

// Imports de componentes UI
import Button from "./components/ui/Button";
import Card from "./components/ui/Card";
import Avatar from "./components/ui/Avatar";
import Badge from "./components/ui/Badge";
import Input from "./components/ui/Input";
import Textarea from "./components/ui/Textarea";
import Alert from "./components/ui/Alert";

// Imports de layout
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

// Imports de páginas
import AuthPage from "./components/auth/AuthPage";
import HomePage from "./components/pages/HomePage";
import ExplorePage from "./components/pages/ExplorePage";
import DashboardPage from "./components/pages/DashboardPage";

// Páginas placeholder para fases posteriores
import MyProfilePage from "./components/pages/MyProfilePage";
import FriendsPage from "./components/pages/FriendsPage";
import SettingsPage from "./components/pages/SettingsPage";

/**
 * Componente principal App
 * Maneja routing, autenticación, y estado global
 */
export default function App() {
  // State para routing
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedUser, setSelectedUser] = useState(null);

  // State para autenticación
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // State para roles
  const [currentRole, setCurrentRole] = useState(ROLES.BIRTHDAY_PERSON);

  // State para UI
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /**
   * Efecto: Verificar sesión al montar el componente
   */
  useEffect(() => {
    const initAuth = async () => {
      // Obtener sesión actual
      const {
        data: { session: s },
      } = await supabase.auth.getSession();
      setSession(s);

      if (s) {
        await loadProfile(s.user.id);
      }

      setLoading(false);
    };

    initAuth();

    // Suscribirse a cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);

      if (s) {
        await loadProfile(s.user.id);
        setCurrentPage("dashboard");
      } else {
        setProfile(null);
        setCurrentRole(ROLES.BIRTHDAY_PERSON);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  /**
   * Carga el perfil del usuario desde Supabase
   */
  const loadProfile = async (userId) => {
    try {
      const { data, error: err } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (err) throw err;

      if (data) {
        setProfile(data);
        setCurrentRole(data.current_role || ROLES.BIRTHDAY_PERSON);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  /**
   * Maneja el logout del usuario
   */
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      setCurrentRole(ROLES.BIRTHDAY_PERSON);
      setCurrentPage("home");
      setSuccess("Sesión cerrada correctamente");
    } catch (error) {
      console.error("Error on logout:", error);
      setError("Error al cerrar sesión");
    }
  };

  /**
   * Maneja el cambio de rol
   */
  const handleRoleSwitch = async (newRole) => {
    if (!session || !profile) return;

    try {
      const { error: err } = await supabase
        .from("profiles")
        .update({ current_role: newRole })
        .eq("id", session.user.id);

      if (err) throw err;

      setCurrentRole(newRole);
      setProfile({ ...profile, current_role: newRole });
      setSuccess(`Rol cambiado a ${newRole === ROLES.GIFT_MANAGER ? "Gestor de Regalos" : "Cumpleañero"}`);
    } catch (error) {
      console.error("Error switching role:", error);
      setError("Error al cambiar de rol");
    }
  };

  /**
   * Callback después de autenticarse
   */
  const handleAuth = (user) => {
    setCurrentPage("dashboard");
  };

  /**
   * Renderiza la página actual según el estado
   */
  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage setCurrentPage={setCurrentPage} recentGifts={[]} />;

      case "explore":
        return (
          <ExplorePage
            setSelectedUser={setSelectedUser}
            setCurrentPage={setCurrentPage}
          />
        );

      case "dashboard":
        return session ? (
          <DashboardPage
            profile={profile}
            session={session}
            setCurrentPage={setCurrentPage}
          />
        ) : (
          <AuthPage setCurrentPage={setCurrentPage} onAuth={handleAuth} />
        );

      case "myprofile":
        return session ? (
          <MyProfilePage profile={profile} session={session} />
        ) : (
          <AuthPage setCurrentPage={setCurrentPage} onAuth={handleAuth} />
        );

      case "friends":
        return session && currentRole === ROLES.GIFT_MANAGER ? (
          <FriendsPage session={session} />
        ) : (
          <HomePage setCurrentPage={setCurrentPage} recentGifts={[]} />
        );

      case "settings":
        return session ? (
          <SettingsPage profile={profile} session={session} />
        ) : (
          <AuthPage setCurrentPage={setCurrentPage} onAuth={handleAuth} />
        );

      case "login":
      case "register":
        return <AuthPage setCurrentPage={setCurrentPage} onAuth={handleAuth} />;

      default:
        return <HomePage setCurrentPage={setCurrentPage} recentGifts={[]} />;
    }
  };

  if (loading) {
    return (
      <div
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          color: COLORS.textLight,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🎂</div>
          <div>Cargando cumpleanitos...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: COLORS.bg,
        minHeight: "100vh",
        color: COLORS.text,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Mostrar mensajes de error/success */}
      {(error || success) && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 2000,
            maxWidth: 400,
          }}
        >
          {error && (
            <Alert
              message={error}
              type="error"
              onDismiss={() => setError("")}
            />
          )}
          {success && (
            <Alert
              message={success}
              type="success"
              onDismiss={() => setSuccess("")}
            />
          )}
        </div>
      )}

      {/* Navbar */}
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        setSelectedUser={setSelectedUser}
        session={session}
        profile={profile}
        currentRole={currentRole}
        onLogout={handleLogout}
        onRoleSwitch={handleRoleSwitch}
      />

      {/* Contenido principal */}
      <main style={{ flex: 1 }}>
        {renderPage()}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

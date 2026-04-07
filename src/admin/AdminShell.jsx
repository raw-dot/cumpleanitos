import { useState, useEffect } from "react";
import { AdminProvider } from "./AdminContext";
import { supabase } from "../supabaseClient";
import AdminLayout from "./AdminLayout";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsuariosPage from "./pages/AdminUsuariosPage";
import AdminCumpleanosPage from "./pages/AdminCumpleanosPage";
import AdminRegalosPage from "./pages/AdminRegalosPage";
import AdminFinanzasPage from "./pages/AdminFinanzasPage";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";
import AdminAlertasPage from "./pages/AdminAlertasPage";
import AdminModeracionPage from "./pages/AdminModeracionPage";
import AdminConfiguracionPage from "./pages/AdminConfiguracionPage";

export default function AdminShell({ profile, onExit }) {
  const [activePage,   setActivePage]   = useState("dashboard");
  const [initialFilter, setInitialFilter] = useState(null);

  // Refresh sesión al volver al panel
  useEffect(() => {
    const handle = async () => {
      if (document.visibilityState === "visible") {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const nowSec = Math.floor(Date.now() / 1000);
            if (session.expires_at && (session.expires_at - nowSec) < 600) {
              await supabase.auth.refreshSession();
            }
          }
        } catch(e) {}
      }
    };
    document.addEventListener("visibilitychange", handle);
    return () => document.removeEventListener("visibilitychange", handle);
  }, []);

  // Navegar con filtro opcional
  const navigate = (page, filter = null) => {
    setInitialFilter(filter);
    setActivePage(page);
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":     return <AdminDashboardPage onNavigate={navigate} />;
      case "usuarios":      return <AdminUsuariosPage   initialFilter={initialFilter} />;
      case "cumpleanos":    return <AdminCumpleanosPage initialFilter={initialFilter} />;
      case "regalos":       return <AdminRegalosPage    initialFilter={initialFilter} />;
      case "finanzas":      return <AdminFinanzasPage   initialFilter={initialFilter} />;
      case "analytics":     return <AdminAnalyticsPage  initialFilter={initialFilter} />;
      case "alertas":       return <AdminAlertasPage />;
      case "moderacion":    return <AdminModeracionPage />;
      case "configuracion": return <AdminConfiguracionPage />;
      default:              return <AdminDashboardPage onNavigate={navigate} />;
    }
  };

  return (
    <AdminProvider>
      <AdminLayout
        activePage={activePage}
        onNavigate={setActivePage}
        profile={profile}
        onExit={onExit}
      >
        {renderPage()}
      </AdminLayout>
    </AdminProvider>
  );
}

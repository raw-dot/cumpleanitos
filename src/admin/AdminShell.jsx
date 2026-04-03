import { useState } from "react";
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

const Placeholder = ({ title, icon }) => (
  <div style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 10, padding: "48px 32px", textAlign: "center", color: "#9CA3AF", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
    <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 15, fontWeight: 500, color: "#1F2937", marginBottom: 6 }}>{title}</div>
    <div style={{ fontSize: 13 }}>Próximamente</div>
  </div>
);

export default function AdminShell({ profile, onExit }) {
  const [activePage, setActivePage] = useState("dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":     return <AdminDashboardPage onNavigate={setActivePage} />;
      case "usuarios":      return <AdminUsuariosPage />;
      case "cumpleanos":    return <AdminCumpleanosPage />;
      case "regalos":       return <AdminRegalosPage />;
      case "finanzas":      return <AdminFinanzasPage />;
      case "analytics":     return <AdminAnalyticsPage />;
      case "alertas":       return <AdminAlertasPage />;
      case "moderacion":    return <AdminModeracionPage />;
      case "configuracion": return <AdminConfiguracionPage />;
      default:              return <AdminDashboardPage onNavigate={setActivePage} />;
    }
  };

  return (
    <AdminLayout
      activePage={activePage}
      onNavigate={setActivePage}
      profile={profile}
      onExit={onExit}
    >
      {renderPage()}
    </AdminLayout>
  );
}

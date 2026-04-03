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

// Placeholders para las páginas que se van a construir
const Placeholder = ({ title, icon }) => (
  <div style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 10, padding: "48px 32px", textAlign: "center", color: "#9CA3AF", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
    <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 15, fontWeight: 500, color: "#1F2937", marginBottom: 6 }}>{title}</div>
    <div style={{ fontSize: 13 }}>Próximamente</div>
  </div>
);

const PAGE_COMPONENTS = {
  dashboard:     <AdminDashboardPage />,
  usuarios:      <AdminUsuariosPage />,
  cumpleanos:    <AdminCumpleanosPage />,
  regalos:       <AdminRegalosPage />,
  finanzas:      <AdminFinanzasPage />,
  analytics:     <AdminAnalyticsPage />,
  alertas:       <AdminAlertasPage />,
  moderacion:    <AdminModeracionPage />,
  configuracion: <AdminConfiguracionPage />,
};

export default function AdminShell({ profile, onExit }) {
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <AdminLayout
      activePage={activePage}
      onNavigate={setActivePage}
      profile={profile}
      onExit={onExit}
    >
      {PAGE_COMPONENTS[activePage] || PAGE_COMPONENTS.dashboard}
    </AdminLayout>
  );
}

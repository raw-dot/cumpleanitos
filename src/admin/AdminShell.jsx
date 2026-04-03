import { useState } from "react";
import AdminLayout from "./AdminLayout";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsuariosPage from "./pages/AdminUsuariosPage";
import AdminCumpleanosPage from "./pages/AdminCumpleanosPage";
import AdminRegalosPage from "./pages/AdminRegalosPage";

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
  finanzas:      <Placeholder title="Dashboard Financiero" icon="💰" />,
  analytics:     <Placeholder title="Analytics de Comportamiento" icon="📈" />,
  alertas:       <Placeholder title="Alertas Operativas" icon="⚠️" />,
  moderacion:    <Placeholder title="Moderación de Contenido" icon="🛡️" />,
  configuracion: <Placeholder title="Configuración Admin" icon="⚙️" />,
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

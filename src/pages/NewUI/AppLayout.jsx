import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import TopBarMobile from './components/TopBarMobile';
import TopBarDesktop from './components/TopBarDesktop';
import BottomNav from './components/BottomNav';
import InicioSection from './sections/InicioSection';
import AmigosSection from './sections/AmigosSection';
import MiCumpleSection from './sections/MiCumpleSection';
import MisRegalosRecibidosSection from './sections/MisRegalosRecibidosSection';
import GestionarRegalosSection from './sections/GestionarRegalosSection';
import CompartirLinkSection from './sections/CompartirLinkSection';
import ExplorarSection from './sections/ExplorarSection';
import PerfilAmigoSection from './sections/PerfilAmigoSection';
import RegalosHechosSection from './sections/RegalosHechosSection';
import ConfiguracionSection from './sections/ConfiguracionSection';
import WizardOrganizarSection from './sections/WizardOrganizarSection';
import DetalleEventoSection from './sections/DetalleEventoSection';
import MiRegaloSection from './sections/MiRegaloSection';
import CalendarioSection from './sections/CalendarioSection';
import OrganizadorSection from './sections/OrganizadorSection';
import ProfileDrawer from './components/ProfileDrawer';
import NotificationsDrawer from './components/NotificationsDrawer';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

export default function AppLayout() {
  const [activeTab, setActiveTab] = useState('inicio');
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') || 'inicio';
    setActiveTab(tab);
    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) loadProfile(s.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadSession = async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    setSession(s);
    if (s?.user) await loadProfile(s.user.id);
    else setLoading(false);
  };

  const loadProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data);
    setLoading(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.history.pushState({ tab }, '', `/new-ui?tab=${tab}`);
  };

  const commonProps = { session, profile, loading, isMobile, handleTabChange };

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: '#FAFAFA',
      minHeight: '100vh',
      color: '#1a1a2e',
    }}>
      {isMobile ? (
        <TopBarMobile
          profile={profile}
          onMenuClick={() => setDrawerOpen(true)}
          onNotifClick={() => setNotifOpen(true)}
        />
      ) : (
        <TopBarDesktop
          profile={profile}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onMenuClick={() => setDrawerOpen(true)}
          onNotifClick={() => setNotifOpen(true)}
        />
      )}

      <div style={{
        paddingBottom: isMobile ? 80 : 40,
        maxWidth: isMobile ? '100%' : 1200,
        margin: isMobile ? 0 : '0 auto',
        padding: isMobile ? '0' : '32px 40px 60px',
      }}>
        {activeTab === 'inicio' && <InicioSection {...commonProps} />}
        {activeTab === 'amigos' && <AmigosSection {...commonProps} />}
        {activeTab === 'micumple' && <MiCumpleSection {...commonProps} />}
        {activeTab === 'miregalo' && <MiRegaloSection {...commonProps} />}
        {activeTab === 'misregalos' && <MisRegalosRecibidosSection {...commonProps} />}
        {activeTab === 'gestionar' && <GestionarRegalosSection {...commonProps} />}
        {activeTab === 'compartir' && <CompartirLinkSection {...commonProps} />}
        {activeTab === 'explorar' && <ExplorarSection {...commonProps} />}
        {activeTab === 'perfil-amigo' && <PerfilAmigoSection {...commonProps} />}
        {activeTab === 'regalos-hechos' && <RegalosHechosSection {...commonProps} />}
        {activeTab === 'configuracion' && <ConfiguracionSection {...commonProps} />}
        {activeTab === 'wizard' && <WizardOrganizarSection {...commonProps} />}
        {activeTab === 'detalle-evento' && <DetalleEventoSection {...commonProps} />}
        {activeTab === 'calendario' && <CalendarioSection {...commonProps} />}
        {activeTab === 'organizador' && <OrganizadorSection {...commonProps} />}
      </div>

      {isMobile && <BottomNav active={activeTab} onChange={handleTabChange} />}

      {drawerOpen && (
        <ProfileDrawer
          profile={profile}
          session={session}
          isMobile={isMobile}
          onClose={() => setDrawerOpen(false)}
        />
      )}
      {notifOpen && (
        <NotificationsDrawer
          isMobile={isMobile}
          onClose={() => setNotifOpen(false)}
        />
      )}
    </div>
  );
}

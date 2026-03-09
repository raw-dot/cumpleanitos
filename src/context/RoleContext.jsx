import { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { supabase } from "../supabaseClient";
import { ROLES } from "../utils/constants";

/**
 * Context para manejar roles de usuario
 * Proporciona: currentRole, switchRole, canAccessFeature
 */
export const RoleContext = createContext();

export function RoleProvider({ children }) {
  const { session, profile, updateProfile } = useContext(AuthContext);
  const [currentRole, setCurrentRole] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar rol cuando el perfil esté disponible
  useEffect(() => {
    if (profile?.current_role) {
      setCurrentRole(profile.current_role);
    }
  }, [profile]);

  const switchRole = async (newRole) => {
    if (!session || !profile) return;

    setLoading(true);
    try {
      // Actualizar en Supabase
      const { error } = await supabase
        .from("profiles")
        .update({ current_role: newRole })
        .eq("id", session.user.id);

      if (error) throw error;

      // Actualizar estado local
      setCurrentRole(newRole);
      updateProfile({ current_role: newRole });
    } catch (error) {
      console.error("Error al cambiar rol:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verifica si el usuario puede acceder a una feature según su rol
   */
  const canAccessFeature = (feature) => {
    const permissions = {
      [ROLES.BIRTHDAY_PERSON]: [
        "view_profile",
        "view_dashboard",
        "view_gifts",
        "edit_profile",
      ],
      [ROLES.GIFT_MANAGER]: [
        "view_profile",
        "view_dashboard",
        "view_gifts",
        "edit_profile",
        "view_friends",
        "manage_friends",
        "track_birthdays",
        "send_reminders",
      ],
    };

    return permissions[currentRole]?.includes(feature) || false;
  };

  // Rol por defecto si no está cargado
  const defaultRole = currentRole || ROLES.BIRTHDAY_PERSON;

  return (
    <RoleContext.Provider
      value={{
        currentRole: defaultRole,
        switchRole,
        canAccessFeature,
        loading,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

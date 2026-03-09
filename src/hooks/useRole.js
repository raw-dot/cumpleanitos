import { useContext } from "react";
import { RoleContext } from "../context/RoleContext";

/**
 * Hook para acceder al context de roles
 * @returns {object} { currentRole, switchRole, canAccessFeature, loading }
 */
export function useRole() {
  const context = useContext(RoleContext);

  if (!context) {
    throw new Error("useRole debe usarse dentro de RoleProvider");
  }

  return context;
}

export default useRole;

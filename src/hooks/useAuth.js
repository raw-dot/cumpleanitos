import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * Hook para acceder al context de autenticación
 * @returns {object} { session, profile, loading, logout, updateProfile }
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}

export default useAuth;

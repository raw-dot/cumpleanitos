import { useContext } from "react";
import { ProfileContext } from "../context/ProfileContext";

/**
 * Hook para acceder al context del perfil
 * @returns {object} { uploadProfilePhoto, updatePaymentAlias, updateBio, calculateProfileProgress, getProfileCompletionItems, uploadingPhoto, uploadingAlias }
 */
export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error("useProfile debe usarse dentro de ProfileProvider");
  }

  return context;
}

export default useProfile;

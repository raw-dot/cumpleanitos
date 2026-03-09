import { createContext, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { supabase } from "../supabaseClient";

/**
 * Context para manejar datos del perfil
 * Proporciona: métodos para actualizar foto, alias, bio, etc
 */
export const ProfileContext = createContext();

export function ProfileProvider({ children }) {
  const { session, profile, updateProfile } = useContext(AuthContext);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingAlias, setUploadingAlias] = useState(false);

  /**
   * Sube una foto de perfil a Supabase Storage
   */
  const uploadProfilePhoto = async (file) => {
    if (!session || !file) return null;

    setUploadingPhoto(true);
    try {
      // Crear ruta del archivo
      const ext = file.name.split(".").pop();
      const path = `profile-photos/${session.user.id}/current.${ext}`;

      // Subir a Storage
      const { error: uploadError } = await supabase.storage
        .from("cumpleanitos-bucket")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data } = supabase.storage
        .from("cumpleanitos-bucket")
        .getPublicUrl(path);

      if (data?.publicUrl) {
        // Actualizar en BD
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_url: data.publicUrl })
          .eq("id", session.user.id);

        if (updateError) throw updateError;

        // Actualizar estado local
        updateProfile({ avatar_url: data.publicUrl });
        return data.publicUrl;
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      throw error;
    } finally {
      setUploadingPhoto(false);
    }
  };

  /**
   * Actualiza el alias de pago
   */
  const updatePaymentAlias = async (alias, method) => {
    if (!session) return false;

    setUploadingAlias(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          payment_alias: alias,
          payment_method: method,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      updateProfile({
        payment_alias: alias,
        payment_method: method,
      });
      return true;
    } catch (error) {
      console.error("Error updating payment alias:", error);
      throw error;
    } finally {
      setUploadingAlias(false);
    }
  };

  /**
   * Actualiza la bio del usuario
   */
  const updateBio = async (bio) => {
    if (!session) return false;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ bio })
        .eq("id", session.user.id);

      if (error) throw error;

      updateProfile({ bio });
      return true;
    } catch (error) {
      console.error("Error updating bio:", error);
      throw error;
    }
  };

  /**
   * Calcula el progreso del perfil completado
   */
  const calculateProfileProgress = () => {
    if (!profile) return 0;

    let completed = 0;
    const total = 5; // Total de items

    if (profile.avatar_url) completed++;
    if (profile.bio) completed++;
    if (profile.payment_alias) completed++;
    if (profile.name) completed++;
    if (profile.birthday) completed++;

    return Math.round((completed / total) * 100);
  };

  /**
   * Obtiene items de progreso del perfil
   */
  const getProfileCompletionItems = () => {
    if (!profile) return [];

    return [
      { key: "avatar", label: "Foto de Perfil", icon: "📸", completed: !!profile.avatar_url },
      { key: "bio", label: "Bio/Descripción", icon: "📝", completed: !!profile.bio },
      { key: "payment", label: "Alias de Pago", icon: "💳", completed: !!profile.payment_alias },
      { key: "birthday", label: "Cumpleaños", icon: "🎂", completed: !!profile.birthday },
      { key: "name", label: "Nombre Completo", icon: "👤", completed: !!profile.name },
    ];
  };

  return (
    <ProfileContext.Provider
      value={{
        uploadProfilePhoto,
        updatePaymentAlias,
        updateBio,
        calculateProfileProgress,
        getProfileCompletionItems,
        uploadingPhoto,
        uploadingAlias,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

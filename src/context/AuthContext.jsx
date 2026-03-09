import { createContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

/**
 * Context para manejar la autenticación
 * Proporciona: session, profile, loading, logout
 */
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión actual
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        // Cargar perfil del usuario
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (data) {
          setProfile(data);
        }
      }
      setLoading(false);
    };

    checkSession();

    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          if (data) {
            setProfile(data);
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const updateProfile = (newData) => {
    setProfile({ ...profile, ...newData });
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

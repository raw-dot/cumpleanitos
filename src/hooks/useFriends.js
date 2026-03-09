import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

/**
 * Hook personalizado para manejar amigos del usuario
 * @returns {object} { friends, loading, addFriend, removeFriend, getFriends }
 */
export function useFriends() {
  const { session } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Carga la lista de amigos del usuario
   */
  const getFriends = async () => {
    if (!session) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("friend_birthdays")
        .select("*")
        .eq("user_id", session.user.id)
        .order("days_until_birthday", { ascending: true });

      if (error) throw error;

      setFriends(data || []);
    } catch (error) {
      console.error("Error loading friends:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Agrega un nuevo amigo
   */
  const addFriend = async (friendUserId, notes = "") => {
    if (!session) return false;

    try {
      // Primero obtener info del amigo
      const { data: friendData, error: friendError } = await supabase
        .from("profiles")
        .select("id, name, username, birthday")
        .eq("id", friendUserId)
        .single();

      if (friendError) throw friendError;

      // Crear registro en tabla friends
      const { error: friendsError } = await supabase
        .from("friends")
        .insert({
          user_id: session.user.id,
          friend_user_id: friendUserId,
          notes,
          status: "accepted",
        });

      if (friendsError) throw friendsError;

      // Crear registro en friend_birthdays
      const { error: bdayError } = await supabase
        .from("friend_birthdays")
        .insert({
          user_id: session.user.id,
          friend_id: friendUserId,
          friend_name: friendData.name,
          friend_username: friendData.username,
          birthday: friendData.birthday,
        });

      if (bdayError) throw bdayError;

      // Recargar amigos
      await getFriends();
      return true;
    } catch (error) {
      console.error("Error adding friend:", error);
      throw error;
    }
  };

  /**
   * Elimina un amigo
   */
  const removeFriend = async (friendUserId) => {
    if (!session) return false;

    try {
      // Eliminar de tabla friends
      const { error: friendsError } = await supabase
        .from("friends")
        .delete()
        .eq("user_id", session.user.id)
        .eq("friend_user_id", friendUserId);

      if (friendsError) throw friendsError;

      // Eliminar de tabla friend_birthdays
      const { error: bdayError } = await supabase
        .from("friend_birthdays")
        .delete()
        .eq("user_id", session.user.id)
        .eq("friend_id", friendUserId);

      if (bdayError) throw bdayError;

      // Recargar amigos
      await getFriends();
      return true;
    } catch (error) {
      console.error("Error removing friend:", error);
      throw error;
    }
  };

  /**
   * Busca usuarios por nombre o username
   */
  const searchUsers = async (query) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, username, birthday, avatar_url")
        .or(`name.ilike.%${query}%, username.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Error searching users:", error);
      return [];
    }
  };

  // Cargar amigos al montar el componente
  useEffect(() => {
    if (session) {
      getFriends();
    }
  }, [session]);

  return {
    friends,
    loading,
    addFriend,
    removeFriend,
    getFriends,
    searchUsers,
  };
}

export default useFriends;

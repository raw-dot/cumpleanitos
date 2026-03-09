import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { COLORS } from "../../utils/constants";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import Input from "../ui/Input";
import Alert from "../ui/Alert";
import Badge from "../ui/Badge";
import { getInitials, truncate } from "../../utils/formatters";
import { getAge, formatBirthday } from "../../utils/dateHelpers";

/**
 * Página para gestionar amigos y sus cumpleaños
 * Solo visible para usuarios con rol "gift_manager"
 */
function FriendsPage({ session }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadFriends();
  }, [session]);

  const loadFriends = async () => {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from("friend_birthdays")
        .select("*")
        .eq("user_id", session.user.id)
        .order("days_until_birthday", { ascending: true });

      if (error) throw error;

      setFriends(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error loading friends:", error);
      setMessage("Error al cargar amigos");
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, username, birthday, avatar_url")
        .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(5);

      if (error) throw error;

      // Filtrar amigos que ya están agregados
      const filtered = (data || []).filter(
        (user) => !friends.some((f) => f.friend_id === user.id)
      );

      setSearchResults(filtered);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearching(false);
    }
  };

  const addFriend = async (friendData) => {
    if (!session) return;

    try {
      // Insertar en tabla friends
      const { error: friendsError } = await supabase.from("friends").insert({
        user_id: session.user.id,
        friend_user_id: friendData.id,
        status: "accepted",
      });

      if (friendsError) throw friendsError;

      // Insertar en tabla friend_birthdays
      const { error: bdayError } = await supabase
        .from("friend_birthdays")
        .insert({
          user_id: session.user.id,
          friend_id: friendData.id,
          friend_name: friendData.name,
          friend_username: friendData.username,
          birthday: friendData.birthday,
        });

      if (bdayError) throw bdayError;

      setMessage(`${friendData.name} agregado/a a tu lista`);
      setSearchQuery("");
      setSearchResults([]);
      setShowAddFriend(false);
      await loadFriends();
    } catch (error) {
      console.error("Error adding friend:", error);
      setMessage("Error al agregar amigo");
    }
  };

  const removeFriend = async (friendId) => {
    if (!session) return;

    try {
      // Eliminar de friends
      const { error: friendsError } = await supabase
        .from("friends")
        .delete()
        .eq("user_id", session.user.id)
        .eq("friend_user_id", friendId);

      if (friendsError) throw friendsError;

      // Eliminar de friend_birthdays
      const { error: bdayError } = await supabase
        .from("friend_birthdays")
        .delete()
        .eq("user_id", session.user.id)
        .eq("friend_id", friendId);

      if (bdayError) throw bdayError;

      setMessage("Amigo eliminado");
      await loadFriends();
    } catch (error) {
      console.error("Error removing friend:", error);
      setMessage("Error al eliminar amigo");
    }
  };

  if (!session) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
        <Alert message="Debes estar logueado para ver esta página" type="error" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      {message && (
        <Alert
          message={message}
          type={message.includes("Error") ? "error" : "success"}
          onDismiss={() => setMessage("")}
        />
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
            Mis Amigos
          </h1>
          <p style={{ fontSize: 16, color: COLORS.textLight }}>
            Gestiona los cumpleaños de tus amigos
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowAddFriend(!showAddFriend)}
        >
          + Agregar amigo
        </Button>
      </div>

      {/* Add Friend Form */}
      {showAddFriend && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Buscar y Agregar Amigo
          </h3>
          <Input
            placeholder="Busca por nombre o usuario..."
            value={searchQuery}
            onChange={handleSearch}
            style={{ marginBottom: 16 }}
          />

          {searching && (
            <div style={{ color: COLORS.textLight }}>Buscando...</div>
          )}

          {searchResults.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    background: COLORS.bg,
                    borderRadius: 8,
                  }}
                >
                  <Avatar
                    initials={getInitials(user.name)}
                    size={40}
                    src={user.avatar_url}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.textLight }}>
                      @{user.username}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addFriend(user)}
                  >
                    Agregar
                  </Button>
                </div>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !searching && (
            <div style={{ color: COLORS.textLight }}>
              No se encontraron usuarios
            </div>
          )}
        </Card>
      )}

      {/* Friends List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: COLORS.textLight }}>
          Cargando amigos...
        </div>
      ) : friends.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>👥</div>
          <p style={{ color: COLORS.textLight }}>
            Todavía no tienes amigos agregados
          </p>
          <p style={{ fontSize: 14, color: COLORS.textLight, marginTop: 8 }}>
            Comienza a agregar amigos para trackear sus cumpleaños
          </p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {friends.map((friend) => (
            <Card
              key={friend.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                cursor: "default",
              }}
            >
              <Avatar initials={getInitials(friend.friend_name)} size={48} />

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>
                  {friend.friend_name}
                </div>
                <div style={{ fontSize: 13, color: COLORS.textLight }}>
                  @{friend.friend_username}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 8,
                    fontSize: 13,
                  }}
                >
                  <span>
                    📅 {formatBirthday(friend.birthday)}
                  </span>
                  {friend.days_until_birthday !== null && (
                    <Badge
                      color={
                        friend.is_today ? COLORS.accent : COLORS.primary
                      }
                    >
                      {friend.is_today
                        ? "¡Hoy!"
                        : `${friend.days_until_birthday} días`}
                    </Badge>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setMessage("Feature de regalos en desarrollo")}
                >
                  🎁 Regalar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => removeFriend(friend.friend_id)}
                >
                  ✕
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default FriendsPage;

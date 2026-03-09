import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, Card, Avatar, Badge, Input, getInitials, formatBirthday, daysUntilBirthday } from "../shared";

export default function ExplorePage({ onViewProfile }) {
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setProfiles(data);
        setLoading(false);
      });
  }, []);

  const filtered = profiles.filter(u => {
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 4, color: "#1F2937" }}>Explorar perfiles</h1>
      <p style={{ color: COLORS.textLight, marginBottom: 24 }}>
        Encontrá a un amigo y regalale en su cumpleaños 🎁
      </p>

      <Input
        placeholder="Buscar por nombre o usuario..."
        value={search}
        onChange={setSearch}
        style={{ marginBottom: 24 }}
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: COLORS.textLight }}>Cargando perfiles...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(user => {
            const days = daysUntilBirthday(user.birthday);
            const isToday = days === "¡Hoy!";
            const isSoon = typeof days === "number" && days <= 7;
            return (
              <Card
                key={user.id}
                onClick={() => onViewProfile(user.username)}
                style={{ display: "flex", alignItems: "center", gap: 16, cursor: "pointer", transition: "box-shadow 0.2s", padding: 20 }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(124,58,237,0.10)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = ""}
              >
                <Avatar initials={getInitials(user.name)} size={52} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#1F2937" }}>{user.name}</div>
                  <div style={{ fontSize: 13, color: COLORS.textLight }}>@{user.username}</div>
                  {user.bio && <div style={{ fontSize: 13, color: COLORS.textLight, marginTop: 2, fontStyle: "italic" }}>"{user.bio.slice(0, 60)}{user.bio.length > 60 ? "..." : ""}"</div>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <Badge color={isToday ? COLORS.accent : isSoon ? COLORS.error : COLORS.primary}>
                    🎂 {isToday ? "¡Hoy!" : isSoon ? `¡${days} días!` : `${days} días`}
                  </Badge>
                  <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 4 }}>
                    {formatBirthday(user.birthday)}
                  </div>
                </div>
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: 60, color: COLORS.textLight }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
              {profiles.length === 0
                ? "Todavía no hay perfiles. ¡Sé el primero en registrarte!"
                : "No se encontraron perfiles con esa búsqueda."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

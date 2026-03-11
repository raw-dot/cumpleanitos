import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, Card, Avatar, Badge, Input, getInitials, formatBirthday, daysUntilBirthday, formatMoney } from "../shared";

export default function ExplorePage({ onViewProfile }) {
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState([]); // [{profile, campaign, manager}]
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Load all active campaigns with birthday_person profile and creator profile
      const { data: camps } = await supabase
        .from("gift_campaigns")
        .select("*, birthday_person:profiles!gift_campaigns_birthday_person_id_fkey(*), creator:profiles!gift_campaigns_created_by_fkey(*)")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (camps) {
        // Deduplicate: keep only most recent campaign per birthday_person
        const seen = new Set();
        const deduped = camps.filter(c => {
          if (seen.has(c.birthday_person_id)) return false;
          seen.add(c.birthday_person_id);
          return true;
        });
        setEntries(deduped.map(c => ({
          profile: c.birthday_person,
          campaign: c,
          manager: c.created_by !== c.birthday_person_id ? c.creator : null,
        })));
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = entries.filter(({ profile, campaign }) => {
    const q = search.toLowerCase();
    return (
      profile?.name?.toLowerCase().includes(q) ||
      profile?.username?.toLowerCase().includes(q) ||
      campaign?.title?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 4, color: "#1F2937" }}>Explorar regalos</h1>
      <p style={{ color: COLORS.textLight, marginBottom: 24 }}>
        Encontrá a un amigo y regalale en su cumpleaños 🎁
      </p>

      <Input
        placeholder="Buscar por nombre, usuario o título de regalo..."
        value={search}
        onChange={setSearch}
        style={{ marginBottom: 24 }}
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: COLORS.textLight }}>Cargando regalos...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map(({ profile, campaign, manager }) => {
            const days = daysUntilBirthday(profile?.birthday || campaign?.birthday_date);
            const isToday = days === "¡Hoy!";
            const isSoon = typeof days === "number" && days <= 7;
            const username = profile?.username;

            return (
              <Card
                key={campaign.id}
                onClick={() => onViewProfile(username)}
                style={{ cursor: "pointer", padding: 0, overflow: "hidden", transition: "box-shadow 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,58,237,0.12)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = ""}
              >
                <div style={{ display: "flex" }}>
                  {/* Campaign image */}
                  {campaign.image_url ? (
                    <div style={{
                      width: 120,
                      minHeight: 100,
                      flexShrink: 0,
                      backgroundImage: `url(${campaign.image_url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }} />
                  ) : (
                    <div style={{
                      width: 100,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: `linear-gradient(135deg, ${COLORS.primary}15, ${COLORS.accent}10)`,
                      flexShrink: 0,
                      fontSize: 36,
                    }}>
                      🎂
                    </div>
                  )}

                  {/* Info */}
                  <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <Avatar initials={getInitials(profile?.name)} size={36} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: "#1F2937" }}>{profile?.name}</div>
                        <div style={{ fontSize: 12, color: COLORS.textLight }}>@{profile?.username}</div>
                      </div>
                      {manager && (
                        <Badge color={COLORS.accent} style={{ fontSize: 11 }}>
                          Gestionado por {manager.name || manager.username}
                        </Badge>
                      )}
                    </div>

                    <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>{campaign.title}</div>

                    {campaign.goal_amount > 0 && (
                      <div style={{ fontSize: 13, color: COLORS.textLight }}>
                        Meta: <strong style={{ color: COLORS.primary }}>{formatMoney(campaign.goal_amount)}</strong>
                      </div>
                    )}
                  </div>

                  {/* Days badge */}
                  <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", gap: 4, flexShrink: 0 }}>
                    <Badge color={isToday ? COLORS.accent : isSoon ? COLORS.error : COLORS.primary}>
                      🎂 {isToday ? "¡Hoy!" : isSoon ? `¡${days} días!` : `${days} días`}
                    </Badge>
                    <div style={{ fontSize: 11, color: COLORS.textLight }}>
                      {formatBirthday(profile?.birthday || campaign?.birthday_date)}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: 60, color: COLORS.textLight }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
              {entries.length === 0
                ? "Todavía no hay regalos. ¡Sé el primero en registrarte!"
                : "No se encontraron regalos con esa búsqueda."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

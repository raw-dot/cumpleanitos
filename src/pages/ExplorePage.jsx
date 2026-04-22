import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, Card, Avatar, Badge, Input, getInitials, formatBirthday, daysUntilBirthday, formatMoney } from "../shared";

export default function ExplorePage({ onViewProfile }) {
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadingTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, []);

  const load = async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    loadingTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) setLoading(false);
    }, 6000);

    try {
      const { data: camps, error } = await supabase
        .from("gift_campaigns")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error || !camps || camps.length === 0) {
        if (loadingTimeoutRef.current) { clearTimeout(loadingTimeoutRef.current); loadingTimeoutRef.current = null; }
        if (mountedRef.current) { setEntries([]); setLoading(false); }
        return;
      }

      const profileIds = new Set();
      camps.forEach(c => {
        if (c.birthday_person_id) profileIds.add(c.birthday_person_id);
        if (c.created_by) profileIds.add(c.created_by);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", [...profileIds]);

      const profileMap = {};
      (profiles || []).forEach(p => { profileMap[p.id] = p; });

      const seen = new Set();
      const deduped = camps.filter(c => {
        if (seen.has(c.birthday_person_id)) return false;
        seen.add(c.birthday_person_id);
        return true;
      });

      const result = deduped.map(c => {
        const profile = profileMap[c.birthday_person_id] || null;
        const creator = profileMap[c.created_by] || null;
        const isManaged = c.created_by && c.created_by !== c.birthday_person_id;
        return { profile, campaign: c, manager: isManaged ? creator : null };
      });

      if (mountedRef.current) setEntries(result);
    } catch(e) {
      console.error("ExplorePage load error:", e);
    } finally {
      if (loadingTimeoutRef.current) { clearTimeout(loadingTimeoutRef.current); loadingTimeoutRef.current = null; }
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && mountedRef.current) {
        // Si sigue en loading al volver, reintentar
        if (loadingTimeoutRef.current) load();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
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
            const birthdayDate = profile?.birthday || campaign?.birthday_date;
            const days = daysUntilBirthday(birthdayDate);
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
                <div style={{ display: "flex", minHeight: 110 }}>
                  {campaign.image_url ? (
                    <div style={{
                      width: 130,
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
                      background: `linear-gradient(135deg, ${COLORS.primary}18, ${COLORS.accent}12)`,
                      flexShrink: 0,
                      fontSize: 40,
                    }}>
                      🎂
                    </div>
                  )}

                  <div style={{ flex: 1, padding: "14px 18px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <Avatar initials={getInitials(profile?.name)} size={32} />
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 15, color: "#1F2937" }}>{profile?.name || "—"}</span>
                        <span style={{ fontSize: 12, color: COLORS.textLight, marginLeft: 6 }}>@{profile?.username}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.primary, marginTop: 2 }}>
                      🎁 {campaign.title}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {manager && (
                        <Badge color={COLORS.accent} style={{ fontSize: 11 }}>
                          Gestionado por {manager.name || manager.username}
                        </Badge>
                      )}
                      {campaign.goal_amount > 0 && (
                        <span style={{ fontSize: 12, color: COLORS.textLight }}>
                          Meta: <strong style={{ color: COLORS.text }}>{formatMoney(campaign.goal_amount)}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    gap: 4,
                    flexShrink: 0,
                  }}>
                    <Badge color={isToday ? COLORS.accent : isSoon ? "#EF4444" : COLORS.primary}>
                      {isToday ? "🎉 ¡Hoy!" : isSoon ? `⚡ ${days} días` : `📅 ${days} días`}
                    </Badge>
                    {birthdayDate && (
                      <div style={{ fontSize: 11, color: COLORS.textLight, marginTop: 2 }}>
                        {formatBirthday(birthdayDate)}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: 60, color: COLORS.textLight }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
                {entries.length === 0 ? "Todavía no hay regalos" : "No se encontraron regalos"}
              </div>
              <div style={{ fontSize: 14 }}>
                {entries.length === 0 ? "¡Sé el primero en registrarte!" : "Probá con otro nombre o título."}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

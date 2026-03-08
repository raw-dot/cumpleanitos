import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const COLORS = {
  primary: "#7C3AED", primaryLight: "#A78BFA", primaryDark: "#5B21B6",
  accent: "#F59E0B", accentLight: "#FDE68A", bg: "#FAFAFA", card: "#FFFFFF",
  text: "#1F2937", textLight: "#6B7280", border: "#E5E7EB",
  success: "#10B981", successLight: "#D1FAE5", error: "#EF4444",
};

const GIFT_AMOUNTS = [500, 1000, 2000, 5000];

function daysUntilBirthday(birthdayStr) {
  const today = new Date();
  const bday = new Date(birthdayStr);
  const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
  if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
  const diff = Math.ceil((thisYear - today) / (1000 * 60 * 60 * 24));
  return diff === 0 ? "¡Hoy!" : diff;
}

function formatBirthday(birthdayStr) {
  const months = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const d = new Date(birthdayStr);
  return `${d.getDate()} de ${months[d.getMonth()]}`;
}

function getInitials(name) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "Hace un momento";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} horas`;
  return `Hace ${Math.floor(diff / 86400)} días`;
}

function Logo({ size = 28 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
      <div style={{ width: size, height: size, borderRadius: 8, background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.5, fontWeight: 700 }}>🎂</div>
      <span style={{ fontSize: size * 0.7, fontWeight: 700, color: COLORS.text, letterSpacing: -0.5 }}>cumpleanitos</span>
    </div>
  );
}

function Button({ children, variant = "primary", size = "md", onClick, style = {}, disabled = false }) {
  const base = { border: "none", borderRadius: 12, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, transition: "all 0.2s", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: disabled ? 0.5 : 1 };
  const sizes = { sm: { padding: "8px 16px", fontSize: 13 }, md: { padding: "12px 24px", fontSize: 15 }, lg: { padding: "16px 32px", fontSize: 17 } };
  const variants = {
    primary: { background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, color: "#fff" },
    secondary: { background: COLORS.border, color: COLORS.text },
    outline: { background: "transparent", border: `2px solid ${COLORS.primary}`, color: COLORS.primary },
    ghost: { background: "transparent", color: COLORS.textLight },
    accent: { background: `linear-gradient(135deg, ${COLORS.accent}, #D97706)`, color: "#fff" },
    google: { background: "#fff", border: `1px solid ${COLORS.border}`, color: COLORS.text },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>{children}</button>;
}

function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{ background: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "all 0.2s", cursor: onClick ? "pointer" : "default", ...style }}>
      {children}
    </div>
  );
}

function Avatar({ initials, size = 48 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.primaryLight}, ${COLORS.primary})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: size * 0.35, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function Badge({ children, color = COLORS.primary }) {
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 20, background: color + "15", color, fontSize: 12, fontWeight: 600 }}>{children}</span>;
}

function Input({ placeholder, value, onChange, type = "text", style = {}, showPassword, togglePassword }) {
  const isPassword = type === "password";
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input type={isPassword && showPassword ? "text" : type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: "12px 16px", paddingRight: isPassword ? 48 : 16, borderRadius: 12, border: `1px solid ${COLORS.border}`, fontSize: 15, outline: "none", transition: "border 0.2s", boxSizing: "border-box", background: COLORS.bg, ...style }}
        onFocus={e => e.target.style.borderColor = COLORS.primary}
        onBlur={e => e.target.style.borderColor = COLORS.border} />
      {isPassword && (
        <button onClick={togglePassword} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: COLORS.textLight, fontSize: 20, padding: 4 }}>
          {showPassword ? "👁️" : "👁️‍🗨️"}
        </button>
      )}
    </div>
  );
}

function Textarea({ placeholder, value, onChange, rows = 3 }) {
  return (
    <textarea placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} rows={rows}
      style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: `1px solid ${COLORS.border}`, fontSize: 15, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", background: COLORS.bg }}
      onFocus={e => e.target.style.borderColor = COLORS.primary}
      onBlur={e => e.target.style.borderColor = COLORS.border} />
  );
}

function Alert({ message, type = "error" }) {
  if (!message) return null;
  const colors = { error: { bg: "#FEF2F2", border: "#FECACA", text: COLORS.error }, success: { bg: COLORS.successLight, border: "#A7F3D0", text: "#065F46" } };
  const c = colors[type];
  return <div style={{ padding: "10px 14px", borderRadius: 10, background: c.bg, border: `1px solid ${c.border}`, color: c.text, fontSize: 14, marginBottom: 12 }}>{message}</div>;
}

function AuthPage({ setCurrentPage, onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [birthday, setBirthday] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Calcular edad actual
  const getAge = (birthdayStr) => {
    const today = new Date();
    const bday = new Date(birthdayStr);
    let age = today.getFullYear() - bday.getFullYear();
    const month = today.getMonth() - bday.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < bday.getDate())) age--;
    return age;
  };

  // Calcular días al próximo cumpleaños
  const getDaysToBirthday = (birthdayStr) => {
    const today = new Date();
    const bday = new Date(birthdayStr);
    const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
    const diff = Math.ceil((thisYear - today) / (1000 * 60 * 60 * 24));
    return diff === 0 ? 0 : diff;
  };

  const handleLogin = async () => {
    setLoading(true); setError(""); setSuccess("");
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    onAuth(data.user);
  };

  const handleRegister = async () => {
    if (!name || !username || !birthday || !phone) { setError("Completá todos los campos"); return; }

    // Validar que sea mayor de 13 años (edad mínima para redes sociales)
    const age = getAge(birthday);
    if (age < 13) { setError("Debes tener al menos 13 años para registrarte"); return; }

    // Validar teléfono (básico: al menos 10 dígitos)
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) { setError("El teléfono debe tener al menos 10 dígitos"); return; }

    setLoading(true); setError(""); setSuccess("");
    const { data: existing } = await supabase.from("profiles").select("username").eq("username", username).single();
    if (existing) { setError("Ese nombre de usuario ya está en uso"); setLoading(false); return; }

    const daysToBday = getDaysToBirthday(birthday);

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          username,
          birthday,
          phone,
          age,
          days_to_birthday: daysToBday
        },
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });
    if (err) { setError(err.message); setLoading(false); return; }

    // Intentar iniciar sesión automáticamente después del registro
    setTimeout(async () => {
      const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
      if (loginData.user) {
        onAuth(loginData.user);
      } else {
        setSuccess("¡Cuenta creada! Revisá tu email para confirmar e inicia sesión.");
      }
      setLoading(false);
    }, 1000);
  };

  const handleGoogleLogin = async () => {
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
    if (err) { setError(err.message); setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "60px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎂</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, margin: "0 0 8px" }}>
          {mode === "login" ? "Iniciá sesión" : "Creá tu cuenta"}
        </h1>
        <p style={{ color: COLORS.textLight }}>
          {mode === "login" ? "Entrá a tu perfil de cumpleanitos" : "Registrate y empezá a recibir regalitos"}
        </p>
      </div>

      <Card style={{ padding: 32 }}>
        <Alert message={error} type="error" />
        <Alert message={success} type="success" />

        <Button variant="google" size="lg" style={{ width: "100%", marginBottom: 20 }} onClick={handleGoogleLogin} disabled={loading}>
          {mode === "login" ? "Entrar con Google" : "Registrarse con Google"}
        </Button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          <span style={{ fontSize: 13, color: COLORS.textLight }}>o con email</span>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "register" && (
            <>
              <Input placeholder="Nombre completo" value={name} onChange={setName} />
              <Input placeholder="Usuario (ej: mariag)" value={username} onChange={v => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ""))} />
              <div>
                <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Fecha de cumpleaños</label>
                <Input type="date" value={birthday} onChange={setBirthday} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Teléfono celular (para WhatsApp)</label>
                <Input placeholder="Ej: +54 9 11 2345 6789" value={phone} onChange={setPhone} />
              </div>
              {birthday && (
                <div style={{ padding: 12, background: COLORS.primaryLight + "15", borderRadius: 8, fontSize: 13, color: COLORS.text }}>
                  📅 Tienes {getAge(birthday)} años | 🎁 Tu cumpleaños es en {getDaysToBirthday(birthday)} días
                </div>
              )}
            </>
          )}
          <Input placeholder="Email" type="email" value={email} onChange={setEmail} />
          <Input placeholder="Contraseña" type="password" value={password} onChange={setPassword} showPassword={showPassword} togglePassword={() => setShowPassword(!showPassword)} />

          <Button size="lg" style={{ width: "100%", marginTop: 4 }}
            disabled={loading || !email || !password || (mode === "register" && (!name || !username || !birthday || !phone))}
            onClick={mode === "login" ? handleLogin : handleRegister}>
            {loading ? "Cargando..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </Button>
        </div>

        <p style={{ textAlign: "center", fontSize: 14, color: COLORS.textLight, marginTop: 16, marginBottom: 0 }}>
          {mode === "login" ? "¿No tenés cuenta? " : "¿Ya tenés cuenta? "}
          <span style={{ color: COLORS.primary, fontWeight: 600, cursor: "pointer" }}
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setSuccess(""); }}>
            {mode === "login" ? "Registrate" : "Iniciá sesión"}
          </span>
        </p>
      </Card>
    </div>
  );
}

function Navbar({ currentPage, setCurrentPage, setSelectedUser, session, profile, onLogout }) {
  return (
    <nav style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${COLORS.border}`, padding: "12px 0", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div onClick={() => { setCurrentPage("home"); setSelectedUser(null); }}><Logo /></div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button variant={currentPage === "explore" ? "primary" : "ghost"} size="sm" onClick={() => setCurrentPage("explore")}>Explorar</Button>
          {session ? (
            <>
              <Button variant={currentPage === "dashboard" ? "accent" : "ghost"} size="sm" onClick={() => setCurrentPage("dashboard")}>Mi cuenta</Button>
              <div onClick={() => setCurrentPage("dashboard")} style={{ cursor: "pointer" }}>
                <Avatar initials={profile ? getInitials(profile.name) : "?"} size={32} />
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setCurrentPage("login")}>Iniciar sesión</Button>
              <Button variant="accent" size="sm" onClick={() => setCurrentPage("register")}>Registrarse</Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function HomePage({ setCurrentPage, recentGifts }) {
  return (
    <div>
      <div style={{ textAlign: "center", padding: "80px 20px 60px", background: `linear-gradient(180deg, ${COLORS.primary}08 0%, transparent 100%)` }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎁</div>
        <h1 style={{ fontSize: 48, fontWeight: 800, color: COLORS.text, margin: "0 0 16px", letterSpacing: -1.5, lineHeight: 1.1 }}>
          Regalá un <span style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>cumpleanito</span>
        </h1>
        <p style={{ fontSize: 20, color: COLORS.textLight, maxWidth: 500, margin: "0 auto 32px", lineHeight: 1.5 }}>
          La forma más fácil de recibir regalos de cumpleaños. Creá tu perfil, compartí tu link y recibí regalos de tus amigos.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Button size="lg" onClick={() => setCurrentPage("register")}>Crear mi perfil gratis</Button>
          <Button variant="outline" size="lg" onClick={() => setCurrentPage("explore")}>Explorar perfiles</Button>
        </div>
      </div>
    </div>
  );
}

function ExplorePage({ setSelectedUser, setCurrentPage }) {
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setProfiles(data);
    setLoading(false);
  };

  const filtered = profiles.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: COLORS.text }}>Explorar perfiles</h1>
      <p style={{ color: COLORS.textLight, marginBottom: 24 }}>Encontrá a alguien y regalale un cumpleanito 🎁</p>
      <Input placeholder="Buscar por nombre o usuario..." value={search} onChange={setSearch} style={{ marginBottom: 24 }} />

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: COLORS.textLight }}>Cargando perfiles...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(user => {
            const days = daysUntilBirthday(user.birthday);
            return (
              <Card key={user.id} onClick={() => { setSelectedUser(user); setCurrentPage("profile"); }}
                style={{ display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}>
                <Avatar initials={getInitials(user.name)} size={52} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, color: COLORS.text }}>{user.name}</div>
                  <div style={{ fontSize: 13, color: COLORS.textLight }}>@{user.username}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Badge color={days === "¡Hoy!" ? COLORS.accent : COLORS.primary}>
                    🎂 {days === "¡Hoy!" ? days : `${days} días`}
                  </Badge>
                  <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 4 }}>{formatBirthday(user.birthday)}</div>
                </div>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: COLORS.textLight }}>
              {profiles.length === 0 ? "Todavía no hay perfiles. ¡Sé el primero!" : "No se encontraron perfiles 😕"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${COLORS.border}`, padding: "32px 20px", textAlign: "center" }}>
      <Logo size={22} />
      <p style={{ fontSize: 13, color: COLORS.textLight, marginTop: 12 }}>
        Hecho con 💜 en Argentina · © 2026 Cumpleanitos
      </p>
    </footer>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedUser, setSelectedUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) loadProfile(s.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        loadProfile(s.user.id);
        setCurrentPage("dashboard");
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setCurrentPage("home");
  };

  const handleAuth = (user) => {
    setCurrentPage("dashboard");
  };

  if (loading) {
    return (
      <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: COLORS.textLight }}>
        Cargando...
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "home": return <HomePage setCurrentPage={setCurrentPage} recentGifts={[]} />;
      case "explore": return <ExplorePage setSelectedUser={setSelectedUser} setCurrentPage={setCurrentPage} />;
      case "login": case "register": return <AuthPage setCurrentPage={setCurrentPage} onAuth={handleAuth} />;
      default: return <HomePage setCurrentPage={setCurrentPage} recentGifts={[]} />;
    }
  };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: COLORS.bg, minHeight: "100vh", color: COLORS.text }}>
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} setSelectedUser={setSelectedUser} session={session} profile={profile} onLogout={handleLogout} />
      {renderPage()}
      <Footer />
    </div>
  );
}

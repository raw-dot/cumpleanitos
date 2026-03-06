import { useState, useEffect, useRef } from "react";

const COLORS = {
  primary: "#7C3AED",
  primaryLight: "#A78BFA",
  primaryDark: "#5B21B6",
  accent: "#F59E0B",
  accentLight: "#FDE68A",
  bg: "#FAFAFA",
  card: "#FFFFFF",
  text: "#1F2937",
  textLight: "#6B7280",
  border: "#E5E7EB",
  success: "#10B981",
  successLight: "#D1FAE5",
};

const GIFT_AMOUNTS = [500, 1000, 2000, 5000];

const SAMPLE_USERS = [
  { id: 1, name: "Lucía Fernández", username: "luciaf", birthday: "1995-04-12", avatar: "LF", bio: "Amo los libros, el café y los atardeceres. 📚☕", wishlist: ["Un libro de Cortázar", "Auriculares bluetooth", "Gift card de Spotify"], giftsReceived: 12, totalReceived: 18500 },
  { id: 2, name: "Martín Rodríguez", username: "martinr", birthday: "1998-07-23", avatar: "MR", bio: "Gamer, cocinero amateur y amante de los gatos. 🎮🐱", wishlist: ["Joystick inalámbrico", "Libro de recetas", "Suscripción Netflix"], giftsReceived: 8, totalReceived: 12000 },
  { id: 3, name: "Camila Torres", username: "camit", birthday: "2000-03-15", avatar: "CT", bio: "Diseñadora gráfica. Me encanta viajar y la fotografía. ✈️📸", wishlist: ["Mochila de viaje", "Lentes de sol", "Curso de Lightroom"], giftsReceived: 21, totalReceived: 34000 },
  { id: 4, name: "Santiago López", username: "santil", birthday: "1997-11-08", avatar: "SL", bio: "Músico de alma, programador de profesión. 🎸💻", wishlist: ["Cuerdas para guitarra", "Teclado mecánico", "Café de especialidad"], giftsReceived: 15, totalReceived: 22500 },
];

const RECENT_GIFTS = [
  { from: "Ana M.", to: "Lucía Fernández", amount: 1000, message: "¡Feliz cumple, Lu! 🎂", time: "Hace 2 min" },
  { from: "Pedro G.", to: "Martín Rodríguez", amount: 2000, message: "¡Pasala genial, crack!", time: "Hace 15 min" },
  { from: "Sofía R.", to: "Camila Torres", amount: 500, message: "Un regalito para vos 💜", time: "Hace 1 hora" },
  { from: "Diego L.", to: "Santiago López", amount: 5000, message: "¡Felicidades, hermano!", time: "Hace 3 horas" },
];

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

function Logo({ size = 28 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
      <div style={{ width: size, height: size, borderRadius: 8, background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.5, fontWeight: 700 }}>
        🎂
      </div>
      <span style={{ fontSize: size * 0.7, fontWeight: 700, color: COLORS.text, letterSpacing: -0.5 }}>
        cumpleanitos
      </span>
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
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 20, background: color + "15", color, fontSize: 12, fontWeight: 600 }}>
      {children}
    </span>
  );
}

function Input({ placeholder, value, onChange, type = "text", style = {} }) {
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: `1px solid ${COLORS.border}`, fontSize: 15, outline: "none", transition: "border 0.2s", boxSizing: "border-box", background: COLORS.bg, ...style }}
      onFocus={e => e.target.style.borderColor = COLORS.primary}
      onBlur={e => e.target.style.borderColor = COLORS.border} />
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

function Navbar({ currentPage, setCurrentPage, setSelectedUser }) {
  return (
    <nav style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${COLORS.border}`, padding: "12px 0", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div onClick={() => { setCurrentPage("home"); setSelectedUser(null); }}><Logo /></div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button variant={currentPage === "explore" ? "primary" : "ghost"} size="sm" onClick={() => setCurrentPage("explore")}>Explorar</Button>
          <Button variant={currentPage === "create" ? "primary" : "ghost"} size="sm" onClick={() => setCurrentPage("create")}>Crear perfil</Button>
          <Button variant="accent" size="sm" onClick={() => setCurrentPage("dashboard")}>Mi cuenta</Button>
        </div>
      </div>
    </nav>
  );
}

function HeroSection({ setCurrentPage }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px 60px", background: `linear-gradient(180deg, ${COLORS.primary}08 0%, transparent 100%)` }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎁</div>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: COLORS.text, margin: "0 0 16px", letterSpacing: -1.5, lineHeight: 1.1 }}>
        Regalá un <span style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>cumpleanito</span>
      </h1>
      <p style={{ fontSize: 20, color: COLORS.textLight, maxWidth: 500, margin: "0 auto 32px", lineHeight: 1.5 }}>
        La forma más fácil de recibir regalos de cumpleaños. Creá tu perfil, compartí tu link y recibí regalos de tus amigos.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Button size="lg" onClick={() => setCurrentPage("create")}>Crear mi perfil gratis</Button>
        <Button variant="outline" size="lg" onClick={() => setCurrentPage("explore")}>Explorar perfiles</Button>
      </div>
      <div style={{ display: "flex", gap: 40, justifyContent: "center", marginTop: 48, flexWrap: "wrap" }}>
        {[["🎂", "2.5K+", "Cumpleañeros"], ["🎁", "15K+", "Regalos enviados"], ["💜", "$2.8M+", "Recaudados"]].map(([icon, num, label]) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28 }}>{icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.text }}>{num}</div>
            <div style={{ fontSize: 13, color: COLORS.textLight }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { icon: "✨", title: "Creá tu perfil", desc: "Registrate gratis y personalizá tu página de cumpleaños." },
    { icon: "🔗", title: "Compartí tu link", desc: "Mandá tu link a amigos y familia por WhatsApp o redes." },
    { icon: "🎁", title: "Recibí regalos", desc: "Tus amigos te mandan regalitos y mensajes para tu cumple." },
  ];
  return (
    <div style={{ padding: "60px 20px", maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: 700, marginBottom: 40, color: COLORS.text }}>¿Cómo funciona?</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
        {steps.map((s, i) => (
          <Card key={i} style={{ textAlign: "center", padding: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{s.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.primary, marginBottom: 4 }}>Paso {i + 1}</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px", color: COLORS.text }}>{s.title}</h3>
            <p style={{ fontSize: 14, color: COLORS.textLight, margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RecentGifts() {
  return (
    <div style={{ padding: "40px 20px 60px", maxWidth: 600, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", fontSize: 24, fontWeight: 700, marginBottom: 24, color: COLORS.text }}>Últimos regalitos 🎉</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {RECENT_GIFTS.map((g, i) => (
          <Card key={i} style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: COLORS.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎁</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14 }}>
                <strong>{g.from}</strong> <span style={{ color: COLORS.textLight }}>le regaló a</span> <strong>{g.to}</strong>
              </div>
              <div style={{ fontSize: 13, color: COLORS.textLight, marginTop: 2 }}>"{g.message}"</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontWeight: 700, color: COLORS.primary }}>${g.amount.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: COLORS.textLight }}>{g.time}</div>
            </div>
          </Card>
        ))}
      </div>
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

function HomePage({ setCurrentPage }) {
  return (
    <div>
      <HeroSection setCurrentPage={setCurrentPage} />
      <HowItWorks />
      <RecentGifts />
    </div>
  );
}

function ExplorePage({ setSelectedUser, setCurrentPage }) {
  const [search, setSearch] = useState("");
  const filtered = SAMPLE_USERS.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: COLORS.text }}>Explorar perfiles</h1>
      <p style={{ color: COLORS.textLight, marginBottom: 24 }}>Encontrá a alguien y regalale un cumpleanito 🎁</p>
      <Input placeholder="Buscar por nombre o usuario..." value={search} onChange={setSearch} style={{ marginBottom: 24 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(user => {
          const days = daysUntilBirthday(user.birthday);
          return (
            <Card key={user.id} onClick={() => { setSelectedUser(user); setCurrentPage("profile"); }}
              style={{ display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}>
              <Avatar initials={user.avatar} size={52} />
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
            No se encontraron perfiles 😕
          </div>
        )}
      </div>
    </div>
  );
}

function GiftModal({ user, onClose }) {
  const [amount, setAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState("choose");
  const [isCustom, setIsCustom] = useState(false);

  const finalAmount = isCustom ? parseInt(customAmount) || 0 : amount;

  if (step === "success") {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}
        onClick={onClose}>
        <Card style={{ maxWidth: 420, width: "100%", textAlign: "center", padding: 40 }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px", color: COLORS.text }}>¡Regalito enviado!</h2>
          <p style={{ color: COLORS.textLight, marginBottom: 24 }}>
            Le mandaste <strong>${finalAmount.toLocaleString()}</strong> a {user.name}
          </p>
          <Button onClick={onClose}>Cerrar</Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}
      onClick={onClose}>
      <Card style={{ maxWidth: 440, width: "100%", padding: 32 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: COLORS.text }}>
            Regalar a {user.name.split(" ")[0]} 🎁
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: COLORS.textLight }}>✕</button>
        </div>

        <p style={{ fontSize: 14, color: COLORS.textLight, marginBottom: 16 }}>Elegí el monto del regalito:</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 12 }}>
          {GIFT_AMOUNTS.map(a => (
            <button key={a} onClick={() => { setAmount(a); setIsCustom(false); }}
              style={{ padding: "14px 0", borderRadius: 12, border: `2px solid ${!isCustom && amount === a ? COLORS.primary : COLORS.border}`, background: !isCustom && amount === a ? COLORS.primary + "10" : "transparent", cursor: "pointer", fontSize: 16, fontWeight: 600, color: !isCustom && amount === a ? COLORS.primary : COLORS.text, transition: "all 0.2s" }}>
              ${a.toLocaleString()}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <button onClick={() => setIsCustom(true)}
            style={{ width: "100%", padding: "10px", borderRadius: 12, border: `2px solid ${isCustom ? COLORS.primary : COLORS.border}`, background: isCustom ? COLORS.primary + "10" : "transparent", cursor: "pointer", fontSize: 14, fontWeight: 500, color: isCustom ? COLORS.primary : COLORS.textLight, transition: "all 0.2s", marginBottom: isCustom ? 8 : 0 }}>
            Otro monto
          </button>
          {isCustom && <Input placeholder="Ingresá el monto" type="number" value={customAmount} onChange={setCustomAmount} />}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, display: "block", marginBottom: 6 }}>Dedicatoria (opcional)</label>
          <Textarea placeholder="¡Feliz cumple! 🎂 Pasala genial..." value={message} onChange={setMessage} rows={2} />
        </div>

        <Button style={{ width: "100%" }} size="lg" disabled={finalAmount <= 0}
          onClick={() => setStep("success")}>
          Regalar ${finalAmount > 0 ? finalAmount.toLocaleString() : "..."} 🎁
        </Button>

        <p style={{ fontSize: 12, color: COLORS.textLight, textAlign: "center", marginTop: 12, marginBottom: 0 }}>
          Pago seguro · Sin comisiones ocultas
        </p>
      </Card>
    </div>
  );
}

function ProfilePage({ user }) {
  const [showGift, setShowGift] = useState(false);
  const days = daysUntilBirthday(user.birthday);
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px" }}>
      <Card style={{ textAlign: "center", padding: "40px 32px", marginBottom: 16 }}>
        <Avatar initials={user.avatar} size={80} />
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "16px 0 4px", color: COLORS.text }}>{user.name}</h1>
        <p style={{ fontSize: 14, color: COLORS.textLight, margin: "0 0 4px" }}>@{user.username}</p>
        <p style={{ fontSize: 15, color: COLORS.text, margin: "12px 0 16px", lineHeight: 1.5 }}>{user.bio}</p>

        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 20 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.primary }}>{user.giftsReceived}</div>
            <div style={{ fontSize: 12, color: COLORS.textLight }}>regalitos</div>
          </div>
          <div style={{ width: 1, background: COLORS.border }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.accent }}>
              {days === "¡Hoy!" ? "🎂" : days}
            </div>
            <div style={{ fontSize: 12, color: COLORS.textLight }}>
              {days === "¡Hoy!" ? "¡Cumple hoy!" : "días para el cumple"}
            </div>
          </div>
          <div style={{ width: 1, background: COLORS.border }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text }}>{formatBirthday(user.birthday)}</div>
            <div style={{ fontSize: 12, color: COLORS.textLight }}>cumpleaños</div>
          </div>
        </div>

        <Button size="lg" style={{ width: "100%", marginBottom: 10 }} onClick={() => setShowGift(true)}>
          Regalar un cumpleanito 🎁
        </Button>

        <Button variant="secondary" size="sm" onClick={copyLink} style={{ width: "100%" }}>
          {copied ? "✅ ¡Link copiado!" : "🔗 Copiar link del perfil"}
        </Button>
      </Card>

      {user.wishlist && user.wishlist.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px", color: COLORS.text }}>Lista de deseos 💫</h3>
          {user.wishlist.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: i > 0 ? `1px solid ${COLORS.border}` : "none" }}>
              <span style={{ fontSize: 18 }}>🎁</span>
              <span style={{ fontSize: 14, color: COLORS.text }}>{item}</span>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px", color: COLORS.text }}>Últimos regalitos recibidos</h3>
        {[{ from: "Ana M.", amount: 1000, msg: "¡Feliz cumple! 🎂", time: "Hace 2 días" },
          { from: "Pedro G.", amount: 2000, msg: "¡Pasala genial!", time: "Hace 5 días" },
          { from: "Sofía R.", amount: 500, msg: "Te quiero mucho 💜", time: "Hace 1 semana" }
        ].map((g, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i > 0 ? `1px solid ${COLORS.border}` : "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: COLORS.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🎁</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{g.from}</div>
              <div style={{ fontSize: 12, color: COLORS.textLight }}>{g.msg}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.primary }}>${g.amount.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: COLORS.textLight }}>{g.time}</div>
            </div>
          </div>
        ))}
      </Card>

      {showGift && <GiftModal user={user} onClose={() => setShowGift(false)} />}
    </div>
  );
}

function CreateProfilePage({ setCurrentPage }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [birthday, setBirthday] = useState("");
  const [bio, setBio] = useState("");
  const [created, setCreated] = useState(false);

  if (created) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 8px", color: COLORS.text }}>¡Perfil creado!</h1>
        <p style={{ color: COLORS.textLight, fontSize: 16, marginBottom: 24 }}>
          Tu página ya está lista para compartir
        </p>
        <Card style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ fontSize: 14, color: COLORS.textLight }}>cumpleanitos.app/</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.primary }}>{username || "tu-usuario"}</span>
          </div>
        </Card>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Button onClick={() => setCurrentPage("explore")}>Explorar perfiles</Button>
          <Button variant="outline" onClick={() => setCurrentPage("dashboard")}>Ir a mi cuenta</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, color: COLORS.text }}>Creá tu perfil 🎂</h1>
      <p style={{ color: COLORS.textLight, marginBottom: 32 }}>Completá tus datos y empezá a recibir regalitos</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, display: "block", marginBottom: 6 }}>Nombre completo</label>
          <Input placeholder="Ej: María García" value={name} onChange={setName} />
        </div>
        <div>
          <label style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, display: "block", marginBottom: 6 }}>Usuario</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: COLORS.textLight, fontSize: 14 }}>cumpleanitos.app/</span>
            <Input placeholder="tu-usuario" value={username} onChange={setUsername} style={{ paddingLeft: 140 }} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, display: "block", marginBottom: 6 }}>Fecha de cumpleaños</label>
          <Input type="date" value={birthday} onChange={setBirthday} />
        </div>
        <div>
          <label style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, display: "block", marginBottom: 6 }}>Bio</label>
          <Textarea placeholder="Contá algo sobre vos..." value={bio} onChange={setBio} rows={3} />
        </div>

        <Button size="lg" style={{ width: "100%", marginTop: 8 }}
          disabled={!name || !username || !birthday}
          onClick={() => setCreated(true)}>
          Crear mi perfil ✨
        </Button>
      </div>
    </div>
  );
}

function DashboardPage() {
  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, color: COLORS.text }}>Mi cuenta</h1>
      <p style={{ color: COLORS.textLight, marginBottom: 32 }}>Gestioná tu perfil y retirá tus regalitos</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Regalitos recibidos", value: "24", icon: "🎁", color: COLORS.primary },
          { label: "Total recaudado", value: "$38.500", icon: "💰", color: COLORS.success },
          { label: "Días para tu cumple", value: "42", icon: "🎂", color: COLORS.accent },
        ].map((s, i) => (
          <Card key={i} style={{ textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 28 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: COLORS.textLight }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: COLORS.text }}>Balance disponible</h3>
          <Badge color={COLORS.success}>Verificado ✓</Badge>
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, color: COLORS.text, marginBottom: 4 }}>$38.500</div>
        <p style={{ fontSize: 14, color: COLORS.textLight, margin: "0 0 16px" }}>Podés retirar a tu cuenta bancaria</p>
        <div style={{ display: "flex", gap: 10 }}>
          <Button>Retirar fondos</Button>
          <Button variant="secondary">Ver historial</Button>
        </div>
      </Card>

      <Card>
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px", color: COLORS.text }}>Últimos regalitos</h3>
        {[
          { from: "Ana M.", amount: 2000, msg: "¡Feliz cumple, amiga! 🎂", time: "Hoy" },
          { from: "Carlos V.", amount: 5000, msg: "¡Grande! Pasala genial 🥳", time: "Ayer" },
          { from: "Laura P.", amount: 1000, msg: "Un mimito para vos 💜", time: "Hace 2 días" },
          { from: "Anónimo", amount: 500, msg: "🎁", time: "Hace 3 días" },
        ].map((g, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: i > 0 ? `1px solid ${COLORS.border}` : "none" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: COLORS.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎁</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{g.from}</div>
              <div style={{ fontSize: 13, color: COLORS.textLight }}>{g.msg}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700, color: COLORS.success }}>+${g.amount.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: COLORS.textLight }}>{g.time}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedUser, setSelectedUser] = useState(null);

  const renderPage = () => {
    switch (currentPage) {
      case "home": return <HomePage setCurrentPage={setCurrentPage} />;
      case "explore": return <ExplorePage setSelectedUser={setSelectedUser} setCurrentPage={setCurrentPage} />;
      case "profile": return selectedUser ? <ProfilePage user={selectedUser} /> : <ExplorePage setSelectedUser={setSelectedUser} setCurrentPage={setCurrentPage} />;
      case "create": return <CreateProfilePage setCurrentPage={setCurrentPage} />;
      case "dashboard": return <DashboardPage />;
      default: return <HomePage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: COLORS.bg, minHeight: "100vh", color: COLORS.text }}>
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} setSelectedUser={setSelectedUser} />
      {renderPage()}
      <Footer />
    </div>
  );
}
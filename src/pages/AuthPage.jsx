import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, ROLES, Button, Card, Input, Alert, Logo } from "../shared";

export default function AuthPage({ initialMode = "login", onAuth, onNavigate }) {
  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("celebrant");
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

  // Sincronizar mode cuando cambia initialMode desde el padre (ej: navbar)
  useEffect(() => {
    setMode(initialMode);
    setError("");
    setSuccess("");
  }, [initialMode]);

  const getAge = (b) => {
    const today = new Date();
    const bday = new Date(b + "T00:00:00");
    let age = today.getFullYear() - bday.getFullYear();
    const m = today.getMonth() - bday.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) age--;
    return age;
  };

  const getDaysToBirthday = (b) => {
    const today = new Date();
    const bday = new Date(b + "T00:00:00");
    const next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    if (next < today) next.setFullYear(today.getFullYear() + 1);
    return Math.ceil((next - today) / 86400000);
  };

  const switchMode = (newMode) => {
    if (onNavigate) onNavigate(newMode);
    else setMode(newMode);
    setStep(1);
    setError("");
    setSuccess("");
  };

  // ─── LOGIN ───────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    onAuth(data.user);
  };

  // ─── REGISTER ────────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!name || !username || !birthday || !phone) {
      setError("Completá todos los campos");
      return;
    }
    const age = getAge(birthday);
    if (age < 13) { setError("Debes tener al menos 13 años"); return; }
    if (phone.replace(/\D/g, "").length < 10) { setError("El teléfono debe tener al menos 10 dígitos"); return; }

    setLoading(true);
    setError("");

    // Check username
    const { data: existing } = await supabase.from("profiles").select("username").eq("username", username).single();
    if (existing) { setError("Ese nombre de usuario ya está en uso"); setLoading(false); return; }

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, username, birthday, phone, age, days_to_birthday: getDaysToBirthday(birthday), role },
        emailRedirectTo: window.location.origin,
      },
    });

    if (err) { setError(err.message); setLoading(false); return; }

    // Auto login after sign up
    setTimeout(async () => {
      const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({ email, password });

      if (loginData?.user) {
        // Upsert profile with role (in case trigger doesn't have it)
        await supabase.from("profiles").upsert({
          id: loginData.user.id,
          name, username, birthday, phone,
          age, days_to_birthday: getDaysToBirthday(birthday),
          role,
        }, { onConflict: "id" });

        // Auto-create campaign for celebrants and managers
        if (role === "celebrant" || role === "manager") {
          const { data: camp } = await supabase.from("gift_campaigns")
            .select("id")
            .eq("birthday_person_id", loginData.user.id)
            .single();

          if (!camp) {
            await supabase.from("gift_campaigns").insert({
              title: "Mi Regalo",
              description: `¡Hola! Soy ${name}. Estoy juntando regalitos para mi cumpleaños. ¡Gracias por entrar a mi regalo! 🎂`,
              birthday_person_id: loginData.user.id,
              created_by: loginData.user.id,
              goal_amount: 10000,
              birthday_date: birthday,
              status: "active",
              birthday_person_name: name,
            });
          }
        }

        onAuth(loginData.user);
      } else {
        setSuccess("¡Cuenta creada! Revisá tu email para confirmar e iniciá sesión.");
        setMode("login");
      }
      setLoading(false);
    }, 1200);
  };

  // ─── GOOGLE ───────────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (err) { setError(err.message); setLoading(false); }
  };

  // ─── REGISTER ─────────────────────────────────────────────────────────────────
  if (mode === "register") {
    return (
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "60px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🎂</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, margin: "0 0 8px" }}>Creá tu cuenta</h1>
          <p style={{ color: COLORS.textLight, margin: 0 }}>Unite a la plataforma de regalos más linda de Argentina</p>
        </div>

        <Card style={{ padding: 32 }}>
          <Alert message={error} type="error" />
          <Alert message={success} type="success" />

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input placeholder="Nombre completo" value={name} onChange={setName} />
            <Input
              placeholder="Nombre de usuario (ej: mariag)"
              value={username}
              onChange={v => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            />
            <div>
              <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Fecha de cumpleaños</label>
              <Input type="date" value={birthday} onChange={setBirthday} />
            </div>
            <Input placeholder="Teléfono (ej: +54 9 11 2345 6789)" value={phone} onChange={setPhone} />

            {birthday && (
              <div style={{ padding: 12, background: COLORS.primaryLight + "15", borderRadius: 10, fontSize: 13, color: COLORS.text }}>
                📅 {getAge(birthday)} años · 🎂 Próximo cumple en {getDaysToBirthday(birthday)} días
              </div>
            )}

            <div style={{ height: 1, background: COLORS.border, margin: "4px 0" }} />

            <Input placeholder="Email" type="email" value={email} onChange={setEmail} />
            <Input
              placeholder="Contraseña (mínimo 6 caracteres)"
              type="password"
              value={password}
              onChange={setPassword}
              showPassword={showPassword}
              togglePassword={() => setShowPassword(!showPassword)}
            />

            <Button
              size="lg"
              style={{ width: "100%", marginTop: 4 }}
              disabled={loading || !email || !password || !name || !username || !birthday || !phone}
              onClick={handleRegister}
            >
              {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
            </Button>
          </div>

        </Card>
      </div>
    );
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "60px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🎂</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, margin: "0 0 8px" }}>Iniciá sesión</h1>
        <p style={{ color: COLORS.textLight, margin: 0 }}>Entrá a tu perfil de cumpleanitos</p>
      </div>

      <Card style={{ padding: 32 }}>
        <Alert message={error} type="error" />
        <Alert message={success} type="success" />

        <Button variant="google" size="lg" style={{ width: "100%", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }} onClick={handleGoogle} disabled={loading}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={18} height={18} alt="" />
          Continuar con Google
        </Button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          <span style={{ fontSize: 13, color: COLORS.textLight }}>o con email</span>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input placeholder="Email" type="email" value={email} onChange={setEmail} />
          <Input
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={setPassword}
            showPassword={showPassword}
            togglePassword={() => setShowPassword(!showPassword)}
          />
          <Button
            size="lg"
            style={{ width: "100%", marginTop: 4 }}
            disabled={loading || !email || !password}
            onClick={handleLogin}
          >
            {loading ? "Cargando..." : "Iniciar sesión"}
          </Button>
        </div>

        <p style={{ textAlign: "center", fontSize: 14, color: COLORS.textLight, marginTop: 16, marginBottom: 0 }}>
          ¿No tenés cuenta?{" "}
          <span style={{ color: COLORS.primary, fontWeight: 600, cursor: "pointer" }} onClick={() => switchMode("register")}>
            Registrate gratis
          </span>
        </p>
      </Card>
    </div>
  );
}

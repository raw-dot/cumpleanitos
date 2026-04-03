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

  useEffect(() => {
    setMode(initialMode);
    setStep(1);
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

  // ─── REGISTER STEP 1: validate email + password ────────────────────────────
  const handleStep1 = () => {
    if (!email || !password) {
      setError("Completá email y contraseña");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Ingresá un email válido");
      return;
    }
    setError("");
    setStep(2);
  };

  // ─── REGISTER STEP 2: create account with retry polling ────────────────────
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

    // Auto-login with retry polling (max 5s, every 500ms)
    let attempts = 0;
    const maxAttempts = 10;
    const tryLogin = async () => {
      attempts++;
      const { data: loginData } = await supabase.auth.signInWithPassword({ email, password });

      if (loginData?.user) {
        await supabase.from("profiles").upsert({
          id: loginData.user.id,
          name, username, birthday, phone,
          age, days_to_birthday: getDaysToBirthday(birthday),
          role,
        }, { onConflict: "id" });
        setLoading(false);
        onAuth(loginData.user);
      } else if (attempts < maxAttempts) {
        setTimeout(tryLogin, 500);
      } else {
        setLoading(false);
        setSuccess("¡Cuenta creada! Revisá tu email para confirmar e iniciá sesión.");
        setMode("login");
        setStep(1);
      }
    };
    setTimeout(tryLogin, 800);
  };

  // ─── GOOGLE ───────────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    const isProd = window.location.hostname !== "localhost";
    const redirectTo = isProd ? "https://cumpleanitos.com" : window.location.origin;
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { 
        redirectTo,
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline'
        }
      },
    });
    if (err) { setError(err.message); setLoading(false); }
  };

  // ─── Step dots component ──────────────────────────────────────────────────────
  const StepDots = ({ current }) => (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 24 }}>
      {[1, 2].map(s => (
        <div key={s} style={{
          height: 6,
          borderRadius: 3,
          background: s === current ? COLORS.primary : COLORS.border,
          width: s === current ? 24 : 6,
          transition: "all 0.3s ease",
        }} />
      ))}
    </div>
  );

  // ─── REGISTER ─────────────────────────────────────────────────────────────────
  if (mode === "register") {
    return (
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "48px 20px" }}>

        {/* ── STEP 1: email + password ── */}
        {step === 1 && (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>🎂</div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: COLORS.text, margin: "0 0 6px" }}>Creá tu cuenta</h1>
              <p style={{ color: COLORS.textLight, margin: 0, fontSize: 14 }}>Solo necesitás email y contraseña</p>
            </div>

            <StepDots current={1} />

            <Card style={{ padding: 28 }}>
              <Alert message={error} type="error" />
              <Alert message={success} type="success" />

              <Button variant="google" size="lg" style={{ width: "100%", marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }} onClick={handleGoogle} disabled={loading}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={18} height={18} alt="" />
                Registrarse con Google
              </Button>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: COLORS.border }} />
                <span style={{ fontSize: 13, color: COLORS.textLight }}>o con email</span>
                <div style={{ flex: 1, height: 1, background: COLORS.border }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                  disabled={loading || !email || !password}
                  onClick={handleStep1}
                >
                  Continuar
                </Button>
              </div>

              <p style={{ textAlign: "center", fontSize: 14, color: COLORS.textLight, marginTop: 16, marginBottom: 0 }}>
                ¿Ya tenés cuenta?{" "}
                <span style={{ color: COLORS.primary, fontWeight: 600, cursor: "pointer" }} onClick={() => switchMode("login")}>
                  Iniciá sesión
                </span>
              </p>
            </Card>
          </>
        )}

        {/* ── STEP 2: personal data ── */}
        {step === 2 && (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: COLORS.text, margin: "0 0 6px" }}>Completá tu perfil</h1>
              <p style={{ color: COLORS.textLight, margin: 0, fontSize: 14 }}>Para que tus amigos te encuentren</p>
            </div>

            <StepDots current={2} />

            <Card style={{ padding: 28 }}>
              <Alert message={error} type="error" />

              {/* Email readonly badge */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 12px", background: COLORS.bg, borderRadius: 8,
                marginBottom: 16, border: "1px solid " + COLORS.border,
              }}>
                <span style={{ color: COLORS.success, fontSize: 16 }}>✓</span>
                <span style={{ fontSize: 13, color: COLORS.textLight, flex: 1 }}>{email}</span>
                <span style={{ fontSize: 11, color: COLORS.primary, fontWeight: 600 }}>Paso 1 ✓</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Input placeholder="Nombre completo" value={name} onChange={setName} />
                <div>
                  <Input
                    placeholder="Nombre de usuario (ej: mariag)"
                    value={username}
                    onChange={v => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  />
                  {username && (
                    <p style={{ fontSize: 11, color: COLORS.textLight, margin: "4px 0 0 2px" }}>
                      cumpleanitos.com/@{username}
                    </p>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: 13, color: COLORS.textLight, display: "block", marginBottom: 4 }}>Fecha de cumpleaños</label>
                  <Input type="date" value={birthday} onChange={setBirthday} />
                </div>

                {birthday && (
                  <div style={{ padding: 10, background: COLORS.primaryLight + "15", borderRadius: 8, fontSize: 13, color: COLORS.text }}>
                    📅 {getAge(birthday)} años · 🎂 Próximo cumple en {getDaysToBirthday(birthday)} días
                  </div>
                )}

                <Input placeholder="Teléfono (ej: +54 9 11 2345 6789)" value={phone} onChange={setPhone} />

                <Button
                  size="lg"
                  style={{ width: "100%", marginTop: 4 }}
                  disabled={loading || !name || !username || !birthday || !phone}
                  onClick={handleRegister}
                >
                  {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
                </Button>
              </div>

              <p style={{
                textAlign: "center", fontSize: 13, color: COLORS.textLight,
                marginTop: 12, marginBottom: 0, cursor: "pointer",
              }}
                onClick={() => { setStep(1); setError(""); }}
              >
                ← Volver al paso anterior
              </p>
            </Card>
          </>
        )}
      </div>
    );
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "48px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>🎂</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: COLORS.text, margin: "0 0 6px" }}>Iniciá sesión</h1>
        <p style={{ color: COLORS.textLight, margin: 0, fontSize: 14 }}>Entrá a tu perfil de cumpleanitos</p>
      </div>

      <Card style={{ padding: 28 }}>
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

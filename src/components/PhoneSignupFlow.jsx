import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { COLORS } from "../utils/constants";

const S = {
  page: { maxWidth: 480, margin: "0 auto", padding: "12px 20px 20px" },
  body: { padding: "0" },
  cta: (disabled) => ({
    width: "100%", padding: 14, borderRadius: 14, border: "none",
    background: disabled ? "#E5E7EB" : `linear-gradient(135deg, ${COLORS.primary}, #6D28D9)`,
    color: disabled ? "#9CA3AF" : "#fff", fontWeight: 700, fontSize: 14,
    cursor: disabled ? "default" : "pointer", fontFamily: "inherit", marginTop: 8,
  }),
  ctaSecondary: {
    width: "100%", padding: 12, borderRadius: 14, border: "1.5px solid #E5E7EB",
    background: "#fff", color: COLORS.text, fontWeight: 600, fontSize: 14,
    cursor: "pointer", fontFamily: "inherit", marginTop: 8,
  },
  label: { fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 },
  input: { width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 16, color: COLORS.text, outline: "none", fontWeight: 600, boxSizing: "border-box", fontFamily: "inherit", marginBottom: 12 },
  inputFocused: { borderColor: COLORS.primary, background: "#FAFAFE" },
  infoBox: { padding: "10px 12px", background: "#EDE9FE", borderRadius: 10, fontSize: 12, color: "#6B7280", display: "flex", gap: 8, lineHeight: 1.5, marginBottom: 12 },
  userCard: { background: "linear-gradient(135deg, #EDE9FE, #DDD6FE)", borderRadius: 12, padding: 12, display: "flex", alignItems: "center", gap: 10, marginBottom: 14 },
  avatar: { width: 40, height: 40, borderRadius: "50%", background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff", fontWeight: 800 },
  title: { fontSize: 18, fontWeight: 800, color: COLORS.text, margin: "0 0 4px" },
  subtitle: { fontSize: 14, color: "#6B7280", margin: "0 0 16px", lineHeight: 1.5 },
  otp: { display: "flex", gap: 6, marginBottom: 14 },
  otpBox: { flex: 1, height: 52, borderRadius: 10, border: "1.5px solid #E5E7EB", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: COLORS.text },
  otpBoxFilled: { borderColor: COLORS.primary, background: "#FAFAFE", color: COLORS.primary },
  divider: { display: "flex", alignItems: "center", gap: 8, margin: "12px 0", color: "#9CA3AF" },
  dividerLine: { flex: 1, height: 1, background: "#E5E7EB" },
  dividerText: { fontSize: 11, fontWeight: 500, color: "#9CA3AF" },
  successIcon: { width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #10B981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 12px", boxShadow: "0 8px 24px rgba(16,185,129,0.35)" },
  errorMsg: { color: "#EF4444", fontSize: 12, marginBottom: 12, padding: "8px 10px", background: "#FEF2F2", borderRadius: 8, fontWeight: 600 },
};

export default function PhoneSignupFlow({ onSuccess, friendPreregisterId, name }) {
  const [internalStep, setInternalStep] = useState("email"); // email, google_password, done — phone/otp aislados temporalmente
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionData, setSessionData] = useState(null); // { user, session } from OTP verify
  const [useFallbackEmail, setUseFallbackEmail] = useState(false);
  const [isFromGoogle, setIsFromGoogle] = useState(false);
  const [email, setEmail] = useState(""); // Para el flujo email directo

  // ──────────────────────────────────────────────────────
  // EMAIL DIRECTO — Crear cuenta con email + password
  // ──────────────────────────────────────────────────────
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    if (password.length < 8) { setError("Mínimo 8 caracteres"); return; }
    setLoading(true);
    setError("");
    try {
      const { data, error: signupErr } = await supabase.auth.signUp({ email, password });
      if (signupErr) throw signupErr;
      const userId = data.user?.id;
      if (!userId) throw new Error("No se pudo crear el usuario");

      const { error: profileErr } = await supabase.from("profiles").upsert({
        id: userId,
        name: name || email.split("@")[0],
        email,
        avatar_url: null,
        bio: null,
        city: null,
      });
      if (profileErr && profileErr.code !== "23505") throw profileErr;

      if (friendPreregisterId) {
        await supabase.from("friend_preregisters")
          .update({ linked_profile_id: userId, status: "validated" })
          .eq("id", friendPreregisterId);
      }

      setInternalStep("done");
      if (onSuccess) onSuccess(userId);
    } catch (err) {
      setError(err.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────
  // Detect Google OAuth session on mount / update
  // ──────────────────────────────────────────────────────
  useEffect(() => {
    const checkGoogleSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user?.app_metadata?.provider === "google") {
        try {
          const userId = session.user.id;
          const googleName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || "Usuario";
          const googleEmail = session.user.email;
          const googleAvatar = session.user.user_metadata?.avatar_url;

          // Upsert profile
          const { error: profileErr } = await supabase.from("profiles").upsert({
            id: userId, name: name || googleName, email: googleEmail,
            avatar_url: googleAvatar, bio: null, city: null,
          });
          if (profileErr && profileErr.code !== "23505") throw profileErr;

          // ── P3 FIX: leer friendPreregisterId de localStorage si no llegó por prop ──
          const savedFriendId = friendPreregisterId || localStorage.getItem("pending_friend_id");
          if (savedFriendId) {
            await supabase.from("friend_preregisters")
              .update({ linked_profile_id: userId, status: "validated" })
              .eq("id", savedFriendId);
            localStorage.removeItem("pending_friend_id");
            localStorage.removeItem("pending_invite_token");
          }

          setSessionData({ user: session.user });
          setIsFromGoogle(true);
          // Mostrar pantalla para agregar contraseña (opcional)
          setInternalStep("set_password_google");
        } catch (err) {
          console.error("Error procesando Google session:", err);
        }
      }
    };
    
    checkGoogleSession();
  }, [friendPreregisterId, name]);

  // ──────────────────────────────────────────────────────
  // STEP 1: Phone — Send OTP
  // ──────────────────────────────────────────────────────
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError("Ingresá un número válido");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Format phone: +54XXXXXXXXXX
      const formattedPhone = `+54${phone.replace(/\D/g, "").slice(-10)}`;
      
      // Intentar con SMS primero
      const { error: err } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });
      
      // Si falla por país no soportado, mostrar mensaje claro
      if (err && err.message && err.message.includes("Unsupported")) {
        setError(
          "⚠️ Validación temporal: usamos Email. Te enviamos un código a tu email."
        );
        setUseFallbackEmail(true);
        // Guardar teléfono pero ir a password step (sin OTP real)
        setSessionData({ user: { id: null, phone: formattedPhone } });
        setInternalStep("password");
        setLoading(false);
        return;
      }
      
      if (err) {
        setError(err.message || "Error al enviar código");
        setLoading(false);
        return;
      }
      setInternalStep("otp");
    } catch (err) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────
  // STEP 2: OTP — Verify code
  // ──────────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    // Auto-focus next box
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Ingresá los 6 dígitos");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formattedPhone = `+54${phone.replace(/\D/g, "").slice(-10)}`;
      const { data, error: err } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otpCode,
        type: "sms",
      });
      if (err) {
        setError(err.message || "Código inválido");
        setLoading(false);
        return;
      }
      // Save session data — { user, session }
      setSessionData(data);
      setInternalStep("password");
    } catch (err) {
      setError(err.message || "Error al verificar");
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────
  // STEP 3: Password (optional) — Create account
  // ──────────────────────────────────────────────────────
  const handlePasswordSkip = async () => {
    // Skip password, create account with OTP only
    await handlePasswordSubmit(true);
  };

  const handlePasswordSubmit = async (skipPassword = false) => {
    if (!skipPassword && password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (!skipPassword && password.length < 8) {
      setError("Mínimo 8 caracteres");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // En fallback email, crear usuario directamente sin OTP verificado
      if (useFallbackEmail) {
        // Sign up con email + password
        const { data, error: signupErr } = await supabase.auth.signUp({
          email: `${phone.replace(/\D/g, "")}@cumpleanitos.temp`,
          password: password || "temp_password_123",
        });
        if (signupErr) throw signupErr;
        
        setSessionData({ user: data.user, session: data.session });
      }

      const userId = sessionData?.user?.id || null;
      const userPhone = sessionData?.user?.phone || phone.replace(/\D/g, "");
      
      if (!userId && !useFallbackEmail) {
        setError("Error: no hay sesión válida");
        return;
      }

      // 1. Update password if provided (y no es fallback)
      if (!useFallbackEmail && !skipPassword && password) {
        const { error: pwdErr } = await supabase.auth.updateUser({
          password: password,
        });
        if (pwdErr) throw pwdErr;
      }

      // 2. Get first letter for avatar
      const avatarLetter = (name || "U").charAt(0).toUpperCase();

      // 3. Create profile record
      const { error: profileErr } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          name: name || "Usuario",
          phone: `+54${userPhone.slice(-10)}`,
          avatar_url: null,
          bio: null,
          city: null,
        });
      if (profileErr && profileErr.code !== "23505") {
        // 23505 = unique constraint (already exists)
        throw profileErr;
      }

      // 4. Link friend_preregister to this user
      if (friendPreregisterId) {
        const { error: linkErr } = await supabase
          .from("friend_preregisters")
          .update({
            linked_profile_id: userId,
            status: "validated",
          })
          .eq("id", friendPreregisterId);
        if (linkErr) throw linkErr;
      }

      // 5. Refresh session and call onSuccess
      if (!useFallbackEmail) {
        await supabase.auth.refreshSession();
      }
      setInternalStep("done");
      if (onSuccess) onSuccess(userId);
    } catch (err) {
      setError(err.message || "Error al crear cuenta");
    } finally {
      setLoading(false);
    }
  };

// ──────────────────────────────────────────────────────
  // GOOGLE OAUTH HANDLERS (must be before renders)
  // ──────────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────
  // GOOGLE OAUTH ─ Sign up with Google
  // ──────────────────────────────────────────────────────
  const handleSetPasswordAfterGoogle = async () => {
    if (password && password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password && password.length < 8) {
      setError("Mínimo 8 caracteres");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      if (password) {
        const { error: pwdErr } = await supabase.auth.updateUser({
          password: password,
        });
        if (pwdErr) throw pwdErr;
      }
      
      setPassword("");
      setConfirmPassword("");
      setInternalStep("done");
      if (onSuccess) onSuccess(sessionData?.user?.id);
    } catch (err) {
      setError(err.message || "Error al guardar contraseña");
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────
  // GOOGLE OAUTH ─ Sign up with Google
  // ──────────────────────────────────────────────────────
  const handleGoogleSignup = async () => {
    setLoading(true);
    setError("");
    try {
      const isProd = window.location.hostname !== "localhost";

      // ── P3 FIX: guardar token del evento antes de que OAuth redirija ──
      if (friendPreregisterId) {
        localStorage.setItem("pending_friend_id", friendPreregisterId);
      }
      // Guardar el token del path actual (/invite/TOKEN)
      const currentToken = window.location.pathname.replace("/invite/", "").replace("/invite", "");
      if (currentToken) {
        localStorage.setItem("pending_invite_token", currentToken);
      }

      const redirectTo = isProd
        ? "https://www.cumpleanitos.com/invite"
        : window.location.origin;

      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account", access_type: "offline" },
        },
      });
      if (err) {
        setError(err.message || "Error al conectar con Google");
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || "Error desconocido");
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────
  // RENDER: STEP 1.5 — Divider / Google Option (Phone step)
  // ──────────────────────────────────────────────────────
  // (Se renderiza en el step="phone" como botón separado)

  // ──────────────────────────────────────────────────────
  // RENDER: STEP 4 — Done (this should not show — handled by parent)
  // ──────────────────────────────────────────────────────

    // ──────────────────────────────────────────────────────
  // RENDER: STEP 1 — Phone input
  // ──────────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────
  // RENDER: STEP EMAIL — Email + password + Google (teléfono aislado)
  // ──────────────────────────────────────────────────────
  if (internalStep === "email") {
    return (
      <div style={S.page}>
        <div style={{ background: "#D1FAE5", borderRadius: 10, padding: "10px 12px", marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>🎉</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>¡Regalo aprobado!</div>
            <div style={{ fontSize: 11, color: "#065F46" }}>Creá tu cuenta para seguir de cerca</div>
          </div>
        </div>

        <h2 style={S.title}>Creá tu cuenta</h2>
        <p style={S.subtitle}>Para activar el regalo necesitás una cuenta en Cumpleanitos</p>

        {/* Google */}
        <button style={{ ...S.ctaSecondary, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 4 }}
          type="button" onClick={handleGoogleSignup} disabled={loading}>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#4285F4", fontFamily: "serif" }}>G</span>
          <span>Continuar con Google</span>
        </button>

        <div style={S.divider}>
          <div style={S.dividerLine} />
          <span style={S.dividerText}>o con email</span>
          <div style={S.dividerLine} />
        </div>

        <form onSubmit={handleEmailSubmit}>
          <label style={S.label}>Email</label>
          <input
            style={S.input}
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <label style={S.label}>Contraseña</label>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <input
              style={{ ...S.input, marginBottom: 0, paddingRight: 40 }}
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <button type="button"
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 14, cursor: "pointer" }}
              onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>

          <div style={{ ...S.infoBox, background: "#EDE9FE" }}>
            <span>🎁</span>
            <span>Tu propuesta de regalo queda vinculada automáticamente a esta cuenta</span>
          </div>

          {error && <div style={S.errorMsg}>{error}</div>}

          <button style={S.cta(loading || !email || !password)} disabled={loading || !email || !password} type="submit">
            {loading ? "Creando cuenta..." : "Crear cuenta →"}
          </button>

          <p style={{ textAlign: "center", fontSize: 10, color: "#9CA3AF", marginTop: 10, lineHeight: 1.5 }}>
            Al registrarte aceptás los <span style={{ color: COLORS.primary, fontWeight: 700 }}>términos y condiciones</span>
          </p>
        </form>
      </div>
    );
  }

  if (internalStep === "phone") {
    return (
      <div style={S.page}>
        <div style={{ background: "#D1FAE5", borderRadius: 10, padding: "10px 12px", marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>🎉</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>¡Regalo aprobado!</div>
            <div style={{ fontSize: 11, color: "#065F46" }}>Creá tu cuenta para seguir de cerca</div>
          </div>
        </div>
        <h2 style={S.title}>Registrate con tu teléfono</h2>
        <p style={S.subtitle}>Te mandamos un código por WhatsApp</p>

        <form onSubmit={handlePhoneSubmit}>
          <label style={S.label}>Tu número de celular</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ padding: "12px 14px", background: "#F3F4F6", borderRadius: 12, border: "1.5px solid #E5E7EB", color: COLORS.text, fontWeight: 600, whiteSpace: "nowrap" }}>
              🇦🇷 +54
            </div>
            <input
              style={{ ...S.input, flex: 1, marginBottom: 0, textAlign: "center", fontSize: 16, fontWeight: 700, letterSpacing: "1px" }}
              inputMode="tel"
              placeholder="11 6784-1234"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div style={S.infoBox}>
            <span>💬</span>
            <span>Te llega un código de 6 dígitos por <strong>WhatsApp</strong>. Sin instalar nada.</span>
          </div>

          {error && <div style={S.errorMsg}>{error}</div>}

          <button style={S.cta(loading)} disabled={loading} type="submit">
            {loading ? "Enviando..." : "Enviar código por WhatsApp →"}
          </button>

          <div style={S.divider}>
            <div style={S.dividerLine} />
            <span style={S.dividerText}>o también podés</span>
            <div style={S.dividerLine} />
          </div>

          <button style={S.ctaSecondary} type="button" onClick={handleGoogleSignup} disabled={loading}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#4285F4" }}>G</span> Continuar con Google
          </button>

          <p style={{ textAlign: "center", fontSize: 10, color: "#9CA3AF", marginTop: 10, lineHeight: 1.5 }}>
            Al registrarte aceptás los <span style={{ color: COLORS.primary, fontWeight: 700 }}>términos y condiciones</span>
          </p>
        </form>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────
  // RENDER: STEP 2 — OTP verification
  // ──────────────────────────────────────────────────────
  if (internalStep === "otp") {
    return (
      <div style={S.page}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📲</div>
          <h2 style={{ ...S.title, textAlign: "center", marginBottom: 4 }}>Revisá tu WhatsApp</h2>
          <p style={{ ...S.subtitle, margin: 0, textAlign: "center" }}>
            Enviamos un código a<br />
            <strong style={{ color: COLORS.text }}>+54 {phone}</strong>
          </p>
        </div>

        <form onSubmit={handleOtpSubmit} style={{ marginTop: 16 }}>
          <label style={{ ...S.label, textAlign: "center" }}>Ingresá los 6 dígitos</label>
          <div style={S.otp}>
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                style={{
                  ...S.otpBox,
                  ...(digit ? S.otpBoxFilled : {}),
                }}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
              />
            ))}
          </div>

          {error && <div style={S.errorMsg}>{error}</div>}

          <button style={S.cta(loading)} disabled={loading || otp.some((d) => !d)} type="submit">
            {loading ? "Verificando..." : "Verificar código"}
          </button>

          <div style={{ textAlign: "center", marginTop: 14 }}>
            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>¿No llegó?</div>
            <div style={{ fontSize: 11, color: COLORS.primary, fontWeight: 700 }}>Reenviar en 0:45</div>
          </div>
          <div style={{ textAlign: "center", marginTop: 6 }}>
            <button
              type="button"
              style={{ fontSize: 11, color: COLORS.primary, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
              onClick={() => setInternalStep("phone")}
            >
              Cambiar número
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────
  // RENDER: STEP 3 — Password (optional)
  // ──────────────────────────────────────────────────────
  if (internalStep === "password") {
    const allMatch = password && password === confirmPassword;
    return (
      <div style={S.page}>
        <div style={S.userCard}>
          <div style={S.avatar}>{(name || "U").charAt(0).toUpperCase()}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.primary }}>{name || "Usuario"}</div>
            <div style={{ fontSize: 11, color: "#6B7280" }}>+54 {phone} ✓ verificado</div>
          </div>
        </div>

        <h2 style={S.title}>Elegí tu contraseña (opcional)</h2>
        <p style={S.subtitle}>Para entrar la próxima vez sin código</p>

        <form onSubmit={(e) => { e.preventDefault(); handlePasswordSubmit(false); }}>
          <label style={S.label}>Contraseña</label>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <input
              style={{ ...S.input, marginBottom: 0, paddingRight: 36 }}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 14, cursor: "pointer" }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>

          <label style={S.label}>Repetir contraseña</label>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <input
              style={{ ...S.input, marginBottom: 0, paddingRight: 36 }}
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repetí la contraseña"
            />
            {allMatch && (
              <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 8, height: 8, background: "#10B981", borderRadius: "50%" }} />
            )}
          </div>

          {allMatch && (
            <div style={{ background: "#F0FDF4", borderRadius: 8, padding: "8px 10px", marginBottom: 12, fontSize: 11, color: "#059669", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              ✓ Las contraseñas coinciden
            </div>
          )}

          {error && <div style={S.errorMsg}>{error}</div>}

          <button style={S.cta(loading)} disabled={loading || !password || !confirmPassword} type="submit">
            {loading ? "Creando..." : "Crear mi cuenta →"}
          </button>

          <button
            type="button"
            style={{ width: "100%", marginTop: 8, background: "none", border: "none", fontSize: 12, color: COLORS.primary, fontWeight: 600, cursor: "pointer" }}
            onClick={handlePasswordSkip}
          >
            Saltar este paso
          </button>

          <p style={{ textAlign: "center", fontSize: 10, color: "#9CA3AF", marginTop: 10 }}>
            También podés usar siempre tu teléfono para entrar
          </p>
        </form>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────
  // RENDER: SET PASSWORD AFTER GOOGLE (Optional)
  // ──────────────────────────────────────────────────────
  if (internalStep === "set_password_google") {
    const googleEmail = sessionData?.user?.email;
    return (
      <div style={S.page}>
        <div style={S.userCard}>
          <div style={S.avatar}>{sessionData?.user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || "G"}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.primary }}>{sessionData?.user?.user_metadata?.full_name || "Usuario"}</div>
            <div style={{ fontSize: 11, color: "#6B7280" }}>{googleEmail} ✓ verificado con Google</div>
          </div>
        </div>

        <h2 style={S.title}>¿Querés agregar contraseña?</h2>
        <p style={S.subtitle}>Opcional. Así podés usar email + contraseña sin Google</p>

        <form onSubmit={(e) => { e.preventDefault(); handleSetPasswordAfterGoogle(); }}>
          <label style={S.label}>Contraseña (opcional)</label>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <input
              style={{ ...S.input, marginBottom: 0, paddingRight: 36 }}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 14, cursor: "pointer" }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>

          {password && (
            <>
              <label style={S.label}>Repetir contraseña</label>
              <div style={{ position: "relative", marginBottom: 12 }}>
                <input
                  style={{ ...S.input, marginBottom: 0, paddingRight: 36 }}
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetí la contraseña"
                />
                {password === confirmPassword && (
                  <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 8, height: 8, background: "#10B981", borderRadius: "50%" }} />
                )}
              </div>
            </>
          )}

          {error && <div style={S.errorMsg}>{error}</div>}

          {password && password === confirmPassword && (
            <button style={S.cta(loading)} disabled={loading} type="submit">
              {loading ? "Guardando..." : "Guardar contraseña →"}
            </button>
          )}

          <button
            type="button"
            style={{ width: "100%", marginTop: 12, background: "none", border: "none", fontSize: 12, color: COLORS.primary, fontWeight: 600, cursor: "pointer" }}
            onClick={() => {
              setInternalStep("done");
              if (onSuccess) onSuccess(sessionData?.user?.id);
            }}
          >
            Continuar sin contraseña
          </button>

          <p style={{ textAlign: "center", fontSize: 10, color: "#9CA3AF", marginTop: 10 }}>
            Siempre podés agregar contraseña después en Configuración
          </p>
        </form>
      </div>
    );
  }


  return null;
}
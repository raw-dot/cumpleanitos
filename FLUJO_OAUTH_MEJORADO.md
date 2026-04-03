# 🔐 Flujo OAuth Mejorado - Especificación

## REGISTRO con Google

### Pantalla 1: AuthPage - Registro
**URL:** `/registro`
**Estado actual:** Ya existe
**Cambio:** Botón "Registrarse con Google" ahora abre **Pantalla 2**

---

### Pantalla 2: Selector de cuenta Google (NUEVA)
**Componente:** `GoogleAccountSelector.jsx`
**Trigger:** Click en "Registrarse con Google"

**UI:**
```
┌─────────────────────────────────────────┐
│  🎂 cumpleanitos                        │
│                                         │
│  Registrarte con Google                 │
│                                         │
│  Elegí la cuenta con la que querés      │
│  registrarte:                           │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  🔐 Continuar con Google          │  │
│  │     (abre selector de Google)     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ← Volver                               │
└─────────────────────────────────────────┘
```

**Acción:** 
- Click → `supabase.auth.signInWithOAuth({ provider: 'google', options: { prompt: 'select_account' } })`
- Esto fuerza a Google a mostrar selector de cuentas

---

### Pantalla 3: Confirmación de datos Google (NUEVA)
**Componente:** `GoogleDataConfirmation.jsx`
**Trigger:** Redirect desde Google después de elegir cuenta

**UI:**
```
┌─────────────────────────────────────────┐
│           [Foto perfil]                 │
│              TR                         │
│                                         │
│  ¡Hola, T RAW!                          │
│                                         │
│  Vamos a usar estos datos de tu        │
│  cuenta de Google:                      │
│                                         │
│  ✅ Nombre: T RAW                       │
│  ✅ Email: eltorodelsur@gmail.com       │
│  ✅ Foto de perfil                      │
│                                         │
│  🔒 Estos datos son seguros y son       │
│     tuyos. No compartimos tu            │
│     información.                        │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Continuar  →                     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ← Cancelar y salir                     │
└─────────────────────────────────────────┘
```

**Acción:**
- Click "Continuar" → Navega a **Pantalla 4**
- Click "Cancelar" → Logout + vuelve a landing

---

### Pantalla 4: Completar perfil (YA EXISTE - mejorar)
**Componente:** `GoogleOnboardingModal.jsx` (renombrar a `CompleteProfilePage.jsx`)
**Trigger:** Después de confirmar datos Google

**UI actual mejorada:**
```
┌─────────────────────────────────────────┐
│  Paso 2 · Completá tu perfil            │
│                                         │
│  [Avatar TR]                            │
│  Bienvenido, T                          │
│  🔗 Registrado con Google               │
│                                         │
│  ✅ T RAW (RAW)         [desde Google]  │
│  ✅ eltorodelsur@gmail.com              │
│                                         │
│  Nombre de usuario                      │
│  ┌───────────────────────────────────┐  │
│  │ eltorodelsur          ✓Disponible │  │
│  └───────────────────────────────────┘  │
│  cumpleanitos.com/@eltorodelsur         │
│                                         │
│  Fecha de cumpleaños *                  │
│  ┌───────────────────────────────────┐  │
│  │ dd/mm/aaaa                        │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Teléfono celular *                     │
│  ┌───────────────────────────────────┐  │
│  │ ej: +54 9 11 2345 6789            │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Crear mi perfil 🎂               │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Cambios:**
- Username auto-generado desde email pero editable
- Validación en tiempo real de username disponible
- Después de guardar → redirige a landing/dashboard

---

## LOGIN con Google

### Pantalla 1: AuthPage - Login
**URL:** `/login`
**Estado actual:** Ya existe
**Cambio:** Botón "Continuar con Google" ahora abre **Pantalla 2**

---

### Pantalla 2: Selector de cuenta Google (REUTILIZAR)
**Componente:** `GoogleAccountSelector.jsx` (mismo que registro)
**Trigger:** Click en "Continuar con Google"

**UI:**
```
┌─────────────────────────────────────────┐
│  🎂 cumpleanitos                        │
│                                         │
│  Iniciar sesión con Google              │
│                                         │
│  ¿Con qué cuenta querés ingresar?       │
│  Podés elegir otra cuenta si querés.    │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  🔐 Continuar con Google          │  │
│  │     (abre selector de Google)     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ← Volver                               │
└─────────────────────────────────────────┘
```

**Acción:**
- Click → `supabase.auth.signInWithOAuth({ provider: 'google', options: { prompt: 'select_account' } })`
- Después del redirect → **Login directo** (sin confirmación ni onboarding)

---

## Implementación técnica

### Nuevos archivos a crear:

1. **`src/pages/GoogleAccountSelector.jsx`**
   - Pantalla previa al OAuth
   - Botón que trigger OAuth con `prompt: 'select_account'`

2. **`src/pages/GoogleDataConfirmation.jsx`**
   - Muestra datos de Google (foto, nombre, email)
   - Botón "Continuar" → guarda flag en localStorage
   - Redirige a onboarding

3. **Refactor `GoogleOnboardingModal.jsx` → `CompleteProfilePage.jsx`**
   - Convertir de modal a página completa
   - Username editable con validación real-time
   - Mejor UX mobile-first

### Rutas nuevas:

```javascript
/registro/google-selector       // GoogleAccountSelector (modo registro)
/registro/confirmar-datos       // GoogleDataConfirmation
/registro/completar-perfil      // CompleteProfilePage

/login/google-selector          // GoogleAccountSelector (modo login)
```

### Flow de estados:

```javascript
// Registro
localStorage.setItem('oauth_flow', 'register')
→ Google OAuth
→ Redirect a /registro/confirmar-datos
→ Confirmar datos
→ /registro/completar-perfil
→ Dashboard

// Login
localStorage.setItem('oauth_flow', 'login')
→ Google OAuth
→ Redirect directo a Dashboard
```

---

## Próximos pasos

1. **Mockup visual** - ¿Querés que te haga un HTML interactivo para ver cómo queda?
2. **Implementación** - Crear los 3 componentes nuevos
3. **Testing** - Probar flujo completo registro + login


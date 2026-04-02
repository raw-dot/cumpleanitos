# 📅 Changelog 31 Marzo - 1 Abril 2026 (hasta 18:55hs cuando funcionaba)

## 31 Marzo 2026

### 1. **172b7b7** - fix: Google OAuth redirectTo apunta a cumpleanitos.com en producción
- **Timestamp:** 22:02:55
- **Pedido del usuario:** Arreglar redirect de Google OAuth para producción
- **Qué hizo:** Cambió redirectTo de localhost a cumpleanitos.com
- **Archivos:** src/pages/AuthPage.jsx
- **Estado:** ✅ Google OAuth funcionando

### 2. **daf2823** - feat: auto-generar username desde nombre de Google
- **Timestamp:** 22:14:25
- **Pedido del usuario:** Generar username automáticamente desde el nombre de Google
- **Qué hizo:** 
  - Mejorar username auto-generado desde metadata de Google
  - Si username es "user_xxx", reemplazarlo con nombre real
  - Normalizar caracteres especiales
- **Archivos:** src/App.jsx (función loadProfile)
- **Estado:** ✅ Funcionando

### 3. **99ddad2** - feat: popup onboarding para nuevos usuarios de Google
- **Timestamp:** 22:22:27
- **Pedido del usuario:** Crear popup de onboarding para completar datos después de Google OAuth
- **Qué hizo:**
  - Creó GoogleOnboardingModal.jsx
  - Detecta usuarios nuevos de Google (username "user_xxx" + sin birthday/phone)
  - Pide teléfono y cumpleaños
  - Username auto-sugerido desde email
- **Archivos:** 
  - src/components/ui/GoogleOnboardingModal.jsx (nuevo)
  - src/App.jsx (lógica de detección)
- **Estado:** ✅ Funcionando

### 4. **1935edf** - feat: agregar botón Registrarse con Google
- **Timestamp:** 22:24:15
- **Pedido del usuario:** Agregar botón de Google en pantalla de registro
- **Qué hizo:** Agregó botón "Registrarse con Google" en AuthPage
- **Archivos:** src/pages/AuthPage.jsx
- **Estado:** ✅ Funcionando

### 5. **54ad46f** - feat: autocomplete ML con API oficial
- **Timestamp:** 22:33:42
- **Pedido del usuario:** Implementar autocomplete de productos de MercadoLibre
- **Qué hizo:**
  - Autocomplete con API oficial de ML
  - Selector de fotos de producto
  - Preview validable antes de guardar
- **Archivos:** WishListPage.jsx, CelebrantDashboard.jsx
- **Estado:** ✅ Funcionando

### 6. **8787cf3** - fix: app no se cuelga al cargar perfil + autocomplete ML via proxy
- **Timestamp:** 22:38:11
- **Pedido del usuario:** Arreglar que app se cuelga + CORS en autocomplete ML
- **Qué hizo:**
  - Timeout de seguridad en loadProfile
  - Autocomplete ML via proxy CORS
- **Archivos:** App.jsx, WishListPage.jsx
- **Estado:** ✅ Funcionando

### 7. **6b0900b** - fix: fetchProductMeta usa Microlink correctamente
- **Timestamp:** 22:41:09
- **Pedido del usuario:** Arreglar parseo de metadata de productos ML
- **Qué hizo:**
  - Microlink para extraer título y precio
  - Parseo correcto de respuesta
- **Archivos:** WishListPage.jsx, CelebrantDashboard.jsx
- **Estado:** ✅ Funcionando

### 8. **9fbf18d** - fix: feedback inline debajo de URL
- **Timestamp:** 22:45:23
- **Pedido del usuario:** Mejor feedback visual al pegar URL de ML
- **Qué hizo:**
  - Feedback inline debajo del input
  - Manejo de errores explícito
- **Archivos:** WishListPage.jsx, CelebrantDashboard.jsx
- **Estado:** ✅ Funcionando

### 9. **e72c020** - fix: app no se cuelga por sesión expirada
- **Timestamp:** 23:07:27
- **Pedido del usuario:** Arreglar que app se cuelga cuando expira token
- **Qué hizo:**
  - Timeouts de seguridad en todos los flujos
  - Manejar evento TOKEN_REFRESHED
  - Evitar loops infinitos
- **Archivos:** App.jsx
- **Estado:** ✅ Funcionando

### 10. **cf4b91a** - fix: hasCampaign null resuelto en 4s máximo
- **Timestamp:** 23:10:35
- **Pedido del usuario:** Que hasCampaign no quede en null indefinidamente
- **Qué hizo:**
  - Timeout de 4s para resolver hasCampaign
  - Fallback a false si tarda mucho
- **Archivos:** App.jsx
- **Estado:** ✅ Funcionando

---

## 1 Abril 2026 (antes de 18:55hs - FUNCIONANDO)

### 11. **2da6893** - feat: email como campo core
- **Timestamp:** (antes de 18:55)
- **Pedido del usuario:** Email editable por usuario y admin
- **Qué hizo:**
  - ⚠️ **CRÍTICO:** Ejecutó migration-email-core.sql
  - Agregó columna email a profiles
  - **PROBLEMA:** Creó trigger sync_email_on_signup() que solo hace UPDATE
  - Reemplazó trigger anterior que creaba profiles
- **Archivos:** 
  - migrations/migration-email-core.sql
  - migrations/migration-admin-users.sql
  - AdminPage.jsx
- **Estado:** ✅ OAuth aún funcionaba pero trigger ya estaba roto

### 12-17. Varios fixes de AdminPage
- **Timestamps:** Entre 2da6893 y 84cbebb
- **Pedidos:** Ajustes en panel admin, emails, logs
- **Estado:** Solo frontend, no afectaron OAuth

### 18. **84cbebb** - feat: Papelera de reciclaje
- **Timestamp:** Pre-18:55hs (ÚLTIMO FUNCIONANDO ✅)
- **Pedido del usuario:** Soft delete de regalos con papelera
- **Qué hizo:** Sistema de soft delete con recuperación
- **Archivos:** ManageGiftsPage.jsx, etc
- **Estado:** ✅ Google OAuth funcionando

---

## 🎯 Resumen de pedidos del usuario (31 marzo):

1. ✅ Arreglar Google OAuth redirect a producción
2. ✅ Auto-generar username desde Google
3. ✅ Popup onboarding para completar datos post-Google
4. ✅ Botón de Google en registro
5. ✅ Autocomplete de productos ML
6. ✅ Arreglar app colgada + CORS
7. ✅ Parseo correcto de productos ML
8. ✅ Feedback visual mejor
9. ✅ Arreglar sesión expirada
10. ✅ Timeout para hasCampaign

**Todos completados exitosamente** - Google OAuth funcionando perfectamente al final del día.

---

## ⚠️ Commit sospechoso:

**2da6893** (1 abril) ejecutó SQL que reemplazó el trigger de creación de profiles.
Aunque OAuth seguía funcionando después de este commit, el trigger ya estaba roto.
El error solo se manifestó después cuando se intentó usar.


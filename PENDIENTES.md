# 📋 Pendientes cumpleanitos.com
**Última actualización:** 07-abr-2026 | **Versión actual:** v0.13

---

## 🔴 Panel de Control — Pendientes del hilo actual

### 1. Actividad reciente dashboard — foto/video en tarjeta de aporte
La tarjeta de actividad reciente muestra texto pero no foto/video del aporte emocional.

### 2. Moderación — columnas emotional_foto_url / emotional_video_url en DB
Las columnas existen en el código pero no en la tabla contributions de Supabase.
**SQL a correr en Supabase SQL Editor:**
```sql
ALTER TABLE contributions
ADD COLUMN IF NOT EXISTS emotional_foto_url TEXT,
ADD COLUMN IF NOT EXISTS emotional_video_url TEXT;
```
Sin esto, badges 📷/🎬 y previews en moderación no aparecen.

### 3. Cámara notebook — sigue sin funcionar en algunos casos
`getUserMedia` puede devolver `NotReadableError` si otra app tiene la cámara.
El overlay está implementado pero el mensaje es genérico.

### 4. Eliminar cuenta — Hard Delete
Ver detalle en versión anterior. Requiere Supabase Edge Function con service_role.

---

## 🟡 Próxima Feature Principal

### 🔵 Integración MercadoPago
**Estado:** Pendiente — hilo nuevo
**El paso 2 del formulario de regalo actualmente muestra el alias manual.**
**Reemplazar por:** botón de pago MP que genere una preference y redirija al checkout.

**Flujo esperado:**
1. Usuario elige monto → paso 2 (mensaje emocional)
2. Botón "Pagar con MercadoPago" → llamada a backend → preference_id
3. Redirect a MP checkout
4. Webhook MP → marcar contribution como pagada
5. Vuelta al sitio con éxito/error

**Credenciales necesarias:** Access token MP (pedir a RAW)
**Backend:** Edge Function en Supabase o Vercel

---


## 🔵 Integración Mercado Pago — Estado actual (v0.14)

### ✅ Completado
- 5 tablas MP creadas en Supabase: mp_connections, mp_orders, mp_transactions, mp_commissions, mp_webhook_logs
- API routes: mp-oauth-callback, mp-create-preference, mp-webhook, mp-admin-connect
- Frontend: MPConnectButton, MPOAuthCallbackPage, MPPaymentResultPage, useMPConnection hook
- Rutas: /oauth/mp/callback, /pago/exito, /pago/pendiente, /pago/error
- Paso 2 del formulario ProfilePage reemplaza alias manual por botón "Pagar con MP"
- Webhook configurado en MP (modo prueba y producción)
- Variables de entorno cargadas en Vercel test y prod
- Comisión 10% configurada

### 🔴 Pendiente para producción
1. **OAuth MP no aprobado** — La app "Cumpleanitos Test" no tiene aprobación de MP para OAuth con cuentas reales. Necesita:
   - Tramitar aprobación de la app en MP developers (proceso manual de MP)
   - O usar flujo alternativo sin OAuth (insertar token manualmente vía SQL como workaround)

2. **Conectar cuenta real del cumpleañero en prod** — Una vez aprobado OAuth, conectar cuenta de tororaw@gmail.com desde cumpleanitos.com/configuracion

3. **Webhook productivo** — Configurar en MP → Webhooks → Modo productivo → https://cumpleanitos.com/api/mp-webhook

4. **Prueba end-to-end real** — El sandbox de MP es inestable. Probar con pago real mínimo ($100 ARS) en producción una vez que OAuth esté aprobado.

5. **Credenciales productivas MP** — Access Token productivo ya cargado en Vercel prod como MP_ACCESS_TOKEN


---

## 🟢 Baja Prioridad

### Admin papelera usuarios eliminados
### Optimizar bundle size (> 500 KB warning)
### Compilado automático de cumpleaños (video slideshow)

---

## ✅ Completado en este hilo (v0.12 → v0.13)

- ✅ v0.12: Formulario regalo emocional (foto/video/mensaje) — 2 pasos
- ✅ v0.12: Cámara desktop con getUserMedia
- ✅ v0.12: Upload a Supabase Storage (bucket cumple-images/emotional/)
- ✅ v0.12: Moderación reescrita con tarjetas filtrables clicables
- ✅ v0.12: AdminRegalosPage columna miniatura foto/video
- ✅ v0.12: UserModal dashboard muestra campaña activa
- ✅ v0.12: Freeze de páginas admin resuelto
- ✅ v0.13: Stats "Regalé" con datos reales (gifter_id)
- ✅ v0.13: GiftsGivenPage con datos reales de Supabase

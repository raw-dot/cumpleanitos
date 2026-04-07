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

# 📊 Historial de Versiones - Cumpleanitos.com

## Formato de Versiones
- **MAJOR.MINOR.PATCH** (ej: 1.2.3)
- **MAJOR**: Cambios que rompen compatibilidad o features grandes
- **MINOR**: Nuevas features sin romper compatibilidad
- **PATCH**: Fixes y mejoras menores

---

## 🗓️ Marzo - Abril 2026

| Versión | Fecha | Commit | Pedido Usuario | Descripción Técnica | Estado | Observaciones |
|---------|-------|--------|----------------|---------------------|--------|---------------|
| **0.12.7** | 07-abr | fcdac98 | Fix cámara notebook + moderación + regalos + usermodal | (1) Cámara: video siempre montado en DOM — error se muestra como overlay encima del elemento video, no desmontándolo. Fallback a video:true si facingMode falla. (2) Moderación: query con r1.data || [] seguro, no crashea si Supabase devuelve error. (3) Regalos drawer: muestra emotional_foto_url y emotional_video_url. (4) UserModal dashboard: busca campaña activa del usuario y muestra imagen + meta + fecha. | ✅ OK | "se cuelga todo, camara no funciona, moderacion vacia, foto en regalos" |
| **0.12.6** | 07-abr | 1dab077 | Flujo regalo simplificado + fixes múltiples | (1) facingMode:ideal en getUserMedia — cámara de notebook funciona con cámara frontal. (2) Formulario regalo: 4 pasos → 2 pasos. Paso 1: monto + nombre (solo si no logueado) + anónimo. Paso 2: mensaje/foto/video + alias + confirmar. Teléfono eliminado. Paso 4 eliminado. (3) Moderación: query sin columnas inexistentes, filtra correctamente. (4) AdminCumpleanosPage: manejo de error en queries, no más freeze. | ✅ OK | "camara notebook no funciona, 2 pasos, sin telefono, moderacion, freeze" |
| **0.12.5** | 07-abr | f5fdd75 | Fix bucket Storage para fotos/videos emocionales | Cambiado bucket de emotional-media (no existía) a cumple-images/emotional/ (ya existe y funciona con policies correctas). Mismo patrón que avatars y covers. Las fotos/videos adjuntos en regalos ahora se suben correctamente y la URL pública persiste en la DB para moderación. | ✅ OK | "revisa como hiciste para crear la que hiciste para que si funcione" |
| **0.12.4** | 07-abr | 4ac6e85 | Cámara desktop con getUserMedia | Tab Sacar foto: en desktop usa navigator.mediaDevices.getUserMedia() con video live en <video> y botón Capturar foto que extrae el frame via canvas → File. En mobile sigue usando input capture=environment (más confiable en Safari iOS). Muestra error con botón Reintentar si no hay permisos. | ✅ OK | "en desktop deberia acceder a la camara de la maquina y que funcione" |
| **0.13** | 07-abr | df984bc | Vercel Analytics | Instalado @vercel/analytics/react e integrado en main.jsx para trackear page views y eventos en producción. | ✅ OK | "Agregar el analytics de vercel en cumpleanitos.com" |
| **0.12.3** | 07-abr | 1823076 | Fix sacar foto + preview paso 4 + Supabase Storage | (1) Bug raíz "sacar foto": DropZone definido dentro de FotoModal causaba remount en cada render, el inputRef se perdía. Inputs ahora al nivel del modal, siempre montados. (2) Paso 4 muestra preview real de foto/video adjunto. (3) Upload a Supabase Storage bucket emotional-media, storageUrl persistente guardada en contributions. Fallback a previewUrl si el bucket no existe. | ✅ OK | "no anda sacar foto, preview en paso 4, ver en moderacion" |
| **0.12.2** | 07-abr | 752ae40 | Fix cámara desktop + freeze + moderación media | (1) capture=environment solo en mobile via maxTouchPoints; tab Grabar muestra 📂 en desktop. (2) loadData() envuelto en try/finally, página nunca se cuelga. (3) columnas emotional_foto_url/video_url en contributions; moderación muestra sección Con foto o video con previews inline y botón Borrar media. | ✅ OK | "camara desktop no funciona, se cuelga la pagina, moderar mensajes con contenido visual" |
| **0.12.1** | 07-abr | b3df342 | Fix upload foto/video + procesando infinito | UploadZone era decorativa sin input real. Reescrito EmotionalStep con input type=file funcional, capture=environment para cámara, lectura de duración real de video, validaciones de tipo/tamaño. submitContribution envuelto en try/finally para que setSubmitting(false) siempre se ejecute. | ✅ OK | "No permite subir fotos y videos, no funciona. Se queda procesando" |
| **0.12** | 07-abr | 91ae288 | Regalo emocional con foto/video | Formulario de regalo refactorizado en 4 pasos: monto, datos, mensaje especial (EmotionalStep.jsx con modal foto + modal video + trimmer interactivo), confirmar. Responsive mobile/desktop. Texto emocional se guarda en contributions.message. | ✅ OK | "Agregar esta funcionalidad a la parte de regalo" + "Implementemos las dos soluciones, la mobile y la desktop" |
| **0.1** | 31-mar 22:02 | 172b7b7 | OAuth Google a producción | `redirectTo` cumpleanitos.com | ✅ OK | "siendo que cumpleanitos tiene para poder registrarse, me gustaria hacer andar que se registre con google acount" |
| **0.2** | 31-mar 22:14 | daf2823 | Username desde Google | `loadProfile()` genera username desde metadata | ✅ OK | Mejora auto-generación username |
| **0.3** | 31-mar 22:22 | 99ddad2 | Onboarding Google | `GoogleOnboardingModal.jsx` - teléfono/cumple | ✅ OK | Modal post-OAuth completar datos |
| **0.4** | 31-mar 22:24 | 1935edf | Botón Google en registro | Botón OAuth en `AuthPage.jsx` | ✅ OK | Agregar botón registro Google |
| **0.5** | 31-mar 22:33 | 54ad46f | Autocomplete ML | API oficial ML + selector fotos | ✅ OK | "Implementar autocomplete productos MercadoLibre" |
| **0.5.1** | 31-mar 22:38 | 8787cf3 | Fix: app cuelga + CORS | Timeout `loadProfile` + proxy CORS | ✅ OK | "Arreglar app se cuelga + CORS autocomplete" |
| **0.5.2** | 31-mar 22:41 | 6b0900b | Fix: parseo ML | Microlink extrae título/precio | ✅ OK | "Arreglar parseo metadata productos ML" |
| **0.5.3** | 31-mar 22:45 | 9fbf18d | Feedback visual URL | Inline + manejo errores | ✅ OK | "Mejor feedback al pegar URL ML" |
| **0.6** | 31-mar 23:07 | e72c020 | Fix: sesión expirada | Timeouts + `TOKEN_REFRESHED` | ✅ OK | "Arreglar app cuelga cuando expira token" |
| **0.6.1** | 31-mar 23:10 | cf4b91a | Fix: hasCampaign null | Timeout 4s fallback false | ✅ OK | "hasCampaign no quede en null" |
| **0.7** | 01-abr | 2da6893 | Email editable | `migration-email-core.sql` | ⚠️ Trigger roto | Ejecutó SQL que ROMPIÓ trigger creación profiles |
| **0.7.1** | 01-abr | 66d9e96 | Admin email contacto | `AdminPage.jsx` UI | ✅ OK | Ajustes panel admin |
| **0.7.2** | 01-abr | 61dd5b6 | Debug logs admin | Logs `AdminPage.jsx` | ✅ OK | Debugging admin |
| **0.7.3** | 01-abr | 3d7d821 | Revert AdminPage | Revert cambios | ✅ OK | Revertir cambios admin |
| **0.7.4** | 01-abr | ca06836 | Select directo | Query directa vs RPC | ✅ OK | Cambio consultas admin |
| **0.8** | 01-abr | c1fac9e | FASE 1 admin | Eliminar + acciones lote | ✅ OK | Panel admin completo |
| **0.8.1** | 01-abr | a2ff6c2 | Fix modal deleteUser | UI fix cerrar modal | ✅ OK | Fix UX eliminación |
| **0.9** | 01-abr | 84cbebb | Papelera reciclaje | Soft delete 7 días | ✅ **ÚLTIMO OK** | "Soft delete regalos papelera" - FUNCIONABA |
| **0.10** | 01-abr 22:49 | b9edcea | Registro 2 pasos | Split `AuthPage.jsx` | ❌ **ROMPIÓ OAUTH** | "Necesito arreglemos registro google, lo rompiste" |
| **0.11** | 01-abr | 4857188 | Eliminar cuenta | Settings eliminar cuenta | ✅ OK | Feature eliminar cuenta |
| **0.10.1** | 02-abr | 0f4d111 | Fix: CompleteProfilePage | `CompleteProfilePage.jsx` | ❌ No arregló | "arreglemos registro google" - Intento 1 FALLÓ |
| **0.10.2** | 02-abr | 05dce81 | Versionado SQLs | Carpeta `/migrations` | ✅ OK | "scripts BD versionados en github" |
| **0.10.3** | 02-abr | 7b086bf | GitHub Action SQLs | `run-migration.yml` | ✅ OK | "VAMOS CON OPCION 2" - Action ejecutar SQLs |
| **0.10.3.1** | 02-abr | 8f242fe | Fix ES modules | `.mjs` + import | ✅ OK | Fix error GitHub Action |
| **0.10.4** | 02-abr | f362f1b | Script diagnóstico | `diagnostic-google-oauth.sql` | ✅ OK | SQL diagnóstico OAuth |
| **0.10.5** | 02-abr | 5b25cff | Fix trigger v1 | Trigger simplificado | ❌ No arregló | "resolvamos login sigue roto" - Intento 2 FALLÓ |
| **0.10.6** | 02-abr | 3026950 | Fix trigger v2 | Campos obligatorios | ❌ No arregló | "listo ahi se ve resultado" - Intento 3 FALLÓ |
| **0.10.7** | 02-abr | 6926b9e | Fix trigger v3 | Bypass RLS | ❌ No arregló | "Sigue dando error" - Intento 4 FALLÓ |
| **0.10.8** | 02-abr | 38c481a | Docs changelogs | Changelogs debugging | 📄 Docs | "volcalo en tabla, versionada" |
| **0.10.9** | 02-abr | 9b6801d | Fix OAuth con retry logic | Retry 3x500ms en loadProfile espera trigger | ✅ TESTING | "no funciono" - trigger OK, app esperaba antes que profile exista |
| **0.10.10** | 03-abr | 5981bff | Fix freeze al volver | `setLoading(false)` en `TOKEN_REFRESHED` | ✅ OK | "necesito que resolvamos este bug, cuando uno se cambia de ventana o se queda un rato, despues un rato se cuelga y hay que refrescar la pagina para que funcione" |

---

## 📈 Resumen por Estado

| Estado | Count | Versiones |
|--------|-------|-----------|
| ✅ Funcionando | 22 | 0.1 - 0.9, 0.11, 0.10.2 - 0.10.4 |
| ❌ Roto / No arregló | 5 | 0.10, 0.10.1, 0.10.5, 0.10.6, 0.10.7 |
| ⚠️ Trigger roto (pero funcionaba) | 1 | 0.7 |
| 📄 Documentación | 1 | 0.10.8 |

---

## 🔴 Issues Activos

### Issue #1: Google OAuth no funciona
- **Desde:** v0.10 (commit b9edcea, 01-abr 22:49)
- **Error:** "Database error saving new user"
- **Causa raíz:** Trigger `sync_email_on_signup()` (v0.7) reemplazó trigger que creaba profiles
- **Intentos de fix:** v0.10.1, v0.10.5, v0.10.6, v0.10.7 - **todos fallidos**
- **Estado:** ❌ SIN RESOLVER
- **Última versión funcional:** v0.9 (commit 84cbebb)

---

## 📝 Notas

- **Versionado semántico:** Iniciado desde v0.1 (31-marzo-2026)
- **Sistema de patches:** `.1`, `.2`, etc para iteraciones sobre mismo tema
- **Commits de fix:** Se numeran consecutivamente (0.10.1, 0.10.2, etc)
- **Branch:** `main` (producción continua)
- **Deploy:** Vercel automático en cada push

---

**Última actualización:** 03 April 2026, 15:07 UTC
| **0.10.11** | 02-abr | d044384 | Test OAuth minimalista | Página diagnóstico test-oauth.html | 📄 Debug | Diagnóstico OAuth |
| **0.11** | 02-abr | 97290b3 | OAuth Google OK | Reset Google Console + Supabase + disable triggers + app crea profiles | ✅ **FUNCIONA** | "ahora si parece que funciono!" - OAuth 100% operativo |
| **0.11.1** | 03-apr | cdd25ac | Fix alias JSON + nombre navbar | getRealAlias() en ProfilePage/MyProfilePage + nombre usuario desktop navbar | ✅ OK | "ahora quiero arreglar este bug de frontend que aparece en el alias" + "me gustaria que al lado de la foto de usuario, en la version desktop diga el nombre del usuario" |

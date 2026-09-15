# AURAFARM2 — Punto de retoma (resumen de sesión)

**Última actualización**: 2026-09-11

> Las sesiones de opencode se guardan automáticamente en `~/.local/share/opencode/opencode.db`.
> Si quieres retomar, abre opencode en `/home/guiarolfo/AURAFARM2` y continúa; o usa este documento.

## Objetivo
Publicar AuraFARM (PWA → TWA Android) en Google Play Store. Hosting web en Cloudflare Pages gratis (`https://aurafarm-1e1.pages.dev`). Fee único $25 USD ya pagado. Sin otros costos.

## Estado actual
- **Última sesión (2026-09-14) AAB nuevo generado y verificado** : `build local bubblewrap 1.25 + JDK 17 (Temurin ~/.bubblewrap/jdk/jdk-17.0.11)` + Android SDK (`~/Android/Sdk`, build-tools 36.1.0, platform android-36).
- Web desplegada en producción: `https://aurafarm-1e1.pages.dev` (Cloudflare Pages, main).
- TWA → `io.github.guiarolfo_afk.twa`, apunta a `https://aurafarm-1e1.pages.dev`.
- **Nuevo AAB firmado**: `/home/guiarolfo/AURA/AURAFARM2/app-release-bundle.aab` (v2.2.0, versionCode 4) + APK `app-release-signed.apk`. Firmado con `AuraFARM - Google Play package/signing.keystore` → SHA1 `B6:72:27:...` (la **única** que Play acepta). **NO usar** el keystore de `AURAFARM 2.1/` (SHA1 `2F:F3:D7` = el del `.bak-wrongsig`).
- AAB anterior `1.0.0.0` en **Internal testing** (Play Console). Fingerprint de App Signing **válido** `3A:39:AB:...` en `assetlinks.json` (los otros fingerprints eran incorrectos, no usar).

## Build local del AAB (comandos)
- Setup (una vez): `npm i -g @bubblewrap/cli`; JDK 17 en `~/.bubblewrap/jdk/jdk-17.0.11`; SDK en `~/Android/Sdk`; config en `~/.bubblewrap/config.json` (`jdkPath` + `androidSdkPath`).
- Regenerar proyecto + checksum (sin prompts): `node /tmp/opencode/scaffold-twa.js` (usa el core de bubblewrap directo; requiere `appVersion` + `enableNotifications` + `iconUrl` en el manifest, si no el template queda roto).
- Build: `BUBBLEWRAP_KEYSTORE_PASSWORD=<pass> BUBBLEWRAP_KEY_PASSWORD=<pass> bubblewrap build` (passwords por env = sin prompts). Salidas: `app-release-bundle.aab` y `app-release-signed.apk`.
- Ojo: en `AURAFARM2` había un archivo `build` (0 bytes) que rompía Gradle (`Could not create problems-report directory`); eliminado.
- El proyecto Android generado (`app/`, `build.gradle`, `gradlew`, etc.) queda en la raíz; es artefacto local, no commitear.

## Funcionalidades implementadas y desplegadas en esta sesión (2026-09-11)

### 1. CTA de Testers (reclutamiento público)
- **AuthScreen.tsx**: Sección completa antes de "Entrar sin registro" — la ven **todos los visitantes no autenticados**.
- **LiveBoard.tsx**: Banner compacto al inicio de "En Vivo" — la ven **usuarios autenticados/invitados**.
- Componente `TesterCTA.tsx` con dos variantes: completa (3 pasos + botones grandes) y compacta (badge + 2 botones).
- i18n en 4 idiomas: `tester_badge`, `tester_title`, `tester_sub`, `tester_step1-3`, `tester_btn_join`, `tester_btn_install`, `tester_note`.
- Enlaces: Tester `https://play.google.com/apps/testing/io.github.guiarolfo_afk.twa` + Play Store `https://play.google.com/store/apps/details?id=io.github.guiarolfo_afk.twa`.

### 2. Migración `features` en Supabase ✅ EJECUTADA
- SQL: `alter table public.events add column if not exists features text[] default '{}';` (idempotente).
- `createEvent` ahora guarda `features` correctamente; `PublicEventView` muestra píldoras traducidas.

### 3. Verificación completa de lógica de datos (typecheck ✅ PASS)
- Auto-finalizar eventos pasados (`tick` + `loadEventsFromSupabase` con `isEventPast`).
- Votación dual: logged-in (`votes` FK) + anónimos (`public_votes`) con merge en `fetchVoteTallies`.
- Límite 100 votos/día con reset automático por fecha.
- Retos/racha/aura con persistencia en `profiles`.
- Realtime votes via canal `votes-realtime` (INSERT en `votes` + `public_votes`).
- Inscripción persistida entre dispositivos (`event_participants` → `myAttendance`).

## Funcionalidades previas (2026-09-07 y 2026-09-05)
- Compartir fix + vista pública `#/e/:id` con características.
- Búsqueda por país/ciudad/evento/dirección (4 idiomas).
- Iconos PWA v2 (fondo sólido, rutas versionadas `icons/v2/`).
- Filtro por provincia, mapa con pines, barra de votación responsive.

## ⚠️ Próximos pasos (en orden)
1. **Probar en dispositivo desde Play Console (Internal testing)** → verificar TWA fullscreen, login Google, crear evento con features, vista pública `#/e/:id`.
2. **Completar requisitos de Play** (content rating, data safety, store listing, producción) — manual, en Play Console.
3. **Publicar release a producción** cuando el usuario lo pida (NO desplegar sin confirmación).

## Datos técnicos clave
- Build raíz limpia (`dist/` para Cloudflare):
  `DEPLOY_ROOT=true npm run build && npx -y wrangler@3 pages deploy dist --project-name aurafarm --branch=main --commit-dirty=true`
- Build normal (GitHub Pages → `docs/`): `npm run build`.
- i18n: diccionario inline en `src/i18n.ts` con **4 idiomas** (es, pt, fr, en). Cualquier texto nuevo debe ir en las 4.
- Keystore/credenciales: `/home/guiarolfo/AuraFARM - Google Play package/` (no exponer).
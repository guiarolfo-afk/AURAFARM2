# AURAFARM2 — Punto de retoma (resumen de sesión)

**Última actualización**: 2026-09-07

> Las sesiones de opencode se guardan automáticamente en `~/.local/share/opencode/opencode.db`.
> Si quieres retomar, abre opencode en `/home/guiarolfo/AURAFARM2` y continúa; o usa este documento.

## Objetivo
Publicar AuraFARM (PWA → TWA Android) en Google Play Store. Hosting web en Cloudflare Pages gratis (`https://aurafarm-1e1.pages.dev`). Fee único $25 USD ya pagado. Sin otros costos.

## Estado actual
- **Última sesión (2026-09-07) desplegada en producción** : `https://aurafarm-1e1.pages.dev` (Cloudflare Pages, main).
- TWA → `io.github.guiarolfo_afk.twa`, apunta a `https://aurafarm-1e1.pages.dev`.
- AAB `1.0.0.0` en **Internal testing** (Play Console). Fingerprint de App Signing **válido** `3A:39:AB:...` en `assetlinks.json` (los otros fingerprints eran incorrectos, no usar).

## Funcionalidades implementadas y desplegadas en esta sesión (2026-09-07)

### 1. Compartir (fix + mejora)
- Pestaña **En Vivo → Compartir**: copia SOLO el enlace de la app (pantalla principal). Antes generaba `#/e/` con id vacío (evento inexistente) o compartía un próximo evento mostrándolo "EN VIVO". (`LiveBoard.tsx`)
- **Vista pública de evento `#/e/:id`** (`PublicEventView.tsx`): nueva tarjeta de info con **dirección, fecha/hora, inscritos `X/max`, asistentes, organizador** y **características** (píldoras `t_stream/t_prize/t_food/...`). El share nativo incluye esos datos.
- `store.ts`: `createEvent` guarda `features`; `loadEventsFromSupabase` lee `features` (columna nueva) y **carga los perfiles de los organizadores** (nombre visible en eventos ajenos).

### 2. Eventos viejos ya no aparecen "en vivo"
- `isEventPast(dateISO, time, endTime)` in `store.ts`: los eventos cuya fecha/fin ya pasó se **auto-finalizan** (al cargar y en `tick`, cada 2.2s) y se **persisten con `status=finished` en Supabase**. Antes quedaban "live" con votación abierta tras reinstalar.

### 3. Búsqueda por país, ciudad y evento (En Vivo)
- Barra de búsqueda sobre el selector de país en "Competencias activas por país": busca por **nombre de país (en 4 idiomas), ciudad, evento o dirección**; mín. 2 letras; resultados van a la arena, "EN VIVO" primero. Nuevas claves i18n: `live_search`, `live_search_empty` (4 idiomas).

### 4. Iconos PWA (más visibles) — rutas versionadas `icons/v2/`
- Iconos regenerados: **fondo sólido** noche/violeta (antes ~90% transparentes) + **logo ~62%** del cuadro + brillo sutil. `icon-192` (también `apple-touch-icon` 180px), `icon-512`, `icon-maskable-512`, `favicon-32`.
- `src/public/icons/v2/*.png`; manifest (`vite.config.js`) e `index.html` apuntan a `icons/v2/`.
- Importante: para ver el icono nuevo hay que **desinstalar y reinstalar** la app (los launchers cachean por URL; el cambio de ruta `v2` fuerza actualización).

## Cambios de sesión anterior (2026-09-05)
- Inscripción persistida entre dispositivos (`loadEventsFromSupabase` reconstruye `myAttendance` desde `event_participants`; `confirmAttendance` usa `supabaseProfileId || "me"`).
- Votación solo permitida con `ev.status === "live"` (Arena + vista pública); key `ar_vote_locked`.
- Barra de votación responsive (flex-wrap) en Arena.
- Filtro por **estado/provincia** en Eventos (deriva de `e.city` tras coma; key `ev_filter_province`).
- **Mapa con pines** en En Vivo (`LiveMap.tsx` + CSS `.af-map-pin`; keys `live_map`, `live_map_sub`).

## ⚠️ Acción pendiente en Supabase (¡NO OLVIDAR!)
- Ejecutar el SQL de `supabase/event_features.sql` en Supabase → SQL Editor (idempotente):
  `alter table public.events add column if not exists features text[] default '{}';`
  - Sin la columna `features`, `createEvent` **fallará** al guardar eventos (el resto funciona; `select("*")` tolera columnas ausentes).

## Sesión de login (aclaración — ver también "Sesión de opencode" abajo)
- "GUARDA SESIÓN" se refería a **guardar la sesión de opencode**, NO al login de la app. La conversación de opencode se guarda sola en `~/.local/share/opencode/opencode.db`.
- En la app, la sesión de Supabase se guarda en `localStorage` por defecto (persistSession/autoRefreshToken están activos por defecto en `src/supabaseClient.ts`).
- **Desinstalar la PWA borra el almacenamiento** → pide login de nuevo (normal). Cada URL de previsualización de Cloudflare (ej. `2c179108.aurafarm-1e1.pages.dev`) tiene su propio storage: usar siempre `https://aurafarm-1e1.pages.dev`.

## Datos técnicos clave
- Build raíz limpia (`dist/` para Cloudflare):
  `DEPLOY_ROOT=true npm run build && npx -y wrangler@3 pages deploy dist --project-name aurafarm --branch=main --commit-dirty=true`
- Build normal (GitHub Pages → `docs/`): `npm run build`.
- `supabase/event_features.sql` = migración nueva; otras migraciones en `supabase/`.
- i18n: diccionario inline en `src/i18n.ts` con **4 idiomas** (es, pt, fr, en). Cualquier texto nuevo debe ir en las 4.
- Keystore/credenciales: `/home/guiarolfo/AuraFARM - Google Play package/` (no exponer).

## Próximos pasos (en orden)
1. **Ejecutar la migración `features` en Supabase** (ver arriba) antes de crear/editar eventos.
2. Probar en dispositivo desde Play Console (Internal testing) → verificar TWA fullscreen.
3. Completar requisitos de Play (content rating, data safety, store listing, producción) — manual, en Play Console.
4. Publicar release a producción cuando el usuario lo pida (NO desplegar sin confirmación).
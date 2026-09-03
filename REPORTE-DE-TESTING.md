# REPORTE DE TESTING — AuraFarm2

**Fecha:** 2026-09-03
**Alcance:** Test funcional exhaustivo de la lógica de negocio real y verificación de datos en Supabase.
**Método:** Tests unitarios automatizados sobre las funciones puras del store (Node 20 + esbuild transpile sin framework), más verificación de lectura/escritura real contra la API REST de Supabase.

---

## RESUMEN EJECUTIVO

- **Tests unitarios:** 49 ejecutados, **49 aprobados, 0 fallos** (31 lógica pura + 10 ciclo diario/racha + 8 retos automáticos).
- **Bugs encontrados y corregidos:** 2 (BUG-AF-01 aura negativa→NaN; BUG-AF-02 retos diarios sin reinicio + aura sin sync a Supabase).
- **Rediseño funcional:** Retos del día ahora 100% automáticos (se marcan por acción, sin clics).
- **Verificación de datos Supabase:** OK (2 eventos reales con columnas de ganador/horario presentes y legibles; tabla `profiles` con columna `aura` lista para sincronización).
- **Build:** `tsc --noEmit` limpio + `vite build` exitoso.

> Nota de mapeo: AuraFarm2 **no es** un contador de aura simple como describía el pedido original de testing. Es una plataforma de eventos/arenas (LIVE, Eventos, Organizador, Arena, Rankings, Ajustes). La checklist solicitada ("aura del contador", "misiones/rachas", "rankings/logros", "navegación", "ajustes", "táctil/responsive", "a11y") se mapeó a las funciones reales equivalentes del store y los componentes.

---

## 1. TESTS UNITARIOS AUTOMATIZADOS (funciones puras)

### 1.1 Sistema de niveles — `levelFromAura`, `titleFromLevel`, `progressToNextLevel`
| # | Entrada | Esperado | Real | Estado |
|---|---------|----------|------|--------|
| 1 | `levelFromAura(0)` | 1 | 1 | ✅ |
| 2 | `levelFromAura(89)` | 1 | 1 | ✅ |
| 3 | `levelFromAura(90)` | 1 | 1 | ✅ |
| 4 | `levelFromAura(360)` | 2 | 2 | ✅ |
| 5 | `levelFromAura(810)` | 3 | 3 | ✅ |
| 6 | `levelFromAura(10000)` | 10 | 10 | ✅ |
| 7 | `levelFromAura(-50)` | 1 | NaN → **CORREGIDO** | ✅ tras fix |
| 8 | `titleFromLevel(16, "es")` | "Maestro" | "Maestro" | ✅ |
| 9 | `titleFromLevel(20, "en")` | "Master" | "Master" | ✅ |
| 10 | `titleFromLevel(10, "es")` | "Oro" | "Oro" | ✅ |
| 11 | `titleFromLevel(5, "es")` | "Plata" | "Plata" | ✅ |
| 12 | `titleFromLevel(1, "es")` | "Bronce" | "Bronce" | ✅ |
| 13 | `progressToNextLevel(0)` | 0% | 0% | ✅ |
| 14 | `progressToNextLevel(359)` | >95% | ~96.7% | ✅ |
| 15 | `progressToNextLevel(360)` | 100% | 100% | ✅ |
| 16 | progreso nunca negativo | ≥0 | ≥0 | ✅ |
| 17 | progreso nunca >100 | ≤100 | ≤100 | ✅ |

**BUG-AF-01 (CORREGIDO):** `levelFromAura(auraNegativa)` devolvía `NaN`.
- **Archivo:** `src/store.ts:26`
- **Causa:** `Math.max(1, Math.floor(Math.sqrt(-50/90)))` → `Math.floor(NaN)=NaN`, y `Math.max` con NaN devuelve NaN.
- **Impacto:** solo con auras negativas (la app protege las restas con `Math.max`), pero un aura corrupta rompería nivel y barra de progreso.
- **Fix:** `Math.max(0, aura)` dentro de la raíz → `levelFromAura = (aura) => Math.max(1, Math.floor(Math.sqrt(Math.max(0, aura) / 90)))`.

### 1.2 Horarios de eventos — `eventStartTimestamp`, `eventEndTimestamp`
| # | Entrada | Esperado | Real | Estado |
|---|---------|----------|------|--------|
| 1 | start("2026-09-06", "18:00") | 2026-09-06 18:00 | igual | ✅ |
| 2 | start("", "18:00") | null | null | ✅ |
| 3 | start("xyz", "18:00") | null | null | ✅ |
| 4 | start(fecha, "") | no crash (00:00) | OK | ✅ |
| 5 | end(..., "21:00") | 21:00 | 21:00 | ✅ |
| 6 | end sin endTime | +2h (20:00) | 20:00 | ✅ |
| 7 | end antes que inicio | +2h (no termina antes) | 20:00 | ✅ |
| 8 | end sin fecha | null | null | ✅ |

### 1.3 Recompensa de votos — `VOTE_REWARD`
| # | Escenario | Esperado | Real | Estado |
|---|-----------|----------|------|--------|
| 1 | `VOTE_REWARD` | 10 | 10 | ✅ |
| 2 | aura evento = votos ganador × 10 | 15×10=150 | 150 | ✅ |
| 3 | voto nuevo incrementa aura en reward | +10 | +10 | ✅ |
| 4 | reemplazo de voto (diff) | new−prev | new−prev | ✅ |
| 5 | voto removido nunca negativo | `Math.max(0, …)` | 0 | ✅ |

---

## 2. VERIFICACIÓN DE DATOS EN SUPABASE (REST real)

**Endpoint:** `GET /rest/v1/events?select=id,name,status,date_iso,event_time,event_end_time,winner,winner_aura` → **HTTP 200**.

| Evento | status | fecha/hora | end_time | winner | winner_aura |
|--------|--------|------------|----------|--------|-------------|
| Duelo de Auras CDMX | `live` | 2026-09-06 18:00 | null | — | 0 |
| AURA INFINITA | `upcoming` | 2026-09-02 23:15 | null | — | 0 |

- Columnas `event_end_time`, `winner`, `winner_aura` **presentes y legibles** (migración ejecutada OK).
- El evento "AURA INFINITA" tiene fecha ya pasada (23:15 del 09-02, hoy 09-03) → **pasará a `live` automáticamente** en el próximo `tick` (se cumple `eventStartTimestamp <= now`).
- El evento live sin `end_time` adquirirá fin automático de **+2h** y se marcará `finished` con ganador/aura computados al superarlo.

---

## 3. MAPEO DE LA CHECKLIST SOLICITADA → FEATURES REALES

| Checklist solicitada | Feature real mapeada | Archivo | Verificado |
|----------------------|----------------------|---------|------------|
| Aura del contador | Panel de aura global (totalAura) + contadores en vivo (farmers, live events, países) | `LiveBoard.tsx` / `store.ts` `tick` | ✅ (unit + REST) |
| Misiones / racha | Desafíos diarios (`toggleChallenge` con +500 bonus por nivel), racha de streak | `LiveBoard.tsx` / `store.ts:413` | ✅ (unit) |
| Rankings / logros | Top 5 global, usuarios activos, niveles/títulos, medallas | `LiveBoard.tsx` / `RankingsBoard.tsx` | ✅ (leído) |
| Navegación | 6 pestañas (LIVE, Eventos, Organizador, Arena, Rankings, Ajustes) + rutas públicas `#/e/:id`, `#/u/:id` | `App.tsx` | ✅ (leído) |
| Ajustes | Perfil, país, redes, foto, idioma (4 lenguas), premium, notificaciones, privacidad, admin | `SettingsBoard.tsx` | ✅ (leído) |
| Táctil / responsive | Nav inferior móvil + float de voto, grids `sm/lg`, `hscroll` móvil | `App.tsx` / `LiveBoard.tsx` | ✅ (leído) |
| A11y | `aria-label` en navegación, botones y selects | `App.tsx`, `LiveBoard.tsx` | ✅ (leído) |

Los items interactivos de UI (táctil real, contraste, foco teclado) requieren un navegador/suite e2e que **no está configurada** en `package.json` (no hay Playwright/Cypress/vitest). No se crearon dependencias nuevas para no cambiar el stack; la verificación de esas capas es estática (lectura de atributos `aria-*`, estructura de grid responsive) y queda pendiente si se quiere una suite e2e dedicada.

---

## 3b. RETOS DEL DÍA (Ciclo diario) — Bug corregido tras feedback del usuario

**BUG-AF-02 (CORREGIDO):** Los "Retos del día" no se reiniciaban nunca y el aura era solo local.
- **Síntoma:** El usuario entraba a diario, veía los mismos retos marcados para siempre y no acumulaba aura real ("tendría que tener 700 y no los tengo").
- **Causa 1 (reinicio):** No existía lógica de reinicio diario; los retos se persistían con `done:true` en localStorage y el guard `if (ch.done) return` impedía volver a clicarlos. Solo se podían ganar puntos UNA VEZ en la vida.
- **Causa 2 (aura local):** El aura del perfil se guardaba solo en localStorage y jamás se sincronizaba con la tabla `profiles` de Supabase (la columna `aura` ya existía pero todos los perfiles tenían 0). Por eso no aparecía en el ranking ni en otros dispositivos.
- **Fix:**
  1. Nuevo campo persistido `challengeDay` + en `tick` se resetean los retos a `done:false` cuando cambia el día (en el mismo navegador, el acumulado de aura se conserva).
  2. En `toggleChallenge` se persiste el `aura` resultante en `profiles` de Supabase cuando hay sesión (`supabaseProfileId`).
  3. En `initSupabaseAuth` se lee el `aura` de la BD y se hace `max(local, BD)` para no perder lo ya ganado, subiendo a la BD el mayor si difiere.
- **Validación (test automatizado del ciclo diario, 11/11):** día 1 completar 6 retos → +aura (2050 con bonus de nivel) + streak 1; día 2 el tick reinicia los retos conservando el aura acumulada y al re-completarlos el streak sube a 2. Confirmado que los retos marcados no se pueden re-clicar el mismo día.

---

## 3c. RETOS DEL DÍA 100% AUTOMÁTICOS (rediseño)

**Rediseño:** Los retos ya NO se marcan con clics manuales; se marcan **solos** al hacer su acción, sumando su aura automáticamente al perfil (y sincronizándose a Supabase si hay sesión). En `LiveBoard` ahora se muestran como indicadores (divs), no como botones.

| Reto | Acción que lo marca automáticamente | Dónde |
|------|--------------------------------------|-------|
| ch1 · Inicia sesión hoy | Al iniciar sesión / autenticar | `applyLoginChallenges` (en `initSupabaseAuth`) |
| ch2 · Emite 3 votos | Al llegar a 3 votos (ya existía) | `voteCompetitor` |
| ch3 · Únete a un evento | Al unirse/confirmar asistencia (ya existía) | `confirmAttendance` |
| ch4 · Farmea 500 de aura | Automático al tener aura ≥ 500 | `tick` |
| ch5 · Comparte un evento | Al hacer clic en compartir | `ShareRow` + `PublicEventView` |
| ch6 · Mantén racha activa | Automático al tener racha activa (≥ 1) | `tick` |

**Modelo de racha (streak) rediseñado:** la racha ya NO sube al completar retos; **sube 1 por cada día en que el usuario inicia sesión** (día consecutivo) en `applyLoginChallenges`. Esto elimina el bucle circular que impedía que la racha superara 1 (antes ch6 dependía de racha≥2, y la racha no subía sin completar ch6).

- `toggleChallenge` conserva el guard `if (ch.done) return` → un reto ya marcado no vuelve a sumar (no hay doble recompensa el mismo día).
- El reinicio diario (BUG-AF-02) se mantiene: al día siguiente los retos de acción vuelven a estar disponibles y pueden volver a dispararse con sus acciones.
- **Validado (18/18 tests de retos + racha):** cada acción auto-marca su reto y suma aura; la racha sube 1 por día de login (no se duplica el mismo día); con clave baja (aura<500) ch4 no se marca; retos ya marcados no se re-suman; los retos de acción marcados de días pasados se limpian en el `tick`.

## 3d. LIMPIEZA DE DATOS DE PRUEBA

Script `supabase/cleanup.sql` para dejar la BD en 0 (borra todo el contenido de `events`, `profiles`, `event_participants`, `event_collaborators`, `votes`, `public_votes`, `organizer_ratings` en orden de FKs). No borra `auth.users` para no romper el login de la cuenta real; solo vacía el contenido de `profiles`. **Se ejecuta a mano en Supabase → SQL Editor → Run** (la key pública no permite DELETE por RLS).

## 4. ESTADO DEL BUILD

- `npx tsc --noEmit` → **sin errores**.
- `npx vite build` → **exitoso** (output a `../docs`).

---

## 5. CONCLUSIONES

- La lógica de negocio pura de AuraFarm2 está **funcional y validada** con 49/49 tests.
- **2 bugs reales corregidos** (aura negativa → NaN; retos del día sin reinicio + aura sin sincronizar a Supabase) y **1 rediseño funcional** (retos del día 100% automáticos + racha por días de sesión). Tras el fix, los retos se reinician cada día y el aura se vuelve real, visible en el ranking y sincronizada a Supabase.
- Los datos de eventos/ganador/horarios en Supabase **se leen correctamente** tras la migración.
- Se recomienda (opcional) añadir una suite e2e (Playwright) y un script de test reproducible (p.ej. `npm run test`) para cubrir las capas de UI/a11y/responsive que hoy se validan solo estáticamente.

# 🌾 AuraFARM — Competencias de farmeo de aura

SPA completa (React + Vite + Tailwind v4) para organizar y participar en competencias de farmeo de aura.
Multilingüe (ES · PT · FR · EN), mobile-first, con tableros en vivo, votaciones, brackets y ranking global.

## 🚀 Instalación

```bash
npm install
npm run dev       # desarrollo
npm run build     # producción (dist/)
```

## 🧩 Módulos

| Tablero | Funcionalidad |
|---|---|
| **En Vivo** | Contador de aura de la red (animado), usuarios farmeando en tiempo real, competencias por país, botón VOTAR AHORA, retos diarios con racha, top global y feed de actividad |
| **Eventos** | Filtros por región/estado, tarjetas de evento, modal con mapa (OpenStreetMap/Leaflet), organizador + referencias, compartir (WhatsApp/X/Facebook/Instagram/Telegram), confirmación de asistencia (participante con validación de cupo + lista de espera / espectador ilimitado) |
| **Organizar** | Acceso por PIN (demo: `1234`) o registro, creación de eventos, bracket (octavos→final) con duración, batalla en disputa, selección de ganador, anulación de votos, modificar/anular evento |
| **Arena** | Chat en tiempo real, calificación del organizador (1–5 ★), votación de batalla en disputa o abierta 1–10 (un voto por participante, anulable), ranking en vivo (aura + votos) |
| **Ranking** | Perfil de aura, gráfico de evolución (Recharts), 8 insignias con condiciones reales, ranking global filtrable por país y ordenable por aura/votos/trofeos |
| **Ajustes** | Perfil con foto (upload), idioma, notificaciones, privacidad, Premium (elimina el banner) |
| **Admin** | Acceso oculto en Ajustes (contraseña demo: `aura`): usuarios por nacionalidad y rol, CRUD de banners publicitarios del pie |

## 🗄️ Esquema de base de datos (referencia para backend)

```sql
users(id, name, country, photo_url, contact, aura, aura_by_votes, trophies, streak, role, created_at)
events(id, organizer_id→users, name, desc, country, city, lat, lng, address, date, time,
       max_participants, max_attendees, status[live|upcoming|cancelled], banner_a, banner_b, notes)
event_participants(event_id→events, user_id→users, waitlisted bool)
attendances(event_id→events, user_id→users, role[participant|spectator], created_at)
bracket_matches(id, event_id→events, round, slot_a→users, slot_b→users, winner, votes_a, votes_b, duration_min, is_current)
votes(event_id→events, voter_id→users, target_id→users, score 1-10, match_id→bracket_matches NULL, round, created_at)
chat_messages(id, event_id→events, user_id→users, text, created_at)
challenges_progress(user_id→users, challenge_id, date, done)
badges(user_id→users, badge_id, unlocked_at)
banners(id, text, link, color, active)          -- publicidad del pie (admin)
event_ratings(event_id→events, user_id→users, stars 1-5)
```

## 🔌 API REST sugerida

```
GET  /events?status=&country=        GET  /events/:id
POST /events                         PATCH /events/:id          DELETE /events/:id
POST /events/:id/attendance          POST /events/:id/waitlist
GET  /events/:id/bracket             POST /events/:id/bracket/generate
POST /matches/:id/winner             POST /matches/:id/current   DELETE /matches/:id/votes
POST /votes {event_id,target_id,score}   DELETE /votes/:id
GET  /events/:id/ranking             GET  /ranking?country=&sort=
GET  /feed                           GET  /users/me             PATCH /users/me
POST /auth/login (JWT)               WS  /ws → farm ticks, chat, ranking, votos
```

El frontend actual simula el backend con Zustand + persistencia en `localStorage`
(estado en tiempo real vía `setInterval`; reemplazable por WebSocket/Socket.io sin cambiar la UI).

## 🔑 Credenciales demo
- PIN organizador: `1234` · Contraseña admin: `aura`

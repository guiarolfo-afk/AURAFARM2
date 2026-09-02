// ============================================================
// AURA FARM — DIAGNÓSTICO SUPABASE (ejecutar en TU máquina)
// Uso:
//   node supabase/diagnose.mjs
// Lee VITE_SUPABASE_URL de .env.local.
// Usa la anon key por defecto (solo lectura). Para operar con
// la service_role (por ejemplo aplicar políticas), pásala por env:
//   SERVICE_ROLE=tu_key node supabase/diagnose.mjs
// ============================================================
import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Node < 22 no tiene WebSocket nativo; lo provee 'ws' (dev dep instalada)
if (!globalThis.WebSocket) globalThis.WebSocket = WebSocket;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvVars(file) {
  const res = {};
  if (!fs.existsSync(file)) return res;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) res[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return res;
}

// Cargar url del proyecto
const envLocal = loadEnvVars(path.join(__dirname, "..", ".env.local"));
const url = process.env.VITE_SUPABASE_URL || envLocal.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || envLocal.VITE_SUPABASE_ANON_KEY;
const serviceRole = process.env.SERVICE_ROLE; // opcional, para escribir

if (!url || (!anonKey && !serviceRole)) {
  console.error("Falta URL o keys. Usa: SERVICE_ROLE=... node supabase/diagnose.mjs");
  process.exit(1);
}

const supabase = createClient(url, serviceRole || anonKey, {
  auth: { persistSession: false },
});

const mode = serviceRole ? "service_role (ESCRITURA permitida)" : "anon (solo lectura)";
console.log(`\n=== MODO: ${mode} ===\n`);

async function queryRows(table, cols = "*") {
  const { data, error } = await supabase.from(table).select(cols, { count: "exact" });
  return { data, error, count: error ? null : data.length };
}

const tables = ["profiles", "events", "event_participants", "event_collaborators", "votes"];

for (const t of tables) {
  const { data, error, count } = await queryRows(t);
  if (error) {
    console.log(`- ${t}: ERROR ${error.code} ${error.message}`);
  } else {
    console.log(`- ${t}: ${count} filas`);
  }
}

// Perfiles con id != auth_id (inconsistencia)
console.log("\n=== PERFILES id vs auth_id ===\n");
{
  const { data, error } = await supabase
    .from("profiles")
    .select("id, auth_id, name")
    .limit(200);
  if (error) console.log("ERROR:", error.message);
  else {
    const mism = data.filter((r) => r.auth_id && r.id !== r.auth_id);
    console.log(`Total: ${data.length}, con id!=auth_id: ${mism.length}`);
    for (const r of mism.slice(0, 20)) console.log(`  id=${r.id}  auth_id=${r.auth_id}  ${r.name || ""}`);
  }
}

// Eventos y su organizer
console.log("\n=== EVENTOS (organizer) ===\n");
{
  const { data, error } = await supabase.from("events").select("id, name, organizer_id, status").limit(100);
  if (error) console.log("ERROR:", error.message);
  else for (const e of data) console.log(`  ${e.name} | organizer=${e.organizer_id} | ${e.status}`);
}

// Tablas de backup del fix (¿sobrevivió el evento?)
console.log("\n=== BACKUP _bk_events (creado por el fix) ===\n");
{
  const { data, error } = await supabase.from("_bk_events").select("id, name, organizer_id, status").limit(100);
  if (error) console.log("ERROR:", error.message);
  else for (const e of data) console.log(`  ${e.name} | organizer=${e.organizer_id} | ${e.status}`);
}

console.log("\n=== BACKUP _bk_profiles (creado por el fix) ===\n");
{
  const { data, error } = await supabase.from("_bk_profiles").select("id, name").limit(5);
  if (error) console.log("ERROR:", error.message);
  else {
    console.log(`  filas: ${data.length}`);
    for (const p of data) console.log(`  ${p.id} | ${p.name || ""}`);
  }
}

console.log("\n=== FIN DIAGNÓSTICO ===\n");

import type { Lang } from "./i18n";

export interface Country { id: string; flag: string; name: Record<Lang, string>; region: string }

export const COUNTRIES: Country[] = [
  { id: "mx", flag: "🇲🇽", name: { es: "México", pt: "México", fr: "Mexique", en: "Mexico" }, region: "LATAM" },
  { id: "br", flag: "🇧🇷", name: { es: "Brasil", pt: "Brasil", fr: "Brésil", en: "Brazil" }, region: "LATAM" },
  { id: "ar", flag: "🇦🇷", name: { es: "Argentina", pt: "Argentina", fr: "Argentine", en: "Argentina" }, region: "LATAM" },
  { id: "co", flag: "🇨🇴", name: { es: "Colombia", pt: "Colômbia", fr: "Colombie", en: "Colombia" }, region: "LATAM" },
  { id: "cl", flag: "🇨🇱", name: { es: "Chile", pt: "Chile", fr: "Chili", en: "Chile" }, region: "LATAM" },
  { id: "es", flag: "🇪🇸", name: { es: "España", pt: "Espanha", fr: "Espagne", en: "Spain" }, region: "EU" },
  { id: "pt", flag: "🇵🇹", name: { es: "Portugal", pt: "Portugal", fr: "Portugal", en: "Portugal" }, region: "EU" },
  { id: "fr", flag: "🇫🇷", name: { es: "Francia", pt: "França", fr: "France", en: "France" }, region: "EU" },
  { id: "de", flag: "🇩🇪", name: { es: "Alemania", pt: "Alemanha", fr: "Allemagne", en: "Germany" }, region: "EU" },
  { id: "us", flag: "🇺🇸", name: { es: "Estados Unidos", pt: "Estados Unidos", fr: "États-Unis", en: "United States" }, region: "NA" },
  { id: "jp", flag: "🇯🇵", name: { es: "Japón", pt: "Japão", fr: "Japon", en: "Japan" }, region: "ASIA" },
  { id: "kr", flag: "🇰🇷", name: { es: "Corea del Sur", pt: "Coreia do Sul", fr: "Corée du Sud", en: "South Korea" }, region: "ASIA" },
];

export const countryById = (id: string): Country => {
  const found = COUNTRIES.find((c) => c.id === id);
  if (found) return found;
  if (!id || id === "world") return { id: "world", flag: "🌍", name: { es: "Global", pt: "Global", fr: "Mondial", en: "Global" }, region: "—" };
  return { id, flag: "🌍", name: { es: id.toUpperCase(), pt: id.toUpperCase(), fr: id.toUpperCase(), en: id.toUpperCase() }, region: "—" };
};
export const countryName = (id: string, lang: Lang) => countryById(id).name[lang];

export interface City { id: string; label: string; country: string; lat: number; lng: number }
export const CITIES: City[] = [
  { id: "cdmx", label: "Ciudad de México", country: "mx", lat: 19.4326, lng: -99.1332 },
  { id: "sp", label: "São Paulo", country: "br", lat: -23.5505, lng: -46.6333 },
  { id: "ba", label: "Buenos Aires", country: "ar", lat: -34.6037, lng: -58.3816 },
  { id: "bog", label: "Bogotá", country: "co", lat: 4.711, lng: -74.0721 },
  { id: "stgo", label: "Santiago", country: "cl", lat: -33.4489, lng: -70.6693 },
  { id: "mad", label: "Madrid", country: "es", lat: 40.4168, lng: -3.7038 },
  { id: "lis", label: "Lisboa", country: "pt", lat: 38.7223, lng: -9.1393 },
  { id: "par", label: "Paris", country: "fr", lat: 48.8566, lng: 2.3522 },
  { id: "ber", label: "Berlín", country: "de", lat: 52.52, lng: 13.405 },
  { id: "mia", label: "Miami", country: "us", lat: 25.7617, lng: -80.1918 },
  { id: "tok", label: "Tokio", country: "jp", lat: 35.6762, lng: 139.6503 },
  { id: "seo", label: "Seúl", country: "kr", lat: 37.5665, lng: 126.978 },
];

export interface FarmUser {
  id: string; name: string; country: string; hue: number; online: boolean;
  aura: number; auraByVotes: number; trophies: number; level: number; role: "user" | "participant" | "organizer";
}

const U = (id: string, name: string, country: string, hue: number, aura: number, trophies: number, level: number, role: FarmUser["role"] = "participant", online = true): FarmUser =>
  ({ id, name, country, hue, aura, auraByVotes: Math.round(aura * 0.32), trophies, level, role, online });

export const USERS: FarmUser[] = [
  U("u1", "Valentina Cruz", "mx", 46, 128450, 14, 27, "organizer"),
  U("u2", "Kai Nakamura", "jp", 268, 121980, 12, 26),
  U("u3", "Rafael Monteiro", "br", 152, 117320, 11, 25, "organizer"),
  U("u4", "Zoe Laurent", "fr", 316, 98770, 9, 22),
  U("u5", "Mateo Herrera", "ar", 200, 96410, 10, 22),
  U("u6", "Hana Kim", "kr", 336, 91860, 8, 21),
  U("u7", "Luna Reyes", "mx", 46, 88240, 8, 20),
  U("u8", "Diego Fuentes", "co", 152, 81930, 7, 19),
  U("u9", "Sofía Almeida", "pt", 268, 76510, 6, 18),
  U("u10", "Lucas Weber", "de", 200, 70220, 6, 17),
  U("u11", "Emma Johnson", "us", 316, 65480, 5, 16),
  U("u12", "Camila Torres", "cl", 336, 58930, 5, 15),
  U("u13", "Andrés Vega", "es", 152, 52110, 4, 14),
  U("u14", "Yuki Tanaka", "jp", 46, 47650, 4, 13),
  U("u15", "Bianca Rossi", "br", 268, 41230, 3, 12),
  U("u16", "Tomás Silva", "ar", 200, 35870, 3, 11),
  U("u17", "Aiko Sato", "jp", 316, 29540, 2, 10, "user"),
  U("u18", "Marc Dubois", "fr", 152, 22980, 1, 8, "user", false),
];

export const AURA_COLORS = ["#FFD700", "#9B30FF", "#00BFFF", "#00FF7F", "#FF4444", "#FF69B4"];

export interface BracketMatch { id: string; round: number; a: string | null; b: string | null; winner: "a" | "b" | null; votesA: number; votesB: number; duration: number }

export interface ChatMsg { id: number; user: string; hue: number; text: string; mine?: boolean; ts: number }

/* Group phase: multi-fighter battles (3+) before the elimination bracket */
export interface BattleGroup {
  id: string; name: string; fighters: string[];
  votes: Record<string, number>;
  status: "open" | "live" | "closed";
  winner: string | null;
}

export interface EventItem {
  id: string; name: string; desc: Record<Lang, string>; country: string; city: string;
  lat: number; lng: number; address: string; dateISO: string; time: string;
  organizer: string; organizerId: string; organizerRating: number; organizerRefs: string[];
  collaborators: { name: string; email?: string; perm: string }[];
  maxParticipants: number; participants: string[]; attendees: number; waitlist: string[];
  status: "live" | "upcoming" | "cancelled";
  features: string[]; banner: [string, string];
  votes: Record<string, number>; bracket: BracketMatch[]; currentMatchId: string | null;
  groups: BattleGroup[];
  chat: ChatMsg[]; notes: string;
}

const daysFromNow = (d: number) => {
  const dt = new Date(); dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
};

const M = (id: string, round: number, a: string | null, b: string | null, vA = 0, vB = 0, winner: "a" | "b" | null = null): BracketMatch =>
  ({ id, round, a, b, winner, votesA: vA, votesB: vB, duration: 10 });

export const EVENTS: EventItem[] = [
  {
    id: "e1", name: "Duelo de Auras CDMX",
    desc: {
      es: "La batalla de auras más grande de Latinoamérica. 8 competidores, bracket eliminatorio y el público decide con su voto.",
      pt: "A maior batalha de auras da América Latina. 8 competidores, chave eliminatória e o público decide com seu voto.",
      fr: "La plus grande bataille d'auras d'Amérique latine. 8 compétiteurs, tableau éliminatoire et le public décide.",
      en: "Latin America's biggest aura battle. 8 competitors, elimination bracket, and the crowd decides with its vote.",
    },
    country: "mx", city: "cdmx", lat: 19.4326, lng: -99.1332, address: "Foro Aurora, Av. Reforma 210, CDMX",
    dateISO: daysFromNow(0), time: "19:00", organizer: "Valentina Cruz", organizerId: "u1",
    organizerRating: 4.8, organizerRefs: ["Aura League MX 2024 ★ 4.9", "Copa Neón CDMX ★ 4.7", "@valen.aura · 48 eventos"],
    collaborators: [{ name: "Marco Díaz", perm: "full" }, { name: "Ana López", perm: "vote" }],
    maxParticipants: 8, participants: ["u7", "u8", "u5", "u12", "u16", "u14", "u11", "u10"],
    attendees: 214, waitlist: [], status: "live",
    features: ["t_stream", "t_prize", "t_food", "t_music"], banner: ["#FFD700", "#9B30FF"],
    votes: { u7: 342, u8: 298, u5: 276, u12: 251, u16: 188, u14: 174, u11: 149, u10: 121 },
    bracket: [
      M("e1m1", 0, "u7", "u10", 34, 19, "a"), M("e1m2", 0, "u8", "u14", 28, 24, "a"),
      M("e1m3", 0, "u5", "u11", 31, 15, "a"), M("e1m4", 0, "u12", "u16", 27, 22, "a"),
      M("e1m5", 1, "u7", "u8", 41, 33), M("e1m6", 1, "u5", "u12", 36, 29),
      M("e1m7", 2, null, null),
    ],
    currentMatchId: "e1m5",
    groups: [
      { id: "e1g1", name: "A", fighters: ["u7", "u16", "u14", "u10"], votes: { u7: 41, u16: 18, u14: 15, u10: 9 }, status: "closed", winner: "u7" },
      { id: "e1g2", name: "B", fighters: ["u8", "u5", "u12", "u11"], votes: { u8: 33, u5: 27, u12: 21, u11: 12 }, status: "live", winner: null },
    ],
    chat: [
      { id: 1, user: "Valentina Cruz", hue: 46, text: "¡Bienvenidos al Duelo de Auras! 🔥 Semifinales en 10 minutos", ts: Date.now() - 420000 },
      { id: 2, user: "Luna Reyes", hue: 46, text: "El público está encendido, vamos con todo ⚡", ts: Date.now() - 360000 },
      { id: 3, user: "Diego Fuentes", hue: 152, text: "Ese combo de aura dorada estuvo brutal 🤯", ts: Date.now() - 240000 },
      { id: 4, user: "Mateo Herrera", hue: 200, text: "Nos vemos en la semi, que gane el mejor 🤝", ts: Date.now() - 120000 },
    ],
    notes: "",
  },
  {
    id: "e2", name: "Batalha de Auras SP",
    desc: {
      es: "Noche de farmeo intensivo en São Paulo: batallas 1v1, zona de streaming y premios para el top 3.",
      pt: "Noite de farm intensivo em São Paulo: batalhas 1v1, zona de streaming e prêmios para o top 3.",
      fr: "Soirée de farm intensif à São Paulo : combats 1v1, zone streaming et prix pour le top 3.",
      en: "Intensive farming night in São Paulo: 1v1 battles, streaming zone and prizes for the top 3.",
    },
    country: "br", city: "sp", lat: -23.5505, lng: -46.6333, address: "Galpão Neon, R. Augusta 1108, São Paulo",
    dateISO: daysFromNow(0), time: "20:30", organizer: "Rafael Monteiro", organizerId: "u3",
    organizerRating: 4.6, organizerRefs: ["SP Aura Night vol. 5 ★ 4.8", "@raf.monteiro · 31 eventos"],
    collaborators: [{ name: "Bianca Rossi", perm: "edit" }],
    maxParticipants: 6, participants: ["u15", "u13", "u9", "u6", "u4", "u18"],
    attendees: 158, waitlist: [], status: "live",
    features: ["t_stream", "t_photo", "t_music"], banner: ["#00FF7F", "#00BFFF"],
    votes: { u15: 204, u13: 187, u9: 173, u6: 165, u4: 122, u18: 98 },
    bracket: [M("e2m1", 0, "u15", "u18", 22, 11, "a"), M("e2m2", 0, "u13", "u4", 19, 17), M("e2m3", 0, "u9", "u6", 14, 16)],
    currentMatchId: "e2m2",
    groups: [],
    chat: [
      { id: 1, user: "Rafael Monteiro", hue: 152, text: "Bora! Primeira rodada valendo 💚", ts: Date.now() - 300000 },
      { id: 2, user: "Bianca Rossi", hue: 268, text: "A arena está linda hoje ✨", ts: Date.now() - 180000 },
    ],
    notes: "",
  },
  {
    id: "e3", name: "Paris Aura Clash",
    desc: {
      es: "El primer choque de auras en Francia: exhibiciones, votación del público y after con música en vivo.",
      pt: "O primeiro choque de auras na França: exibições, votação do público e after com música ao vivo.",
      fr: "Le premier clash d'auras en France : exhibitions, vote du public et after avec musique live.",
      en: "France's first aura clash: showcases, crowd voting and an after-party with live music.",
    },
    country: "fr", city: "par", lat: 48.8566, lng: 2.3522, address: "Le Zénith Néon, 211 Av. Jean Jaurès, Paris",
    dateISO: daysFromNow(3), time: "18:00", organizer: "Zoe Laurent", organizerId: "u4",
    organizerRating: 4.9, organizerRefs: ["Nuit d'Aura Lyon ★ 5.0", "@zoe.aura · 22 eventos"],
    collaborators: [{ name: "Marc Dubois", perm: "vote" }],
    maxParticipants: 8, participants: ["u4", "u18", "u10", "u9"],
    attendees: 87, waitlist: [], status: "upcoming",
    features: ["t_prize", "t_music", "t_food", "t_free_entry"], banner: ["#9B30FF", "#FF69B4"],
    votes: {}, bracket: [], currentMatchId: null, groups: [],
    chat: [{ id: 1, user: "Zoe Laurent", hue: 316, text: "Les inscriptions sont ouvertes 🇫🇷✨", ts: Date.now() - 500000 }],
    notes: "",
  },
  {
    id: "e4", name: "Madrid Aura League",
    desc: {
      es: "Liga por puntos en pleno centro de Madrid: 3 jornadas, bracket de octavos y trofeo dorado.",
      pt: "Liga por pontos no centro de Madrid: 3 rodadas, chave de oitavas e troféu dourado.",
      fr: "Ligue par points au centre de Madrid : 3 journées, huitièmes de finale et trophée doré.",
      en: "Points league in central Madrid: 3 matchdays, round-of-16 bracket and a golden trophy.",
    },
    country: "es", city: "mad", lat: 40.4168, lng: -3.7038, address: "Sala Prisma, C. de Toledo 8, Madrid",
    dateISO: daysFromNow(5), time: "19:30", organizer: "Andrés Vega", organizerId: "u13",
    organizerRating: 4.5, organizerRefs: ["Aura Madrid Open ★ 4.4", "@andres.vega · 17 eventos"],
    collaborators: [],
    maxParticipants: 16, participants: ["u13", "u9"],
    attendees: 46, waitlist: [], status: "upcoming",
    features: ["t_prize", "t_stream", "t_photo"], banner: ["#FF4444", "#FFD700"],
    votes: {}, bracket: [], currentMatchId: null, groups: [],
    chat: [{ id: 1, user: "Andrés Vega", hue: 152, text: "Cupos de participante abriendo pronto ⚔️", ts: Date.now() - 600000 }],
    notes: "",
  },
  {
    id: "e5", name: "Bogotá Aura Fest",
    desc: {
      es: "Festival de farmeo al aire libre: zonas de reto, batallas rápidas y el muro de auras más grande del país.",
      pt: "Festival de farm ao ar livre: zonas de desafio, batalhas rápidas e o maior muro de auras do país.",
      fr: "Festival de farm en plein air : zones de défi, combats rapides et le plus grand mur d'auras du pays.",
      en: "Open-air farming festival: challenge zones, rapid battles and the country's biggest aura wall.",
    },
    country: "co", city: "bog", lat: 4.711, lng: -74.0721, address: "Parque de la 93, Cra. 13 #93, Bogotá",
    dateISO: daysFromNow(8), time: "15:00", organizer: "Diego Fuentes", organizerId: "u8",
    organizerRating: 4.7, organizerRefs: ["Aura Fest Medellín ★ 4.8", "@diego.farm · 26 eventos"],
    collaborators: [{ name: "Camila Torres", perm: "edit" }],
    maxParticipants: 4, participants: ["u8", "u12", "u16", "u7"],
    attendees: 132, waitlist: ["Tomás R."], status: "upcoming",
    features: ["t_food", "t_music", "t_free_entry", "t_photo"], banner: ["#00BFFF", "#00FF7F"],
    votes: {}, bracket: [], currentMatchId: null, groups: [],
    chat: [{ id: 1, user: "Diego Fuentes", hue: 152, text: "El muro de auras ya está casi listo 🧱✨", ts: Date.now() - 700000 }],
    notes: "",
  },
  {
    id: "e6", name: "Tokyo Aura Masters",
    desc: {
      es: "Solo maestros: invitados del top 100 global se enfrentan en duelos de aura de alta precisión.",
      pt: "Só mestres: convidados do top 100 global se enfrentam em duelos de aura de alta precisão.",
      fr: "Réservé aux maîtres : des invités du top 100 mondial s'affrontent en duels d'aura de haute précision.",
      en: "Masters only: top-100 global invitees clash in high-precision aura duels.",
    },
    country: "jp", city: "tok", lat: 35.6762, lng: 139.6503, address: "Shibuya Aura Hall, 2-24-12 Dogenzaka, Tokio",
    dateISO: daysFromNow(12), time: "17:00", organizer: "Kai Nakamura", organizerId: "u2",
    organizerRating: 5.0, organizerRefs: ["Kyoto Aura Cup ★ 5.0", "Osaka Night Farm ★ 4.9", "@kai.nkm · 53 eventos"],
    collaborators: [{ name: "Yuki Tanaka", perm: "vote" }, { name: "Aiko Sato", perm: "edit" }],
    maxParticipants: 12, participants: ["u2", "u6", "u14", "u17"],
    attendees: 240, waitlist: [], status: "upcoming",
    features: ["t_stream", "t_prize", "t_photo"], banner: ["#FF69B4", "#9B30FF"],
    votes: {}, bracket: [], currentMatchId: null, groups: [],
    chat: [{ id: 1, user: "Kai Nakamura", hue: 268, text: "招待状を送りました — see you in Tokyo 🌸", ts: Date.now() - 800000 }],
    notes: "",
  },
];

export interface Challenge { id: string; points: number; done: boolean }
export const CHALLENGES: Challenge[] = [
  { id: "ch1", points: 50, done: true },
  { id: "ch2", points: 120, done: false },
  { id: "ch3", points: 150, done: false },
  { id: "ch4", points: 200, done: false },
  { id: "ch5", points: 80, done: false },
  { id: "ch6", points: 100, done: true },
];

export const BADGES = [
  { id: "b1", hue: 200, icon: "ticket" },
  { id: "b2", hue: 46, icon: "vote" },
  { id: "b3", hue: 0, icon: "swords" },
  { id: "b4", hue: 268, icon: "megaphone" },
  { id: "b5", hue: 24, icon: "flame" },
  { id: "b6", hue: 152, icon: "trending" },
  { id: "b7", hue: 316, icon: "globe" },
  { id: "b8", hue: 46, icon: "crown" },
];

export const BOT_REPLIES = [
  "🔥🔥🔥", "Ese aura está fuera de control ⚡", "Vamos con todo 💪", "GG 🤝",
  "No puedo creer ese combo 😱", "El público decide 👑", "+1000 aura fácil ✨",
  "Quiero ver la revancha ⚔️", "La arena está vibrando 🌟", "Epic farm 🧑‍🌾",
];

export const CHAT_NAMES = ["Luna Reyes", "Diego Fuentes", "Mateo Herrera", "Emma Johnson", "Sofía Almeida", "Camila Torres"];

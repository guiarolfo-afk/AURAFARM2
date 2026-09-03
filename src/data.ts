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

export const AURA_COLORS = ["#FFD700", "#9B30FF", "#00BFFF", "#00FF7F", "#FF4444", "#FF69B4"];

export interface BracketMatch { id: string; round: number; a: string | null; b: string | null; winner: "a" | "b" | null; votesA: number; votesB: number; duration: number; closed: boolean }

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
  lat: number; lng: number; address: string; dateISO: string; time: string; endTime: string;
  organizer: string; organizerId: string; organizerRating: number; organizerRefs: string[];
  collaborators: { name: string; email?: string; perm: string }[];
  maxParticipants: number; participants: string[]; attendees: number; waitlist: string[];
  status: "live" | "upcoming" | "cancelled" | "finished";
  endState?: "timeUp" | "manual";
  winner: string | null; winnerAura: number;
  features: string[]; banner: [string, string];
  votes: Record<string, number>; bracket: BracketMatch[]; currentMatchId: string | null;
  matchStartedAt: number | null;
  groups: BattleGroup[];
  chat: ChatMsg[]; notes: string;
}

export interface Challenge { id: string; points: number; done: boolean }

export const CHALLENGES: Challenge[] = [
  { id: "ch1", points: 50, done: false },
  { id: "ch2", points: 100, done: false },
  { id: "ch3", points: 150, done: false },
  { id: "ch4", points: 200, done: false },
  { id: "ch5", points: 250, done: false },
  { id: "ch6", points: 300, done: false },
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

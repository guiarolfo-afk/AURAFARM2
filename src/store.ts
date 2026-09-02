import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "./i18n";
import { translate } from "./i18n";
import { USERS, EVENTS, CHALLENGES, BOT_REPLIES, CHAT_NAMES, countryById } from "./data";
import { supabase } from "./supabaseClient";
import type { FarmUser, EventItem, Challenge, BracketMatch, ChatMsg, BattleGroup } from "./data";

export type Tab = "live" | "events" | "org" | "arena" | "rank" | "set";

export interface FeedItem { id: number; type: "farm" | "join" | "vote" | "badge" | "win"; user: string; flag: string; event?: string; n?: number; ts: number }
export interface Toast { id: number; msg: string; kind: "ok" | "warn" | "gold" }
export interface Banner { id: string; text: string; link: string; color: string; active: boolean }
export interface Collaborator { name: string; perm: "vote" | "edit" | "full" }

export interface Profile {
  name: string; country: string; photo: string | null; contact: string;
  socials: { ig: string; x: string; tt: string };
  aura: number; auraByVotes: number; trophies: number;
  attended: number; participated: number; organized: number;
  history: number[];
}

export interface OrganizerAccount { name: string; contact: string; country: string; refs: string; email: string; collaborators: Collaborator[] }

export const levelFromAura = (aura: number) => Math.max(1, Math.floor(Math.sqrt(aura / 90)));

let toastSeq = 1;
let feedSeq = 100;
let chatSeq = 1000;

const uid = () => Math.random().toString(36).slice(2, 9);

/* Build a seeded elimination bracket from any list of competitor ids */
const makeBracket = (eventId: string, source: (string | null)[]): BracketMatch[] => {
  const parts: (string | null)[] = [...source];
  let size = 4;
  while (size < parts.length) size *= 2;
  while (parts.length < size) parts.push(null);
  for (let i = parts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [parts[i], parts[j]] = [parts[j], parts[i]];
  }
  const rounds = Math.log2(size);
  const bracket: BracketMatch[] = [];
  let idx = 0;
  for (let r = 0; r < rounds; r++) {
    const count = size / Math.pow(2, r + 1);
    for (let i = 0; i < count; i++) {
      bracket.push({
        id: `${eventId}m${++idx}`, round: r,
        a: r === 0 ? parts[i * 2] : null, b: r === 0 ? parts[i * 2 + 1] : null,
        winner: null, votesA: 0, votesB: 0, duration: 10,
      });
    }
  }
  return bracket;
};

interface AppState {
  lang: Lang; tab: Tab; activeEventId: string;
  supabaseUserId: string | null; supabaseProfileId: string | null; authBusy: boolean; authed: boolean;
  users: FarmUser[]; totalAura: number; farmProg: Record<string, number>; feed: FeedItem[];
  challenges: Challenge[]; streak: number; lastStreakDate: string;
  profile: Profile; votesCast: number;
  myVotes: Record<string, Record<string, number>>;
  battleVotes: Record<string, Record<string, string>>;
  myRatings: Record<string, number>;
  myAttendance: Record<string, "participant" | "spectator">;
  events: EventItem[];
  toasts: Toast[];
  premium: boolean;
  organizer: OrganizerAccount | null; orgUnlocked: boolean;
  banners: Banner[];
  settings: { notifFarm: boolean; notifEvents: boolean; publicProfile: boolean; showCountry: boolean };
  adminUnlocked: boolean;

  t: (key: string, vars?: Record<string, string | number>) => string;
  setLang: (l: Lang) => void; setTab: (t: Tab) => void; enterArena: (eventId: string) => void;
  tick: () => void; toast: (msg: string, kind?: Toast["kind"]) => void; dismissToast: (id: number) => void;
  toggleChallenge: (id: string) => void;
  voteCompetitor: (eventId: string, userId: string, score: number) => void;
  removeVote: (eventId: string, userId: string) => void;
  voteBattle: (eventId: string, matchId: string, side: "a" | "b") => void;
  rateEvent: (eventId: string, stars: number) => void;
  sendChat: (eventId: string, text: string) => void;
  confirmAttendance: (eventId: string, role: "participant" | "spectator", name: string) => boolean;
  createEvent: (e: EventItem) => void; updateEvent: (id: string, patch: Partial<EventItem>) => void;
  cancelEvent: (id: string) => void;
  generateBracket: (eventId: string) => void;
  setMatchDuration: (eventId: string, matchId: string, duration: number) => void;
  setCurrentMatch: (eventId: string, matchId: string) => void;
  pickWinner: (eventId: string, matchId: string, side: "a" | "b") => void;
  voidMatchVotes: (eventId: string, matchId: string) => void; voidEventVotes: (eventId: string) => void;
  voidMyBattleVote: (eventId: string, matchId: string) => void;
  createGroups: (eventId: string) => void; setGroupLive: (eventId: string, groupId: string) => void;
  addManualGroup: (eventId: string, participantIds: string[]) => void; removeGroup: (eventId: string, groupId: string) => void;
  closeGroup: (eventId: string, groupId: string) => void; promoteGroups: (eventId: string) => void;
  voteGroup: (eventId: string, groupId: string, pid: string) => void;
  undoGroupVote: (eventId: string, groupId: string) => void;
  voidGroupVotes: (eventId: string, groupId: string) => void;
  loadEventsFromSupabase: () => Promise<void>;
  initSupabaseAuth: () => Promise<void>;
  addGuestParticipant: (eventId: string, name: string) => Promise<void>;
  loginAppUser: (email: string, password: string) => Promise<boolean>;
  registerAppUser: (email: string, password: string, name: string, country: string) => Promise<boolean>;
  logoutOrganizer: () => Promise<void>;
  logoutAppUser: () => Promise<void>;
  registerOrganizerReal: (email: string, password: string, name: string, contact: string, country: string, refs: string) => Promise<boolean>;
  loginOrganizerReal: (email: string, password: string) => Promise<boolean>;
  inviteCollab: (c: Collaborator) => void; removeCollab: (i: number) => void; setCollabPerm: (i: number, p: Collaborator["perm"]) => void;
  setProfile: (p: Partial<Profile>) => void; toggleSetting: (k: keyof AppState["settings"]) => void;
  activatePremium: () => void;
  adminLogin: (pass: string) => Promise<boolean>; adminExit: () => void;
  saveBanner: (b: Banner) => void; deleteBanner: (id: string) => void;
}

const feedItem = (type: FeedItem["type"], user: string, flag: string, n?: number, event?: string): FeedItem =>
  ({ id: ++feedSeq, type, user, flag, n, event, ts: Date.now() });

const initialFeed: FeedItem[] = [
  feedItem("farm", "Kai Nakamura", "🇯🇵", 240),
  feedItem("vote", "Emma Johnson", "🇺🇸", undefined, "Duelo de Auras CDMX"),
  feedItem("win", "Luna Reyes", "🇲🇽", undefined, "Duelo de Auras CDMX"),
  feedItem("farm", "Zoe Laurent", "🇫🇷", 180),
  feedItem("badge", "Sofía Almeida", "🇵🇹"),
  feedItem("join", "Lucas Weber", "🇩🇪", undefined, "Paris Aura Clash"),
];

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      lang: "es", tab: "live", activeEventId: "e1",
      users: USERS, totalAura: 84_211_540, farmProg: Object.fromEntries(USERS.map((u, i) => [u.id, (i * 23) % 100])),
      feed: initialFeed,
      challenges: CHALLENGES, streak: 4, lastStreakDate: new Date().toDateString(),
      profile: {
        name: "Alex Rivera", country: "mx", photo: null, contact: "@alex.aura",
        socials: { ig: "@alex.aura", x: "@alexfarm", tt: "@alex.aura" },
        aura: 24680, auraByVotes: 8420, trophies: 2,
        attended: 3, participated: 1, organized: 0,
        history: [6200, 7800, 9100, 10400, 12100, 13900, 15200, 17800, 19600, 21400, 23100, 24680],
      },
      supabaseUserId: null, supabaseProfileId: null, authBusy: false, authed: false,
      votesCast: 0, myVotes: {}, battleVotes: {}, myRatings: {}, myAttendance: {},
      events: EVENTS,
      toasts: [], premium: false, organizer: null, orgUnlocked: false,
      banners: [
        { id: "bn1", text: "⚡ AuraEnergy Drink — Energía para farmear toda la noche", link: "https://example.com/aura-energy", color: "#9B30FF", active: true },
      ],
      settings: { notifFarm: true, notifEvents: true, publicProfile: true, showCountry: true },
      adminUnlocked: false,

      t: (key, vars) => translate(get().lang, key, vars),

      setLang: (l) => set({ lang: l }),
      setTab: (t) => set({ tab: t }),
      enterArena: (eventId) => set({ tab: "arena", activeEventId: eventId }),

      toast: (msg, kind = "ok") => {
        const id = ++toastSeq;
        set((s) => ({ toasts: [...s.toasts.slice(-2), { id, msg, kind }] }));
        setTimeout(() => get().dismissToast(id), 3000);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      tick: () =>
        set((s) => {
          const users = s.users.map((u) =>
            u.online && Math.random() < 0.65 ? { ...u, aura: u.aura + 8 + Math.floor(Math.random() * 42) } : u
          );
          const farmProg = { ...s.farmProg };
          users.forEach((u) => { farmProg[u.id] = (farmProg[u.id] + 7 + Math.random() * 16) % 100; });
          let feed = s.feed;
          const roll = Math.random();
          const ru = users[Math.floor(Math.random() * users.length)];
          const randomEvent = () => (s.events.length > 0 ? s.events[Math.floor(Math.random() * s.events.length)] : undefined);
          if (roll < 0.45) feed = [feedItem("farm", ru.name, countryById(ru.country).flag, 20 + Math.floor(Math.random() * 220)), ...feed];
          else if (roll < 0.62) feed = [feedItem("vote", ru.name, countryById(ru.country).flag, undefined, randomEvent()?.name), ...feed];
          else if (roll < 0.72) feed = [feedItem("join", ru.name, countryById(ru.country).flag, undefined, randomEvent()?.name), ...feed];
          return { users, farmProg, feed: feed.slice(0, 9), totalAura: s.totalAura + 400 + Math.floor(Math.random() * 2400) };
        }),

      toggleChallenge: (id) => {
        const s = get();
        const ch = s.challenges.find((c) => c.id === id);
        if (!ch || ch.done) return;
        const challenges = s.challenges.map((c) => (c.id === id ? { ...c, done: true } : c));
        const allDone = challenges.every((c) => c.done);
        const today = new Date().toDateString();
        const streak = allDone && s.lastStreakDate !== today ? s.streak + 1 : s.streak;
        const history = allDone ? [...s.profile.history, s.profile.aura + ch.points] : s.profile.history;
        set({
          challenges, streak,
          lastStreakDate: allDone ? today : s.lastStreakDate,
          profile: { ...s.profile, aura: s.profile.aura + ch.points, history },
        });
        s.toast(translate(s.lang, "t_challenge", { n: ch.points }), "gold");
        if (allDone) s.toast(translate(s.lang, "ch_all_done"), "gold");
      },

      voteCompetitor: (eventId, userId, score) => {
        const s = get();
        const ev = s.events.find((e) => e.id === eventId);
        if (!ev) return;
        const prev = s.myVotes[eventId]?.[userId];
        const myVotes = { ...s.myVotes, [eventId]: { ...(s.myVotes[eventId] ?? {}), [userId]: score } };
        const votes = { ...ev.votes, [userId]: (ev.votes[userId] ?? 0) + score - (prev ?? 0) };
        set({
          myVotes, votesCast: s.votesCast + (prev ? 0 : 1),
          events: s.events.map((e) => (e.id === eventId ? { ...e, votes } : e)),
        });
        if (!prev && s.votesCast + 1 >= 3) get().toggleChallenge("ch2");
        s.toast(translate(s.lang, "t_voted"));

        const { supabaseProfileId } = get();
        if (supabaseProfileId) {
          supabase
            .from("votes")
            .upsert(
              { event_id: eventId, voter_id: supabaseProfileId, target_user_id: userId, context: "general", score },
              { onConflict: "event_id,voter_id,target_user_id,context" }
            )
            .then(({ error }) => {
              if (error) console.error("Error guardando voto en Supabase:", error.message);
            });
        }
      },

      removeVote: (eventId, userId) => {
        const s = get();
        const ev = s.events.find((e) => e.id === eventId);
        const score = s.myVotes[eventId]?.[userId];
        if (!ev || !score) return;
        const rest = { ...(s.myVotes[eventId] ?? {}) };
        delete rest[userId];
        const votes = { ...ev.votes, [userId]: Math.max(0, (ev.votes[userId] ?? 0) - score) };
        set({
          myVotes: { ...s.myVotes, [eventId]: rest },
          events: s.events.map((e) => (e.id === eventId ? { ...e, votes } : e)),
        });
        s.toast(translate(s.lang, "t_vote_removed"), "warn");
      },

      voteBattle: (eventId, matchId, side) => {
        const s = get();
        const ev = s.events.find((e) => e.id === eventId);
        if (!ev) return;
        const prev = s.battleVotes[eventId]?.[matchId];
        if (prev === side) return;
        const bracket = ev.bracket.map((m) => {
          if (m.id !== matchId) return m;
          let { votesA, votesB } = m;
          if (prev === "a") votesA--; if (prev === "b") votesB--;
          if (side === "a") votesA++; if (side === "b") votesB++;
          return { ...m, votesA, votesB };
        });
        const battleVotes = { ...s.battleVotes, [eventId]: { ...(s.battleVotes[eventId] ?? {}), [matchId]: side } };
        const m = ev.bracket.find((x) => x.id === matchId)!;
        const pid = side === "a" ? m.a : m.b;
        const votes = pid ? { ...ev.votes, [pid]: (ev.votes[pid] ?? 0) + 1 } : ev.votes;
        set({
          battleVotes, votesCast: s.votesCast + (prev ? 0 : 1),
          events: s.events.map((e) => (e.id === eventId ? { ...e, bracket, votes } : e)),
        });
        if (!prev && s.votesCast + 1 >= 3) get().toggleChallenge("ch2");
        s.toast(translate(s.lang, "t_battle_voted"), "gold");
      },

      rateEvent: (eventId, stars) => {
        const s = get();
        set({ myRatings: { ...s.myRatings, [eventId]: stars } });
        const ev = s.events.find((e) => e.id === eventId);
        if (ev) {
          const newRating = Math.round(((ev.organizerRating + stars) / 2) * 10) / 10;
          set({ events: get().events.map((e) => (e.id === eventId ? { ...e, organizerRating: newRating } : e)) });
        }
        s.toast(translate(s.lang, "ar_thanks_rate"), "gold");
      },

      sendChat: (eventId, text) => {
        const s = get();
        const mine: ChatMsg = { id: ++chatSeq, user: s.profile.name, hue: 46, text, mine: true, ts: Date.now() };
        set({ events: s.events.map((e) => (e.id === eventId ? { ...e, chat: [...e.chat, mine] } : e)) });
        if (Math.random() < 0.75) {
          const name = CHAT_NAMES[Math.floor(Math.random() * CHAT_NAMES.length)];
          const reply: ChatMsg = { id: ++chatSeq, user: name, hue: Math.floor(Math.random() * 360), text: BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)], ts: Date.now() + 1800 };
          setTimeout(() => {
            set((st) => ({ events: st.events.map((e) => (e.id === eventId ? { ...e, chat: [...e.chat, { ...reply, ts: Date.now() }] } : e)) }));
          }, 1600 + Math.random() * 1600);
        }
      },

      confirmAttendance: (eventId, role, name) => {
        const s = get();
        const ev = s.events.find((e) => e.id === eventId);
        if (!ev) return false;
        if (role === "participant") {
          if (ev.participants.length >= ev.maxParticipants) {
            set({ events: s.events.map((e) => (e.id === eventId ? { ...e, waitlist: [...e.waitlist, name] } : e)) });
            s.toast(translate(s.lang, "t_waitlisted"), "warn");
            return false;
          }
          set({
            events: s.events.map((e) => (e.id === eventId ? { ...e, participants: [...e.participants, "me"] } : e)),
            myAttendance: { ...s.myAttendance, [eventId]: "participant" },
            profile: { ...s.profile, participated: s.profile.participated + 1 },
          });
          get().toggleChallenge("ch3");
          s.toast(translate(s.lang, "t_conf_part"), "gold");

          const { supabaseProfileId } = get();
          if (supabaseProfileId) {
            supabase
              .from("event_participants")
              .insert({ event_id: eventId, user_id: supabaseProfileId, role: "participant" })
              .then(({ error }) => {
                if (error) console.error("Error guardando inscripción en Supabase:", error.message);
              });
          }
          return true;
        }
        set({
          events: s.events.map((e) => (e.id === eventId ? { ...e, attendees: e.attendees + 1 } : e)),
          myAttendance: { ...s.myAttendance, [eventId]: "spectator" },
          profile: { ...s.profile, attended: s.profile.attended + 1 },
        });
        s.toast(translate(s.lang, "t_conf_spec"));

        const { supabaseProfileId: specProfileId } = get();
        if (specProfileId) {
          supabase
            .from("event_participants")
            .insert({ event_id: eventId, user_id: specProfileId, role: "spectator" })
            .then(({ error }) => {
              if (error) console.error("Error guardando asistencia en Supabase:", error.message);
            });
        }
        return true;
      },

      createEvent: (e) => {
        const s = get();
        set({
          events: [e, ...s.events],
          profile: { ...s.profile, organized: s.profile.organized + 1 },
          feed: [feedItem("badge", s.profile.name, countryById(s.profile.country).flag), ...s.feed].slice(0, 9),
        });
        s.toast(translate(s.lang, "t_event_created"), "gold");
      },
      updateEvent: (id, patch) => {
        set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
        get().toast(translate(get().lang, "org_saved"));
      },
      cancelEvent: (id) => {
        set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, status: "cancelled" as const, currentMatchId: null } : e)) }));
        get().toast(translate(get().lang, "t_event_cancelled"), "warn");
      },

      generateBracket: (eventId) => {
        const s = get();
        const ev = s.events.find((e) => e.id === eventId);
        if (!ev) return;
        const bracket = makeBracket(eventId, ev.participants);
        set({ events: s.events.map((e) => (e.id === eventId ? { ...e, bracket } : e)) });
        s.toast(translate(s.lang, "t_bracket_gen"), "gold");
      },

      /* ================= GROUP PHASE (3+ fighters per battle, before the bracket) ================= */
      addManualGroup: (eventId, participantIds) => {
        if (participantIds.length < 2) return;
        const s = get();
        const ev = s.events.find((e) => e.id === eventId);
        if (!ev) return;
        const nextLetter = String.fromCharCode(65 + ev.groups.length);
        const newGroup: BattleGroup = {
          id: `${eventId}g${Date.now()}`, name: nextLetter,
          fighters: participantIds, votes: {}, status: "open", winner: null,
        };
        set({ events: s.events.map((e) => (e.id === eventId ? { ...e, groups: [...e.groups, newGroup] } : e)) });
        s.toast(translate(s.lang, "t_bracket_gen"), "gold");
      },

      removeGroup: (eventId, groupId) => {
        const s = get();
        set({ events: s.events.map((e) => (e.id === eventId ? { ...e, groups: e.groups.filter((g) => g.id !== groupId) } : e)) });
      },

      createGroups: (eventId) => {
        const s = get();
        const ev = s.events.find((e) => e.id === eventId);
        if (!ev || ev.participants.length < 3) return;
        const pids = [...ev.participants];
        for (let i = pids.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pids[i], pids[j]] = [pids[j], pids[i]];
        }
        const k = Math.max(1, Math.ceil(pids.length / 4));
        const groups: BattleGroup[] = Array.from({ length: k }, (_, g) => ({
          id: `${eventId}g${g + 1}`, name: String.fromCharCode(65 + g),
          fighters: [], votes: {}, status: "open" as const, winner: null,
        }));
        pids.forEach((p, i) => groups[i % k].fighters.push(p));
        set({ events: s.events.map((e) => (e.id === eventId ? { ...e, groups } : e)) });
        s.toast(translate(s.lang, "t_bracket_gen"), "gold");
      },

      setGroupLive: (eventId, groupId) => {
        const s = get();
        set({ events: s.events.map((e) => (e.id === eventId ? { ...e, groups: e.groups.map((g) => (g.id === groupId ? { ...g, status: "live" as const } : g)) } : e)) });
        s.toast(translate(s.lang, "t_current_set"), "gold");
      },

      closeGroup: (eventId, groupId) => {
        const s = get();
        const ev = s.events.find((e) => e.id === eventId);
        const g = ev?.groups.find((x) => x.id === groupId);
        if (!ev || !g) return;
        const winner = Object.entries(g.votes).sort((a, b) => b[1] - a[1])[0]?.[0] ?? g.fighters[0] ?? null;
        const wu = s.users.find((u) => u.id === winner);
        const feed = wu ? [feedItem("win", wu.name, countryById(wu.country).flag, undefined, ev.name), ...s.feed].slice(0, 9) : s.feed;
        set({
          events: get().events.map((e) => (e.id === eventId ? { ...e, groups: e.groups.map((x) => (x.id === groupId ? { ...x, status: "closed" as const, winner } : x)) } : e)),
          feed,
        });
        get().toast(translate(get().lang, "org_group_closed_toast"), "gold");
      },

      promoteGroups: (eventId) => {
        const s = get();
        const ev = s.events.find((e) => e.id === eventId);
        if (!ev) return;
        const winners = ev.groups.filter((g) => g.status === "closed" && g.winner).map((g) => g.winner as string);
        if (winners.length < 2) return;
        set({ events: s.events.map((e) => (e.id === eventId ? { ...e, bracket: makeBracket(eventId, winners) } : e)) });
        s.toast(translate(s.lang, "org_promote_toast"), "gold");
      },

      voteGroup: (eventId, groupId, pid) => {
        const s = get();
        const ev = s.events.find((e) => e.id === eventId);
        const g = ev?.groups.find((x) => x.id === groupId);
        if (!ev || !g || g.status !== "live") return;
        const gKey = "g_" + groupId;
        const prev = s.battleVotes[eventId]?.[gKey];
        if (prev === pid) return;
        const battleVotes = { ...s.battleVotes, [eventId]: { ...(s.battleVotes[eventId] ?? {}), [gKey]: pid } };
        set({
          battleVotes, votesCast: s.votesCast + (prev ? 0 : 1),
          events: s.events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  groups: e.groups.map((x) =>
                    x.id === groupId
                      ? { ...x, votes: { ...(prev ? { ...x.votes, [prev]: Math.max(0, (x.votes[prev] ?? 0) - 1) } : x.votes), [pid]: (x.votes[pid] ?? 0) + 1 } }
                      : x
                  ),
                  votes: { ...e.votes, ...(prev ? { [prev]: Math.max(0, (e.votes[prev] ?? 0) - 1) } : {}), [pid]: (e.votes[pid] ?? 0) + 1 },
                }
              : e
          ),
        });
        if (!prev && s.votesCast + 1 >= 3) get().toggleChallenge("ch2");
        s.toast(translate(s.lang, "t_battle_voted"), "gold");
      },

      undoGroupVote: (eventId, groupId) => {
        const s = get();
        const gKey = "g_" + groupId;
        const prev = s.battleVotes[eventId]?.[gKey];
        if (!prev) return;
        const rest = { ...(s.battleVotes[eventId] ?? {}) };
        delete rest[gKey];
        set({
          battleVotes: { ...s.battleVotes, [eventId]: rest },
          events: s.events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  groups: e.groups.map((x) => (x.id === groupId ? { ...x, votes: { ...x.votes, [prev]: Math.max(0, (x.votes[prev] ?? 0) - 1) } } : x)),
                  votes: { ...e.votes, [prev]: Math.max(0, (e.votes[prev] ?? 0) - 1) },
                }
              : e
          ),
        });
        s.toast(translate(s.lang, "t_vote_removed"), "warn");
      },

      voidGroupVotes: (eventId, groupId) => {
        const s = get();
        const gKey = "g_" + groupId;
        const battleVotes = { ...s.battleVotes };
        if (battleVotes[eventId]) delete battleVotes[eventId][gKey];
        set({
          battleVotes,
          events: s.events.map((e) => (e.id === eventId ? { ...e, groups: e.groups.map((x) => (x.id === groupId ? { ...x, votes: {} } : x)) } : e)),
        });
        s.toast(translate(s.lang, "t_votes_void"), "warn");
      },

      setMatchDuration: (eventId, matchId, duration) =>
        set((s) => ({ events: s.events.map((e) => (e.id === eventId ? { ...e, bracket: e.bracket.map((m) => (m.id === matchId ? { ...m, duration } : m)) } : e)) })),

      setCurrentMatch: (eventId, matchId) => {
        set((s) => ({ events: s.events.map((e) => (e.id === eventId ? { ...e, currentMatchId: matchId } : e)) }));
        get().toast(translate(get().lang, "t_current_set"), "gold");
      },

      pickWinner: (eventId, matchId, side) => {
        const s = get();
        const ev = s.events.find((e) => e.id === eventId);
        if (!ev) return;
        const m = ev.bracket.find((x) => x.id === matchId);
        if (!m) return;
        const winnerId = side === "a" ? m.a : m.b;
        const roundMatches = ev.bracket.filter((x) => x.round === m.round);
        const myIndex = roundMatches.findIndex((x) => x.id === matchId);
        const nextRound = ev.bracket.filter((x) => x.round === m.round + 1);
        let bracket = ev.bracket.map((x) => (x.id === matchId ? { ...x, winner: side } : x));
        if (nextRound.length > 0 && winnerId) {
          const target = nextRound[Math.floor(myIndex / 2)];
          const slot = myIndex % 2 === 0 ? "a" : "b";
          bracket = bracket.map((x) => (x.id === target.id ? { ...x, [slot]: winnerId } : x));
        }
        const winnerUser = s.users.find((u) => u.id === winnerId);
        const feed = winnerUser
          ? [feedItem("win", winnerUser.name, countryById(winnerUser.country).flag, undefined, ev.name), ...s.feed].slice(0, 9)
          : s.feed;
        set({ events: s.events.map((e) => (e.id === eventId ? { ...e, bracket, currentMatchId: null } : e)), feed });
        s.toast(translate(s.lang, "t_winner_set"), "gold");
      },

      voidMatchVotes: (eventId, matchId) => {
        const s = get();
        const battleVotes = { ...s.battleVotes };
        if (battleVotes[eventId]) delete battleVotes[eventId][matchId];
        set({
          battleVotes,
          events: s.events.map((e) => (e.id === eventId ? { ...e, bracket: e.bracket.map((m) => (m.id === matchId ? { ...m, votesA: 0, votesB: 0 } : m)) } : e)),
        });
        s.toast(translate(s.lang, "t_votes_void"), "warn");
      },
      voidMyBattleVote: (eventId, matchId) => {
        const s = get();
        const pick = s.battleVotes[eventId]?.[matchId];
        if (!pick) return;
        const battleVotes = { ...s.battleVotes, [eventId]: { ...(s.battleVotes[eventId] ?? {}) } };
        delete battleVotes[eventId][matchId];
        set({
          battleVotes,
          events: s.events.map((e) =>
            e.id === eventId
              ? { ...e, bracket: e.bracket.map((m) => (m.id === matchId ? { ...m, votesA: m.votesA - (pick === "a" ? 1 : 0), votesB: m.votesB - (pick === "b" ? 1 : 0) } : m)) }
              : e
          ),
        });
        s.toast(translate(s.lang, "t_vote_removed"), "warn");
      },

      voidEventVotes: (eventId) => {
        const s = get();
        const myVotes = { ...s.myVotes };
        delete myVotes[eventId];
        set({ myVotes, events: s.events.map((e) => (e.id === eventId ? { ...e, votes: {} } : e)) });
        s.toast(translate(s.lang, "t_votes_void"), "warn");
      },

      logoutOrganizer: async () => {
        try { await supabase.auth.signOut({ scope: "global" }); } catch (e) { console.error("Error cerrando sesión organizador:", e); }
        localStorage.removeItem("aurafarm-store");
        set({
          organizer: null, orgUnlocked: false, supabaseUserId: null, supabaseProfileId: null,
          profile: { name: "Usuario", country: "", photo: null, contact: "", socials: { ig: "", x: "", tt: "" }, aura: 0, auraByVotes: 0, trophies: 0, attended: 0, participated: 0, organized: 0, history: [] },
        });
        await get().initSupabaseAuth();
        await get().loadEventsFromSupabase();
      },

      logoutAppUser: async () => {
        if (get().authBusy) return;
        set({ authBusy: true });
        try {
          await supabase.auth.signOut({ scope: "global" });
        } catch (e) {
          console.error("Error cerrando sesión Supabase:", e);
        }
        localStorage.removeItem("aurafarm-store");
        set({
          supabaseUserId: null, supabaseProfileId: null, organizer: null, orgUnlocked: false, authed: false,
          profile: { name: "Usuario", country: "", photo: null, contact: "", socials: { ig: "", x: "", tt: "" }, aura: 0, auraByVotes: 0, trophies: 0, attended: 0, participated: 0, organized: 0, history: [] },
        });
        await get().initSupabaseAuth();
        await get().loadEventsFromSupabase();
        get().toast(translate(get().lang, "t_session_closed") || "Sesión cerrada", "ok");
        set({ authBusy: false });
      },

      registerOrganizerReal: async (email, password, name, contact, country, refs) => {
        const s = get();
        const { error } = await supabase.auth.updateUser({ email, password });
        if (error) { console.error(error.message); s.toast(translate(s.lang, "t_wrong_pin"), "warn"); return false; }
        const { supabaseProfileId } = get();
        if (supabaseProfileId) await supabase.from("profiles").update({ name, role: "organizer" }).eq("id", supabaseProfileId);
        set({ organizer: { name, contact, country, refs, email, collaborators: [] }, orgUnlocked: true, profile: { ...get().profile, name } });
        s.toast(translate(s.lang, "t_registered"), "gold");
        return true;
      },
      loginOrganizerReal: async (email, password) => {
        const s = get();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) { s.toast(translate(s.lang, "t_wrong_pin"), "warn"); return false; }
        const { data: profile } = await supabase.from("profiles").select("id, name, role").eq("auth_id", data.user.id).maybeSingle();
        if (!profile || profile.role !== "organizer") { s.toast(translate(s.lang, "t_wrong_pin"), "warn"); return false; }
        set({ supabaseUserId: data.user.id, supabaseProfileId: profile.id, organizer: { name: profile.name, contact: "", country: "mx", refs: "", email, collaborators: [] }, orgUnlocked: true, profile: { ...get().profile, name: profile.name } });
        await get().loadEventsFromSupabase();
        s.toast(translate(s.lang, "t_unlocked"), "gold");
        return true;
      },
      inviteCollab: (c) => {
        const s = get();
        if (!s.organizer) return;
        set({ organizer: { ...s.organizer, collaborators: [...s.organizer.collaborators, c] } });
        s.toast(translate(s.lang, "t_collab_added"));
      },
      removeCollab: (i) => {
        const s = get();
        if (!s.organizer) return;
        set({ organizer: { ...s.organizer, collaborators: s.organizer.collaborators.filter((_, x) => x !== i) } });
        s.toast(translate(s.lang, "t_collab_removed"), "warn");
      },
      setCollabPerm: (i, p) => {
        const s = get();
        if (!s.organizer) return;
        set({ organizer: { ...s.organizer, collaborators: s.organizer.collaborators.map((c, x) => (x === i ? { ...c, perm: p } : c)) } });
      },

      setProfile: (p) => {
        set((s) => ({ profile: { ...s.profile, ...p } }));
        get().toast(translate(get().lang, "t_saved"));
      },
      toggleSetting: (k) => set((s) => ({ settings: { ...s.settings, [k]: !s.settings[k] } })),
      activatePremium: () => {
        set({ premium: true });
        get().toast(translate(get().lang, "t_premium"), "gold");
      },

      initSupabaseAuth: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;

        const isAnon = (user as any)?.is_anonymous === true || user?.email == null;
        if (!user || isAnon) {
          if (isAnon) await supabase.auth.signOut().catch(() => {});
          set({ authed: false, supabaseUserId: null, supabaseProfileId: null });
          return;
        }

        const userId = user.id;
        set({ supabaseUserId: userId, authed: true });

        const { data: existing } = await supabase
          .from("profiles")
          .select("id, name, country, aura, trophies, role")
          .eq("auth_id", userId)
          .maybeSingle();

        if (existing) {
          set({ supabaseProfileId: existing.id, profile: { ...get().profile, name: existing.name, country: existing.country ?? get().profile.country } });
          if (existing.role === "organizer" && !get().orgUnlocked) {
            set({
              organizer: { name: existing.name, contact: "", country: existing.country ?? "mx", refs: "", email: session?.user?.email ?? "", collaborators: [] },
              orgUnlocked: true,
              profile: { ...get().profile, name: existing.name },
            });
          }
          return;
        }

        const localProfile = get().profile;
        const { data: created, error: insertError } = await supabase
          .from("profiles")
          .insert({ auth_id: userId, name: localProfile.name, country: localProfile.country })
          .select("id")
          .single();

        if (insertError) {
          console.error("Error creando perfil en Supabase:", insertError.message);
          return;
        }
        set({ supabaseProfileId: created.id });
      },

      loginAppUser: async (email, password) => {
        const s = get();
        if (s.authBusy) return false;
        set({ authBusy: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error || !data.user) {
            s.toast(translate(s.lang, "t_wrong_pin"), "warn");
            return false;
          }
          set({ supabaseUserId: data.user.id, authed: true });
          await get().initSupabaseAuth();
          await get().loadEventsFromSupabase();
          s.toast(translate(s.lang, "t_welcome_back"), "ok");
          return true;
        } catch (e) {
          console.error("Error al iniciar sesión:", e);
          s.toast(translate(s.lang, "t_wrong_pin"), "warn");
          return false;
        } finally {
          set({ authBusy: false });
        }
      },

      registerAppUser: async (email, password, name, country) => {
        const s = get();
        if (s.authBusy) return false;
        set({ authBusy: true });
        try {
          const { data, error } = await supabase.auth.signUp({ email, password });
          if (error || !data.user) {
            s.toast(translate(s.lang, "t_reg_error"), "warn");
            return false;
          }
          const { error: profError } = await supabase
            .from("profiles")
            .insert({ auth_id: data.user.id, name, country: country || "mx", role: "user" });
          if (profError) {
            console.error("Error creando perfil:", profError.message);
            s.toast(translate(s.lang, "t_reg_error"), "warn");
            return false;
          }
          set({
            supabaseUserId: data.user.id, authed: true,
            profile: { ...get().profile, name, country: country || "mx" },
          });
          await get().initSupabaseAuth();
          await get().loadEventsFromSupabase();
          s.toast(translate(s.lang, "t_registered_ok"), "gold");
          return true;
        } catch (e) {
          console.error("Error al registrarse:", e);
          s.toast(translate(s.lang, "t_reg_error"), "warn");
          return false;
        } finally {
          set({ authBusy: false });
        }
      },

      addGuestParticipant: async (eventId, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const s = get();
        const { data: profile, error: profError } = await supabase
          .from("profiles")
          .insert({ name: trimmed, country: "mx" })
          .select("id")
          .single();
        if (profError || !profile) {
          console.error("Error creando perfil de invitado:", profError?.message);
          s.toast(translate(s.lang, "t_admin_bad"), "warn");
          return;
        }
        const { error: partError } = await supabase
          .from("event_participants")
          .insert({ event_id: eventId, user_id: profile.id, role: "participant" });
        if (partError) {
          console.error("Error anotando invitado:", partError.message);
          s.toast(translate(s.lang, "t_admin_bad"), "warn");
          return;
        }
        await get().loadEventsFromSupabase();
        s.toast(translate(s.lang, "t_conf_part"), "gold");
      },

      loadEventsFromSupabase: async () => {
        const { data, error } = await supabase.from("events").select("*");
        if (error) {
          console.error("Error cargando eventos de Supabase:", error.message);
          return;
        }

        const { data: participantRows, error: partError } = await supabase
          .from("event_participants")
          .select("event_id, user_id, role");
        if (partError) console.error("Error cargando participantes:", partError.message);

        const participantsByEvent: Record<string, string[]> = {};
        const attendeesByEvent: Record<string, number> = {};
        (participantRows ?? []).forEach((row: any) => {
          if (row.role === "spectator") {
            attendeesByEvent[row.event_id] = (attendeesByEvent[row.event_id] ?? 0) + 1;
          } else {
            (participantsByEvent[row.event_id] ??= []).push(row.user_id);
          }
        });

        const allParticipantIds = Array.from(new Set(Object.values(participantsByEvent).flat()));
        if (allParticipantIds.length > 0) {
          const { data: realProfiles, error: profError } = await supabase
            .from("profiles")
            .select("id, name, country, hue, aura, trophies")
            .in("id", allParticipantIds);
          if (profError) {
            console.error("Error cargando perfiles de participantes:", profError.message);
          } else if (realProfiles) {
            const existingIds = new Set(get().users.map((u) => u.id));
            const newUsers: FarmUser[] = realProfiles
              .filter((p: any) => !existingIds.has(p.id))
              .map((p: any) => ({
                id: p.id, name: p.name, country: p.country, hue: p.hue ?? 200, online: true,
                aura: p.aura ?? 0, auraByVotes: 0, trophies: p.trophies ?? 0,
                level: levelFromAura(p.aura ?? 0), role: "participant" as const,
              }));
            if (newUsers.length > 0) set((s) => ({ users: [...s.users, ...newUsers] }));
          }
        }

        const mapped: EventItem[] = (data ?? []).map((row: any) => ({
          id: row.id,
          name: row.name,
          desc: { es: row.description ?? "", pt: row.description ?? "", fr: row.description ?? "", en: row.description ?? "" },
          country: row.country, city: row.city, lat: row.lat ?? 0, lng: row.lng ?? 0, address: row.address ?? "",
          dateISO: row.date_iso, time: row.event_time ?? "",
          organizer: "", organizerId: row.organizer_id ?? "", organizerRating: 0, organizerRefs: [],
          collaborators: [],
          maxParticipants: row.max_participants ?? 32, participants: participantsByEvent[row.id] ?? [], attendees: attendeesByEvent[row.id] ?? 0, waitlist: [],
          status: row.status,
          features: [], banner: ["#FFD700", "#9B30FF"] as [string, string],
          votes: {}, bracket: [], currentMatchId: null,
          groups: [],
          chat: [], notes: row.notes ?? "",
        }));
        set({ events: mapped });
      },

      adminLogin: async (pass) => {
        const ADMIN_HASH = "8890449cb8b0bfc34284d3a9bb169327dbca24fa47df764f43a82cace05cf0ea";
        const enc = new TextEncoder().encode(pass.trim());
        const digest = await crypto.subtle.digest("SHA-256", enc);
        const hashHex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
        if (hashHex === ADMIN_HASH) {
          set({ adminUnlocked: true });
          get().toast(translate(get().lang, "t_admin_ok"), "gold");
          return true;
        }
        get().toast(translate(get().lang, "t_admin_bad"), "warn");
        return false;
      },
      adminExit: () => set({ adminUnlocked: false }),
      saveBanner: (b) => {
        set((s) => {
          const exists = s.banners.some((x) => x.id === b.id);
          return { banners: exists ? s.banners.map((x) => (x.id === b.id ? b : x)) : [...s.banners, b] };
        });
        get().toast(translate(get().lang, "t_banner_saved"));
      },
      deleteBanner: (id) => {
        set((s) => ({ banners: s.banners.filter((b) => b.id !== id) }));
        get().toast(translate(get().lang, "t_banner_del"), "warn");
      },
    }),
    {
      name: "aurafarm-store",
      partialize: (s) => ({
        lang: s.lang, profile: s.profile, premium: s.premium, banners: s.banners,
        challenges: s.challenges, streak: s.streak, lastStreakDate: s.lastStreakDate,
        organizer: s.organizer, orgUnlocked: s.orgUnlocked, settings: s.settings,
        votesCast: s.votesCast, myVotes: s.myVotes, battleVotes: s.battleVotes,
        myRatings: s.myRatings, myAttendance: s.myAttendance,
      }),
    }
  )
);

export const userNameById = (id: string | null): string => {
  if (!id) return "TBD";
  if (id === "me") return "⭐ " + useApp.getState().profile.name;
  return useApp.getState().users.find((u) => u.id === id)?.name ?? "TBD";
};

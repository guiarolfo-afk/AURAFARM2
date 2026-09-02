import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "./i18n";
import { translate } from "./i18n";
import { CHALLENGES, countryById } from "./data";
import { supabase } from "./supabaseClient";
import type { FarmUser, EventItem, Challenge, BracketMatch, ChatMsg, BattleGroup } from "./data";

export type Tab = "live" | "events" | "org" | "arena" | "rank" | "set";

export interface FeedItem { id: number; type: "farm" | "join" | "vote" | "badge" | "win"; user: string; flag: string; event?: string; n?: number; ts: number }
export interface Toast { id: number; msg: string; kind: "ok" | "warn" | "gold" }
export interface Banner { id: string; text: string; link: string; color: string; active: boolean }
export interface Collaborator { name: string; email?: string; perm: "vote" | "edit" | "full" }

export interface Profile {
  name: string; country: string; photo: string | null; contact: string;
  socials: { ig: string; x: string; tt: string };
  aura: number; auraByVotes: number; trophies: number;
  attended: number; participated: number; organized: number;
  history: number[];
}

export interface OrganizerAccount { name: string; contact: string; country: string; refs: string; email: string; collaborators: Collaborator[] }

export const levelFromAura = (aura: number) => Math.max(1, Math.floor(Math.sqrt(aura / 90)));

export const titleFromLevel = (level: number, lang: string) => {
  if (level >= 16) return lang === "en" ? "Master" : lang === "fr" ? "Maître" : lang === "pt" ? "Mestre" : "Maestro";
  if (level >= 10) return "Oro";
  if (level >= 5) return "Plata";
  return "Bronce";
};

let toastSeq = 1;
let feedSeq = 100;
let chatSeq = 1000;

const VOTES_PER_DAY = 5;
const VOTES_TO_CLOSE_BATTLE = 5;
export const VOTE_REWARD = 10;
export const VOTES_PER_DAY_LABEL = VOTES_PER_DAY;

const syncDailyVotes = (st: { dailyVotes: number; dailyVotesDate: string }) => {
  const today = new Date().toDateString();
  if (st.dailyVotesDate !== today) return { dailyVotes: 0, dailyVotesDate: today };
  return { dailyVotes: st.dailyVotes, dailyVotesDate: st.dailyVotesDate };
};

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
  supabaseUserId: string | null; supabaseProfileId: string | null; authBusy: boolean; authed: boolean; isOAuth: boolean; userEmail: string | null;
  users: FarmUser[]; totalAura: number; farmProg: Record<string, number>; feed: FeedItem[];
  challenges: Challenge[]; streak: number; lastStreakDate: string;
  profile: Profile; votesCast: number;
  dailyVotes: number; dailyVotesDate: string;
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
  createEvent: (e: EventItem) => Promise<void>; updateEvent: (id: string, patch: Partial<EventItem>) => void;
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
  socialLogin: (provider: "google" | "apple" | "facebook") => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  logoutOrganizer: () => Promise<void>;
  logoutAppUser: () => Promise<void>;
  registerOrganizerReal: (email: string, password: string, name: string, contact: string, country: string, refs: string) => Promise<boolean>;
  loginOrganizerReal: (email: string, password: string) => Promise<boolean>;
  becomeOrganizer: (name: string, contact: string, refs: string) => Promise<boolean>;
  inviteCollab: (eventId: string, c: Collaborator) => Promise<void>; removeCollab: (eventId: string, i: number) => Promise<void>; setCollabPerm: (eventId: string, i: number, p: Collaborator["perm"]) => Promise<void>;
  setProfile: (p: Partial<Profile>) => void; toggleSetting: (k: keyof AppState["settings"]) => void;
  activatePremium: () => void;
  adminLogin: (pass: string) => Promise<boolean>; adminExit: () => void;
  saveBanner: (b: Banner) => void; deleteBanner: (id: string) => void;
}

const feedItem = (type: FeedItem["type"], user: string, flag: string, n?: number, event?: string): FeedItem =>
  ({ id: ++feedSeq, type, user, flag, n, event, ts: Date.now() });

const initialFeed: FeedItem[] = [
  feedItem("join", "Bienvenido a Aura Farm", "🌍", undefined, "Completa tus primeros retos"),
];

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      lang: "es", tab: "live", activeEventId: "e1",
            users: [], totalAura: 0, farmProg: {},
      feed: initialFeed,

      challenges: CHALLENGES, streak: 0, lastStreakDate: new Date().toDateString(),
      profile: {
        name: "Usuario", country: "mx", photo: null, contact: "",
        socials: { ig: "", x: "", tt: "" },
        aura: 0, auraByVotes: 0, trophies: 0,
        attended: 0, participated: 0, organized: 0,
        history: [],
      },
      supabaseUserId: null, supabaseProfileId: null, authBusy: false, authed: false, isOAuth: false, userEmail: null,
      votesCast: 0, dailyVotes: 0, dailyVotesDate: new Date().toDateString(), myVotes: {}, battleVotes: {}, myRatings: {}, myAttendance: {},
      events: [],


      toasts: [], premium: false, organizer: null, orgUnlocked: false,
      banners: [],
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

      tick: () => set((s) => ({ users: s.users, farmProg: s.farmProg, feed: s.feed, totalAura: s.totalAura })),

      toggleChallenge: (id) => {
        const s = get();
        const ch = s.challenges.find((c) => c.id === id);
        if (!ch || ch.done) return;
        const challenges = s.challenges.map((c) => (c.id === id ? { ...c, done: true } : c));
        const allDone = challenges.every((c) => c.done);
        const today = new Date().toDateString();
        const streak = allDone && s.lastStreakDate !== today ? s.streak + 1 : s.streak;
        const beforeLevel = levelFromAura(s.profile.aura);
        const afterAura = s.profile.aura + ch.points;
        const afterLevel = levelFromAura(afterAura);
        const levelUp = afterLevel > beforeLevel;
        const bonus = levelUp ? 500 : 0;
        const finalAura = afterAura + bonus;
        const history = allDone ? [...s.profile.history, finalAura] : s.profile.history;
        set({
          challenges, streak,
          lastStreakDate: allDone ? today : s.lastStreakDate,
          profile: { ...s.profile, aura: finalAura, history },
        });
        s.toast(translate(s.lang, "t_challenge", { n: ch.points }), "gold");
        if (levelUp) s.toast(`⭐ Nivel ${afterLevel} · ${titleFromLevel(afterLevel, s.lang)} · +500 bonus`, "gold");
        if (allDone) s.toast(translate(s.lang, "ch_all_done"), "gold");
      },

      voteCompetitor: (eventId, userId, score) => {
        const s = get();
        const ev = s.events.find((e) => e.id === eventId);
        if (!ev) return;
        const prev = s.myVotes[eventId]?.[userId];
        const sync = syncDailyVotes(s);
        const isNewVote = !prev;
        if (isNewVote && sync.dailyVotes >= VOTES_PER_DAY) {
          s.toast(translate(s.lang, "ar_vote_limit"), "warn");
          return;
        }
        const myVotes = { ...s.myVotes, [eventId]: { ...(s.myVotes[eventId] ?? {}), [userId]: score } };
        const votes = { ...ev.votes, [userId]: (ev.votes[userId] ?? 0) + score - (prev ?? 0) };
        set({
          myVotes,
          dailyVotes: sync.dailyVotes + (isNewVote ? 1 : 0), dailyVotesDate: sync.dailyVotesDate,
          votesCast: s.votesCast + (prev ? 0 : 1),
          profile: { ...s.profile, aura: s.profile.aura + (isNewVote ? VOTE_REWARD : 0) },
          events: s.events.map((e) => (e.id === eventId ? { ...e, votes } : e)),
        });
        if (!prev && s.votesCast + 1 >= 3) get().toggleChallenge("ch2");
        s.toast(prev ? translate(s.lang, "t_vote_updated") : translate(s.lang, "t_voted"));

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
        const sync = syncDailyVotes(s);
        const isNewVote = !prev;
        if (isNewVote && sync.dailyVotes >= VOTES_PER_DAY) {
          s.toast(translate(s.lang, "ar_vote_limit"), "warn");
          return;
        }
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
          battleVotes,
          dailyVotes: sync.dailyVotes + (isNewVote ? 1 : 0), dailyVotesDate: sync.dailyVotesDate,
          votesCast: s.votesCast + (prev ? 0 : 1),
          profile: { ...s.profile, aura: s.profile.aura + (isNewVote ? VOTE_REWARD : 0) },
          events: s.events.map((e) => (e.id === eventId ? { ...e, bracket, votes } : e)),
        });
        if (!prev && s.votesCast + 1 >= 3) get().toggleChallenge("ch2");
        s.toast(prev ? translate(s.lang, "t_battle_vote_updated") : translate(s.lang, "t_battle_voted"), "gold");

        const updatedBracket = get().events.find((x) => x.id === eventId)?.bracket.find((x) => x.id === matchId);
        if (updatedBracket && !updatedBracket.winner && updatedBracket.votesA + updatedBracket.votesB >= VOTES_TO_CLOSE_BATTLE) {
          get().pickWinner(eventId, matchId, updatedBracket.votesA >= updatedBracket.votesB ? "a" : "b");
        }

        const { supabaseProfileId } = get();
        if (supabaseProfileId) {
          supabase
            .from("votes")
            .upsert(
              { event_id: eventId, voter_id: supabaseProfileId, target_user_id: pid, context: "battle_" + matchId, score: side === "a" ? 1 : 2 },
              { onConflict: "event_id,voter_id,target_user_id,context" }
            )
            .then(({ error }) => {
              if (error) console.error("Error guardando voto de batalla:", error.message);
            });
        }
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

      createEvent: async (e) => {
        const s = get();
        const ownerId = s.supabaseProfileId ?? s.supabaseUserId;
        const base: EventItem = { ...e, organizerId: ownerId || "me", organizer: e.organizer || s.profile.name, organizerRating: 5 };
        const insertPayload: any = {
          name: e.name, description: e.desc.es ?? "", country: e.country, city: e.city ?? "",
          lat: e.lat ?? 0, lng: e.lng ?? 0, address: e.address ?? "",
          date_iso: e.dateISO, event_time: e.time ?? "",
          organizer_id: ownerId ?? null, max_participants: e.maxParticipants ?? 32,
          status: e.status, notes: e.notes ?? "",
        };
        let saved: EventItem = base;
        try {
          const { data, error } = await supabase
            .from("events")
            .insert(insertPayload)
            .select("id")
            .single();
          if (error) {
            console.error("Error guardando evento en Supabase:", error.message);
          } else if (data?.id) {
            saved = { ...base, id: data.id };
          }
        } catch (err) { console.error("Error guardando evento:", err); }
        set({
          events: [saved, ...s.events.filter((x) => x.id !== e.id)],
          profile: { ...s.profile, organized: s.profile.organized + 1 },
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
        const sync = syncDailyVotes(s);
        const isNewVote = !prev;
        if (isNewVote && sync.dailyVotes >= VOTES_PER_DAY) {
          s.toast(translate(s.lang, "ar_vote_limit"), "warn");
          return;
        }
        const battleVotes = { ...s.battleVotes, [eventId]: { ...(s.battleVotes[eventId] ?? {}), [gKey]: pid } };
        set({
          battleVotes,
          dailyVotes: sync.dailyVotes + (isNewVote ? 1 : 0), dailyVotesDate: sync.dailyVotesDate,
          votesCast: s.votesCast + (prev ? 0 : 1),
          profile: { ...s.profile, aura: s.profile.aura + (isNewVote ? VOTE_REWARD : 0) },
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
          organizer: null, orgUnlocked: false, supabaseUserId: null, supabaseProfileId: null, isOAuth: false, userEmail: null,
          profile: { name: "Usuario", country: "", photo: null, contact: "", socials: { ig: "", x: "", tt: "" }, aura: 0, auraByVotes: 0, trophies: 0, attended: 0, participated: 0, organized: 0, history: [] },
        });
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
          supabaseUserId: null, supabaseProfileId: null, organizer: null, orgUnlocked: false, authed: false, isOAuth: false, userEmail: null,
          profile: { name: "Usuario", country: "", photo: null, contact: "", socials: { ig: "", x: "", tt: "" }, aura: 0, auraByVotes: 0, trophies: 0, attended: 0, participated: 0, organized: 0, history: [] },
        });
        get().toast(translate(get().lang, "t_session_closed") || "Sesión cerrada", "ok");
        set({ authBusy: false });
      },

      registerOrganizerReal: async (email, password, name, contact, country, refs) => {
        const s = get();
        const { error } = await supabase.auth.updateUser({ email, password });
        if (error) { console.error(error.message); s.toast(translate(s.lang, "t_wrong_pin"), "warn"); return false; }
        const { supabaseProfileId } = get();
        if (supabaseProfileId) await supabase.from("profiles").update({ name, role: "organizer" }).eq("id", supabaseProfileId);
        set({ organizer: { name, contact, country, refs, email, collaborators: [] }, orgUnlocked: true, profile: { ...get().profile, name }, userEmail: email });
        s.toast(translate(s.lang, "t_registered"), "gold");
        return true;
      },
      loginOrganizerReal: async (email, password) => {
        const s = get();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) { s.toast(translate(s.lang, "t_wrong_pin"), "warn"); return false; }
        const { data: profile } = await supabase.from("profiles").select("id, name, role").eq("auth_id", data.user.id).maybeSingle();
        if (!profile || profile.role !== "organizer") { s.toast(translate(s.lang, "t_wrong_pin"), "warn"); return false; }
        set({ supabaseUserId: data.user.id, supabaseProfileId: profile.id, organizer: { name: profile.name, contact: "", country: "mx", refs: "", email, collaborators: [] }, orgUnlocked: true, profile: { ...get().profile, name: profile.name }, userEmail: data.user.email ?? null });
        await get().loadEventsFromSupabase();
        s.toast(translate(s.lang, "t_unlocked"), "gold");
        return true;
      },
      becomeOrganizer: async (name, contact, refs) => {
        const s = get();
        if (!s.supabaseProfileId) return false;
        const { error } = await supabase.from("profiles").update({ role: "organizer", name }).eq("id", s.supabaseProfileId);
        if (error) { console.error("Error becoming organizer:", error.message); s.toast(translate(s.lang, "t_wrong_pin"), "warn"); return false; }
        set({
          organizer: { name, contact, country: s.profile.country, refs, email: s.userEmail ?? "", collaborators: [] },
          orgUnlocked: true,
          profile: { ...get().profile, name },
        });
        s.toast(translate(s.lang, "t_unlocked"), "gold");
        return true;
      },
      inviteCollab: async (eventId, c) => {
        const s = get();
        const ev = s.events.find((e) => e.id === eventId);
        if (!ev) return;
        if (ev.collaborators.some((x) => (c.email && x.email === c.email) || (!c.email && x.name === c.name))) {
          s.toast(translate(s.lang, "t_collab_dup"), "warn");
          return;
        }
        const updated = [...ev.collaborators, c];
        set({ events: s.events.map((e) => (e.id === eventId ? { ...e, collaborators: updated } : e)) });
        if (!s.supabaseProfileId) { s.toast(translate(s.lang, "t_collab_added")); return; }
        try {
          await supabase.from("event_collaborators").insert({
            event_id: eventId, collaborator_email: c.email ?? "", perm: c.perm, name: c.name, owner_id: s.supabaseProfileId,
          });
        } catch (e) { console.error("Error guardando colaborador:", e); }
        s.toast(translate(s.lang, "t_collab_added"));
      },
      removeCollab: async (eventId, i) => {
        const s = get();
        const ev = s.events.find((e) => e.id === eventId);
        if (!ev) return;
        const removed = ev.collaborators[i];
        set({ events: s.events.map((e) => (e.id === eventId ? { ...e, collaborators: e.collaborators.filter((_, x) => x !== i) } : e)) });
        if (removed?.email) {
          try {
            await supabase.from("event_collaborators")
              .delete()
              .eq("event_id", eventId)
              .eq("collaborator_email", removed.email);
          } catch (e) { console.error("Error borrando colaborador:", e); }
        }
        s.toast(translate(s.lang, "t_collab_removed"), "warn");
      },
      setCollabPerm: async (eventId, i, p) => {
        const s = get();
        const ev = s.events.find((e) => e.id === eventId);
        if (!ev) return;
        const target = ev.collaborators[i];
        set({ events: s.events.map((e) => (e.id === eventId ? { ...e, collaborators: e.collaborators.map((c, x) => (x === i ? { ...c, perm: p } : c)) } : e)) });
        if (target?.email) {
          try {
            await supabase.from("event_collaborators")
              .update({ perm: p })
              .eq("event_id", eventId)
              .eq("collaborator_email", target.email);
          } catch (e) { console.error("Error actualizando permiso:", e); }
        }
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
        const provider = (user as any).app_metadata?.provider;
        const isOAuth = provider && provider !== "email";
        set({ supabaseUserId: userId, authed: true, isOAuth: !!isOAuth, userEmail: user.email ?? null });

        await get().loadEventsFromSupabase();

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
        const metaName = (user.user_metadata?.name as string) || (user.user_metadata?.full_name as string) || "";
        const nameToUse = metaName || localProfile.name;
        const { data: created, error: insertError } = await supabase
          .from("profiles")
          .insert({ auth_id: userId, name: nameToUse, country: localProfile.country })
          .select("id")
          .single();

        if (insertError) {
          console.error("Error creando perfil en Supabase:", insertError.message);
          return;
        }
        set({ supabaseProfileId: created.id });
        if (metaName) set({ profile: { ...get().profile, name: metaName } });
      },

      loginAppUser: async (email, password) => {
        const s = get();
        if (s.authBusy) return false;
        set({ authBusy: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            const code = (error as any)?.code;
            if (code === "email_not_confirmed") {
              s.toast(translate(s.lang, "au_unconfirmed"), "warn");
            } else {
              s.toast(translate(s.lang, "t_wrong_pin"), "warn");
            }
            return false;
          }
          if (!data.user || !data.session) {
            s.toast(translate(s.lang, "t_wrong_pin"), "warn");
            return false;
          }
          set({ supabaseUserId: data.user.id, authed: true, userEmail: data.user.email ?? null });
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
          if (!data.session) {
            s.toast(translate(s.lang, "au_check_email"), "ok");
            return false;
          }
          set({
            supabaseUserId: data.user.id, authed: true, userEmail: data.user.email ?? null,
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

      socialLogin: async (provider) => {
        const s = get();
        if (s.authBusy) return;
        set({ authBusy: true });
        try {
          const redirectTo = `${window.location.origin}${window.location.pathname}`;
          const base = import.meta.env.VITE_SITE_URL as string | undefined;
          const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: base || redirectTo },
          });
          if (error) {
            console.error("Error OAuth:", error.message);
            s.toast(translate(s.lang, "au_provider_err"), "warn");
          }
        } catch (e) {
          console.error("Error OAuth:", e);
          s.toast(translate(s.lang, "au_provider_err"), "warn");
        } finally {
          set({ authBusy: false });
        }
      },

      resetPassword: async (email) => {
        const s = get();
        if (s.authBusy) return false;
        set({ authBusy: true });
        try {
          const redirectTo = `${window.location.origin}${window.location.pathname}`;
          const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
          if (error) {
            console.error("Error reset:", error.message);
            s.toast(translate(s.lang, "au_reset_err"), "warn");
            return false;
          }
          s.toast(translate(s.lang, "au_reset_sent"), "ok");
          return true;
        } catch (e) {
          console.error("Error reset:", e);
          s.toast(translate(s.lang, "au_reset_err"), "warn");
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

        let collabByEvent: Record<string, { name: string; email?: string; perm: string }[]> = {};
        const mineProfileId = get().supabaseProfileId;
        try {
          const { data: collabRows, error: collabError } = await supabase.from("event_collaborators").select("*");
          if (collabError) {
            console.error("Error cargando colaboradores:", collabError.message);
          } else {
            collabByEvent = (collabRows ?? []).reduce((acc: any, r: any) => {
              if (mineProfileId && r.owner_id !== mineProfileId) return acc;
              (acc[r.event_id] ??= []).push({ name: r.name || r.collaborator_email, email: r.collaborator_email, perm: r.perm || "edit" });
              return acc;
            }, {});
          }
        } catch (e) { console.error("Error cargando colaboradores:", e); }

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

        const prevByEvent = new Map(get().events.map((e) => [e.id, e]));
        const mapped: EventItem[] = (data ?? []).map((row: any) => {
          const prev = prevByEvent.get(row.id);
          let collabs = collabByEvent[row.id] ?? [];
          if (collabs.length === 0 && prev && prev.collaborators.length > 0) collabs = prev.collaborators;
          return {
            id: row.id,
            name: row.name,
            desc: { es: row.description ?? "", pt: row.description ?? "", fr: row.description ?? "", en: row.description ?? "" },
            country: row.country, city: row.city, lat: row.lat ?? 0, lng: row.lng ?? 0, address: row.address ?? "",
            dateISO: row.date_iso, time: row.event_time ?? "",
            organizer: "", organizerId: row.organizer_id ?? "", organizerRating: 0, organizerRefs: [],
            collaborators: collabs,
            maxParticipants: row.max_participants ?? 32, participants: participantsByEvent[row.id] ?? [], attendees: attendeesByEvent[row.id] ?? 0, waitlist: [],
            status: row.status,
            features: [], banner: ["#FFD700", "#9B30FF"] as [string, string],
            votes: {}, bracket: [], currentMatchId: null,
            groups: [],
            chat: [], notes: row.notes ?? "",
          };
        });
        const realUsers = get().users;
        const totalAura = realUsers.reduce((a, u) => a + (u.aura || 0), 0) + (get().profile.aura || 0);
        set({ events: mapped, totalAura });
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
        votesCast: s.votesCast, dailyVotes: s.dailyVotes, dailyVotesDate: s.dailyVotesDate,
        myVotes: s.myVotes, battleVotes: s.battleVotes,
        myRatings: s.myRatings, myAttendance: s.myAttendance,
        users: s.users, events: s.events, feed: s.feed, totalAura: s.totalAura, farmProg: s.farmProg,
      }),
    }
  )
);

export const userNameById = (id: string | null): string => {
  if (!id) return "TBD";
  if (id === "me") return "⭐ " + useApp.getState().profile.name;
  return useApp.getState().users.find((u) => u.id === id)?.name ?? "TBD";
};

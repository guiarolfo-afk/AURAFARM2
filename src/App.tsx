import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, MapPin, ShieldCheck, Swords, Trophy, Settings, Flame, ChevronDown, Megaphone, Crown } from "lucide-react";
import { useApp } from "./store";
import type { Tab } from "./store";
import { LANGS } from "./i18n";
import { useT } from "./i18n";
import { Avatar, Toasts } from "./components/ui";
import LiveBoard from "./components/LiveBoard";
import EventsBoard from "./components/EventsBoard";
import OrganizerBoard from "./components/OrganizerBoard";
import ArenaBoard from "./components/ArenaBoard";
import RankingsBoard from "./components/RankingsBoard";
import SettingsBoard from "./components/SettingsBoard";

const PARTICLES = [
  { s: 130, c: "#9B30FF", x: "6%", y: "18%", d: "0s" },
  { s: 90, c: "#FFD700", x: "88%", y: "10%", d: "-4s" },
  { s: 110, c: "#00BFFF", x: "78%", y: "72%", d: "-8s" },
  { s: 80, c: "#FF69B4", x: "12%", y: "78%", d: "-11s" },
  { s: 70, c: "#00FF7F", x: "48%", y: "40%", d: "-6s" },
];

export default function App() {
  const t = useT();
  /* narrow subscriptions: the shell must NOT re-render on realtime ticks */
  const tab = useApp((s) => s.tab);
  const lang = useApp((s) => s.lang);
  const streak = useApp((s) => s.streak);
  const profile = useApp((s) => s.profile);
  const premium = useApp((s) => s.premium);
  const banners = useApp((s) => s.banners);
  const activeEventId = useApp((s) => s.activeEventId);
  const { setTab, setLang, enterArena } = useApp.getState();
  const [langOpen, setLangOpen] = useState(false);
  const [countryFilter, setCountryFilter] = useState("all");

  useEffect(() => {
    const id = setInterval(() => useApp.getState().tick(), 2200);
    return () => clearInterval(id);
  }, []);

  const tabs: { id: Tab; icon: typeof Radio; hue: number; label: string }[] = [
    { id: "live", icon: Radio, hue: 152, label: t("nav_live") },
    { id: "events", icon: MapPin, hue: 200, label: t("nav_events") },
    { id: "org", icon: ShieldCheck, hue: 268, label: t("nav_org") },
    { id: "arena", icon: Swords, hue: 0, label: t("nav_arena") },
    { id: "rank", icon: Trophy, hue: 46, label: t("nav_rank") },
    { id: "set", icon: Settings, hue: 316, label: t("nav_set") },
  ];

  const browseCountry = (c: string) => {
    setCountryFilter(c);
    setTab("events");
  };

  const adBanner = !premium ? banners.find((b) => b.active) : undefined;
  const currentLang = LANGS.find((l) => l.code === lang)!;

  return (
    <div className="min-h-screen">
      <div className="aura-bg" />
      <div className="aura-noise" />
      {PARTICLES.map((p, i) => (
        <span key={i} className="aura-particle" style={{ width: p.s, height: p.s, left: p.x, top: p.y, background: p.c, animationDelay: p.d }} />
      ))}

      <Toasts />

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 border-b border-line bg-night/78 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center gap-2.5 sm:gap-3">
          <button onClick={() => setTab("live")} className="flex items-center gap-2.5 cursor-pointer group" aria-label="AuraFARM">
            <span className="relative w-8 h-8 rounded-full conic-ring grid place-items-center group-hover:scale-105 transition-transform">
              <span className="w-6 h-6 rounded-full bg-night grid place-items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-gold shadow-[0_0_10px_#FFD700]" />
              </span>
            </span>
            <span className="display text-[15px] font-extrabold tracking-tight leading-none">
              <span className="text-gold">AURA</span><span className="text-white">FARM</span>
            </span>
          </button>
          <span className="hidden md:block text-[10px] text-white/30 font-semibold tracking-wide mt-0.5">{t("tagline")}</span>

          {/* desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 mx-auto">
            {tabs.map((x) => (
              <button
                key={x.id}
                onClick={() => setTab(x.id)}
                className={`relative px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all cursor-pointer ${tab === x.id ? "text-[#0a0a14]" : "text-white/55 hover:text-white hover:bg-white/5"}`}
                style={tab === x.id ? { background: `hsl(${x.hue} 90% 62%)`, boxShadow: `0 0 16px hsl(${x.hue} 90% 60% / .35)` } : undefined}
              >
                {x.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 ml-auto lg:ml-0">
            <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-ember/10 border border-ember/30" title={t("live_streak")}>
              <Flame size={13} className="text-ember" />
              <span className="display text-[11.5px] font-extrabold text-ember">{streak}</span>
            </span>

            {/* language selector */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                aria-label={t("st_lang")}
              >
                <span className="text-[13px]">{currentLang.flag}</span>
                <span className="display text-[10.5px] font-extrabold uppercase text-white/75">{lang}</span>
                <ChevronDown size={12} className={`text-white/40 transition-transform ${langOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-44 panel !rounded-xl p-1.5 shadow-2xl"
                  >
                    {LANGS.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => { setLang(l.code); setLangOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-semibold transition-colors cursor-pointer ${lang === l.code ? "bg-gold/12 text-gold" : "text-white/70 hover:bg-white/6"}`}
                      >
                        <span className="text-base">{l.flag}</span> {l.label}
                        {lang === l.code && <span className="ml-auto font-extrabold">✓</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={() => setTab("set")} className="cursor-pointer hover:scale-105 transition-transform" aria-label={t("nav_set")}>
              <Avatar name={profile.name} hue={46} size={32} src={profile.photo} premium={premium} />
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className={`max-w-7xl mx-auto px-3 sm:px-4 pt-5 sm:pt-6 overflow-x-clip ${adBanner ? "pb-40" : "pb-28"}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {tab === "live" && <LiveBoard onBrowseCountry={browseCountry} />}
            {tab === "events" && <EventsBoard key={countryFilter} initialCountry={countryFilter} />}
            {tab === "org" && <OrganizerBoard />}
            {tab === "arena" && <ArenaBoard key={activeEventId} />}
            {tab === "rank" && <RankingsBoard />}
            {tab === "set" && <SettingsBoard />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ================= AD BANNER (footer, admin-configurable) ================= */}
      <AnimatePresence>
        {adBanner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-[64px] lg:bottom-0 left-0 right-0 z-40 px-3 pb-1 lg:pb-0"
          >
            <div className="max-w-7xl mx-auto">
              <button
                onClick={() => window.open(adBanner.link, "_blank", "noopener,noreferrer")}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-t-none lg:rounded-xl border border-white/10 cursor-pointer group overflow-hidden relative"
                style={{ background: `linear-gradient(100deg, ${adBanner.color}22, #0d0d1cdd 55%, ${adBanner.color}18)`, borderColor: `${adBanner.color}40` }}
              >
                <span className="text-[8.5px] font-extrabold tracking-widest px-1.5 py-0.5 rounded bg-white/10 text-white/50">AD</span>
                <Megaphone size={14} style={{ color: adBanner.color }} className="shrink-0" />
                <span className="flex-1 text-left text-[12px] font-semibold text-white/85 truncate group-hover:text-white transition-colors">{adBanner.text}</span>
                <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-gold shrink-0">
                  <Crown size={11} /> Premium ✦
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-night/88 backdrop-blur-xl" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid grid-cols-6">
          {tabs.map((x) => {
            const active = tab === x.id;
            return (
              <button key={x.id} onClick={() => setTab(x.id)} className="relative flex flex-col items-center gap-1 py-2.5 cursor-pointer" aria-label={x.label}>
                {active && (
                  <motion.span layoutId="navglow" className="absolute top-0 w-8 h-[3px] rounded-full" style={{ background: `hsl(${x.hue} 90% 60%)`, boxShadow: `0 0 12px hsl(${x.hue} 90% 60%)` }} />
                )}
                <x.icon size={18} style={{ color: active ? `hsl(${x.hue} 90% 62%)` : "rgba(255,255,255,.35)", transition: "color .2s" }} />
                <span className="w-full px-0.5 text-center text-[8px] sm:text-[8.5px] font-bold leading-none truncate" style={{ color: active ? `hsl(${x.hue} 90% 68%)` : "rgba(255,255,255,.35)" }}>{x.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* quick vote float (mobile, outside arena) */}
      {tab !== "arena" && (
        <button
          onClick={() => enterArena("e1")}
          aria-label={t("live_vote_now")}
          className="lg:hidden fixed bottom-20 right-4 z-40 rounded-full conic-ring grid place-items-center pulse-glow cursor-pointer active:scale-90 transition-transform"
          style={{ width: 52, height: 52 }}
        >
          <span className="w-[44px] h-[44px] rounded-full bg-night grid place-items-center">
            <Swords size={18} className="text-gold" />
          </span>
        </button>
      )}
    </div>
  );
}

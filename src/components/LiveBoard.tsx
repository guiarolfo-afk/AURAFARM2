import { useState } from "react";
import { motion } from "framer-motion";
import { Radio, Zap, Flame, Trophy, Users, Globe2, ChevronRight, ChevronDown, Vote, ArrowRight, Activity, Crown, MapPin, Check, Calendar } from "lucide-react";
import { useApp, levelFromAura, titleFromLevel, progressToNextLevel } from "../store";
import { useT } from "../i18n";
import { countryById } from "../data";
import { Avatar, AuraBar, AnimatedNumber, SectionHead, LiveBadge } from "./ui";

const reveal = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export default function LiveBoard({ onBrowseCountry }: { onBrowseCountry: (c: string) => void }) {
  const t = useT();
  const { users, feed, challenges, streak, totalAura, events, lang, enterArena, setTab } = useApp();

  const [nextOpen, setNextOpen] = useState(false);
  const online = users.filter((u) => u.online);
  const liveEvents = events.filter((e) => e.status === "live");
  const nextEvents = events
    .filter((e) => e.status === "upcoming" && e.dateISO)
    .sort((a, b) => (a.dateISO + a.time).localeCompare(b.dateISO + b.time) || a.name.localeCompare(b.name))
    .slice(0, 3);
  const byCountry = [...new Set(events.filter((e) => e.status !== "cancelled").map((e) => e.country))];
  const doneCount = challenges.filter((c) => c.done).length;
  const top5 = [...users].sort((a, b) => b.aura - a.aura).slice(0, 5);
  const medal = ["#FFD700", "#c9d4e3", "#cd8b4a", "#9B30FF", "#00BFFF"];
  const mins = (ts: number) => Math.max(0, Math.floor((Date.now() - ts) / 60000));
  const feedIcon = { farm: Zap, vote: Vote, join: Users, badge: Trophy, win: Crown };
  const feedText = (f: (typeof feed)[number]) => {
    const map = { farm: t("feed_farm", { u: f.user, n: f.n ?? 0 }), join: t("feed_join", { u: f.user, e: f.event ?? "" }), vote: t("feed_vote", { u: f.user, e: f.event ?? "" }), badge: t("feed_badge", { u: f.user }), win: t("feed_win", { u: f.user, e: f.event ?? "" }) };
    return map[f.type];
  };

  return (
    <div className="space-y-8">
      {/* ===== Signature opener: network aura counter + VOTE NOW ===== */}
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
        <motion.div {...reveal} className="panel p-6 sm:p-7 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gold/8 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-10 w-52 h-52 rounded-full bg-violet/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold/80">
              <Radio size={13} className="animate-pulse" /> {t("live_global")} · {t("live_global_sub")}
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <AnimatedNumber value={totalAura} className="display text-3xl sm:text-5xl font-extrabold tracking-tight text-white" />
              <span className="display text-sm font-bold text-gold">{t("c_aura")}</span>
            </div>
            <p className="text-[12px] text-white/45 mt-1.5">{t("live_total_aura")}</p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {[
                { icon: Users, n: online.length, label: t("live_users_farming"), c: "#00FF7F" },
                { icon: Radio, n: liveEvents.length, label: t("live_events_live"), c: "#FF4444" },
                { icon: Globe2, n: byCountry.length, label: t("live_countries"), c: "#00BFFF" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/4 border border-white/8">
                  <s.icon size={14} style={{ color: s.c }} />
                  <span className="display text-sm font-bold" style={{ color: s.c }}>
                    <AnimatedNumber value={s.n} />
                  </span>
                  <span className="text-[11px] text-white/50">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col gap-4">
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.08 }} className="panel p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 conic-ring opacity-[0.05]" />
            <div className="relative flex items-start justify-between">
              <div>
                <h3 className="display text-lg font-extrabold leading-tight">{t("live_vote_now_sub")}</h3>
                <div className="flex items-center gap-2 mt-2 text-[11.5px] text-white/50">
                  <LiveBadge label={t("c_live")} />
                  <span>{liveEvents.length} {t("live_events_live")}</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full conic-ring grid place-items-center floaty shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#0d0d1c] grid place-items-center">
                  <Vote size={18} className="text-gold" />
                </div>
              </div>
            </div>
            <button
              onClick={() => enterArena(liveEvents[0]?.id ?? events[0].id)}
              className="relative mt-5 w-full py-3.5 rounded-xl display text-sm font-extrabold tracking-widest bg-gold text-[#171200] pulse-glow hover:brightness-110 active:scale-[0.97] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {t("live_vote_now")} <ArrowRight size={16} strokeWidth={3} />
            </button>
          </motion.div>

          {/* ===== Next 3 events + event dropdown ===== */}
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.12 }} className="panel p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="display text-[13px] font-extrabold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                <Calendar size={14} className="text-gold" /> {t("live_next_events")}
              </h3>
              <span className="text-[9.5px] font-extrabold tracking-wider px-1.5 py-0.5 rounded-full bg-azure/10 text-azure border border-azure/30">
                {nextEvents.length}/3
              </span>
            </div>
            {events.filter((e) => e.status !== "cancelled").length > 0 && (
              <div className="relative mb-3">
                <button
                  onClick={() => setNextOpen((o) => !o)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors cursor-pointer"
                  aria-expanded={nextOpen}
                >
                  <Globe2 size={13} className="text-azure shrink-0" />
                  <span className="flex-1 text-left text-[11.5px] font-bold text-white/80 truncate">{t("live_by_country")}</span>
                  <span className="text-[9.5px] font-extrabold text-white/35 shrink-0">{events.filter((e) => e.status !== "cancelled").length}</span>
                  <ChevronDown size={13} className={`text-white/40 transition-transform shrink-0 ${nextOpen ? "rotate-180" : ""}`} />
                </button>
                {nextOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setNextOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 mt-2 max-h-64 overflow-y-auto panel !rounded-xl p-1.5 z-40 shadow-2xl"
                    >
                      {events.filter((e) => e.status !== "cancelled").map((e) => (
                        <button
                          key={e.id}
                          onClick={() => { enterArena(e.id); setNextOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer hover:bg-white/6"
                        >
                          {e.status === "live" ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-ember animate-pulse shrink-0" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-azure/60 shrink-0" />
                          )}
                          <span className="flex-1 min-w-0">
                            <span className="block text-[12px] font-bold truncate">{e.name}</span>
                            <span className="block text-[9.5px] text-white/40">{countryById(e.country).flag} {e.participants.length} ⚔️</span>
                          </span>
                          <span className={`text-[9px] font-extrabold tracking-wider px-1.5 py-0.5 rounded-full shrink-0 ${e.status === "live" ? "bg-ember/15 text-ember border border-ember/40" : e.status === "finished" ? "bg-white/10 text-white/50 border border-white/15" : "bg-azure/10 text-azure border border-azure/30"}`}>
                            {e.status === "live" ? t("c_live") : e.status === "finished" ? t("ev_finished") : t("c_upcoming")}
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </div>
            )}
            {nextEvents.length > 0 ? (
              <div className="space-y-1.5">
                {nextEvents.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => enterArena(e.id)}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-white/3 border border-white/7 hover:bg-white/7 hover:border-white/10 transition-colors cursor-pointer text-left"
                  >
                    <span className="w-6 h-6 rounded-lg bg-white/6 grid place-items-center shrink-0">
                      <Calendar size={13} className="text-azure" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[12px] font-bold truncate">{e.name}</span>
                      <span className="block text-[9.5px] text-white/40">
                        {countryById(e.country).flag} {e.dateISO} · {e.time || "19:00"} h
                      </span>
                    </span>
                    <ArrowRight size={12} className="text-white/30 shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-white/40">{t("live_no_next")}</p>
            )}
          </motion.div>
        </div>
      </div>

      {/* ===== Users farming right now ===== */}
      <motion.section {...reveal}>
        <SectionHead hue={152} icon={<Zap size={17} />} title={t("live_farming_now")} sub={t("live_farming_sub")} />
        <div className="hscroll flex gap-3 pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          {online.slice(0, 12).map((u, i) => {
            const c = countryById(u.country);
            const lvl = levelFromAura(u.aura);
            const nextPct = progressToNextLevel(u.aura);
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 6) * 0.05, duration: 0.4 }}
                className="panel panel-hover shrink-0 grow-0 basis-[150px] sm:basis-[168px] p-3.5 sm:p-4 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, hsl(${u.hue} 95% 60%), transparent)` }} />
                <div className="flex items-center gap-2.5">
                  <Avatar name={u.name} hue={u.hue} size={40} />
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold truncate">{u.name}</p>
                    <p className="text-[10.5px] text-white/45">{c.flag} {c.name[lang]} · {t("c_online")}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <AnimatedNumber value={u.aura} className="display text-[13px] font-bold" />
                  <span className="display text-[9.5px] font-bold text-mint">Nv {lvl}</span>
                </div>
                <AuraBar value={nextPct} className="mt-2" />
                <p className="text-[9.5px] text-white/35 mt-1.5 uppercase tracking-wider">{titleFromLevel(lvl, lang)} · {Math.round(nextPct)}% al Nv {lvl + 1}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ===== Middle grid: active users / challenges / feed+top ===== */}
      <div className="grid lg:grid-cols-3 gap-4 items-start">
        <motion.section {...reveal} className="panel p-5">
          <SectionHead hue={200} icon={<Users size={16} />} title={t("live_active_users")} sub={t("live_active_users_sub")} />
          <div className="space-y-3">
            {[...users].sort((a, b) => b.aura - a.aura).slice(0, 7).map((u, i) => {
              const c = countryById(u.country);
              return (
                <div key={u.id} className="flex items-center gap-3 group">
                  <span className="display text-[11px] w-4 text-white/30 font-bold">{i + 1}</span>
                  <Avatar name={u.name} hue={u.hue} size={34} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12.5px] font-semibold truncate">{u.name} <span className="text-[11px]">{c.flag}</span></p>
                      <AnimatedNumber value={u.aura} className="display text-[11.5px] font-bold text-white/80" />
                    </div>
                    <AuraBar value={progressToNextLevel(u.aura)} className="mt-1.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        <motion.section {...reveal} transition={{ ...reveal.transition, delay: 0.06 }} className="panel p-5">
          <div className="flex items-start justify-between">
            <SectionHead hue={46} icon={<Flame size={16} />} title={t("live_challenges")} sub={t("live_challenges_sub")} />
          </div>
          <div className="flex items-center gap-3 mb-4 -mt-1">
            <div className="flex-1">
              <div className="flex justify-between text-[10.5px] font-bold text-white/50 mb-1">
                <span>{t("live_day_progress")}</span>
                <span className="text-gold">{doneCount}/{challenges.length}</span>
              </div>
              <AuraBar value={(doneCount / challenges.length) * 100} color="#FFD700" />
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-ember/12 border border-ember/30">
              <Flame size={14} className="text-ember" />
              <span className="display text-sm font-extrabold text-ember">{streak}</span>
              <span className="text-[10px] text-white/50">{t("live_streak")}</span>
            </div>
          </div>
          <div className="space-y-1">
            {challenges.map((ch) => (
              <div
                key={ch.id}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${ch.done ? "bg-mint/6" : "bg-white/3"}`}
              >
                <span
                  className={`w-5 h-5 rounded-md grid place-items-center shrink-0 transition-all ${ch.done ? "bg-mint text-[#03150c]" : "border border-white/20"}`}
                >
                  {ch.done && <Check size={12} strokeWidth={3.5} />}
                </span>
                <span className={`flex-1 min-w-0 text-[12.5px] leading-snug ${ch.done ? "text-white/40 line-through" : "text-white/85"}`}>{t(ch.id)}</span>
                <span className="display text-[11px] font-bold text-gold shrink-0">+{ch.points}</span>
              </div>
            ))}
          </div>
        </motion.section>

        <div className="space-y-4">
          <motion.section {...reveal} transition={{ ...reveal.transition, delay: 0.1 }} className="panel p-5">
            <SectionHead hue={268} icon={<Crown size={16} />} title={`${t("live_global")} · Top 5`} />
            <div className="space-y-2.5">
              {top5.map((u, i) => {
                const c = countryById(u.country);
                return (
                  <div key={u.id} className="flex items-center gap-2.5">
                    <span className="display text-[12px] font-extrabold w-5" style={{ color: medal[i] }}>{i + 1}</span>
                    <Avatar name={u.name} hue={u.hue} size={30} />
                    <span className="flex-1 text-[12.5px] font-semibold truncate">{u.name}</span>
                    <span className="text-[11.5px]">{c.flag}</span>
                    <AnimatedNumber value={u.aura} className="display text-[11.5px] font-bold" />
                  </div>
                );
              })}
            </div>
            <button onClick={() => setTab("rank")} className="mt-4 w-full py-2 rounded-xl text-[11.5px] font-bold text-violet border border-violet/30 bg-violet/8 hover:bg-violet/16 transition-colors cursor-pointer flex items-center justify-center gap-1">
              {t("live_view_all")} <ArrowRight size={12} />
            </button>
          </motion.section>

          <motion.section {...reveal} transition={{ ...reveal.transition, delay: 0.14 }} className="panel p-5">
            <SectionHead hue={336} icon={<Activity size={16} />} title={t("live_recent")} />
            <div className="space-y-1 overflow-hidden">
              {feed.slice(0, 6).map((f) => {
                const I = feedIcon[f.type];
                return (
                  <div key={f.id} className="tick-in flex items-start gap-2.5 py-1.5 border-b border-white/5 last:border-0">
                    <span className="mt-0.5 w-6 h-6 rounded-lg bg-white/5 grid place-items-center shrink-0">
                      <I size={12} className="text-gold" />
                    </span>
                    <p className="flex-1 text-[11.5px] text-white/65 leading-snug">{feedText(f)}</p>
                    <span className="text-[9.5px] text-white/25 shrink-0 mt-0.5">{mins(f.ts)}m</span>
                  </div>
                );
              })}
            </div>
          </motion.section>
        </div>
      </div>

      {/* ===== Active competitions by country ===== */}
      <motion.section {...reveal}>
        <SectionHead hue={316} icon={<MapPin size={16} />} title={t("live_by_country")} sub={t("live_by_country_sub")} />
        <div className="panel p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Globe2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose pointer-events-none" />
            <select
              value=""
              onChange={(e) => e.target.value && onBrowseCountry(e.target.value)}
              className="w-full appearance-none pl-10 pr-9 py-3 rounded-xl bg-white/5 border border-white/12 text-[13px] font-semibold text-white/85 outline-none focus:border-rose/50 transition-colors cursor-pointer"
              aria-label={t("live_by_country")}
            >
              <option value="" disabled className="bg-[#0d0d1c]">
                {t("live_by_country")} — {byCountry.length} {t("live_countries").toLowerCase()}
              </option>
              {byCountry.map((cid) => {
                const c = countryById(cid);
                const evs = events.filter((e) => e.country === cid && e.status !== "cancelled");
                const live = evs.filter((e) => e.status === "live").length;
                return (
                  <option key={cid} value={cid} className="bg-[#0d0d1c]">
                    {c.flag} {c.name[lang]} — {evs.length} {t("nav_events").toLowerCase()}{live > 0 ? ` · ${live} 🔴` : ""}
                  </option>
                );
              })}
            </select>
            <ChevronRight size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none" />
          </div>
          <p className="text-[10.5px] text-white/40 sm:max-w-[220px] leading-snug shrink-0">{t("live_by_country_sub")}</p>
        </div>
      </motion.section>
    </div>
  );
}

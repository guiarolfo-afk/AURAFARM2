import { useState } from "react";
import { motion } from "framer-motion";
import { Radio, Globe2, ChevronRight, ChevronDown, Vote, ArrowRight, Calendar, MapPin, Share2 } from "lucide-react";
import { useApp } from "../store";
import { useT } from "../i18n";
import { countryById } from "../data";
import { AnimatedNumber, SectionHead, LiveBadge, ShareRow } from "./ui";

const reveal = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export default function LiveBoard({ onBrowseCountry }: { onBrowseCountry: (c: string) => void }) {
  const t = useT();
  const { totalAura, events, lang, enterArena, setTab } = useApp();

  const [nextOpen, setNextOpen] = useState(false);
  const liveEvents = events.filter((e) => e.status === "live");
  const nextEvents = events
    .filter((e) => e.status === "upcoming" && e.dateISO)
    .sort((a, b) => (a.dateISO + a.time).localeCompare(b.dateISO + b.time) || a.name.localeCompare(b.name))
    .slice(0, 3);
  const byCountry = [...new Set(events.filter((e) => e.status !== "cancelled").map((e) => e.country))];

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

      {/* ===== Compartir la app / evento en vivo ===== */}
      <motion.section {...reveal}>
        <div className="panel p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/25 grid place-items-center">
              <Share2 size={17} className="text-gold" />
            </span>
            <div>
              <h3 className="display text-[13px] font-extrabold">{t("ev_share")}</h3>
              <p className="text-[11.5px] text-white/45">{t("live_share_sub")}</p>
            </div>
          </div>
          <ShareRow
            compact
            title={liveEvents[0]?.name ?? nextEvents[0]?.name ?? "AuraFARM"}
            url={`${window.location.origin}${window.location.pathname}#/e/${(liveEvents[0] ?? nextEvents[0])?.id ?? ""}`}
          />
        </div>
      </motion.section>
    </div>
  );
}
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Radio, Globe2, ChevronRight, Vote, ArrowRight, Calendar, MapPin, Share2, Trophy, Crown, Search, X, Clock } from "lucide-react";
import { useApp, userNameById } from "../store";
import { useT } from "../i18n";
import { countryById } from "../data";
import { AnimatedNumber, SectionHead, LiveBadge, ShareRow } from "./ui";
import LiveMap from "./LiveMap";

const reveal = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export default function LiveBoard({ onBrowseCountry }: { onBrowseCountry: (c: string) => void }) {
  const t = useT();
  const { totalAura, events, lang, enterArena, setTab } = useApp();
  const [q, setQ] = useState("");

  const liveEvents = events.filter((e) => e.status === "live");
  const upcoming = events
    .filter((e) => e.status === "upcoming" && e.dateISO)
    .sort((a, b) => (a.dateISO + a.time).localeCompare(b.dateISO + b.time) || a.name.localeCompare(b.name));
  const nextEvents = upcoming.slice(0, 3);
  /* eventos de esta semana (hoy + 7 días) */
  const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
  const weekEvents = upcoming.filter((e) => {
    const d = new Date(e.dateISO + "T12:00:00");
    return d >= weekStart && d < weekEnd;
  });
  /* ganadores de hoy */
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayWinners = events
    .filter((e) => e.status === "finished" && e.dateISO === todayStr)
    .sort((a, b) => (b.winnerAura || 0) - (a.winnerAura || 0));
  const byCountry = [...new Set(events.filter((e) => e.status !== "cancelled" && e.status !== "finished").map((e) => e.country))];
  const activeEvents = events.filter((e) => e.status !== "cancelled" && e.status !== "finished");
  const searchResults = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [];
    return activeEvents
      .filter((e) => {
        const c = countryById(e.country);
        const names = Object.values(c.name).map((n) => n.toLowerCase());
        const city = (e.city || "").toLowerCase();
        const name = e.name.toLowerCase();
        const address = (e.address || "").toLowerCase();
        return names.some((n) => n.includes(query)) || city.includes(query) || name.includes(query) || address.includes(query);
      })
      .sort((a, b) => (b.status === "live" ? 1 : 0) - (a.status === "live" ? 1 : 0));
  }, [activeEvents, q]);

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
            {liveEvents.length > 0 ? (
              <button
                onClick={() => enterArena(liveEvents[0]?.id ?? events[0].id)}
                className="relative mt-5 w-full py-3.5 rounded-xl display text-sm font-extrabold tracking-widest bg-gold text-[#171200] pulse-glow hover:brightness-110 active:scale-[0.97] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {t("live_vote_now")} <ArrowRight size={16} strokeWidth={3} />
              </button>
            ) : (
              <div className="relative mt-5 w-full py-3.5 rounded-xl border border-white/10 bg-white/4 flex items-center justify-center gap-2.5 text-center px-4">
                <Clock size={16} className="text-gold shrink-0" />
                <span className="text-[12px] font-semibold text-white/55">{t("live_no_live_now")}</span>
              </div>
            )}
            <p className="mt-2.5 text-center text-[10.5px] font-medium text-white/40 leading-relaxed">{t("live_vote_hint")}</p>

            <button
              onClick={() => setTab("org")}
              className="relative mt-4 w-full py-3.5 rounded-xl display text-sm font-extrabold tracking-widest bg-gold text-[#171200] pulse-glow hover:brightness-110 active:scale-[0.97] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="flex flex-col items-center leading-tight">
                <span>{t("live_org_cta")}</span>
                <span className="text-[10.5px] font-bold tracking-widest text-[#171200]/75 mt-0.5">{t("live_org_cta_sub")}</span>
              </span>
              <ArrowRight size={16} strokeWidth={3} />
            </button>
          </motion.div>

          {/* ===== Next 3 events + event dropdown ===== */}
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.12 }} className="panel p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="display text-[13px] font-extrabold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                <Calendar size={14} className="text-gold" /> {t("live_next_events")}
              </h3>
              <span className="text-[10.5px] font-extrabold tracking-wider px-1.5 py-0.5 rounded-full bg-azure/10 text-azure border border-azure/30">
                {nextEvents.length}/3
              </span>
            </div>
            {weekEvents.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-1.5 mb-1.5">
                  <Globe2 size={12} className="text-azure" /> {t("live_week_events")}
                </p>
                <div className="space-y-1">
                  {weekEvents.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => enterArena(e.id)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/3 border border-white/6 hover:bg-white/7 transition-colors cursor-pointer text-left"
                    >
                      <Calendar size={12} className="text-azure shrink-0" />
                      <span className="flex-1 min-w-0 text-[11.5px] font-semibold truncate">{e.name}</span>
                      <span className="text-[10.5px] text-white/40 shrink-0">{countryById(e.country).flag} {e.dateISO} · {e.time || "19:00"}</span>
                      <ArrowRight size={11} className="text-white/30 shrink-0" />
                    </button>
                  ))}
                </div>
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
                      <span className="block text-[10.5px] text-white/40">
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

      {/* ===== Today's winners ===== */}
      {todayWinners.length > 0 && (
        <motion.section {...reveal}>
          <SectionHead hue={46} icon={<Trophy size={16} />} title={t("live_today_winners")} sub={t("live_today_winners_sub")} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayWinners.map((e) => (
              <div key={e.id} className="panel p-4 relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gold/10 blur-2xl pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-9 h-9 rounded-xl bg-gold/12 border border-gold/30 grid place-items-center shrink-0"><Trophy size={16} className="text-gold" /></span>
                    <div className="min-w-0">
                      <p className="display text-[13px] font-extrabold truncate">{e.name}</p>
                      <p className="text-[10px] text-white/40 flex items-center gap-1 flex-wrap">
                        <Calendar size={10} className="text-gold" /> {e.dateISO} · <MapPin size={10} className="text-rose" /> {e.city || e.address}
                      </p>
                    </div>
                  </div>
                  {e.winner && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-mint/8 border border-mint/25 px-2.5 py-2">
                      <Crown size={14} className="text-gold shrink-0" />
                      <span className="flex-1 text-[12.5px] font-bold text-mint truncate">{userNameById(e.winner)}</span>
                      {e.winnerAura > 0 && <span className="display text-[11px] font-extrabold text-gold shrink-0">+{e.winnerAura}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ===== Active competitions by country / search ===== */}
      <motion.section {...reveal}>
        <SectionHead hue={316} icon={<MapPin size={16} />} title={t("live_by_country")} sub={t("live_by_country_sub")} />
        <div className="panel p-4">
          {/* buscador por país, ciudad o evento */}
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose pointer-events-none" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("live_search")}
              type="search"
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/12 text-[13px] font-semibold text-white/85 outline-none focus:border-rose/50 transition-colors placeholder:text-white/35"
              aria-label={t("live_search")}
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer" aria-label="Limpiar">
                <X size={15} />
              </button>
            )}
          </div>
          {q.trim().length >= 2 ? (
            searchResults.length > 0 ? (
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {searchResults.map((e) => {
                  const c = countryById(e.country);
                  return (
                    <button
                      key={e.id}
                      onClick={() => enterArena(e.id)}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-white/3 border border-white/7 hover:bg-white/7 hover:border-white/10 transition-colors cursor-pointer text-left"
                    >
                      <span className="w-7 h-7 rounded-lg bg-white/6 grid place-items-center shrink-0 text-sm">{c.flag}</span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="block text-[12px] font-bold truncate">{e.name}</span>
                          {e.status === "live" && <LiveBadge label={t("c_live")} />}
                        </span>
                        <span className="block text-[10.5px] text-white/40 truncate">{c.name[lang]} · {(e.city || e.address || "—")}</span>
                      </span>
                      <ArrowRight size={12} className="text-white/30 shrink-0" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11.5px] text-white/40">{t("live_search_empty")} “{q.trim()}”</p>
            )
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
                    const evs = events.filter((e) => e.country === cid && e.status !== "cancelled" && e.status !== "finished");
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
          )}
        </div>
      </motion.section>

      {/* ===== Compartir la app (enlace a la pantalla principal) ===== */}
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
            title={`AuraFARM — ${t("live_global")}`}
            url={`${window.location.origin}${window.location.pathname}`}
          />
        </div>
      </motion.section>

      {/* ===== Mapa con pin en cada evento activo ===== */}
      <motion.section {...reveal}>
        <SectionHead hue={152} icon={<MapPin size={16} />} title={t("live_map")} sub={t("live_map_sub")} />
        <div className="panel p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2 mb-3 px-1">
            <span className="flex items-center gap-1.5 text-[10.5px] font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-ember/12 text-ember border border-ember/35">
              <span className="relative w-1.5 h-1.5 rounded-full bg-ember live-ping text-ember" /> {t("c_live").toUpperCase()} {liveEvents.length}
            </span>
            <span className="text-[10.5px] font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-azure/10 text-azure border border-azure/30">
              {t("c_upcoming").toUpperCase()} {upcoming.length}
            </span>
          </div>
          <LiveMap events={events.filter((e) => e.status !== "cancelled" && e.status !== "finished")} />
        </div>
      </motion.section>
    </div>
  );
}
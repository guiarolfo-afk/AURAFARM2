import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Trophy, Ticket, Vote, Swords, Megaphone, Flame, TrendingUp, Globe2, Crown, Medal, Lock } from "lucide-react";
import { useApp, levelFromAura } from "../store";
import { useT } from "../i18n";
import { COUNTRIES, countryById, BADGES, USERS } from "../data";
import { Avatar, AnimatedNumber, SectionHead, Chip, AuraBar } from "./ui";

const BADGE_ICONS: Record<string, typeof Trophy> = {
  ticket: Ticket, vote: Vote, swords: Swords, megaphone: Megaphone,
  flame: Flame, trending: TrendingUp, globe: Globe2, crown: Crown,
};

export default function RankingsBoard() {
  const t = useT();
  const { profile, users, lang, streak, votesCast, premium } = useApp();
  const [country, setCountry] = useState("all");
  const [sort, setSort] = useState<"total" | "votes" | "trophies">("total");

  const level = levelFromAura(profile.aura);
  const unlocked: Record<string, boolean> = {
    b1: profile.attended > 0, b2: votesCast > 0, b3: profile.participated > 0,
    b4: profile.organized > 0, b5: streak >= 7, b6: level >= 10,
    b7: profile.attended >= 3, b8: profile.aura >= 100000,
  };

  const rows = useMemo(() => {
    const me = {
      id: "me", name: profile.name, country: profile.country, hue: 46,
      aura: profile.aura, auraByVotes: profile.auraByVotes, trophies: profile.trophies,
      level, role: "user" as const, online: true,
    };
    const all = [...USERS.map((u) => ({ ...u })), me];
    return all
      .filter((u) => country === "all" || u.country === country)
      .sort((a, b) => (sort === "total" ? b.aura - a.aura : sort === "votes" ? b.auraByVotes - a.auraByVotes : b.trophies - a.trophies));
  }, [country, sort, profile, level]);

  const chartData = profile.history.map((v, i) => ({ s: `${i + 1}`, aura: v }));

  return (
    <div className="space-y-6">
      <SectionHead hue={46} icon={<Trophy size={17} />} title={t("rk_title")} sub={t("rk_sub")} />

      {/* ===== my profile ===== */}
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4 items-start">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="panel p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-44 h-44 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <Avatar name={profile.name} hue={46} size={64} src={profile.photo} premium={premium} />
            <div className="flex-1 min-w-0">
              <h3 className="display text-lg font-extrabold truncate">{profile.name}</h3>
              <p className="text-[11.5px] text-white/50">{countryById(profile.country).flag} {countryById(profile.country).name[lang]} · {t("c_level")} {level}</p>
              <AuraBar value={(profile.aura % 10000) / 100} color="#FFD700" className="mt-2" />
            </div>
            <div className="text-right shrink-0">
              <AnimatedNumber value={profile.aura} className="display text-xl sm:text-2xl font-extrabold text-gold" />
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">{t("rk_total")}</p>
            </div>
          </div>
          <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
            {[
              { n: profile.auraByVotes, label: t("rk_by_votes"), c: "#00BFFF" },
              { n: profile.trophies, label: t("rk_trophies"), c: "#FFD700" },
              { n: profile.attended, label: t("rk_events_attended"), c: "#00FF7F" },
              { n: profile.participated + profile.organized, label: `${t("rk_events_part")} + ${t("rk_events_org")}`, c: "#FF69B4" },
            ].map((x, i) => (
              <div key={i} className="rounded-xl bg-white/4 border border-white/8 p-3 text-center">
                <AnimatedNumber value={x.n} className="display text-base font-extrabold" />
                <p className="text-[9.5px] text-white/45 font-bold uppercase tracking-wide mt-0.5" style={{ color: `${x.c}bb` }}>{x.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="panel p-5">
          <p className="text-[12.5px] font-bold flex items-center gap-1.5"><TrendingUp size={14} className="text-mint" /> {t("rk_evolution")}</p>
          <p className="text-[10.5px] text-white/40 mb-3">{t("rk_evolution_sub")}</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id="auraGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFD700" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#9B30FF" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="s" tick={{ fill: "rgba(255,255,255,.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,.3)", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${Math.round(v / 1000)}K`} />
                <Tooltip
                  contentStyle={{ background: "#121226", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, fontSize: 11, color: "#fff" }}
                  labelStyle={{ color: "rgba(255,255,255,.5)" }}
                  formatter={(v) => [`${Number(v).toLocaleString()} aura`, ""]}
                />
                <Area type="monotone" dataKey="aura" stroke="#FFD700" strokeWidth={2.5} fill="url(#auraGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ===== badges ===== */}
      <motion.section initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <SectionHead hue={316} icon={<Medal size={16} />} title={t("rk_badges")} sub={t("rk_badges_sub")} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BADGES.map((b, i) => {
            const I = BADGE_ICONS[b.icon];
            const on = unlocked[b.id];
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className={`panel p-4 text-center relative overflow-hidden ${on ? "" : "opacity-55 grayscale"}`}
              >
                {on && <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-24 h-16 rounded-full blur-2xl" style={{ background: `hsl(${b.hue} 90% 60% / .3)` }} />}
                <div className="relative w-12 h-12 mx-auto rounded-2xl grid place-items-center" style={{ background: `hsl(${b.hue} 90% 60% / ${on ? ".16" : ".06"})`, border: `1px solid hsl(${b.hue} 90% 60% / ${on ? ".45" : ".15"})` }}>
                  {on ? <I size={20} className={`text-white`} /> : <Lock size={16} className="text-white/30" />}
                </div>
                <p className="relative display text-[11.5px] font-bold mt-2.5" style={{ color: on ? `hsl(${b.hue} 90% 70%)` : "rgba(255,255,255,.45)" }}>{t(b.id)}</p>
                <p className="relative text-[10px] text-white/40 mt-0.5 leading-snug">{t(`d${b.id.slice(1)}`)}</p>
                {!on && <p className="relative text-[9px] font-extrabold uppercase tracking-widest text-white/25 mt-1.5">{t("rk_locked")}</p>}
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ===== global ranking ===== */}
      <motion.section initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <SectionHead hue={200} icon={<Globe2 size={16} />} title={t("rk_global_title")} />
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-white/35">{t("rk_filter_country")}:</span>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="px-3 py-1.5 rounded-full text-[12px] font-semibold bg-white/5 border border-white/10 outline-none cursor-pointer" aria-label={t("rk_filter_country")}>
            <option value="all" className="bg-[#0d0d1c]">🌍 {t("c_all")}</option>
            {COUNTRIES.map((c) => <option key={c.id} value={c.id} className="bg-[#0d0d1c]">{c.flag} {c.name[lang]}</option>)}
          </select>
          <span className="w-px h-5 bg-white/10 mx-1" />
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-white/35">{t("rk_sort_by")}:</span>
          <Chip active={sort === "total"} onClick={() => setSort("total")} hue={46}>{t("rk_sort_total")}</Chip>
          <Chip active={sort === "votes"} onClick={() => setSort("votes")} hue={200}>{t("rk_sort_votes")}</Chip>
          <Chip active={sort === "trophies"} onClick={() => setSort("trophies")} hue={268}>{t("rk_sort_trophies")}</Chip>
        </div>

        <div className="panel overflow-hidden">
          <div className="grid grid-cols-[36px_1fr_72px_56px] sm:grid-cols-[44px_1.5fr_110px_90px_80px] gap-x-2 px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-white/30 border-b border-white/8">
            <span>#</span><span>{t("st_name")}</span><span className="text-right">{t("rk_sort_total")}</span><span className="text-right hidden sm:block">{t("rk_sort_votes")}</span><span className="text-right">🏆</span>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {rows.map((u, i) => {
              const c = countryById(u.country);
              const me = u.id === "me";
              return (
                <motion.div
                  key={u.id}
                  layout
                  transition={{ type: "spring", damping: 28, stiffness: 260 }}
                  className={`grid grid-cols-[36px_1fr_72px_56px] sm:grid-cols-[44px_1.5fr_110px_90px_80px] gap-x-2 items-center px-4 py-2.5 border-b border-white/5 last:border-0 transition-colors ${me ? "bg-gold/8" : "hover:bg-white/3"}`}
                >
                  <span className="display text-[12px] font-extrabold" style={{ color: i === 0 ? "#FFD700" : i === 1 ? "#c9d4e3" : i === 2 ? "#cd8b4a" : "rgba(255,255,255,.35)" }}>
                    {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                  </span>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={u.name} hue={u.hue} size={32} src={me ? profile.photo : null} premium={me && premium} />
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-bold truncate">{u.name} {me && <span className="text-[9.5px] text-gold font-extrabold">· {t("c_you")}</span>}</p>
                      <p className="text-[10px] text-white/40">{c.flag} {c.name[lang]} · {t("c_level")} {levelFromAura(u.aura)}</p>
                    </div>
                  </div>
                  <AnimatedNumber value={u.aura} className="display text-[11.5px] font-bold text-right text-gold" />
                  <AnimatedNumber value={u.auraByVotes} className="display text-[11px] font-bold text-right text-azure hidden sm:block" />
                  <span className="display text-[11.5px] font-bold text-right text-white/80">{u.trophies}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>
    </div>
  );
}

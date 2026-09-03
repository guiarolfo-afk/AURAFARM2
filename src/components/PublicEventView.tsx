import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Share2, Copy, Link2, Swords, RefreshCw } from "lucide-react";
import { useApp, userNameById, levelFromAura, VOTE_REWARD } from "../store";
import { useT } from "../i18n";
import { countryById } from "../data";
import { Avatar, AuraBar, LiveBadge, ShareRow } from "./ui";

/* FASE 6.2 — Vista pública de evento, accesible SIN login desde un enlace
   compartido (#/e/:id). El público ve el ranking en vivo y vota como anónimo
   (los votos anónimos van a `public_votes` vía persistVote). */
export default function PublicEventView({ eventId }: { eventId: string }) {
  const t = useT();
  const s = useApp();
  const { events, users, profile, myVotes, dailyVotes } = s;
  const ev = events.find((e) => e.id === eventId) ?? null;
  const [sliders, setSliders] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    s.refreshVotes();
    const unsub = s.subscribeVotes();
    const iv = setInterval(() => s.refreshVotes(), 8000);
    return () => {
      unsub();
      clearInterval(iv);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const hueOf = (pid: string | null) => (pid && pid !== "me" ? users.find((u) => u.id === pid)?.hue ?? 46 : 46);
  const auraOf = (pid: string | null) => (pid === "me" ? profile.aura : pid ? users.find((u) => u.id === pid)?.aura ?? 0 : 0);

  if (!ev) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="text-center text-white/50 text-sm space-y-2">
          <p className="display text-lg font-extrabold text-white/80">{t("nav_events")}</p>
          <p className="text-[12px]">Cargando evento…</p>
        </div>
      </div>
    );
  }

  const ranking = ev.participants
    .map((pid) => {
      const votes = ev.votes[pid] ?? 0;
      const aura = auraOf(pid);
      return { pid, name: userNameById(pid), hue: hueOf(pid), votes, aura, total: aura + votes * VOTE_REWARD };
    })
    .sort((a, b) => b.total - a.total);
  const maxTotal = Math.max(...ranking.map((r) => r.total), 1);
  const maxVotes = Math.max(...ranking.map((r) => r.votes), 1);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const shareUrl = `${window.location.origin}${window.location.pathname}#/e/${ev.id}`;

  const copyLink = async () => {
    s.toggleChallenge("ch5");
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      s.toast("No pude copiar el enlace", "warn");
    }
  };

  const nativeShare = async () => {
    s.toggleChallenge("ch5");
    if (navigator.share) {
      try {
        await navigator.share({ title: ev.name, text: `${ev.name} — ¡vota en vivo!`, url: shareUrl });
      } catch { /* cancelado */ }
    } else {
      copyLink();
    }
  };

  return (
    <div className="min-h-screen">
      <div className="aura-bg" />
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* header */}
        <header className="flex items-center gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="display text-[17px] font-extrabold truncate">{ev.name}</h1>
              <LiveBadge label={t("c_live")} />
            </div>
            <p className="text-[11px] text-white/45 mt-0.5 mb-1">{countryById(ev.country).flag} {ev.city ?? ev.country} · {ev.participants.length} ⚔️</p>
            <div className="flex items-center gap-2">
              <button onClick={nativeShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/15 border border-gold/40 text-gold display text-[10.5px] font-bold hover:brightness-110 transition cursor-pointer">
                <Share2 size={13} /> {t("ev_share")}
              </button>
              <button onClick={copyLink} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/6 border border-white/10 text-white/70 display text-[10.5px] font-bold hover:bg-white/10 transition cursor-pointer">
                {copied ? <Copy size={12} /> : <Link2 size={12} />} {copied ? "¡Copiado!" : "Enlace"}
              </button>
            </div>
          </div>
        </header>

        {/* winners podium */}
        <div className="panel p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Crown size={15} className="text-gold" />
            <h3 className="display text-[13px] font-extrabold">{t("ar_rank_live")}</h3>
            <span className="w-1.5 h-1.5 rounded-full bg-mint live-ping" />
            <RefreshCw size={12} className="text-white/30 ml-auto" />
          </div>
          {ranking.length === 0 ? (
            <p className="text-[11.5px] text-white/40">Aún no hay participantes visibles.</p>
          ) : (
            ranking.slice(0, 3).map((r, i) => (
              <div key={r.pid} className={`flex items-center gap-3 p-2.5 rounded-xl mb-1.5 ${i === 0 ? "bg-gold/8 border border-gold/25" : "bg-white/3 border border-white/7"}`}>
                <span className="display w-5 text-center text-[15px] font-extrabold" style={{ color: i === 0 ? "#FFD700" : i === 1 ? "#c9d4e3" : "#cd8b4a" }}>{i + 1}</span>
                <Avatar name={r.name} hue={r.hue} size={34} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-bold truncate">{r.name}</p>
                  <AuraBar value={(r.total / maxTotal) * 100} color={i === 0 ? "#FFD700" : undefined} className="mt-1 !h-1.5" />
                </div>
                <span className="text-[11px] font-extrabold text-gold">🗳️ {r.votes}</span>
              </div>
            ))
          )}
        </div>

        {/* live leaderboard (full) */}
        <div className="panel p-4 mb-4">
          <div className="grid grid-cols-[20px_1fr_46px_50px] text-[9.5px] font-extrabold uppercase tracking-wider text-white/30 pb-2 border-b border-white/8 mb-2">
            <span>#</span><span /> <span className="text-right">votos</span><span className="text-right">aura</span>
          </div>
          {ranking.map((r, i) => (
            <motion.div key={r.pid} layout className={`flex items-center gap-2 p-2 rounded-lg mb-1 ${i === 0 ? "bg-gold/5" : ""}`}>
              <span className="display text-[11px] font-extrabold w-4 text-center" style={{ color: i === 0 ? "#FFD700" : "rgba(255,255,255,.4)" }}>{i + 1}</span>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Avatar name={r.name} hue={r.hue} size={26} />
                {r.pid && r.pid !== "me" ? (
                  <a href={`#/u/${r.pid}`} className="text-[11.5px] font-bold truncate hover:text-gold transition-colors cursor-pointer">{r.name}</a>
                ) : (
                  <span className="text-[11.5px] font-bold truncate">{r.name}</span>
                )}
              </div>
              <span className="text-[11px] font-bold text-gold text-right">{r.votes}</span>
              <span className="text-[11px] font-extrabold text-white/85 text-right" style={{ color: levelFromAura(r.aura) > 0 ? `hsl(${r.hue} 80% 60%)` : undefined }}>{r.aura}</span>
            </motion.div>
          ))}
        </div>

        {/* quick vote — competitors (anonymous writes to public_votes) */}
        <div className="panel p-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Swords size={15} className="text-gold" />
            <h3 className="display text-[13px] font-extrabold">Vota en vivo</h3>
          </div>
          <p className="text-[10.5px] text-white/45 mb-1">+{VOTE_REWARD} aura · {t("ar_open_sub")}</p>
          <p className="text-[11px] text-gold font-bold">{dailyVotes} votos hoy</p>
          <div className="mt-3 space-y-2">
            {ranking.map((r) => {
              const my = myVotes[ev.id]?.[r.pid];
              return (
                <div key={r.pid} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/3 border border-white/7">
                  <Avatar name={r.name} hue={r.hue} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold truncate">{r.name}</p>
                    <p className="text-[9.5px] text-white/40">🗳️ <span className="text-gold font-bold">{r.votes}</span> votos · {maxVotes > 0 ? Math.round((r.votes / maxVotes) * 100) : 0}%</p>
                  </div>
                  {my ? (
                    <span className="display text-[10.5px] font-extrabold text-mint bg-mint/10 border border-mint/30 px-2 py-0.5 rounded-full">{t("ar_voted")} ✓</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input type="range" min={1} max={10} value={sliders[r.pid] ?? 7} onChange={(e) => setSliders({ ...sliders, [r.pid]: +e.target.value })} className="w-20 shrink" aria-label={`Votar a ${r.name}`} />
                      <span className="display text-sm font-extrabold w-6 text-center text-gold">{sliders[r.pid] ?? 7}</span>
                      <button onClick={() => s.voteCompetitor(ev.id, r.pid, sliders[r.pid] ?? 7)} className="px-3 py-1.5 rounded-lg display text-[10.5px] font-bold bg-gold text-[#171200] active:scale-95 transition cursor-pointer">Votar</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* share panel */}
        <div className="panel p-4">
          <div className="flex items-center gap-2 mb-1">
            <Share2 size={15} className="text-gold" />
            <h3 className="display text-[13px] font-extrabold">{t("ev_share")}</h3>
          </div>
          <p className="text-[11px] text-white/45 mb-3 break-all">{shareUrl}</p>
          <ShareRow title={ev.name} url={shareUrl} />
        </div>
      </div>
    </div>
  );
}

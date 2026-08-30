import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Swords, Trophy, SlidersHorizontal, ListChecks, Crown, Zap, ChevronDown, Users, Timer } from "lucide-react";
import { useApp, userNameById, levelFromAura } from "../store";
import { useT } from "../i18n";
import { countryById, roundMeta } from "../data";
import { Avatar, AuraBar, AnimatedNumber, SectionHead, Stars, LiveBadge } from "./ui";

export default function ArenaBoard() {
  const t = useT();
  const s = useApp();
  const { events, users, lang, activeEventId, myVotes, battleVotes, myRatings, profile } = s;
  const ev = events.find((e) => e.id === activeEventId) ?? events[0];
  const [tab, setTab] = useState<"chat" | "vote" | "rank">("vote");
  const [msg, setMsg] = useState("");
  const [sliders, setSliders] = useState<Record<string, number>>({});
  const [evOpen, setEvOpen] = useState(false);
  const [battleOpen, setBattleOpen] = useState(false);
  const [pickedMatch, setPickedMatch] = useState<string | null>(null);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [ev?.chat.length]);

  if (!ev) return null;

  const currentMatch = ev.bracket.find((m) => m.id === ev.currentMatchId) ?? null;
  /* battle finder: the participant can open any battle from the bracket */
  const viewMatch = ev.bracket.find((m) => m.id === pickedMatch) ?? currentMatch;
  const R = Math.max(...ev.bracket.map((m) => m.round + 1), 0);
  const roundName = (r: number) => {
    const m = roundMeta(r, R);
    return m.n ? t(m.key, { n: m.n }) : t(m.key);
  };

  /* live countdown for the battle in dispute (1s tick while it runs) */
  const liveBattle = ev.bracket.find((m) => m.startedAt && !m.winner) ?? null;
  const liveGroup = ev.groups.find((g) => g.startedAt && !g.winner) ?? null;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!liveBattle && !liveGroup) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [!!liveBattle, !!liveGroup]);
  const battleRemaining = liveBattle && liveBattle.startedAt ? Math.max(0, liveBattle.duration * 60_000 - (now - liveBattle.startedAt)) : null;
  const fmtClock = (ms: number) => {
    const sec = Math.ceil(ms / 1000);
    return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  };
  const hueOf = (pid: string | null) => (pid && pid !== "me" ? users.find((u) => u.id === pid)?.hue ?? 46 : 46);
  const auraOf = (pid: string | null) => (pid === "me" ? profile.aura : pid ? users.find((u) => u.id === pid)?.aura ?? 0 : 0);

  const ranking = ev.participants
    .map((pid) => {
      const votes = ev.votes[pid] ?? 0;
      const aura = auraOf(pid);
      return { pid, name: userNameById(pid), hue: hueOf(pid), aura, votes, total: Math.round(aura / 120) + votes * 5 };
    })
    .sort((a, b) => b.total - a.total);
  const maxTotal = Math.max(...ranking.map((r) => r.total), 1);

  const send = () => {
    if (!msg.trim()) return;
    s.sendChat(ev.id, msg.trim());
    setMsg("");
  };

  const matchVote = viewMatch ? battleVotes[ev.id]?.[viewMatch.id] : undefined;
  const totalAB = viewMatch ? viewMatch.votesA + viewMatch.votesB : 0;
  const pct = (v: number) => (totalAB === 0 ? 50 : Math.round((v / totalAB) * 100));

  return (
    <div className="space-y-5">
      {/* header + event picker */}
      <div>
        <SectionHead hue={0} icon={<Swords size={17} />} title={t("ar_title")} sub={t("ar_sub")} />
        {/* event dropdown — easy to locate even with many events */}
        <div className="relative w-fit max-w-full">
          <button
            onClick={() => setEvOpen((o) => !o)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/9 transition-colors cursor-pointer max-w-full"
            aria-expanded={evOpen}
          >
            {ev.status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-ember animate-pulse shrink-0" />}
            <span className="display text-[12.5px] font-bold truncate">{ev.name}</span>
            <span className="text-[10px] font-extrabold text-white/35 shrink-0">{events.filter((e) => e.status !== "cancelled").length}</span>
            <ChevronDown size={13} className={`text-white/40 transition-transform shrink-0 ${evOpen ? "rotate-180" : ""}`} />
          </button>
          {evOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setEvOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 mt-2 w-[300px] max-w-[86vw] max-h-80 overflow-y-auto panel !rounded-xl p-1.5 z-40 shadow-2xl"
              >
                {events.filter((e) => e.status !== "cancelled").map((e) => (
                  <button
                    key={e.id}
                    onClick={() => { s.enterArena(e.id); setEvOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${e.id === ev.id ? "bg-ember/14 text-white" : "text-white/70 hover:bg-white/6"}`}
                  >
                    {e.status === "live" ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-ember animate-pulse shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-azure/60 shrink-0" />
                    )}
                    <span className="flex-1 min-w-0">
                      <span className="block text-[12.5px] font-bold truncate">{e.name}</span>
                      <span className="block text-[10px] text-white/40">{countryById(e.country).flag} {e.attendees} 👥 · {Object.keys(e.votes).length > 0 ? `${e.participants.length} ⚔️` : `${e.participants.length} ${t("ev_participants").toLowerCase()}`}</span>
                    </span>
                    <span className={`text-[9px] font-extrabold tracking-wider px-1.5 py-0.5 rounded-full shrink-0 ${e.status === "live" ? "bg-ember/15 text-ember border border-ember/40" : "bg-azure/10 text-azure border border-azure/30"}`}>
                      {e.status === "live" ? t("c_live") : t("c_upcoming")}
                    </span>
                    {e.id === ev.id && <span className="text-ember font-extrabold text-[12px] shrink-0">✓</span>}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="panel p-4 sm:p-5 relative overflow-hidden">
        <div className="absolute -top-10 right-0 w-48 h-32 rounded-full blur-3xl opacity-25 pointer-events-none" style={{ background: ev.banner[0] }} />
        <div className="relative flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[180px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="display text-[18px] sm:text-[20px] font-extrabold leading-tight">{ev.name}</h3>
              {ev.status === "live" && <LiveBadge label={t("c_live")} />}
            </div>
            <p className="text-[11.5px] text-white/45 mt-0.5">{countryById(ev.country).flag} {ev.address.split(",")[0]} · {ev.attendees} {t("ev_attendees").toLowerCase()}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/4 border border-white/8">
            <span className="text-[11px] text-white/50 font-semibold">{t("ar_rate_org")}:</span>
            <Stars value={myRatings[ev.id] ?? ev.organizerRating} onChange={(n) => s.rateEvent(ev.id, n)} size={15} />
            <span className="display text-[11px] font-bold text-gold">{ev.organizerRating.toFixed(1)}</span>
          </div>
        </div>

        <div className="relative flex gap-1.5 mt-4 p-1 rounded-xl bg-white/4 border border-white/8 w-fit">
          {([["chat", MessageCircle, t("ar_tab_chat")], ["vote", SlidersHorizontal, t("ar_tab_vote")], ["rank", Trophy, t("ar_tab_rank")]] as const).map(([k, I, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${tab === k ? "bg-ember text-white" : "text-white/50 hover:text-white"}`}>
              <I size={13} /> {label}
            </button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ================= CHAT ================= */}
        {tab === "chat" && (
          <motion.div key="chat" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="panel p-4">
            <div className="h-[380px] overflow-y-auto space-y-3 pr-1">
              {ev.chat.map((m) => (
                <div key={m.id} className={`tick-in flex gap-2.5 ${m.mine ? "flex-row-reverse" : ""}`}>
                  <Avatar name={m.user} hue={m.mine ? 46 : m.hue} size={30} />
                  <div className={`max-w-[75%] ${m.mine ? "text-right" : ""}`}>
                    <p className="text-[10px] font-bold text-white/40 mb-0.5">{m.mine ? `${t("c_you")} · ` : ""}{m.user}</p>
                    <div className={`inline-block px-3 py-2 rounded-2xl text-[12.5px] leading-snug ${m.mine ? "bg-gold/15 border border-gold/30 rounded-tr-sm" : "bg-white/6 border border-white/8 rounded-tl-sm"}`}>
                      {m.text}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEnd} />
            </div>
            <div className="flex gap-2 mt-4">
              <input
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={t("ar_chat_ph")}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[13px] outline-none focus:border-ember/50 transition-colors"
              />
              <button onClick={send} aria-label={t("ar_send")} className="w-11 h-11 rounded-xl grid place-items-center bg-ember text-white hover:brightness-110 active:scale-90 transition-all cursor-pointer">
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ================= VOTE ================= */}
        {tab === "vote" && (
          <motion.div key="vote" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="panel p-4 flex flex-wrap items-start gap-3">
              <ListChecks size={16} className="text-gold mt-0.5 shrink-0" />
              <div className="flex-1 min-w-[220px] grid sm:grid-cols-3 gap-2 text-[11px] text-white/55">
                <p><b className="text-white/80">1.</b> {t("ar_rule1")}</p>
                <p><b className="text-white/80">2.</b> {t("ar_rule2")}</p>
                <p><b className="text-white/80">3.</b> {t("ar_rule3")}</p>
              </div>
            </div>

            {/* ===== group phase (multi-fighter battles before the bracket) ===== */}
            {ev.groups.length > 0 && (
              <div className="panel p-4 sm:p-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Users size={15} className="text-mint" />
                  <h3 className="display text-[13.5px] font-extrabold">{t("ar_group_phase")}</h3>
                  <span className="text-[10px] font-bold text-white/35">{ev.groups.filter((g) => g.status === "closed").length}/{ev.groups.length}</span>
                  <p className="w-full text-[11px] text-white/45">{t("ar_group_advances")}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  {ev.groups.map((g) => {
                    const total = Object.values(g.votes).reduce((a, b) => a + b, 0) || 1;
                    const sorted = [...g.fighters].sort((x, y) => (g.votes[y] ?? 0) - (g.votes[x] ?? 0));
                    const myPick = battleVotes[ev.id]?.["g_" + g.id];
                    return (
                      <div key={g.id} className={`rounded-xl border p-3 transition-colors ${g.status === "live" ? "border-ember/45 bg-ember/6" : g.status === "closed" ? "border-mint/25 bg-mint/4" : "border-white/9 bg-white/3"}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="display text-[11px] font-extrabold text-white/85">{g.name}</span>
                          {g.status === "live" ? (
                            <span className="flex items-center gap-1.5 text-[9px] font-extrabold tracking-wider text-ember bg-ember/15 border border-ember/40 px-1.5 py-0.5 rounded-full">
                              <span className="relative w-1.5 h-1.5 rounded-full bg-ember live-ping text-ember" /> {t("org_current").toUpperCase()}
                            </span>
                          ) : g.status === "closed" ? (
                            <span className="text-[9px] font-extrabold tracking-wider text-mint bg-mint/12 border border-mint/35 px-1.5 py-0.5 rounded-full">{t("ar_completed").toUpperCase()}</span>
                          ) : (
                            <span className="text-[9px] font-extrabold tracking-wider text-white/40 bg-white/6 border border-white/12 px-1.5 py-0.5 rounded-full">{t("ar_scheduled").toUpperCase()}</span>
                          )}
                          {g.status === "live" && g.startedAt && (() => {
                            const rem = Math.max(0, g.duration * 60000 - (now - g.startedAt));
                            return (
                              <span className={`display text-[10px] font-extrabold flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${rem <= 0 ? "text-ember border-ember/40 bg-ember/10 animate-pulse" : "text-gold border-gold/40 bg-gold/8"}`}>
                                <Timer size={10} /> {rem <= 0 ? t("org_time_up") : fmtClock(rem)}
                              </span>
                            );
                          })()}
                          <span className="ml-auto display text-[10px] font-bold text-white/35">{Object.values(g.votes).reduce((a, b) => a + b, 0)} 🗳️</span>
                        </div>
                        <div className="space-y-1">
                          {sorted.map((pid) => {
                            const v = g.votes[pid] ?? 0;
                            const pctV = Math.round((v / total) * 100);
                            const mine = myPick === pid;
                            const won = g.winner === pid;
                            const row = (
                              <>
                                <Avatar name={userNameById(pid)} hue={hueOf(pid)} size={26} />
                                <span className={`flex-1 min-w-0 text-left text-[11.5px] font-bold truncate ${won ? "text-mint" : ""}`}>
                                  {won && <Crown size={10} className="inline mr-1 text-gold" />}{userNameById(pid)}
                                  {won && <span className="ml-1.5 text-[8.5px] font-extrabold tracking-wider text-mint bg-mint/12 border border-mint/35 px-1 py-px rounded-full align-middle">{t("ar_group_winner").toUpperCase()}</span>}
                                </span>
                                <div className="w-16 sm:w-20 h-1.5 rounded-full bg-white/8 overflow-hidden shrink-0">
                                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pctV}%`, background: mine || won ? "#FFD700" : ev.banner[0], boxShadow: mine || won ? "0 0 8px #FFD70066" : undefined }} />
                                </div>
                                <span className={`display text-[10.5px] font-extrabold w-9 text-right shrink-0 ${mine || won ? "text-gold" : "text-white/45"}`}>{pctV}%</span>
                              </>
                            );
                            return g.status === "live" ? (
                              <button
                                key={pid}
                                onClick={() => s.voteGroup(ev.id, g.id, pid)}
                                className={`w-full flex items-center gap-2 p-1.5 rounded-lg border transition-all cursor-pointer active:scale-[0.98] ${mine ? "bg-gold/12 border-gold/40" : "border-transparent hover:bg-white/5"}`}
                              >
                                {row}
                              </button>
                            ) : (
                              <div key={pid} className={`w-full flex items-center gap-2 p-1.5 rounded-lg ${g.status === "open" ? "opacity-55" : ""}`}>{row}</div>
                            );
                          })}
                        </div>
                        {g.status === "live" && myPick && (
                          <button onClick={() => s.undoGroupVote(ev.id, g.id)} className="mt-2 text-[10px] font-bold text-ember hover:underline cursor-pointer">
                            ✕ {t("ar_undo_vote")}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===== battle finder dropdown ===== */}
            {ev.bracket.length > 0 && (
              <div className="panel p-4 relative z-30">
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="text-[10.5px] font-extrabold uppercase tracking-[0.15em] text-white/40 flex items-center gap-1.5 shrink-0">
                    <Trophy size={12} className="text-gold" /> {t("ar_tournament")}
                  </p>
                  <div className="relative flex-1 min-w-[178px]">
                    <button
                      onClick={() => setBattleOpen((o) => !o)}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/4 hover:bg-white/8 transition-colors cursor-pointer"
                      aria-expanded={battleOpen}
                    >
                      <Swords size={14} className="text-gold shrink-0" />
                      {viewMatch ? (
                        <span className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-[9px] font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-violet/15 text-violet border border-violet/30 uppercase shrink-0">
                            {roundName(viewMatch.round)}
                          </span>
                          <span className="display text-[12px] font-bold truncate">
                            {userNameById(viewMatch.a)} <span className="text-white/35">vs</span> {userNameById(viewMatch.b)}
                          </span>
                        </span>
                      ) : (
                        <span className="display text-[12px] font-bold text-white/55">{t("ar_find_battle")}</span>
                      )}
                      <span className="ml-auto text-[9.5px] font-extrabold text-white/30 shrink-0">{ev.bracket.length}</span>
                      <ChevronDown size={13} className={`text-white/40 transition-transform shrink-0 ${battleOpen ? "rotate-180" : ""}`} />
                    </button>

                    {battleOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setBattleOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 right-0 mt-2 max-h-80 overflow-y-auto panel !rounded-xl p-1.5 pb-2 z-40 shadow-2xl"
                        >
                          {Array.from({ length: R }).map((_, r) => {
                            const ms = ev.bracket.filter((m) => m.round === r);
                            if (ms.length === 0) return null;
                            return (
                              <div key={r} className="px-1.5 pt-2">
                                <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-white/30 px-1.5 mb-1">{roundName(r)}</p>
                                {ms.map((m) => {
                                  const st = m.winner ? "done" : m.id === ev.currentMatchId ? "live" : "sched";
                                  const sel = viewMatch?.id === m.id;
                                  const playable = !!m.a && !!m.b;
                                  const voted = battleVotes[ev.id]?.[m.id];
                                  return (
                                    <button
                                      key={m.id}
                                      disabled={!playable}
                                      onClick={() => { setPickedMatch(m.id); setBattleOpen(false); }}
                                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${sel ? "bg-gold/12 border border-gold/30" : playable ? "hover:bg-white/6" : "opacity-40 cursor-default"}`}
                                    >
                                      <span className="shrink-0 w-4 grid place-items-center">
                                        {st === "done" ? (
                                          <Crown size={12} className="text-gold" />
                                        ) : st === "live" ? (
                                          <span className="relative w-1.5 h-1.5 rounded-full bg-ember live-ping text-ember" />
                                        ) : (
                                          <Swords size={11} className="text-white/25" />
                                        )}
                                      </span>
                                      <span className="flex-1 min-w-0 text-[12px] font-semibold truncate">
                                        {userNameById(m.a)} <span className="text-white/30 font-normal">vs</span> {userNameById(m.b)}
                                      </span>
                                      {voted && <span className="text-[10px] font-extrabold text-gold shrink-0">✓</span>}
                                      <span className="text-[9px] text-white/35 shrink-0">
                                        {st === "done" ? t("ar_completed") : st === "live" ? t("org_current") : m.votesA + m.votesB > 0 ? `${m.votesA + m.votesB} 🗳️` : t("ar_scheduled")}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </motion.div>
                      </>
                    )}
                  </div>
                  {currentMatch && viewMatch?.id !== currentMatch.id && (
                    <button
                      onClick={() => setPickedMatch(null)}
                      className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl bg-ember/12 border border-ember/35 text-ember hover:bg-ember/22 transition-colors cursor-pointer shrink-0"
                    >
                      <Zap size={11} className="animate-pulse" /> {t("ar_go_current")}
                    </button>
                  )}
                </div>
              </div>
            )}

            {viewMatch ? (
              <div className="panel p-4 sm:p-5">
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <p className={`text-[11px] font-bold uppercase tracking-[0.15em] flex items-center gap-1.5 ${viewMatch.id === ev.currentMatchId ? "text-ember" : "text-white/45"}`}>
                    {viewMatch.id === ev.currentMatchId ? <Zap size={13} className="animate-pulse" /> : <Swords size={13} />}
                    {viewMatch.id === ev.currentMatchId
                      ? t("ar_current_battle")
                      : viewMatch.winner
                        ? `${t("ar_completed")} · 🏆 ${userNameById(viewMatch.winner === "a" ? viewMatch.a : viewMatch.b)}`
                        : t("ar_scheduled")}
                  </p>
                  <span className="text-[9px] font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-violet/15 text-violet border border-violet/30 uppercase">
                    {roundName(viewMatch.round)}
                  </span>
                  {viewMatch.startedAt && !viewMatch.winner && battleRemaining !== null && viewMatch.id === liveBattle?.id && (
                    <span className={`display text-[11px] font-extrabold flex items-center gap-1 ml-auto px-2 py-0.5 rounded-lg border ${battleRemaining <= 0 ? "text-ember border-ember/40 bg-ember/10 animate-pulse" : "text-gold border-gold/40 bg-gold/8"}`}>
                      <Timer size={11} /> {battleRemaining <= 0 ? t("org_time_up") : fmtClock(battleRemaining)}
                    </span>
                  )}
                  {viewMatch.winner && <span className="text-[10px] font-bold text-white/35 ml-auto">{t("ar_rule3")}</span>}
                </div>
                <div className="relative grid grid-cols-2 items-stretch gap-2 sm:gap-3">
                  <span className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 z-10 display text-sm sm:text-lg font-black px-2 py-1 rounded-lg bg-night border border-white/12 text-gold" style={{ textShadow: "0 0 14px #FFD700" }}>{t("c_vs")}</span>
                  {(["a", "b"] as const).map((side) => {
                    const isB = side === "b";
                    const pid = side === "a" ? viewMatch.a : viewMatch.b;
                    const v = side === "a" ? viewMatch.votesA : viewMatch.votesB;
                    const mine = matchVote === side;
                    const isWinner = viewMatch.winner === side;
                    const closed = !!viewMatch.winner;
                    const col = isB ? ev.banner[1] : ev.banner[0];
                    const card = (
                      <button
                        key={side}
                        disabled={closed}
                        onClick={() => pid && s.voteBattle(ev.id, viewMatch.id, side)}
                        className={`w-full p-2.5 sm:p-4 rounded-2xl border transition-all text-left ${closed ? (isWinner ? "border-mint/50 bg-mint/8" : "border-white/8 bg-white/3 opacity-60") : mine ? "border-gold/70 bg-gold/10 cursor-pointer active:scale-95" : "border-white/10 bg-white/4 hover:bg-white/8 cursor-pointer active:scale-95"}`}
                      >
                        {isWinner && (
                          <p className="display text-[9px] font-extrabold tracking-widest text-mint mb-1.5 flex items-center gap-1">
                            <Crown size={10} /> {t("ar_completed").toUpperCase()}
                          </p>
                        )}
                        <div className={`flex items-center gap-2.5 ${isB ? "flex-row-reverse" : ""}`}>
                          <Avatar name={userNameById(pid)} hue={hueOf(pid)} size={44} />
                          <div className={`min-w-0 ${isB ? "text-right" : ""}`}>
                            <p className="text-[12.5px] sm:text-[13px] font-extrabold leading-tight truncate">{userNameById(pid)}</p>
                            <p className="display text-[10.5px] sm:text-[11px] font-bold mt-0.5" style={{ color: mine ? "#FFD700" : "rgba(255,255,255,.45)" }}>
                              {mine ? `✓ ${t("ar_voted")}` : `${v} ${t("ar_battle_votes")}`}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-white/8 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${isB ? "ml-auto" : ""}`} style={{ width: `${pct(v)}%`, background: col, boxShadow: `0 0 12px ${col}66` }} />
                        </div>
                        <p className={`display text-[15px] font-extrabold mt-1.5 ${isB ? "text-right" : ""}`}>{pct(v)}%</p>
                      </button>
                    );
                    return card;
                  })}
                </div>
                {matchVote && (
                  <div className="flex items-center justify-between mt-4 text-[11.5px] text-white/50">
                    <span>{t("ar_rule2")}</span>
                    <button onClick={() => s.voidMyBattleVote(ev.id, viewMatch.id)} className="font-bold text-ember hover:underline cursor-pointer">{t("ar_undo_vote")}</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="panel p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-azure mb-1">{t("ar_no_battle")}</p>
                <p className="text-[12px] text-white/50 mb-4">{t("ar_open_vote")} · {t("ar_open_sub")}</p>
                <div className="space-y-3">
                  {ev.participants.map((pid) => {
                    const my = myVotes[ev.id]?.[pid];
                    const val = sliders[pid] ?? 7;
                    return (
                      <div key={pid} className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/7">
                        <Avatar name={userNameById(pid)} hue={hueOf(pid)} size={36} />
                        <div className="flex-1 min-w-[140px]">
                          <p className="text-[12.5px] font-bold">{userNameById(pid)}</p>
                          <p className="text-[10.5px] text-white/40">{t("ar_score_for")} {userNameById(pid)}</p>
                        </div>
                        {my ? (
                          <div className="flex items-center gap-2.5">
                            <span className="display text-lg font-extrabold text-gold">{my}<span className="text-[10px] text-white/40">/10</span></span>
                            <span className="text-[10px] font-bold text-mint bg-mint/10 border border-mint/30 px-2 py-0.5 rounded-full">{t("ar_voted")}</span>
                            <button onClick={() => s.removeVote(ev.id, pid)} className="text-[10.5px] font-bold text-ember hover:underline cursor-pointer">{t("ar_undo_vote")}</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0 sm:flex-none">
                            <input type="range" min={1} max={10} value={val} onChange={(e) => setSliders({ ...sliders, [pid]: +e.target.value })} className="w-20 sm:w-28 shrink min-w-0" aria-label={t("ar_score_for")} />
                            <span className="display text-sm font-extrabold w-6 text-center" style={{ color: `hsl(${val * 12} 90% 60%)` }}>{val}</span>
                            <button onClick={() => s.voteCompetitor(ev.id, pid, val)} className="px-3 py-1.5 rounded-lg display text-[10.5px] font-bold bg-gold text-[#171200] hover:brightness-110 active:scale-95 transition-all cursor-pointer">
                              {t("ar_cast_vote")}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ================= RANKING ================= */}
        {tab === "rank" && (
          <motion.div key="rank" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="panel p-5">
            <div className="flex items-center gap-2 mb-1">
              <Crown size={16} className="text-gold" />
              <h3 className="display text-[14px] font-extrabold">{t("ar_rank_live")}</h3>
              <span className="relative w-1.5 h-1.5 rounded-full bg-mint live-ping text-mint" />
            </div>
            <p className="text-[11px] text-white/45 mb-4">{t("ar_rank_sub")}</p>
            <div className="grid grid-cols-[24px_1fr_64px_52px_64px] sm:grid-cols-[28px_1.4fr_90px_70px_80px] gap-x-2 text-[10px] font-extrabold uppercase tracking-wider text-white/30 pb-2 border-b border-white/8">
              <span>#</span><span></span><span className="text-right">{t("ar_aura_col")}</span><span className="text-right">{t("ar_votes_col")}</span><span className="text-right">{t("ar_total_col")}</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {ranking.map((r, i) => (
                <motion.div key={r.pid} layout transition={{ type: "spring", damping: 26, stiffness: 240 }} className={`grid grid-cols-[24px_1fr_64px_52px_64px] sm:grid-cols-[28px_1.4fr_90px_70px_80px] gap-x-2 items-center p-2 rounded-xl ${i === 0 ? "bg-gold/8 border border-gold/25" : "bg-white/2"}`}>
                  <span className="display text-[12px] font-extrabold" style={{ color: i === 0 ? "#FFD700" : i === 1 ? "#c9d4e3" : i === 2 ? "#cd8b4a" : "rgba(255,255,255,.35)" }}>{i + 1}</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar name={r.name} hue={r.hue} size={30} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold truncate">{r.name} {r.pid === "me" && <span className="text-[9px] text-gold">({t("c_you")})</span>}</p>
                      <AuraBar value={(r.total / maxTotal) * 100} color={i === 0 ? "#FFD700" : undefined} className="mt-1 !h-1.5" />
                    </div>
                  </div>
                  <AnimatedNumber value={r.aura} className="display text-[11px] font-bold text-right text-white/75" />
                  <AnimatedNumber value={r.votes} className="display text-[11px] font-bold text-right text-azure" />
                  <AnimatedNumber value={r.total} className="display text-[12px] font-extrabold text-right text-gold" />
                </motion.div>
              ))}
            </div>
            <p className="text-[10.5px] text-white/35 mt-3 flex items-center gap-1.5"><Zap size={11} className="text-mint" /> {t("ar_rank_sub")}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-center text-[10.5px] text-white/25">{t("c_level")} {levelFromAura(profile.aura)} · {profile.aura.toLocaleString()} {t("c_aura")} · {lang.toUpperCase()}</p>
    </div>
  );
}

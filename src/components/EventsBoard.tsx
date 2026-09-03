import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Clock, Users, Swords, Eye, ArrowRight, Hourglass, UserCheck, Sparkles, Trophy, Zap, Crown, Medal } from "lucide-react";
import { useApp, userNameById } from "../store";
import { useT } from "../i18n";
import { COUNTRIES, countryById } from "../data";
import type { EventItem } from "../data";
import { Avatar, Chip, Modal, SectionHead, Stars, ShareRow, LiveBadge, Field, inputCls, btnGold } from "./ui";
import MiniMap from "./MiniMap";

export default function EventsBoard({ initialCountry }: { initialCountry: string }) {
  const t = useT();
  /* narrow subscriptions: realtime ticks (users/farmProg/feed) must not re-render this board */
  const events = useApp((s) => s.events);
  const lang = useApp((s) => s.lang);
  const profile = useApp((s) => s.profile);
  const myAttendance = useApp((s) => s.myAttendance);
  const { enterArena, confirmAttendance, setTab } = useApp.getState();
  const [status, setStatus] = useState<"all" | "live" | "upcoming">("all");
  const [country, setCountry] = useState(initialCountry);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [role, setRole] = useState<"participant" | "spectator" | null>(null);
  const [formName, setFormName] = useState(profile.name);
  const [formContact, setFormContact] = useState(profile.contact);
  const [err, setErr] = useState("");

  const filtered = useMemo(
    () =>
      events.filter(
        (e) =>
          e.status !== "cancelled" &&
          e.status !== "finished" &&
          (status === "all" || (status === "live" ? e.status === "live" : e.status === "upcoming")) &&
          (country === "all" || e.country === country)
      ),
    [events, status, country]
  );

  const detail = events.find((e) => e.id === detailId) ?? null;
  const confirming = events.find((e) => e.id === confirmId) ?? null;

  const fmtDate = (iso: string) =>
    new Date(iso + "T12:00:00").toLocaleDateString(lang === "en" ? "en-US" : lang, { weekday: "short", day: "numeric", month: "short" });

  const openConfirm = (id: string) => {
    setConfirmId(id);
    setRole(null);
    setErr("");
  };

  const submitConfirm = () => {
    if (!confirming || !role) return;
    if (role === "participant" && (!formName.trim() || !formContact.trim())) {
      setErr("⚠️ " + t("ev_name_ph") + " + " + t("ev_contact_ph"));
      return;
    }
    confirmAttendance(confirming.id, role, formName.trim());
    setConfirmId(null);
  };

  const eventCard = (e: EventItem, i: number) => {
    const c = countryById(e.country);
    const spots = e.maxParticipants - e.participants.length;
    const full = spots <= 0;
    return (
      <motion.article
        key={e.id}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ delay: (i % 6) * 0.06, duration: 0.5 }}
        className="panel panel-hover overflow-hidden flex flex-col group"
      >
        <div className="h-28 relative overflow-hidden" style={{ background: `linear-gradient(120deg, ${e.banner[0]}44, ${e.banner[1]}55), radial-gradient(18rem 9rem at 85% 0%, ${e.banner[0]}77, transparent)` }}>
          <div className="absolute -bottom-8 -left-4 w-28 h-28 rounded-full opacity-30 blur-2xl" style={{ background: e.banner[0] }} />
          <div className="absolute top-3 left-3">
            {e.status === "live" ? <LiveBadge label={t("c_live")} /> : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider bg-azure/12 text-azure border border-azure/35">
                <Clock size={10} /> {fmtDate(e.dateISO)} · {e.time}
              </span>
            )}
          </div>
          <span className="absolute right-3 top-3 text-[11px] font-bold px-2 py-0.5 rounded-full bg-black/35 backdrop-blur">{c.flag} {c.name[lang]}</span>
          <div className="absolute inset-0 bg-gradient-to-t from-[#05050de6] via-[#05050d40] to-transparent pointer-events-none" />
          <h3 className="absolute bottom-3 left-4 right-3.5 display text-[18px] sm:text-[20px] font-extrabold leading-tight drop-shadow-lg">{e.name}</h3>
        </div>
        <div className="p-4 flex flex-col flex-1">
          <p className="text-[11.5px] text-white/50 flex items-center gap-1.5"><MapPin size={11} /> {e.city !== "" ? e.address.split(",").slice(0, 2).join(",") : e.address}</p>
          <div className="flex items-center gap-2 mt-2.5">
            <Avatar name={e.organizer} hue={46} size={26} />
            <span className="text-[11.5px] font-semibold flex-1 truncate">{e.organizer}</span>
            <Stars value={e.organizerRating} size={11} />
            <span className="display text-[10.5px] font-bold text-gold">{e.organizerRating.toFixed(1)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="rounded-xl bg-white/4 border border-white/7 px-2.5 py-2">
              <p className="text-[9.5px] uppercase tracking-wider text-white/40 font-bold flex items-center gap-1"><Swords size={10} /> {t("ev_participants")}</p>
              <p className={`display text-[13px] font-bold mt-0.5 ${full ? "text-ember" : "text-mint"}`}>
                {e.participants.length}/{e.maxParticipants} {full && <span className="text-[9px]">· {t("ev_full")}</span>}
              </p>
            </div>
            <div className="rounded-xl bg-white/4 border border-white/7 px-2.5 py-2">
              <p className="text-[9.5px] uppercase tracking-wider text-white/40 font-bold flex items-center gap-1"><Users size={10} /> {t("ev_attendees")}</p>
              <p className="display text-[13px] font-bold mt-0.5 text-azure">{e.attendees} <span className="text-[9px] text-white/40">+{e.waitlist.length} ⏳</span></p>
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-1">
            <button onClick={() => setDetailId(e.id)} className="flex-1 py-2.5 rounded-xl text-[12px] font-bold border border-white/12 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center gap-1.5">
              <Eye size={13} /> {t("ev_info")}
            </button>
            {!myAttendance[e.id] && (
              <button onClick={() => openConfirm(e.id)} className="flex-1 py-2.5 rounded-xl text-[12px] font-bold border border-mint/40 text-mint bg-mint/8 hover:bg-mint/16 transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                <UserCheck size={13} /> {t("ev_confirm")}
              </button>
            )}
            {e.status === "live" && (
              <button onClick={() => enterArena(e.id)} className="flex-1 py-2.5 rounded-xl text-[12px] font-bold display bg-gold text-[#171200] hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-1.5">
                {t("live_enter")} <ArrowRight size={13} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>
      </motion.article>
    );
  };

  return (
    <div className="space-y-6">
      <SectionHead
        hue={200}
        icon={<MapPin size={17} />}
        title={t("ev_title")}
        sub={t("ev_sub")}
        action={
          <button onClick={() => setTab("org")} className="hidden sm:flex items-center gap-1.5 text-[11.5px] font-bold text-violet border border-violet/35 bg-violet/8 hover:bg-violet/16 px-3 py-1.5 rounded-full transition-colors cursor-pointer">
            <Sparkles size={12} /> {t("nav_org")}
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Chip active={status === "all"} onClick={() => setStatus("all")} hue={268}>{t("c_all")}</Chip>
        <Chip active={status === "live"} onClick={() => setStatus("live")} hue={0}>{t("c_live")}</Chip>
        <Chip active={status === "upcoming"} onClick={() => setStatus("upcoming")} hue={200}>{t("c_upcoming")} · 14 {t("c_days")}</Chip>
        <span className="w-px h-5 bg-white/10 mx-1 hidden sm:block" />
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="px-3 py-1.5 rounded-full text-[12px] font-semibold bg-white/5 border border-white/10 text-white/80 outline-none cursor-pointer"
          aria-label={t("ev_filter_region")}
        >
          <option value="all" className="bg-[#0d0d1c]">🌍 {t("c_all")}</option>
          {COUNTRIES.map((c) => (
            <option key={c.id} value={c.id} className="bg-[#0d0d1c]">{c.flag} {c.name[lang]}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="panel p-10 text-center text-white/40 text-sm">
          <Hourglass size={28} className="mx-auto mb-3 text-white/20" />
          —
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((e, i) => eventCard(e, i))}
        </div>
      )}

      {/* ===== finished events (separate box, results) ===== */}
      {(() => {
        const finished = events
          .filter((e) => e.status === "finished" && (country === "all" || e.country === country))
          .sort((a, b) => (b.dateISO || "").localeCompare(a.dateISO || ""));
        if (finished.length === 0) return null;
        return (
          <motion.section initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5 }} className="pt-2">
            <SectionHead hue={316} icon={<Medal size={16} />} title={t("ev_finished_events")} sub={t("ev_finished_events_sub")} />
            <div className="space-y-3">
              {finished.map((fe) => {
                const ranked = Object.entries(fe.votes).sort((a, b) => b[1] - a[1]);
                const champ = fe.winner ?? (ranked.length > 0 ? ranked[0][0] : null);
                const maxV = ranked.length > 0 ? ranked[0][1] : 1;
                return (
                  <article key={fe.id} className="panel p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="display text-[15px] font-extrabold flex-1 min-w-0 truncate">{fe.name}</span>
                      <span className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-mint/10 text-mint border border-mint/30"><Medal size={10} /> {t("ev_finished").toUpperCase()}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] text-white/45">
                      <span>{countryById(fe.country).flag} {countryById(fe.country).name[lang]}</span>
                      <span>· {fe.dateISO} {fe.time}</span>
                      <span>· {fe.participants.length} {t("ev_participants").toLowerCase()}</span>
                      {champ && (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-gold bg-gold/10 border border-gold/30 px-2 py-0.5 rounded-full">
                          <Crown size={12} /> {t("ev_winner_title")}: {userNameById(champ)} {fe.winnerAura > 0 && `+${fe.winnerAura}`} <Zap size={9} className="text-gold" />
                        </span>
                      )}
                    </div>
                    {ranked.length > 0 ? (
                      <div className="mt-3 space-y-1.5">
                        {ranked.map(([pid, v], i) => (
                          <div key={pid} className={`flex items-center gap-2 ${pid === champ ? "text-gold" : ""}`}>
                            <span className="display text-[10px] w-4 shrink-0 text-white/30">{i + 1}</span>
                            <span className="text-[11.5px] font-semibold w-20 sm:w-28 shrink-0 truncate">{userNameById(pid)}</span>
                            <div className="flex-1 min-w-0 h-1.5 rounded-full bg-white/6 overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-700 ${pid === champ ? "bg-gold" : "bg-azure"}`} style={{ width: `${(v / maxV) * 100}%` }} />
                            </div>
                            <span className="display text-[10.5px] font-bold text-azure w-9 sm:w-10 shrink-0 text-right">{v}</span>
                            {pid === champ && <Crown size={12} className="text-gold shrink-0" />}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-[11px] text-white/35">{t("org_no_votes")}</p>
                    )}
                  </article>
                );
              })}
            </div>
          </motion.section>
        );
      })()}

      {/* ================= EVENT DETAIL MODAL ================= */}
      <Modal open={!!detail} onClose={() => setDetailId(null)} wide>
        {detail && (() => {
          const c = countryById(detail.country);
          const spots = detail.maxParticipants - detail.participants.length;
          const full = spots <= 0;
          const attended = myAttendance[detail.id];
          return (
            <div className="space-y-5">
              <div className="h-28 rounded-xl relative overflow-hidden" style={{ background: `linear-gradient(120deg, ${detail.banner[0]}40, ${detail.banner[1]}50), radial-gradient(20rem 10rem at 80% 0%, ${detail.banner[0]}66, transparent)` }}>
                <div className="absolute top-3 left-3">{detail.status === "live" ? <LiveBadge label={t("c_live")} /> : detail.status === "finished" ? <span className="text-[10.5px] font-extrabold tracking-wider text-white/60 bg-white/10 border border-white/20 px-2 py-0.5 rounded-full">{t("ev_finished").toUpperCase()}</span> : <span className="text-[10.5px] font-extrabold tracking-wider text-azure bg-azure/12 border border-azure/35 px-2 py-0.5 rounded-full">{t("c_upcoming").toUpperCase()}</span>}</div>
                <h3 className="absolute bottom-3 left-4 right-10 display text-lg sm:text-xl font-extrabold leading-tight">{detail.name}</h3>
              </div>

              <p className="text-[13px] text-white/70 leading-relaxed">{detail.desc[lang]}</p>

              {detail.status === "finished" && detail.winner && (
                <div className="panel p-4 flex items-center gap-3 border border-gold/30 bg-gold/5">
                  <Trophy size={22} className="text-gold shrink-0" />
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-gold/80">{t("ev_winner_title")}</p>
                    <p className="display text-[16px] font-extrabold">{userNameById(detail.winner)}</p>
                    {detail.winnerAura > 0 && <p className="text-[11px] text-white/55">+{detail.winnerAura.toLocaleString()} {t("c_aura")} <Zap size={10} className="inline text-gold" /></p>}
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3 text-[12.5px]">
                <div className="flex items-center gap-2.5 panel p-3"><Calendar size={15} className="text-gold shrink-0" /><div><p className="font-bold">{fmtDate(detail.dateISO)}</p><p className="text-white/45 text-[11px] flex items-center gap-1"><Clock size={10} /> {detail.time} – {detail.endTime || "–"} h</p></div></div>
                <div className="flex items-center gap-2.5 panel p-3"><MapPin size={15} className="text-rose shrink-0" /><div><p className="font-bold">{c.flag} {c.name[lang]}</p><p className="text-white/45 text-[11px]">{detail.address}</p></div></div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">{t("ev_map")}</p>
                <MiniMap lat={detail.lat} lng={detail.lng} label={detail.name} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="panel p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2.5">{t("ev_organizer")}</p>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={detail.organizer} hue={46} size={38} />
                    <div className="flex-1">
                      <p className="text-[13px] font-bold">{detail.organizer}</p>
                      <div className="flex items-center gap-1.5"><Stars value={detail.organizerRating} size={11} /><span className="display text-[10.5px] font-bold text-gold">{detail.organizerRating.toFixed(1)}</span></div>
                    </div>
                  </div>
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/35 mt-3 mb-1.5">{t("ev_refs")}</p>
                  <ul className="space-y-1">
                    {detail.organizerRefs.map((r, i) => <li key={i} className="text-[11.5px] text-white/60 flex gap-1.5"><span className="text-gold">★</span>{r}</li>)}
                  </ul>
                  {detail.collaborators.length > 0 && (
                    <>
                      <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/35 mt-3 mb-1.5">{t("ev_collabs")}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {detail.collaborators.map((cb, i) => <span key={i} className="text-[10.5px] px-2 py-1 rounded-full bg-violet/10 border border-violet/25 text-white/70">{cb.name}</span>)}
                      </div>
                    </>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="panel p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">{t("ev_part_list")} · <span className={full ? "text-ember" : "text-mint"}>{detail.participants.length}/{detail.maxParticipants}</span> {full && `· ${t("ev_full")}`}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.participants.map((p, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10">
                          <Avatar name={userNameById(p)} hue={(i * 67) % 360} size={18} />
                          {userNameById(p)}
                        </span>
                      ))}
                      {full && detail.waitlist.length > 0 && <span className="text-[11px] px-2 py-1 rounded-full bg-ember/10 border border-ember/30 text-ember">⏳ {detail.waitlist.length} {t("ev_waitlist").toLowerCase()}</span>}
                    </div>
                  </div>
                    <div className="panel p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">{t("ev_features")}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {detail.features.map((f) => <span key={f} className="text-[10.5px] px-2.5 py-1 rounded-full font-semibold" style={{ background: "#FFD70014", border: "1px solid #FFD70035", color: "#FFD700" }}>{t(f)}</span>)}
                      </div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-white/35 mt-3.5 mb-2">{t("ev_share")}</p>
                      <ShareRow title={detail.name} url={`${window.location.origin}${window.location.pathname}#/e/${detail.id}`} />
                    </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                {detail.status === "finished" ? (
                  <div className="flex-1 py-3 rounded-xl text-center text-[12.5px] font-bold text-white/50 border border-white/12 bg-white/4">🏁 {t("ev_finished")}</div>
                ) : attended ? (
                  <div className="flex-1 py-3 rounded-xl text-center text-[13px] font-bold text-mint border border-mint/35 bg-mint/8">✓ {t("ev_registered")}</div>
                ) : (
                  <button onClick={() => { openConfirm(detail.id); }} className={`${btnGold} flex-1 !py-3.5`}>
                    <UserCheck size={16} /> {t("ev_confirm")}
                  </button>
                )}
                {detail.status === "live" && (
                  <button onClick={() => { setDetailId(null); enterArena(detail.id); }} className="flex-1 py-3 rounded-xl display text-[12px] font-bold border border-ember/45 text-ember bg-ember/10 hover:bg-ember/20 transition-colors cursor-pointer">
                    {t("ev_enter_arena")} ⚔️
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ================= CONFIRM ATTENDANCE MODAL ================= */}
      <Modal open={!!confirming} onClose={() => setConfirmId(null)}>
        {confirming && (() => {
          const full = confirming.participants.length >= confirming.maxParticipants;
          return (
            <div className="space-y-4">
              <div>
                <h3 className="display text-base font-extrabold">{t("ev_confirm_title")}</h3>
                <p className="text-[12px] text-white/45 mt-0.5">{confirming.name} · {t("ev_as_what")}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => { setRole("participant"); setErr(""); }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${role === "participant" ? "border-ember/60 bg-ember/10" : "border-white/10 bg-white/4 hover:bg-white/7"}`}
                >
                  <Swords size={18} className={role === "participant" ? "text-ember" : "text-white/35"} />
                  <p className="text-[12.5px] font-bold mt-2">{t("ev_role_participant")}</p>
                  <p className="text-[10.5px] text-white/45 mt-0.5">{confirming.participants.length}/{confirming.maxParticipants} · {full ? t("ev_full") : `${confirming.maxParticipants - confirming.participants.length} ${t("ev_spots_left")}`}</p>
                </button>
                <button
                  onClick={() => { setRole("spectator"); setErr(""); }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${role === "spectator" ? "border-azure/60 bg-azure/10" : "border-white/10 bg-white/4 hover:bg-white/7"}`}
                >
                  <Eye size={18} className={role === "spectator" ? "text-azure" : "text-white/35"} />
                  <p className="text-[12.5px] font-bold mt-2">{t("ev_role_spectator")}</p>
                  <p className="text-[10.5px] text-white/45 mt-0.5">{t("ev_spec_unlimited")}</p>
                </button>
              </div>

              {role === "participant" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {full && (
                    <div className="p-3.5 rounded-xl bg-ember/8 border border-ember/30 text-[12px] text-white/75">
                      ⏳ <b>{t("ev_full")}.</b> {t("ev_waitlist_note")}
                    </div>
                  )}
                  <Field label={t("ev_name_ph")}><input className={inputCls} value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={t("ev_name_ph")} /></Field>
                  <Field label={t("ev_contact_ph")}><input className={inputCls} value={formContact} onChange={(e) => setFormContact(e.target.value)} placeholder={t("ev_contact_ph")} /></Field>
                  {err && <p className="text-[11.5px] text-ember font-semibold">{err}</p>}
                  <button onClick={submitConfirm} className="w-full py-3 rounded-xl display text-[12px] font-bold bg-ember text-white hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer">
                    {full ? t("ev_waitlist_btn") : t("ev_confirm_btn")} ⚔️
                  </button>
                </motion.div>
              )}

              {role === "spectator" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <button onClick={submitConfirm} className="w-full py-3 rounded-xl display text-[12px] font-bold bg-azure text-[#001018] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer">
                    {t("ev_confirm_btn")} 🗳️
                  </button>
                </motion.div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

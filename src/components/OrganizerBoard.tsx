import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { motion } from "framer-motion";
import { Lock, KeyRound, ShieldCheck, Swords, Trash2, UserPlus, Save, Radio, AlertTriangle, Users, Vote, Trophy, Crown, Zap, Plus } from "lucide-react";
import { useApp, userNameById } from "../store";
import { useT } from "../i18n";
import { COUNTRIES, countryById } from "../data";
import type { EventItem } from "../data";
import { Avatar, Chip, Modal, SectionHead, Field, inputCls, btnGold } from "./ui";
import LocationPicker, { type PickedPlace } from "./LocationPicker";

const FEATURE_TAGS = ["t_stream", "t_prize", "t_food", "t_music", "t_photo", "t_free_entry"];
const BANNER_COMBOS: [string, string][] = [
  ["#FFD700", "#9B30FF"], ["#00FF7F", "#00BFFF"], ["#FF4444", "#FFD700"],
  ["#9B30FF", "#FF69B4"], ["#00BFFF", "#00FF7F"], ["#FF69B4", "#9B30FF"],
];

export default function OrganizerBoard() {
  const t = useT();
  /* narrow subscriptions: realtime ticks must not re-render this board.
     `s` merges stable actions (getState) with the reactive data slice. */
  const data = useApp(
    useShallow((st) => ({
      orgUnlocked: st.orgUnlocked,
      organizer: st.organizer,
      events: st.events,
      lang: st.lang,
      profile: st.profile,
      supabaseProfileId: st.supabaseProfileId,
      userEmail: st.userEmail,
      isOAuth: st.isOAuth,
    }))
  );
  const s = { ...useApp.getState(), ...data };
  const { orgUnlocked, organizer, events, lang, supabaseProfileId, userEmail, profile, isOAuth } = s;

  /* ---------- access gate ---------- */
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [reg, setReg] = useState({ name: "", contact: "", country: "mx", refs: "", email: "", password: "" });
  const [authErr, setAuthErr] = useState("");
  const [becomeForm, setBecomeForm] = useState({ name: profile.name || "", contact: "", refs: "" });
  const [becomeErr, setBecomeErr] = useState("");

  const doUnlock = async () => {
    setAuthErr("");
    const ok = await s.loginOrganizerReal(loginEmail.trim(), loginPassword);
    if (ok) { setLoginEmail(""); setLoginPassword(""); }
    else setAuthErr("⚠️");
  };

  /* ---------- create form ---------- */
  const [form, setForm] = useState({ name: "", desc: "", date: "", time: "19:00", endTime: "21:00", loc: null as PickedPlace | null, address: "", maxAtt: 200, maxPart: 8, notes: "", features: ["t_stream", "t_prize"], banner: 0 });
  const [formErr, setFormErr] = useState("");
  const myEvents = useMemo(() => events.filter((e) => e.organizerId === "u1" || e.organizerId === "me" || (supabaseProfileId && e.organizerId === supabaseProfileId)), [events, supabaseProfileId]);
  const userEmailNorm = userEmail?.trim().toLowerCase() ?? "";
  const [manageIdLocal, setManageIdLocal] = useState<string | null>(null);
  const collabEvents = useMemo(() => events.filter((e) => e.collaborators.some((c) => (c.email ?? "").trim().toLowerCase() === userEmailNorm)), [events, userEmailNorm]);
  const isOwnerOf = (e: EventItem) => e.organizerId === "u1" || e.organizerId === "me" || (supabaseProfileId && e.organizerId === supabaseProfileId);
  const myPermFor = (e: EventItem): "owner" | "full" | "edit" | "vote" | null => {
    if (isOwnerOf(e)) return "owner";
    const c = e.collaborators.find((x) => (x.email ?? "").trim().toLowerCase() === userEmailNorm);
    if (!c) return null;
    return (c.perm as "full" | "edit" | "vote") || null;
  };
  const allManageable = useMemo(() => {
    const set = new Map<string, EventItem>();
    myEvents.forEach((e) => set.set(e.id, e));
    collabEvents.forEach((e) => set.set(e.id, e));
    return Array.from(set.values());
  }, [myEvents, collabEvents]);
  const managed = allManageable.find((e) => e.id === manageIdLocal) ?? allManageable[0] ?? null;
  const permOfManaged = managed ? myPermFor(managed) : null;
  const canManageEvent = permOfManaged === "owner" || permOfManaged === "full" || permOfManaged === "edit";

  const [collab, setCollab] = useState({ name: "", nameDisplay: "", perm: "vote" as "vote" | "edit" | "full" });
  const [guestName, setGuestName] = useState("");
  const [manualPicks, setManualPicks] = useState<string[]>([]);
  const [cancelAsk, setCancelAsk] = useState(false);
  const [delAsk, setDelAsk] = useState(false);
  const [edit, setEdit] = useState<{ name: string; date: string; time: string; endTime: string; notes: string } | null>(null);

  const roundKeys = ["org_r16", "org_qf", "org_sf", "org_final"];

  const submitCreate = () => {
    if (!form.name.trim() || !form.desc.trim() || !form.address.trim() || !form.date || !form.loc) {
      setFormErr("⚠️ " + t("org_create_sub"));
      return;
    }
    const loc = form.loc;
    const ev: EventItem = {
      id: "ev" + Date.now(), name: form.name.trim(),
      desc: { es: form.desc, pt: form.desc, fr: form.desc, en: form.desc },
      country: loc.countryCode || "world", city: loc.label, lat: loc.lat, lng: loc.lng, address: form.address.trim(),
      dateISO: form.date, time: form.time, endTime: form.endTime,
      organizer: organizer?.name ?? s.profile.name, organizerId: "me", organizerRating: 5,
      organizerRefs: organizer?.refs ? organizer.refs.split("·") : [t("c_free")],
      collaborators: [],
      maxParticipants: form.maxPart, participants: [], attendees: 0, waitlist: [],
      status: "upcoming", features: form.features, banner: BANNER_COMBOS[form.banner],
      votes: {}, bracket: [], currentMatchId: null, matchStartedAt: null, groups: [], chat: [], notes: form.notes,
      winner: null, winnerAura: 0,
    };
    s.createEvent(ev);
    setForm({ ...form, name: "", desc: "", address: "", notes: "", date: "", loc: null });
    setFormErr("");
  };

  /* ================= GATE UI ================= */
  const canManage = allManageable.length > 0 || orgUnlocked;
  if (allManageable.length === 0 && !orgUnlocked) {
    return (
      <div className="max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="panel p-6 sm:p-7 relative overflow-hidden">
          <div className="absolute -top-14 -right-14 w-44 h-44 rounded-full bg-violet/15 blur-3xl" />
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl grid place-items-center bg-violet/12 border border-violet/35 mb-4">
              <Lock size={20} className="text-violet" />
            </div>
            <h2 className="display text-lg font-extrabold">{t("org_locked_title")}</h2>
            <p className="text-[12px] text-white/45 mt-1">{isOAuth ? "Completa tus datos para ser organizador" : t("org_locked_sub")}</p>

            {isOAuth ? (
              <div className="mt-5 space-y-3">
                <Field label={t("org_reg_name")}><input className={inputCls} value={becomeForm.name} onChange={(e) => setBecomeForm({ ...becomeForm, name: e.target.value })} placeholder="Valentina Cruz" /></Field>
                <Field label={t("org_reg_contact")}><input className={inputCls} value={becomeForm.contact} onChange={(e) => setBecomeForm({ ...becomeForm, contact: e.target.value })} placeholder="@usuario / +52 …" /></Field>
                <Field label={t("org_reg_refs")}><textarea className={inputCls + " resize-none"} rows={2} value={becomeForm.refs} onChange={(e) => setBecomeForm({ ...becomeForm, refs: e.target.value })} placeholder="…" /></Field>
                {becomeErr && <p className="text-[10.5px] text-ember">{becomeErr}</p>}
                <button
                  onClick={async () => {
                    if (!becomeForm.name.trim()) { setBecomeErr("⚠️"); return; }
                    setBecomeErr("");
                    const ok = await s.becomeOrganizer(becomeForm.name.trim(), becomeForm.contact, becomeForm.refs);
                    if (!ok) setBecomeErr("Error al registrar");
                  }}
                  className="w-full py-3 rounded-xl display text-[12px] font-bold bg-violet text-white hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {t("org_create_org")}
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-1.5 mt-5 p-1 rounded-xl bg-white/4 border border-white/8">
                  {(["login", "register"] as const).map((m) => (
                    <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${mode === m ? "bg-violet text-white" : "text-white/50 hover:text-white"}`}>
                      {m === "login" ? t("org_login_tab") : t("org_register_tab")}
                    </button>
                  ))}
                </div>

                {mode === "login" ? (
                  <div className="mt-5 space-y-3">
                    <Field label="Email"><input type="email" className={inputCls} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="tu@email.com" /></Field>
                    <Field label="Contraseña"><input type="password" className={inputCls} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && doUnlock()} /></Field>
                    {authErr && <p className="text-[10.5px] text-ember">{authErr} Email o contraseña incorrectos</p>}
                    <button onClick={doUnlock} className="w-full py-3 rounded-xl display text-[12px] font-bold bg-violet text-white hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer">{t("org_unlock")}</button>
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    <Field label={t("org_reg_name")}><input className={inputCls} value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} placeholder="Valentina Cruz" /></Field>
                    <Field label={t("org_reg_contact")}><input className={inputCls} value={reg.contact} onChange={(e) => setReg({ ...reg, contact: e.target.value })} placeholder="@usuario / +52 …" /></Field>
                    <Field label={t("org_reg_country")}>
                      <select className={inputCls + " cursor-pointer"} value={reg.country} onChange={(e) => setReg({ ...reg, country: e.target.value })}>
                        {COUNTRIES.map((c) => <option key={c.id} value={c.id} className="bg-[#0d0d1c]">{c.flag} {c.name[lang]}</option>)}
                      </select>
                    </Field>
                    <Field label={t("org_reg_refs")}><textarea className={inputCls + " resize-none"} rows={2} value={reg.refs} onChange={(e) => setReg({ ...reg, refs: e.target.value })} placeholder="…" /></Field>
                    <Field label="Email"><input type="email" className={inputCls} value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} placeholder="tu@email.com" /></Field>
                    <Field label="Contraseña"><input type="password" className={inputCls} value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} placeholder="Mínimo 6 caracteres" /></Field>
                    {formErr && <p className="text-[10.5px] text-ember">{formErr} Revisa los datos ingresados</p>}
                    <button
                      onClick={async () => {
                        if (!reg.name.trim() || !reg.email.trim() || reg.password.length < 6) { setFormErr("⚠️"); return; }
                        setFormErr("");
                        await s.registerOrganizerReal(reg.email.trim(), reg.password, reg.name.trim(), reg.contact, reg.country, reg.refs);
                      }}
                      className="w-full py-3 rounded-xl display text-[12px] font-bold bg-violet text-white hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      {t("org_create_org")}
                    </button>
                    {formErr && <p className="text-ember text-[11.5px] font-semibold">{formErr}</p>}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  /* ================= DASHBOARD UI ================= */
  const totalVotes = myEvents.reduce((acc, e) => acc + Object.values(e.votes).reduce((a, b) => a + b, 0), 0);
  const totalAssist = myEvents.reduce((a, e) => a + e.attendees, 0);
  const totalPart = myEvents.reduce((a, e) => a + e.participants.length, 0);
  const R = managed ? Math.max(...managed.bracket.map((m) => m.round + 1), 0) : 0;
  const roundName = (r: number) => t(roundKeys.slice(4 - R)[r] ?? "org_final");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-11 h-11 rounded-2xl grid place-items-center bg-violet/12 border border-violet/35"><ShieldCheck size={19} className="text-violet" /></div>
        <div className="flex-1 min-w-0">
          <h2 className="display text-base font-extrabold leading-tight">{t("org_title")}</h2>
          <p className="text-[11.5px] text-white/45">{organizer?.name ?? profile?.name ?? userEmail ?? ""} · {organizer ? countryById(organizer.country ?? "mx").flag : "🧑‍💻"}</p>
        </div>
        <button onClick={() => (orgUnlocked ? s.logoutOrganizer() : s.logoutAppUser())} className="text-[11.5px] font-bold text-ember/70 hover:text-ember border border-ember/25 px-3 py-1.5 rounded-full transition-colors cursor-pointer mr-2">Cerrar sesión</button>
        <button onClick={() => s.setTab("events")} className="text-[11.5px] font-bold text-white/50 hover:text-white border border-white/12 px-3 py-1.5 rounded-full transition-colors cursor-pointer">{t("c_back")}</button>
      </div>

      {/* stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users, n: totalAssist, label: t("org_assist_count"), c: "#00BFFF" },
          { icon: Swords, n: totalPart, label: t("org_part_count"), c: "#FF4444" },
          { icon: Vote, n: totalVotes, label: t("org_vote_count"), c: "#FFD700" },
        ].map((x, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="panel p-4 text-center">
            <x.icon size={16} style={{ color: x.c }} className="mx-auto" />
            <p className="display text-lg font-extrabold mt-1" style={{ color: x.c }}>{x.n.toLocaleString()}</p>
            <p className="text-[10px] text-white/45 font-semibold uppercase tracking-wider">{x.label}</p>
          </motion.div>
        ))}
      </div>

      <div className={`grid items-start gap-4 ${orgUnlocked ? "lg:grid-cols-2" : ""}`}>
        {/* ===== create event ===== */}
        {orgUnlocked && (
          <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="panel p-5">
          <SectionHead hue={46} icon={<Plus size={16} />} title={t("org_create_title")} sub={t("org_create_sub")} />
          <div className="space-y-3">
            <Field label={t("org_ev_name") + " *"}><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label={t("org_ev_desc") + " *"}><textarea rows={2} className={inputCls + " resize-none"} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("org_ev_date") + " *"}><input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
              <Field label={t("org_ev_time")}><input type="time" className={inputCls} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
              <Field label={t("org_ev_end_time")}><input type="time" className={inputCls} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></Field>
            </div>
            <Field label={t("org_ev_address") + " *"}><input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">{t("org_ev_location")} *</p>
              <LocationPicker value={form.loc} onChange={(loc) => setForm({ ...form, loc })} lang={lang} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("org_ev_max_att")}><input type="number" min={1} className={inputCls} value={form.maxAtt} onChange={(e) => setForm({ ...form, maxAtt: +e.target.value })} /></Field>
              <Field label={t("org_ev_max_part")}><input type="number" min={2} max={16} className={inputCls} value={form.maxPart} onChange={(e) => setForm({ ...form, maxPart: +e.target.value })} /></Field>
            </div>
            <Field label={t("org_ev_notes")}><input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">{t("org_ev_features")}</p>
              <div className="flex flex-wrap gap-1.5">
                {FEATURE_TAGS.map((f) => {
                  const on = form.features.includes(f);
                  return (
                    <button key={f} onClick={() => setForm({ ...form, features: on ? form.features.filter((x) => x !== f) : [...form.features, f] })} className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold transition-all cursor-pointer ${on ? "bg-gold text-[#171200]" : "bg-white/5 border border-white/10 text-white/55"}`}>
                      {t(f)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">{t("org_ev_banner")} <span className="normal-case font-medium text-white/30">· {t("org_ev_banner_sub")}</span></p>
              <div className="flex gap-2">
                {BANNER_COMBOS.map((b, i) => (
                  <button key={i} onClick={() => setForm({ ...form, banner: i })} aria-label={`banner ${i}`} className={`w-10 h-7 rounded-lg transition-all cursor-pointer ${form.banner === i ? "ring-2 ring-white scale-110" : "opacity-60 hover:opacity-100"}`} style={{ background: `linear-gradient(120deg, ${b[0]}, ${b[1]})` }} />
                ))}
              </div>
            </div>
            {formErr && <p className="text-ember text-[11.5px] font-semibold">{formErr}</p>}
            <button onClick={submitCreate} className={btnGold + " w-full"}><Zap size={15} /> {t("org_ev_create")}</button>
          </div>
          </motion.section>
        )}

        <div className="space-y-4">
          {/* ===== collaborators (per event, owner only) ===== */}
          {managed && myPermFor(managed) === "owner" && (
            <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="panel p-5">
              <SectionHead hue={316} icon={<UserPlus size={16} />} title={t("org_collab_title")} />
              <p className="text-[10.5px] text-white/40 mb-3">{managed.name} · {t("org_invite")}</p>
              <div className="space-y-2 mb-3">
                {managed.collaborators.map((c, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl bg-white/3 border border-white/7">
                    <Avatar name={c.name} hue={(i * 90 + 200) % 360} size={30} />
                    <div className="flex-1 min-w-0">
                      <span className="block text-[12.5px] font-semibold truncate">{c.name}</span>
                      {c.email && <span className="block text-[10px] text-white/40 truncate">{c.email}</span>}
                    </div>
                    <select value={c.perm} onChange={(e) => s.setCollabPerm(managed.id, i, e.target.value as "vote" | "edit" | "full")} className="text-[10.5px] font-bold px-2 py-1 rounded-lg bg-violet/10 border border-violet/30 text-white/75 outline-none cursor-pointer" aria-label={t("org_perm")}>
                      <option value="vote" className="bg-[#0d0d1c]">🗳️ vote</option>
                      <option value="edit" className="bg-[#0d0d1c]">✏️ edit</option>
                      <option value="full" className="bg-[#0d0d1c]">👑 full</option>
                    </select>
                    <button onClick={() => s.removeCollab(managed.id, i)} aria-label={t("org_remove")} className="text-white/30 hover:text-ember transition-colors cursor-pointer"><Trash2 size={14} /></button>
                  </div>
                ))}
                {managed.collaborators.length === 0 && <p className="text-[11.5px] text-white/35">—</p>}
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                <div>
                  <input className={inputCls} placeholder="Email del colaborador" value={collab.name} onChange={(e) => setCollab({ ...collab, name: e.target.value })} />
                  <input className={inputCls + " mt-2"} placeholder="Nombre (opcional)" value={collab.nameDisplay ?? ""} onChange={(e) => setCollab({ ...collab, nameDisplay: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <select value={collab.perm} onChange={(e) => setCollab({ ...collab, perm: e.target.value as typeof collab.perm })} className="px-2 rounded-xl bg-white/5 border border-white/10 text-[11px] outline-none cursor-pointer">
                    <option value="vote" className="bg-[#0d0d1c]">vote</option>
                    <option value="edit" className="bg-[#0d0d1c]">edit</option>
                    <option value="full" className="bg-[#0d0d1c]">full</option>
                  </select>
                  <button
                    onClick={() => {
                      const email = collab.name.trim();
                      if (!email) return;
                      s.inviteCollab(managed.id, { name: collab.nameDisplay?.trim() || email, email, perm: collab.perm });
                      setCollab({ name: "", nameDisplay: "", perm: "vote" });
                    }}
                    className="px-3.5 rounded-xl bg-violet text-white display text-[11px] font-bold hover:brightness-110 transition-all cursor-pointer"
                  >
                    {t("org_invite")}
                  </button>
                </div>
              </div>
            </motion.section>
          )}

          {/* ===== manage events ===== */}
          <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="panel p-5">
            <SectionHead hue={0} icon={<Swords size={16} />} title={t("org_my_events")} sub={t("org_control")} />
            {allManageable.length === 0 ? (
              <p className="text-[12px] text-white/40">{t("org_no_events")}</p>
            ) : (
              <>
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                  {allManageable.map((e) => (
                    <Chip key={e.id} active={managed?.id === e.id} onClick={() => setManageIdLocal(e.id)} hue={0}>{e.name}</Chip>
                  ))}
                </div>

                {managed && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-full ${managed.status === "live" ? "bg-ember/15 text-ember border border-ember/40" : managed.status === "cancelled" ? "bg-white/6 text-white/40 border border-white/12" : managed.status === "finished" ? "bg-mint/10 text-mint border border-mint/30" : "bg-azure/12 text-azure border border-azure/35"}`}>
                        {managed.status === "live" ? t("c_live") : managed.status === "cancelled" ? t("ev_cancelled").toUpperCase() : managed.status === "finished" ? t("ev_finished").toUpperCase() : t("c_upcoming").toUpperCase()}
                      </span>
                      <span className="text-[11.5px] text-white/50">{managed.participants.length}/{managed.maxParticipants} {t("ev_participants").toLowerCase()} · {managed.attendees} {t("org_assist_count").toLowerCase()}</span>
                      {managed.status === "finished" && managed.winner && (
                        <span className="flex items-center gap-1 text-[10.5px] font-bold text-gold bg-gold/10 border border-gold/30 px-2 py-0.5 rounded-full">
                          <Trophy size={11} /> {t("ev_winner_title")}: {userNameById(managed.winner)} +{managed.winnerAura} <Zap size={9} className="text-gold" />
                        </span>
                      )}
                      <div className="flex-1" />
                      {canManageEvent && (
                        <div className="flex items-center gap-1.5 w-full sm:w-auto order-last sm:order-none">
                          <input
                            type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)}
                            placeholder="Nombre del participante"
                            className="flex-1 sm:w-40 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/12 text-[11.5px] outline-none focus:border-mint/40"
                          />
                          <button
                            onClick={() => { s.addGuestParticipant(managed.id, guestName); setGuestName(""); }}
                            disabled={!guestName.trim()}
                            className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-mint/12 border border-mint/35 text-mint hover:bg-mint/22 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                          >
                            + Agregar
                          </button>
                        </div>
                      )}
                      {managed.status !== "cancelled" && permOfManaged === "owner" && (
                        <>
                          <button onClick={() => setEdit({ name: managed.name, date: managed.dateISO, time: managed.time, endTime: managed.endTime, notes: managed.notes })} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-white/12 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">{t("org_modify")}</button>
                          <button onClick={() => setCancelAsk(true)} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-ember/35 text-ember bg-ember/8 hover:bg-ember/16 transition-colors cursor-pointer">{t("org_cancel_ev")}</button>
                          {managed.status !== "finished" && (
                            <button onClick={() => s.finishEvent(managed.id)} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-mint/35 text-mint bg-mint/8 hover:bg-mint/16 transition-colors cursor-pointer">{t("org_finish_ev")}</button>
                          )}
                          <button onClick={() => setDelAsk(true)} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-ember/45 text-ember bg-ember/12 hover:bg-ember/22 transition-colors cursor-pointer">{t("org_delete_ev")}</button>
                        </>
                      )}
                    </div>

                    {/* group phase (3+ fighters per battle, before the bracket) */}
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                          <Users size={12} className="text-mint" /> {t("org_groups_title")}
                          <span className="normal-case font-medium text-white/30 tracking-normal hidden sm:inline">· {t("org_groups_sub")}</span>
                        </p>
                        <div className="flex gap-1.5">
                          {canManageEvent && (
                            <button onClick={() => s.createGroups(managed.id)} className="text-[10.5px] font-bold px-2.5 py-1 rounded-lg bg-mint/12 border border-mint/35 text-mint hover:bg-mint/22 transition-colors cursor-pointer">
                              {t("org_gen_groups")} · Auto
                            </button>
                          )}
                          {canManageEvent && managed.groups.some((g) => g.status === "closed" && g.winner) && (
                            <button onClick={() => s.promoteGroups(managed.id)} className="text-[10.5px] font-bold px-2.5 py-1 rounded-lg bg-ember/12 border border-ember/35 text-ember hover:bg-ember/22 transition-colors cursor-pointer">
                              {t("org_promote_bracket")}
                            </button>
                          )}
                        </div>
                      </div>
                      {canManageEvent && (
                        <div className="mb-3 p-2.5 rounded-lg bg-white/4 border border-white/8">
                          <p className="text-[10.5px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Armar grupo manual</p>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {managed.participants.map((pid) => {
                              const picked = manualPicks.includes(pid);
                              return (
                                <button
                                  key={pid}
                                  onClick={() => setManualPicks((prev) => (picked ? prev.filter((x) => x !== pid) : [...prev, pid]))}
                                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${picked ? "bg-mint/20 border-mint/50 text-mint" : "bg-white/5 border-white/12 text-white/60 hover:bg-white/10"}`}
                                >
                                  {userNameById(pid)}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => { s.addManualGroup(managed.id, manualPicks); setManualPicks([]); }}
                            disabled={manualPicks.length < 2}
                            className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-mint/12 border border-mint/35 text-mint hover:bg-mint/22 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            Crear grupo con {manualPicks.length} seleccionados
                          </button>
                        </div>
                      )}

                      {managed.groups.length === 0 ? (
                        <p className="text-[11.5px] text-white/35">— {t("org_gen_groups")} ({managed.participants.length} {t("ev_participants").toLowerCase()})</p>
                      ) : (
                        <div className="grid sm:grid-cols-2 gap-2.5">
                          {managed.groups.map((g) => {
                            const total = Object.values(g.votes).reduce((a, b) => a + b, 0) || 1;
                            const sorted = [...g.fighters].sort((x, y) => (g.votes[y] ?? 0) - (g.votes[x] ?? 0));
                            return (
                              <div key={g.id} className={`rounded-xl border p-2.5 transition-colors ${g.status === "live" ? "border-ember/45 bg-ember/6" : g.status === "closed" ? "border-mint/30 bg-mint/5" : "border-white/9 bg-white/3"}`}>
                                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-2">
                                  <span className="display text-[10.5px] font-extrabold text-white/80">{t("org_group")} {g.name}</span>
                                  <span className={`text-[8.5px] font-extrabold tracking-wider px-1.5 py-0.5 rounded-full ${g.status === "live" ? "bg-ember/15 text-ember border border-ember/40" : g.status === "closed" ? "bg-mint/12 text-mint border border-mint/35" : "bg-white/6 text-white/40 border border-white/12"}`}>
                                    {g.status === "live" ? t("org_current").toUpperCase() : g.status === "closed" ? t("ar_completed").toUpperCase() : t("ar_scheduled").toUpperCase()}
                                  </span>
                                  <div className="flex-1" />
                                  {canManageEvent && g.status === "open" && (
                                    <button onClick={() => s.setGroupLive(managed.id, g.id)} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-ember/12 text-ember border border-ember/35 hover:bg-ember/25 transition-colors cursor-pointer">{t("org_set_current")}</button>
                                  )}
                                  {canManageEvent && g.status === "live" && (
                                    <button onClick={() => s.closeGroup(managed.id, g.id)} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-mint/12 text-mint border border-mint/35 hover:bg-mint/25 transition-colors cursor-pointer">{t("org_close_group")}</button>
                                  )}
                                  {canManageEvent && total > 1 && g.status !== "closed" && (
                                    <button onClick={() => s.voidGroupVotes(managed.id, g.id)} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/6 text-white/45 hover:text-ember transition-colors cursor-pointer">{t("org_void_votes")}</button>
                                  )}
                                  {canManageEvent && g.status === "open" && (
                                    <button onClick={() => s.removeGroup(managed.id, g.id)} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/6 text-white/45 hover:text-ember transition-colors cursor-pointer">✕</button>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  {sorted.map((pid) => {
                                    const v = g.votes[pid] ?? 0;
                                    const won = g.winner === pid;
                                    return (
                                      <div key={pid} className="flex items-center gap-1.5">
                                        <span className={`flex-1 text-[10.5px] font-semibold truncate ${won ? "text-mint" : "text-white/75"}`}>
                                          {won && <Crown size={9} className="inline mr-1 text-gold" />}{userNameById(pid)}
                                        </span>
                                        <div className="w-16 h-1.5 rounded-full bg-white/7 overflow-hidden">
                                          <div className="h-full rounded-full bg-mint transition-all duration-700" style={{ width: `${(v / total) * 100}%` }} />
                                        </div>
                                        <span className="display text-[9.5px] font-bold text-white/40 w-6 text-right">{v}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* bracket */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-1.5"><Trophy size={12} className="text-gold" /> {t("org_bracket_title")}</p>
                        {canManageEvent && <button onClick={() => s.generateBracket(managed.id)} className="text-[10.5px] font-bold px-2.5 py-1 rounded-lg bg-gold/12 border border-gold/35 text-gold hover:bg-gold/20 transition-colors cursor-pointer">{t("org_gen_bracket")}</button>}
                      </div>
                      {managed.bracket.length === 0 ? (
                        <p className="text-[11.5px] text-white/35">— {t("org_gen_bracket")} ({managed.participants.length} {t("ev_participants").toLowerCase()})</p>
                      ) : (
                        <div className="overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
                        <div className="grid gap-3 w-max min-w-full" style={{ gridTemplateColumns: `repeat(${R}, minmax(168px, 1fr))` }}>
                          {Array.from({ length: R }).map((_, r) => (
                            <div key={r} className="space-y-2 min-w-[150px]">
                              <p className="display text-[10px] font-extrabold tracking-wider text-white/45 uppercase text-center">{roundName(r)}</p>
                              {managed.bracket.filter((m) => m.round === r).map((m) => {
                                const isCurrent = managed.currentMatchId === m.id;
                                return (
                                  <div key={m.id} className={`rounded-xl border p-2 transition-all ${isCurrent ? "border-gold/60 bg-gold/8" : "border-white/9 bg-white/3"}`}>
                                    {isCurrent && <p className="text-[8.5px] font-extrabold tracking-widest text-gold mb-1 flex items-center gap-1"><Radio size={8} className="animate-pulse" /> {t("org_current").toUpperCase()}</p>}
                                    {m.closed && !m.winner && (
                                      <p className="text-[8.5px] font-extrabold tracking-widest text-ember mb-1 flex items-center gap-1 animate-pulse">👑 {t("org_decide_winner").toUpperCase()}</p>
                                    )}
                                    {(["a", "b"] as const).map((side) => {
                                      const pid = side === "a" ? m.a : m.b;
                                      const v = side === "a" ? m.votesA : m.votesB;
                                      const won = m.winner === side;
                                      return (
                                        <div key={side} className={`flex items-center gap-1.5 py-1 px-1.5 rounded-lg mb-0.5 ${won ? "bg-mint/12" : ""}`}>
                                          <span className={`flex-1 text-[11px] font-semibold truncate ${won ? "text-mint" : "text-white/80"}`}>{won && <Crown size={10} className="inline mr-1 text-gold" />}{userNameById(pid)}</span>
                                          <span className="display text-[10px] font-bold text-white/40">{v}</span>
                                          {canManageEvent && pid && (
                                            <button
                                              onClick={() => s.pickWinner(managed.id, m.id, side)}
                                              aria-label={t(m.winner ? "org_override_winner" : "org_pick_winner")}
                                              title={t(m.winner ? "org_override_winner" : "org_pick_winner")}
                                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded transition-colors cursor-pointer ${won ? "bg-gold/20 text-gold border border-gold/50" : m.winner ? "bg-white/6 text-white/45 border border-white/15 hover:bg-ember/20 hover:text-ember" : "bg-mint/15 text-mint border border-mint/40 hover:bg-mint/30"}`}
                                            >
                                              ✓
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                    <div className="flex items-center flex-wrap gap-1 mt-1">
                                      {canManageEvent && (
                                        <input type="number" min={3} max={30} value={m.duration} onChange={(e) => s.setMatchDuration(managed.id, m.id, +e.target.value)} className="w-11 px-1 py-0.5 rounded bg-white/6 border border-white/10 text-[10px] outline-none" aria-label={t("org_duration")} />
                                      )}
                                      {canManageEvent && <span className="text-[9px] text-white/35">{t("c_min")}</span>}
                                      <div className="flex-1" />
                                      {canManageEvent && isCurrent && !m.winner && (
                                        <button onClick={() => s.endMatch(managed.id, m.id)} className="text-[9px] font-bold px-2 py-0.5 rounded bg-ember/12 text-ember border border-ember/45 hover:bg-ember/25 transition-colors cursor-pointer">{t("org_end_battle")}</button>
                                      )}
                                      {canManageEvent && !isCurrent && !m.winner && m.a && m.b && (
                                        <button onClick={() => s.startMatch(managed.id, m.id)} className="text-[9px] font-bold px-2 py-0.5 rounded bg-mint/15 text-mint border border-mint/45 hover:bg-mint/30 transition-colors cursor-pointer">▶ {t("org_start_battle")}</button>
                                      )}
                                      {canManageEvent && m.votesA + m.votesB > 0 && (
                                        <button onClick={() => s.voidMatchVotes(managed.id, m.id)} aria-label={t("org_void_votes")} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/6 text-white/50 hover:text-ember transition-colors cursor-pointer">{t("org_void_votes")}</button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                        </div>
                      )}
                    </div>

                    {/* votes table */}
                    {Object.keys(managed.votes).length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1.5"><Vote size={12} className="text-azure" /> {t("org_votes_tbl")}</p>
                        <div className="space-y-1.5">
                          {Object.entries(managed.votes).sort((a, b) => b[1] - a[1]).map(([pid, v], i) => {
                            const max = Math.max(...Object.values(managed.votes), 1);
                            return (
                              <div key={pid} className="flex items-center gap-1.5 sm:gap-2">
                                <span className="display text-[10px] w-4 shrink-0 text-white/30">{i + 1}</span>
                                <span className="text-[11.5px] font-semibold w-20 sm:w-28 shrink-0 truncate">{userNameById(pid)}</span>
                                <div className="flex-1 min-w-0 h-1.5 rounded-full bg-white/6 overflow-hidden">
                                  <div className="h-full rounded-full bg-azure transition-all duration-700" style={{ width: `${(v / max) * 100}%` }} />
                                </div>
                                <span className="display text-[10.5px] font-bold text-azure w-9 sm:w-10 shrink-0 text-right">{v}</span>
                              </div>
                            );
                          })}
                        </div>
                        {canManageEvent && <button onClick={() => s.voidEventVotes(managed.id)} className="mt-2.5 text-[10.5px] font-bold px-2.5 py-1.5 rounded-lg border border-ember/35 text-ember bg-ember/8 hover:bg-ember/16 transition-colors cursor-pointer">{t("org_void_votes")} · {t("c_all")}</button>}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </motion.section>
        </div>
      </div>

      {/* ===== edit modal ===== */}
      <Modal open={!!edit} onClose={() => setEdit(null)}>
        {edit && managed && (
          <div className="space-y-3">
            <h3 className="display text-base font-extrabold">{t("org_modify")} · {managed.name}</h3>
            <Field label={t("org_ev_name")}><input className={inputCls} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("org_ev_date")}><input type="date" className={inputCls} value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} /></Field>
              <Field label={t("org_ev_time")}><input type="time" className={inputCls} value={edit.time} onChange={(e) => setEdit({ ...edit, time: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("org_ev_end_time")}><input type="time" className={inputCls} value={edit.endTime} onChange={(e) => setEdit({ ...edit, endTime: e.target.value })} /></Field>
            </div>
            <Field label={t("org_ev_notes")}><input className={inputCls} value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></Field>
            <button onClick={() => { s.updateEvent(managed.id, { name: edit.name, dateISO: edit.date, time: edit.time, endTime: edit.endTime, notes: edit.notes }); setEdit(null); }} className={btnGold + " w-full"}><Save size={14} /> {t("c_save")}</button>
          </div>
        )}
      </Modal>

      {/* ===== cancel confirm ===== */}
      <Modal open={cancelAsk} onClose={() => setCancelAsk(false)}>
        {managed && (
          <div className="space-y-4 text-center">
            <AlertTriangle size={30} className="mx-auto text-ember" />
            <p className="text-[13px] text-white/80">{t("org_cancel_confirm")}</p>
            <p className="display text-sm font-extrabold">{managed.name}</p>
            <div className="flex gap-2">
              <button onClick={() => setCancelAsk(false)} className="flex-1 py-2.5 rounded-xl border border-white/12 text-[12px] font-bold text-white/60 hover:bg-white/6 transition-colors cursor-pointer">{t("c_cancel")}</button>
              <button onClick={() => { s.cancelEvent(managed.id); setCancelAsk(false); }} className="flex-1 py-2.5 rounded-xl bg-ember text-white display text-[12px] font-bold hover:brightness-110 transition-all cursor-pointer">{t("ev_cancel")}</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== delete confirm ===== */}
      <Modal open={delAsk} onClose={() => setDelAsk(false)}>
        {managed && (
          <div className="space-y-4 text-center">
            <Trash2 size={30} className="mx-auto text-ember" />
            <p className="text-[13px] text-white/80">{t("org_delete_confirm")}</p>
            <p className="display text-sm font-extrabold">{managed.name}</p>
            <div className="flex gap-2">
              <button onClick={() => setDelAsk(false)} className="flex-1 py-2.5 rounded-xl border border-white/12 text-[12px] font-bold text-white/60 hover:bg-white/6 transition-colors cursor-pointer">{t("c_cancel")}</button>
              <button onClick={() => { s.deleteEvent(managed.id); setDelAsk(false); setManageIdLocal(null); }} className="flex-1 py-2.5 rounded-xl bg-ember text-white display text-[12px] font-bold hover:brightness-110 transition-all cursor-pointer">{t("org_delete_ev")}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

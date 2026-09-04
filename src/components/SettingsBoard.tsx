import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Bell, Lock, Crown, ShieldCheck, LogOut, Megaphone, Trash2, Save, Plus, Users, Database, Radio, Link2, KeyRound, Bug } from "lucide-react";
import { useApp, levelFromAura, titleFromLevel } from "../store";
import { useT, LANGS } from "../i18n";
import { COUNTRIES, countryById } from "../data";
import { Avatar, Modal, SectionHead, Toggle, Field, inputCls, btnGold, AnimatedNumber } from "./ui";

export default function SettingsBoard() {
  const t = useT();
  const s = useApp();
  const { profile, lang, settings, premium, banners, adminUnlocked, users, events, totalAura } = s;
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState({ name: profile.name, country: profile.country, contact: profile.contact, ig: profile.socials.ig, x: profile.socials.x, tt: profile.socials.tt });
  const [adminAsk, setAdminAsk] = useState(false);
  const [pass, setPass] = useState("");
  const [bannerDraft, setBannerDraft] = useState({ id: "", text: "", link: "", color: "#9B30FF", active: true });
  const [fb, setFb] = useState({ type: "error" as "error" | "suggestion" | "other", msg: "", contact: s.userEmail || "" });
  const [fbSent, setFbSent] = useState(false);

  const sendFeedback = () => {
    if (!fb.msg.trim()) return;
    const typeLabel = fb.type === "error" ? t("st_fb_error") : fb.type === "suggestion" ? t("st_fb_suggestion") : t("st_fb_other");
    const subject = encodeURIComponent(`[AuraFARM ${typeLabel}] ${fb.msg.slice(0, 60)}`);
    const body = encodeURIComponent(
      `Tipo: ${typeLabel}\n\nMensaje:\n${fb.msg}\n\nContacto: ${fb.contact || "—"}\nUsuario: ${s.userEmail || profile.name || "invitado"}`
    );
    window.location.href = `mailto:shop.aurafarm@gmail.com?subject=${subject}&body=${body}`;
    setFbSent(true);
    setTimeout(() => setFbSent(false), 3000);
  };

  const onPhoto = (f: File | undefined) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => s.setProfile({ photo: r.result as string });
    r.readAsDataURL(f);
  };

  /* ================= ADMIN VIEW ================= */
  if (adminUnlocked) {
    const byNat = COUNTRIES.map((c) => ({ c, n: users.filter((u) => u.country === c.id).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
    const roles = [
      { k: "user", n: users.filter((u) => u.role === "user").length, c: "#00BFFF" },
      { k: "participant", n: users.filter((u) => u.role === "participant").length, c: "#FF69B4" },
      { k: "organizer", n: users.filter((u) => u.role === "organizer").length, c: "#FFD700" },
    ];
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl grid place-items-center bg-ember/12 border border-ember/35"><ShieldCheck size={19} className="text-ember" /></div>
          <div className="flex-1">
            <h2 className="display text-base font-extrabold">{t("ad_title")}</h2>
            <p className="text-[11.5px] text-white/45">{t("ad_sub")}</p>
          </div>
          <button onClick={s.adminExit} className="flex items-center gap-1.5 text-[11.5px] font-bold text-white/55 border border-white/12 px-3 py-1.5 rounded-full hover:text-white hover:border-white/30 transition-colors cursor-pointer">
            <LogOut size={12} /> {t("ad_exit")}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Users, n: users.length + 1, label: t("ad_users"), c: "#00BFFF" },
            { icon: Radio, n: events.filter((e) => e.status === "live").length, label: t("ad_events") + " · " + t("c_live").toLowerCase(), c: "#FF4444" },
            { icon: Database, n: totalAura, label: t("ad_total_aura"), c: "#FFD700", anim: true },
          ].map((x, i) => (
            <div key={i} className="panel p-4 text-center">
              <x.icon size={15} style={{ color: x.c }} className="mx-auto" />
              {x.anim ? <AnimatedNumber value={x.n} className="display text-[15px] font-extrabold mt-1" /> : <p className="display text-lg font-extrabold mt-1" style={{ color: x.c }}>{x.n}</p>}
              <p className="text-[10.5px] text-white/45 font-bold uppercase tracking-wider mt-0.5">{x.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 items-start">
          {/* users by nationality */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="panel p-5">
            <SectionHead hue={200} icon={<Users size={16} />} title={t("ad_users")} sub={t("ad_by_nat")} />
            <div className="space-y-2">
              {byNat.map(({ c, n }) => (
                <div key={c.id} className="flex items-center gap-2.5">
                  <span className="text-base w-7">{c.flag}</span>
                  <span className="text-[12px] font-semibold w-28 truncate">{c.name[lang]}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/6 overflow-hidden">
                    <div className="h-full rounded-full bg-azure/80 transition-all duration-700" style={{ width: `${(n / byNat[0].n) * 100}%` }} />
                  </div>
                  <span className="display text-[11px] font-bold w-6 text-right">{n}</span>
                </div>
              ))}
            </div>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/35 mt-4 mb-2">{t("ad_by_role")}</p>
            <div className="space-y-2">
              {roles.map((r) => (
                <div key={r.k} className="flex items-center gap-2.5">
                  <span className="text-[11px] font-bold w-24 capitalize" style={{ color: r.c }}>{r.k}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/6 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(r.n / users.length) * 100}%`, background: r.c }} />
                  </div>
                  <span className="display text-[11px] font-bold w-6 text-right">{r.n}</span>
                </div>
              ))}
            </div>
          </motion.section>

          {/* ad banners */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="panel p-5">
            <SectionHead hue={316} icon={<Megaphone size={16} />} title={t("ad_ads")} sub={t("ad_banners_sub")} />
            <div className="space-y-2.5 mb-4">
              {banners.map((b) => (
                <div key={b.id} className="p-3 rounded-xl border" style={{ borderColor: `${b.color}44`, background: `${b.color}0d` }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: b.color, boxShadow: `0 0 8px ${b.color}` }} />
                    <p className="flex-1 text-[12px] font-semibold truncate">{b.text}</p>
                    <Toggle on={b.active} onChange={() => s.saveBanner({ ...b, active: !b.active })} hue={316} />
                    <button onClick={() => setBannerDraft({ ...b })} className="text-[10px] font-bold text-white/50 hover:text-white px-1.5 py-1 rounded bg-white/6 cursor-pointer">✏️</button>
                    <button onClick={() => s.deleteBanner(b.id)} aria-label={t("ad_delete")} className="text-white/30 hover:text-ember transition-colors cursor-pointer"><Trash2 size={13} /></button>
                  </div>
                  <p className="text-[10px] text-white/35 mt-1 flex items-center gap-1"><Link2 size={9} /> {b.link}</p>
                </div>
              ))}
              {banners.length === 0 && <p className="text-[11.5px] text-white/35">—</p>}
            </div>
            <div className="space-y-2.5 p-3.5 rounded-xl bg-white/3 border border-white/8">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-1"><Plus size={11} /> {t("ad_add")}</p>
              <input className={inputCls} placeholder={t("ad_text")} value={bannerDraft.text} onChange={(e) => setBannerDraft({ ...bannerDraft, text: e.target.value })} />
              <input className={inputCls} placeholder={t("ad_link") + " · https://"} value={bannerDraft.link} onChange={(e) => setBannerDraft({ ...bannerDraft, link: e.target.value })} />
              <div className="flex items-center gap-2">
                <input type="color" value={bannerDraft.color} onChange={(e) => setBannerDraft({ ...bannerDraft, color: e.target.value })} className="w-9 h-9 rounded-lg bg-transparent border border-white/12 cursor-pointer" aria-label="color" />
                <div className="flex-1" />
                <button
                  onClick={() => {
                    if (!bannerDraft.text.trim()) return;
                    s.saveBanner({ ...bannerDraft, id: bannerDraft.id || "bn" + Date.now() });
                    setBannerDraft({ id: "", text: "", link: "", color: "#9B30FF", active: true });
                  }}
                  className={btnGold + " !px-4 !py-2"}
                >
                  <Save size={13} /> {t("c_save")}
                </button>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    );
  }

  /* ================= SETTINGS VIEW ================= */
  return (
    <div className="space-y-6">
      <SectionHead hue={268} icon={<Lock size={16} />} title={t("st_title")} sub={t("st_sub")} />

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <div className="space-y-4">
          {/* profile */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="panel p-5">
            <p className="text-[12.5px] font-bold mb-4 flex items-center gap-2"><Camera size={14} className="text-violet" /> {t("st_profile")}</p>
            <div className="flex items-center gap-4 mb-4">
              <button onClick={() => fileRef.current?.click()} className="relative group cursor-pointer" aria-label={t("st_photo")}>
                <Avatar name={draft.name || "?"} hue={46} size={64} src={profile.photo} premium={premium} />
                <span className="absolute inset-0 rounded-full grid place-items-center bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={18} />
                </span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
              <div>
                <p className="display text-sm font-extrabold">{draft.name || profile.name}</p>
                {s.userEmail && <p className="text-[10.5px] text-white/55 break-all">{s.userEmail}</p>}
                <p className="text-[10.5px] text-white/45">{t("c_level")} {levelFromAura(profile.aura)} · {titleFromLevel(levelFromAura(profile.aura), lang)} · {profile.aura.toLocaleString()} {t("c_aura")}</p>
                <p className="text-[10px] text-violet font-bold mt-1 cursor-pointer hover:underline" onClick={() => fileRef.current?.click()}>{t("st_photo")} ↑</p>
              </div>
              <button onClick={() => s.logoutAppUser()} disabled={s.authBusy} className="ml-auto self-start text-[10.5px] font-bold text-white/40 hover:text-ember border border-white/10 hover:border-ember/30 px-2.5 py-1 rounded-full transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">{s.authBusy ? "..." : "Cerrar sesión"}</button>
            </div>
            <div className="space-y-3">
              <Field label={t("st_name")}><input className={inputCls} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("st_country")}>
                  <select className={inputCls + " cursor-pointer"} value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })}>
                    {COUNTRIES.map((c) => <option key={c.id} value={c.id} className="bg-[#0d0d1c]">{c.flag} {c.name[lang]}</option>)}
                  </select>
                </Field>
                <Field label={t("st_contact")}><input className={inputCls} value={draft.contact} onChange={(e) => setDraft({ ...draft, contact: e.target.value })} /></Field>
              </div>
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/35 pt-1">{t("st_socials")}</p>
              <div className="grid grid-cols-3 gap-2">
                <input className={inputCls} placeholder="Instagram" value={draft.ig} onChange={(e) => setDraft({ ...draft, ig: e.target.value })} />
                <input className={inputCls} placeholder="X" value={draft.x} onChange={(e) => setDraft({ ...draft, x: e.target.value })} />
                <input className={inputCls} placeholder="TikTok" value={draft.tt} onChange={(e) => setDraft({ ...draft, tt: e.target.value })} />
              </div>
              <button onClick={() => s.setProfile({ name: draft.name, country: draft.country, contact: draft.contact, socials: { ig: draft.ig, x: draft.x, tt: draft.tt } })} className={btnGold + " w-full"}>
                <Save size={14} /> {t("c_save")}
              </button>
            </div>
          </motion.section>

          {/* premium */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="panel p-5 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-gold/12 blur-3xl pointer-events-none" />
            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl grid place-items-center bg-gold/14 border border-gold/40"><Crown size={19} className="text-gold" /></div>
              <div className="flex-1">
                <p className="display text-[13.5px] font-extrabold">{t("st_premium")}</p>
                <p className="text-[11px] text-white/50">{premium ? t("st_premium_active") : t("st_premium_sub")}</p>
              </div>
            </div>
            {!premium && (
              <button onClick={s.activatePremium} className="relative mt-4 w-full py-3 rounded-xl display text-[12px] font-extrabold bg-gold text-[#171200] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer">
                ✦ {t("st_premium_btn")}
              </button>
            )}
            <p className="relative text-[10px] text-white/30 mt-2.5 text-center">{t("c_free")} · AuraFARM 🌾</p>
          </motion.section>
        </div>

        <div className="space-y-4">
          {/* language */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="panel p-5">
            <p className="text-[12.5px] font-bold mb-1">🌐 {t("st_lang")}</p>
            <p className="text-[10.5px] text-white/40 mb-3.5">{t("st_lang_sub")}</p>
            <div className="grid grid-cols-2 gap-2">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => s.setLang(l.code)}
                  className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-left transition-all cursor-pointer ${lang === l.code ? "border-gold/60 bg-gold/10" : "border-white/10 bg-white/3 hover:bg-white/6"}`}
                >
                  <span className="text-xl">{l.flag}</span>
                  <span>
                    <span className={`block text-[12.5px] font-bold ${lang === l.code ? "text-gold" : ""}`}>{l.label}</span>
                    <span className="block text-[10.5px] uppercase tracking-widest text-white/35 font-bold">{l.code}</span>
                  </span>
                  {lang === l.code && <span className="ml-auto text-gold font-extrabold">✓</span>}
                </button>
              ))}
            </div>
          </motion.section>

          {/* notifications & privacy */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="panel p-5 space-y-4">
            <div>
              <p className="text-[12.5px] font-bold mb-2.5 flex items-center gap-2"><Bell size={14} className="text-azure" /> {t("st_notifs")}</p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between"><span className="text-[12.5px] text-white/70">{t("st_notif_farm")}</span><Toggle on={settings.notifFarm} onChange={() => s.toggleSetting("notifFarm")} hue={200} /></div>
                <div className="flex items-center justify-between"><span className="text-[12.5px] text-white/70">{t("st_notif_events")}</span><Toggle on={settings.notifEvents} onChange={() => s.toggleSetting("notifEvents")} hue={200} /></div>
              </div>
            </div>
            <div className="border-t border-white/7 pt-4">
              <p className="text-[12.5px] font-bold mb-2.5 flex items-center gap-2"><Lock size={14} className="text-mint" /> {t("st_privacy")}</p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between"><span className="text-[12px] text-white/70">{t("st_priv_public")}</span><Toggle on={settings.publicProfile} onChange={() => s.toggleSetting("publicProfile")} hue={152} /></div>
                <div className="flex items-center justify-between"><span className="text-[12px] text-white/70">{t("st_priv_country")}</span><Toggle on={settings.showCountry} onChange={() => s.toggleSetting("showCountry")} hue={152} /></div>
              </div>
            </div>
          </motion.section>

          {/* feedback / report error */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bug size={16} className="text-gold" />
              <div>
                <p className="display text-[12.5px] font-extrabold">{t("st_feedback")}</p>
                <p className="text-[10.5px] text-white/40">{t("st_feedback_sub")}</p>
              </div>
            </div>
            <div className="flex gap-1.5 mb-3">
              {(["error", "suggestion", "other"] as const).map((tp) => (
                <button
                  key={tp}
                  onClick={() => setFb({ ...fb, type: tp })}
                  className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${fb.type === tp ? "bg-gold border-gold text-[#171200]" : "border-white/12 bg-white/4 text-white/50 hover:bg-white/8"}`}
                >
                  {tp === "error" ? t("st_fb_error") : tp === "suggestion" ? t("st_fb_suggestion") : t("st_fb_other")}
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              className={inputCls + " resize-none"}
              value={fb.msg}
              onChange={(e) => setFb({ ...fb, msg: e.target.value })}
              placeholder={t("st_fb_desc")}
            />
            <Field label={t("st_fb_contact")}>
              <input className={inputCls} value={fb.contact} onChange={(e) => setFb({ ...fb, contact: e.target.value })} placeholder="tu@email.com" />
            </Field>
            <button
              onClick={sendFeedback}
              disabled={!fb.msg.trim()}
              className="w-full mt-2 py-2.5 rounded-xl display text-[12px] font-extrabold bg-gold text-[#171200] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {fbSent ? "✓ " + t("st_fb_ok") : t("st_fb_send")}
            </button>
          </motion.section>

          {/* hidden admin access */}
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="panel p-4 flex items-center gap-3">
            <ShieldCheck size={16} className="text-white/25" />
            <div className="flex-1">
              <p className="text-[12px] font-bold text-white/55">{t("st_admin")}</p>
              <p className="text-[10px] text-white/30">{t("st_admin_sub")}</p>
            </div>
            <button onClick={() => { setAdminAsk(true); setPass(""); }} aria-label={t("st_admin")} className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-lg grid place-items-center bg-white/4 border border-white/8 text-white/35 hover:text-ember hover:border-ember/40 transition-colors cursor-pointer">
              <KeyRound size={13} />
            </button>
          </motion.section>

          <p className="text-center text-[10px] text-white/20 font-semibold">{t("st_version")} · {countryById(profile.country).flag}</p>
        </div>
      </div>

      {/* admin password modal */}
      <Modal open={adminAsk} onClose={() => setAdminAsk(false)}>
        <div className="space-y-3">
          <h3 className="display text-base font-extrabold flex items-center gap-2"><ShieldCheck size={17} className="text-ember" /> {t("st_admin")}</h3>
          <Field label={t("ad_pass")}>
            <input type="password" className={inputCls + " tracking-widest text-center display"} value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={async (e) => { if (e.key === "Enter" && (await s.adminLogin(pass))) setAdminAsk(false); }} placeholder="••••••" autoFocus />
          </Field>
          <p className="text-[10.5px] text-white/35 flex items-center gap-1"><KeyRound size={11} /> {t("ad_hint")}</p>
          <button onClick={async () => { if (await s.adminLogin(pass)) setAdminAsk(false); }} className="w-full py-3 rounded-xl display text-[12px] font-bold bg-ember text-white hover:brightness-110 transition-all cursor-pointer">{t("ad_enter")}</button>
        </div>
      </Modal>
    </div>
  );
}

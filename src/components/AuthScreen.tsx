import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, User as UserIcon, Mail, LogIn, UserPlus, Flame } from "lucide-react";
import { useApp } from "../store";
import { useT, LANGS } from "../i18n";
import { COUNTRIES } from "../data";
import { Field, inputCls, btnGold } from "./ui";

export default function AuthScreen() {
  const t = useT();
  const s = useApp();
  const lang = useApp((x) => x.lang);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("mx");
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    if (mode === "login") {
      if (!email.trim() || !password) return setErr(t("au_need_fields"));
      const ok = await s.loginAppUser(email.trim(), password);
      if (!ok) setErr(t("au_error"));
      return;
    }
    if (!name.trim() || !email.trim() || !password) return setErr(t("au_need_fields"));
    if (password.length < 6) return setErr(t("au_weak_password"));
    const ok = await s.registerAppUser(email.trim(), password, name.trim(), country);
    if (!ok) setErr(t("au_error"));
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10">
      <div className="aura-bg" />
      <div className="aura-noise" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md panel p-6 sm:p-8 relative overflow-hidden"
      >
        <div className="absolute -top-14 -right-14 w-44 h-44 rounded-full bg-gold/15 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="w-14 h-14 rounded-2xl conic-ring grid place-items-center mb-5 mx-auto">
            <span className="w-9 h-9 rounded-full bg-night grid place-items-center">
              <Flame size={18} className="text-gold" />
            </span>
          </div>
          <h1 className="display text-xl font-extrabold text-center tracking-tight">
            <span className="text-gold">AURA</span><span className="text-white">FARM</span>
          </h1>
          <p className="text-[12px] text-white/45 text-center mt-1">{t("au_welcome")}</p>
          <p className="text-[10.5px] text-white/30 text-center mt-0.5">{t("au_welcome_sub")}</p>

          <div className="flex gap-1.5 mt-6 p-1 rounded-xl bg-white/4 border border-white/8">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setErr(""); }}
                className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${mode === m ? "bg-gold text-[#171200]" : "text-white/50 hover:text-white"}`}
              >
                {m === "login" ? t("au_login_tab") : t("au_register_tab")}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {mode === "register" && (
              <>
                <Field label={t("au_name")}>
                  <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("au_name_ph")} />
                </Field>
                <Field label={t("au_country")}>
                  <select className={inputCls + " cursor-pointer"} value={country} onChange={(e) => setCountry(e.target.value)}>
                    {COUNTRIES.map((c) => <option key={c.id} value={c.id} className="bg-[#0d0d1c]">{c.flag} {c.name[lang]}</option>)}
                  </select>
                </Field>
              </>
            )}
            <Field label={t("au_email")}>
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input type="email" className={inputCls + " !pl-8"} value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("au_email_ph")} />
              </div>
            </Field>
            <Field label={t("au_password")}>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input type="password" className={inputCls + " !pl-8"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("au_password_ph")} onKeyDown={(e) => e.key === "Enter" && submit()} />
              </div>
            </Field>

            {err && <p className="text-[11.5px] text-ember font-semibold">{err}</p>}

            <button
              onClick={submit}
              disabled={s.authBusy}
              className="w-full py-3.5 rounded-xl display text-[13px] font-extrabold bg-gold text-[#171200] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {s.authBusy ? "..." : mode === "login" ? (<><LogIn size={15} /> {t("au_login_btn")}</>) : (<><UserPlus size={15} /> {t("au_register_btn")}</>)}
            </button>

            <p className="text-center text-[10.5px] text-white/40">
              {mode === "login" ? (
                <>
                  {t("au_not_account")} <button onClick={() => setMode("register")} className="text-gold font-bold hover:underline cursor-pointer">{t("au_register_tab")}</button>
                </>
              ) : (
                <>
                  {t("au_already")} <button onClick={() => setMode("login")} className="text-gold font-bold hover:underline cursor-pointer">{t("au_login_tab")}</button>
                </>
              )}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

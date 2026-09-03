import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, LogIn, UserPlus, Flame, X } from "lucide-react";
import { useApp } from "../store";
import { useT, LANGS } from "../i18n";
import { Field, inputCls, btnGold } from "./ui";

function SocialButton({ onClick, children, busy }: { onClick: () => void; children: ReactNode; busy?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/10 bg-white/4 hover:bg-white/8 text-[12px] font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

export default function AuthScreen() {
  const t = useT();
  const s = useApp();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const submit = async () => {
    setErr("");
    setInfo("");
    if (mode === "login") {
      if (!email.trim() || !password) return setErr(t("au_need_fields"));
      const ok = await s.loginAppUser(email.trim(), password);
      if (!ok) setErr(t("au_error"));
      return;
    }
    if (!name.trim() || !email.trim() || !password) return setErr(t("au_need_fields"));
    if (password.length < 6) return setErr(t("au_weak_password"));
    const ok = await s.registerAppUser(email.trim(), password, name.trim(), "");
    if (!ok) setErr(t("au_error"));
  };

  const doReset = async () => {
    if (!resetEmail.trim()) return;
    setInfo("");
    const ok = await s.resetPassword(resetEmail.trim());
    if (ok) {
      setResetOpen(false);
      setInfo(t("au_reset_sent"));
    }
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

          {/* entrar sin registro / invitado */}
          <button
            onClick={() => s.enterGuest()}
            className="w-full mt-5 py-3 rounded-xl display text-[13px] font-extrabold bg-mint text-[#032018] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Flame size={16} /> {t("au_enter_guest")}
          </button>
          <p className="text-center text-[10px] text-white/35 mt-1.5 mb-2">{t("au_enter_guest_sub")}</p>

          <div className="flex items-center gap-3 my-3">
            <span className="flex-1 h-px bg-white/8" />
            <span className="text-[9.5px] uppercase tracking-widest text-white/25 font-bold">{t("au_or")}</span>
            <span className="flex-1 h-px bg-white/8" />
          </div>

          <div className="flex gap-1.5 p-1 rounded-xl bg-white/4 border border-white/8">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setErr(""); setInfo(""); }}
                className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${mode === m ? "bg-gold text-[#171200]" : "text-white/50 hover:text-white"}`}
              >
                {m === "login" ? t("au_login_tab") : t("au_register_tab")}
              </button>
            ))}
          </div>

          {/* social login */}
          <p className="text-center text-[9.5px] uppercase tracking-widest text-white/30 font-bold mt-6 mb-3">{t("au_social_title")}</p>
          <div className="grid gap-2">
            <SocialButton onClick={() => s.socialLogin("google")} busy={s.authBusy}>
              <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6 29.4 4 24 4 16.3 4 9.6 8.2 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
              {t("au_google")}
            </SocialButton>
          </div>

          <div className="flex items-center gap-3 my-5">
            <span className="flex-1 h-px bg-white/8" />
            <span className="text-[9.5px] uppercase tracking-widest text-white/25 font-bold">{t("au_or")}</span>
            <span className="flex-1 h-px bg-white/8" />
          </div>

          <div className="space-y-3">
            {mode === "register" && (
              <>
                <Field label={t("au_name")}>
                  <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("au_name_ph")} />
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

            {mode === "login" && (
              <button onClick={() => setResetOpen(true)} className="text-[11px] text-white/40 hover:text-gold transition-colors cursor-pointer">{t("au_forgot")}</button>
            )}

            {err && <p className="text-[11.5px] text-ember font-semibold">{err}</p>}
            {info && <p className="text-[11.5px] text-mint font-semibold">{info}</p>}

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

      {/* reset password modal */}
      {resetOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] grid place-items-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setResetOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm panel p-6 relative"
          >
            <button onClick={() => setResetOpen(false)} className="absolute top-4 right-4 text-white/40 hover:text-white cursor-pointer" aria-label={t("c_close")}><X size={16} /></button>
            <h3 className="display text-base font-extrabold mb-1">{t("au_reset_btn")}</h3>
            <p className="text-[11px] text-white/45 mb-4">{t("au_reset_sent")}</p>
            <Field label={t("au_email")}>
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input type="email" className={inputCls + " !pl-8"} value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder={t("au_email_ph")} autoFocus onKeyDown={(e) => e.key === "Enter" && doReset()} />
              </div>
            </Field>
            <button onClick={doReset} disabled={s.authBusy} className={btnGold + " w-full mt-4 !py-3"}>
              {s.authBusy ? "..." : t("au_reset_btn")}
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

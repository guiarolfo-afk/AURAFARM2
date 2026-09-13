import { motion } from "framer-motion";
import { Smartphone, Download, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useT } from "../i18n";

const TESTER_URL = "https://play.google.com/apps/testing/io.github.guiarolfo_afk.twa";
const STORE_URL = "https://play.google.com/store/apps/details?id=io.github.guiarolfo_afk.twa";

export default function TesterCTA({ compact = false }: { compact?: boolean }) {
  const t = useT();

  const steps = [
    { icon: Smartphone, text: t("tester_step1") },
    { icon: CheckCircle, text: t("tester_step2") },
    { icon: Download, text: t("tester_step3") },
  ];

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel p-4 border border-gold/30 bg-gold/5 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-transparent to-gold/10" />
        <div className="relative flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 grid place-items-center shrink-0">
            <AlertCircle size={18} className="text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="display text-sm font-extrabold text-gold">{t("tester_title")}</h3>
            <p className="text-[11px] text-white/70 mt-1">{t("tester_sub")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={TESTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold text-[#171200] text-[11px] font-extrabold hover:brightness-110 transition-colors cursor-pointer"
              >
                <Smartphone size={12} /> {t("tester_btn_join")}
              </a>
              <a
                href={STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white/80 text-[11px] font-bold hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Download size={12} /> {t("tester_btn_install")}
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
    >
      <div className="panel p-5 sm:p-7 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gold/8 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-52 h-52 rounded-full bg-violet/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold/80 mb-4">
            <AlertCircle size={13} className="animate-pulse" /> {t("tester_badge")}
          </div>
          <h2 className="display text-xl sm:text-2xl font-extrabold tracking-tight text-center mb-2">
            {t("tester_title")}
          </h2>
          <p className="text-[12px] text-white/50 text-center mb-6 max-w-xl mx-auto">
            {t("tester_sub")}
          </p>

          <div className="space-y-4 mb-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * (i + 1), duration: 0.4 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-white/3 border border-white/6 hover:bg-white/5 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-gold/15 border border-gold/30 grid place-items-center shrink-0">
                  <step.icon size={18} className="text-gold" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-white leading-snug">{step.text}</p>
                </div>
                <ExternalLink size={16} className="text-white/30 shrink-0 mt-1" />
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={TESTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 min-h-[48px] rounded-xl display text-sm font-extrabold tracking-widest bg-gold text-[#171200] pulse-glow hover:brightness-110 active:scale-[0.97] transition-all cursor-pointer"
            >
              <Smartphone size={18} /> {t("tester_btn_join")}
            </a>
            <a
              href={STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 min-h-[48px] rounded-xl display text-sm font-extrabold tracking-widest bg-white/5 border border-white/15 text-white/85 hover:bg-white/10 hover:border-white/25 active:scale-[0.97] transition-all cursor-pointer"
            >
              <Download size={18} /> {t("tester_btn_install")}
            </a>
          </div>

          <p className="text-center text-[10.5px] text-white/35 mt-4">
            {t("tester_note")}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Check } from "lucide-react";
import { useApp } from "../store";
import { AURA_COLORS } from "../data";

/* ---------- Avatar: aura orb with initials ---------- */
export function Avatar({ name, hue, size = 44, src, premium }: { name: string; hue: number; size?: number; src?: string | null; premium?: boolean }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {premium && (
        <div className="absolute -inset-[3px] rounded-full conic-ring opacity-90" style={{ animationDuration: "5s" }} />
      )}
      <div
        className="absolute inset-0 rounded-full overflow-hidden grid place-items-center font-bold select-none"
        style={{
          background: src ? undefined : `linear-gradient(135deg, hsl(${hue} 95% 62%), hsl(${(hue + 70) % 360} 90% 45%))`,
          fontSize: size * 0.34, color: "#0a0a14", zIndex: 1,
          boxShadow: `0 0 ${size / 3}px hsl(${hue} 95% 60% / .45)`,
        }}
      >
        {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : initials}
      </div>
    </div>
  );
}

/* ---------- Animated number counter ---------- */
export function AnimatedNumber({ value, className = "" }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    const to = value;
    if (from === to) return;
    prev.current = to;
    const start = performance.now();
    const dur = 750;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * ease));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={className}>{display.toLocaleString()}</span>;
}

/* ---------- Aura progress bar ---------- */
export function AuraBar({ value, color, className = "" }: { value: number; color?: string; className?: string }) {
  const c = color ?? AURA_COLORS[Math.floor(value / 17) % AURA_COLORS.length];
  return (
    <div className={`h-2 rounded-full bg-white/8 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out shimmer"
        style={{ width: `${Math.min(100, value)}%`, background: `linear-gradient(90deg, ${c}88, ${c})`, boxShadow: `0 0 10px ${c}66` }}
      />
    </div>
  );
}

/* ---------- Section header ---------- */
export function SectionHead({ icon, title, sub, action, hue = 268 }: { icon: React.ReactNode; title: string; sub?: string; action?: React.ReactNode; hue?: number }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
          style={{ background: `hsl(${hue} 90% 60% / .12)`, border: `1px solid hsl(${hue} 90% 60% / .3)`, color: `hsl(${hue} 90% 65%)`, boxShadow: `0 0 18px hsl(${hue} 90% 60% / .15)` }}
        >
          {icon}
        </div>
        <div>
          <h2 className="display text-[15px] sm:text-base font-bold tracking-tight leading-tight">{title}</h2>
          {sub && <p className="text-[11.5px] text-white/45 mt-0.5">{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ---------- Filter chip ---------- */
export function Chip({ active, onClick, children, hue = 268 }: { active: boolean; onClick: () => void; children: React.ReactNode; hue?: number }) {
  return (
    <button
      onClick={onClick}
      className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer"
      style={
        active
          ? { background: `hsl(${hue} 90% 60%)`, color: "#0a0a14", boxShadow: `0 0 18px hsl(${hue} 90% 60% / .4)` }
          : { background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.65)", border: "1px solid rgba(255,255,255,.09)" }
      }
    >
      {children}
    </button>
  );
}

/* ---------- Modal (bottom sheet on mobile) ---------- */
export function Modal({ open, onClose, children, wide }: { open: boolean; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-black/72 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`relative w-full ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"} max-h-[92vh] overflow-y-auto panel !rounded-b-none sm:!rounded-2xl p-5 sm:p-6`}
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full grid place-items-center bg-white/6 hover:bg-white/14 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Stars ---------- */
export function Stars({ value, onChange, size = 16 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer transition-transform hover:scale-125" : "cursor-default"}
          aria-label={`${n} stars`}
        >
          <Star size={size} className={n <= Math.round(value) ? "text-gold" : "text-white/15"} fill={n <= Math.round(value) ? "#FFD700" : "none"} />
        </button>
      ))}
    </div>
  );
}

/* ---------- Share row (WhatsApp, X, Facebook, Instagram, Telegram) ---------- */
export function ShareRow({ title, compact, url }: { title: string; compact?: boolean; url?: string }) {
  const toast = useApp((s) => s.toast);
  const toggleChallenge = useApp((s) => s.toggleChallenge);
  const base = typeof window !== "undefined" ? window.location.href : "https://aurafarm.app";
  const theUrl = url ?? base;
  const enc = encodeURIComponent(`${title} — ${theUrl}`);
  const share = (u: string, net: string) => {
    toggleChallenge("ch5");
    window.open(u, "_blank", "noopener,noreferrer");
    toast(`${net} ↗`);
  };
  const cls = `w-9 h-9 rounded-full grid place-items-center border transition-all duration-200 hover:scale-110 cursor-pointer ${compact ? "" : ""}`;
  const mk = (bg: string) => ({ background: `${bg}1f`, borderColor: `${bg}55`, color: bg });
  return (
    <div className="flex items-center gap-2">
      <button aria-label="WhatsApp" className={cls} style={mk("#25D366")} onClick={() => share(`https://wa.me/?text=${enc}`, "WhatsApp")}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z" /><path d="M8.8 9.2c.4 2.6 3.4 5.6 6 6l1.4-1.4-2-1.2-1 .7c-.9-.4-1.9-1.4-2.3-2.3l.7-1-1.2-2-1.6 1.2Z" fill="currentColor" stroke="none" /></svg>
      </button>
      <button aria-label="X" className={cls} style={mk("#e8e6f5")} onClick={() => share(`https://twitter.com/intent/tweet?text=${enc}`, "X")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.7 3H21l-7.2 8.3L22.2 21h-6.6l-5.2-6.2L4.5 21H1.2l7.7-8.9L1.5 3h6.8l4.7 5.7L17.7 3Zm-1.2 16h1.8L7.1 4.9H5.2L16.5 19Z" /></svg>
      </button>
      <button aria-label="Facebook" className={cls} style={mk("#1877F2")} onClick={() => share(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(theUrl)}`, "Facebook")}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7h2.4l.4-2.9h-2.8V9.2c0-.8.3-1.4 1.4-1.4h1.5V5.2c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.7v2.3H8v2.9h2.5v7h3Z" /></svg>
      </button>
      <button aria-label="Instagram" className={cls} style={mk("#FF69B4")} onClick={() => { toggleChallenge("ch5"); navigator.clipboard?.writeText(`${title} — ${theUrl}`).catch(() => {}); toast("Instagram · link copiado 📋"); }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" /></svg>
      </button>
      <button aria-label="Telegram" className={cls} style={mk("#00BFFF")} onClick={() => share(`https://t.me/share/url?url=${encodeURIComponent(theUrl)}&text=${encodeURIComponent(title)}`, "Telegram")}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.6 18.9 19c-.2 1-.8 1.2-1.6.8l-4.5-3.3-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.6L18.5 7c.4-.3-.1-.5-.6-.2L7.6 13.3l-4.4-1.4c-1-.3-1-1 .2-1.4l17.1-6.6c.8-.3 1.5.2 1.4.7Z" /></svg>
      </button>
    </div>
  );
}

/* ---------- Toggle switch ---------- */
export function Toggle({ on, onChange, hue = 268 }: { on: boolean; onChange: () => void; hue?: number }) {  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={on}
      className="w-11 h-6 rounded-full relative transition-colors duration-300 cursor-pointer shrink-0"
      style={{ background: on ? `hsl(${hue} 90% 55%)` : "rgba(255,255,255,.12)", boxShadow: on ? `0 0 14px hsl(${hue} 90% 55% / .4)` : "none" }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300"
        style={{ left: on ? 22 : 2, boxShadow: "0 1px 4px rgba(0,0,0,.5)" }}
      />
    </button>
  );
}

/* ---------- Live badge ---------- */
export function LiveBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider bg-ember/15 text-ember border border-ember/40">
      <span className="relative w-1.5 h-1.5 rounded-full bg-ember live-ping text-ember" />
      {label}
    </span>
  );
}

/* ---------- QR code (scannable on the phone for the live vote page) ---------- */
export function QRCode({ url, size = 150, label }: { url: string; size?: number; label?: string }) {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    let alive = true;
    import("qrcode").then((m) =>
      m.default.toDataURL(url, { width: size, margin: 1, color: { dark: "#0a0a14", light: "#ffffff" } })
        .then((d) => { if (alive) setSrc(d); })
        .catch(() => {})
    );
    return () => { alive = false; };
  }, [url, size]);
  return (
    <div className="flex flex-col items-center gap-2">
      {src ? (
        <img src={src} width={size} height={size} alt="QR" className="rounded-lg border border-white/10" />
      ) : (
        <div className="rounded-lg border border-dashed border-white/20 grid place-items-center" style={{ width: size, height: size }}>
          <span className="text-[10px] text-white/35">QR…</span>
        </div>
      )}
      {label && <span className="text-[10px] text-white/40 text-center">{label}</span>}
    </div>
  );
}

/* ---------- Toasts ---------- */
export function Toasts() {
  const toasts = useApp((s) => s.toasts);
  const dismiss = useApp((s) => s.dismissToast);
  const kind = { ok: { c: "#00FF7F", I: Check }, warn: { c: "#FF4444", I: X }, gold: { c: "#FFD700", I: Star } };
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[90] flex flex-col items-center gap-2 pointer-events-none px-4 w-full max-w-md">
      <AnimatePresence>
        {toasts.map((t) => {
          const k = kind[t.kind];
          return (
            <motion.button
              key={t.id}
              layout
              initial={{ opacity: 0, y: -18, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              onClick={() => dismiss(t.id)}
              className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[12.5px] font-semibold panel !rounded-xl cursor-pointer"
              style={{ borderColor: `${k.c}55`, boxShadow: `0 8px 30px -8px ${k.c}44`, color: "#f0eefc" }}
            >
              <k.I size={14} style={{ color: k.c }} />
              {t.msg}
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Form input ---------- */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[13.5px] text-white placeholder-white/25 outline-none focus:border-violet/60 focus:bg-white/8 transition-colors";

export const btnGold =
  "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl display text-[12px] font-bold tracking-wide bg-gold text-[#171200] transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-95 cursor-pointer";

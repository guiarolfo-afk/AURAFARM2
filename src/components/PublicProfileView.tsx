import { useEffect, useState } from "react";
import { Trophy, Medal, ShieldCheck, Star } from "lucide-react";
import { useApp, levelFromAura, titleFromLevel, progressToNextLevel } from "../store";
import { useT } from "../i18n";
import { countryById } from "../data";
import { Avatar, AuraBar, AnimatedNumber } from "./ui";

interface PubProfile {
  id: string; name: string; country: string; photo: string | null;
  aura: number; trophies: number; role?: string | null;
}

/* FASE 6.5 — Perfil público de un usuario, accesible SIN login (#/u/:id).
   Lee de la tabla `profiles` (RLS: select público). */
export default function PublicProfileView({ profileId }: { profileId: string }) {
  const t = useT();
  const lang = useApp((s) => s.lang);
  const [p, setP] = useState<PubProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [orgScore, setOrgScore] = useState<{ avg: number; count: number } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await import("../supabaseClient").then((m) =>
          m.supabase.from("profiles").select("id, name, country, photo, aura, trophies, role").eq("id", profileId).maybeSingle()
        );
        if (alive) {
          if (data) {
            setP({ ...data, aura: data.aura ?? 0, trophies: data.trophies ?? 0 });
            if (data.role === "organizer" || data.role === "admin") {
              const { data: ratings } = await import("../supabaseClient").then((m) =>
                m.supabase.from("organizer_ratings").select("score").eq("organizer_id", data.id)
              );
              if (alive && ratings && ratings.length > 0) {
                const total = ratings.reduce((a: number, r: any) => a + (r.score ?? 0), 0);
                setOrgScore({ avg: Math.round((total / ratings.length) * 10) / 10, count: ratings.length });
              }
            }
          } else {
            setNotFound(true);
          }
        }
      } catch { if (alive) setNotFound(true); }
    })();
    return () => { alive = false; };
  }, [profileId]);

  if (notFound) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="text-center text-white/50 text-sm space-y-2">
          <p className="display text-lg font-extrabold text-white/80">404</p>
          <p className="text-[12px]">Perfil no encontrado.</p>
        </div>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="min-h-screen grid place-items-center text-white/40 text-sm">Cargando perfil…</div>
    );
  }

  const level = levelFromAura(p.aura);
  const country = countryById(p.country ?? "");
  const isOrg = p.role === "organizer" || p.role === "admin";

  return (
    <div className="min-h-screen">
      <div className="aura-bg" />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="panel p-6">
          <div className="flex items-center gap-4">
            <Avatar name={p.name} hue={46} size={64} src={p.photo} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="display text-xl font-extrabold truncate">{p.name}</h1>
                {isOrg && (
                  <span className="flex items-center gap-1 text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-violet/15 text-violet border border-violet/40">
                    <ShieldCheck size={10} /> {t("nav_org")}
                  </span>
                )}
              </div>
              <p className="text-[11.5px] text-white/50 mt-0.5">{country.flag} {country.name[lang]} · {t("c_level")} {level} · {titleFromLevel(level, lang)}</p>
            </div>
          </div>

          <div className="mt-5">
            <AuraBar value={progressToNextLevel(p.aura)} color="#FFD700" className="mb-1" />
            <AnimatedNumber value={p.aura} className="display text-2xl font-extrabold text-gold" />
            <p className="text-[10px] text-white/40">Aura</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <Stat icon={<Trophy size={14} className="text-gold" />} value={p.trophies} label={t("rk_trophies")} />
            <Stat icon={<Medal size={14} className="text-azure" />} value={level} label={t("c_level")} />
            <Stat icon={<ShieldCheck size={14} className="text-mint" />} value={p.aura} label="Aura" />
          </div>

          {isOrg && orgScore && (
            <div className="mt-3 flex items-center gap-2.5 p-3 rounded-xl bg-violet/8 border border-violet/25">
              <ShieldCheck size={16} className="text-violet shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-violet/80">{t("d4")}</p>
                <p className="display text-[15px] font-extrabold flex items-center gap-1">
                  {orgScore.avg.toFixed(1)} <Star size={13} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-[11px] font-semibold text-white/50">· {orgScore.count} {t("ar_rate_org").toLowerCase()}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="p-3 rounded-xl bg-white/3 border border-white/7 text-center">
      <div className="flex justify-center mb-1.5">{icon}</div>
      <AnimatedNumber value={value} className="display text-lg font-extrabold text-white" />
      <p className="text-[9px] font-bold uppercase tracking-wider text-white/35 mt-0.5">{label}</p>
    </div>
  );
}

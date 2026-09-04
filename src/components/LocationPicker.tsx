import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import { addDarkTiles } from "./mapTiles";
import { Search, MapPin, Loader2, Crosshair, Globe2 } from "lucide-react";
import { useT } from "../i18n";
import type { Lang } from "../i18n";

export interface PickedPlace { lat: number; lng: number; label: string; countryCode: string }

interface GeoResult {
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  addresstype?: string;
  type?: string;
  address?: {
    city?: string; town?: string; village?: string; municipality?: string;
    state?: string; province?: string; region?: string; country?: string; country_code?: string;
  };
}

const pinIcon = () =>
  L.divIcon({ html: '<div class="af-pin"></div>', className: "", iconSize: [24, 34], iconAnchor: [12, 32], popupAnchor: [0, -30] });

/** Unlimited worldwide location picker: Nominatim search + click/drag on map + reverse geocoding. */
export default function LocationPicker({ value, onChange, lang }: { value: PickedPlace | null; onChange: (p: PickedPlace) => void; lang: Lang }) {
  const t = useT();
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const reverseTimer = useRef<number | null>(null);
  onChangeRef.current = onChange;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showList, setShowList] = useState(false);

  const shortName = (r: GeoResult) => {
    const main = (r.name || r.display_name.split(",")[0]).trim();
    const region = r.address?.state ?? r.address?.province ?? r.address?.region ?? r.address?.country;
    return region && region !== main ? `${main}, ${region}` : main;
  };

  const placeMarker = (lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;
    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { icon: pinIcon(), draggable: true }).addTo(map);
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    markerRef.current.off("dragend").on("dragend", () => {
      const p = markerRef.current!.getLatLng();
      commitPoint(p.lat, p.lng);
    });
  };

  const reverseGeo = (lat: number, lng: number) => {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=${lang}&lat=${lat}&lon=${lng}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        const label = d.name || (d.display_name ? d.display_name.split(",").slice(0, 2).join(",").trim() : `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        onChangeRef.current({ lat, lng, label, countryCode: ((d.address?.country_code as string) ?? "world").toLowerCase() });
      })
      .catch(() => {});
  };

  const commitPoint = (lat: number, lng: number) => {
    onChangeRef.current({ lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, countryCode: "world" });
    if (reverseTimer.current) window.clearTimeout(reverseTimer.current);
    reverseTimer.current = window.setTimeout(() => reverseGeo(lat, lng), 450);
  };

  /* ----- map init ----- */
  useEffect(() => {
    if (!boxRef.current || mapRef.current) return;
    const map = L.map(boxRef.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false }).setView([22, 0], 2);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    addDarkTiles(map);
    map.on("click", (e: LeafletMouseEvent) => {
      placeMarker(e.latlng.lat, e.latlng.lng);
      commitPoint(e.latlng.lat, e.latlng.lng);
    });
    mapRef.current = map;
    const tm = window.setTimeout(() => map.invalidateSize(), 220);
    return () => {
      window.clearTimeout(tm);
      if (reverseTimer.current) window.clearTimeout(reverseTimer.current);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ----- clear marker when parent resets ----- */
  useEffect(() => {
    if (!value && markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
      setQuery("");
      setResults([]);
      setShowList(false);
      setSearched(false);
    }
  }, [value]);

  /* ----- debounced worldwide search ----- */
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      setFailed(false);
      setShowList(false);
      return;
    }
    setSearching(true);
    const tm = window.setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&accept-language=${lang}&q=${encodeURIComponent(q)}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("search"))))
        .then((d: GeoResult[]) => {
          setResults(d);
          setSearched(true);
          setFailed(false);
          setShowList(true);
        })
        .catch(() => {
          setResults([]);
          setSearched(true);
          setFailed(true);
          setShowList(true);
        })
        .finally(() => setSearching(false));
    }, 650);
    return () => window.clearTimeout(tm);
  }, [query, lang]);

  const pick = (r: GeoResult) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    onChange({ lat, lng, label: shortName(r), countryCode: ((r.address?.country_code as string) ?? "world").toLowerCase() });
    placeMarker(lat, lng);
    mapRef.current?.flyTo([lat, lng], 11, { duration: 0.9 });
    setShowList(false);
  };

  const typeBadge = (r: GeoResult) => {
    const raw = (r.addresstype ?? r.type ?? "place").toString();
    const map: Record<string, string> = {
      city: t("geo_city"), town: t("geo_city"), village: t("geo_city"), municipality: t("geo_city"), hamlet: t("geo_city"),
      state: t("geo_state"), province: t("geo_province"), region: t("geo_state"), county: t("geo_province"),
      country: t("geo_country"),
    };
    return map[raw] ?? raw.charAt(0).toUpperCase() + raw.slice(1);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/3 p-3 space-y-3">
      {/* search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35">
          {searching ? <Loader2 size={15} className="animate-spin text-gold" /> : <Search size={15} />}
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowList(true)}
          placeholder={t("org_pick_search")}
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[13px] outline-none focus:border-gold/50 transition-colors"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25"><Globe2 size={15} /></span>

        {/* results dropdown */}
        {showList && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-30 panel !rounded-xl overflow-hidden shadow-2xl max-h-56 overflow-y-auto">
            {failed && (
              <p className="px-3.5 py-3 text-[12px] text-ember flex items-center gap-2">{t("org_pick_error")}</p>
            )}
            {!failed && searched && results.length === 0 && (
              <p className="px-3.5 py-3 text-[12px] text-white/45">{t("org_pick_no_results")}</p>
            )}
            {results.map((r, i) => (
              <button
                key={`${r.lat}-${r.lon}-${i}`}
                onClick={() => pick(r)}
                className="w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left hover:bg-gold/8 transition-colors cursor-pointer border-b border-white/5 last:border-0"
              >
                <MapPin size={14} className="text-gold mt-0.5 shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-[12.5px] font-bold text-white/85 leading-tight">{r.name || r.display_name.split(",")[0]}</span>
                  <span className="block text-[10.5px] text-white/40 truncate">{r.display_name}</span>
                </span>
                <span className="shrink-0 text-[10.5px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet/14 border border-violet/30 text-violet mt-0.5">
                  {typeBadge(r)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* selected place */}
      {value ? (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gold/8 border border-gold/30">
          <Crosshair size={14} className="text-gold shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-gold/80">{t("org_pick_selected")}</p>
            <p className="text-[12.5px] font-bold truncate">{value.label}</p>
          </div>
          <span className="display text-[10px] text-white/35 shrink-0">{value.lat.toFixed(3)}, {value.lng.toFixed(3)}</span>
        </div>
      ) : (
        <p className="text-[11px] text-white/40 flex items-center gap-1.5 px-1">
          <MapPin size={12} className="text-gold" /> {t("org_pick_click_map")}
        </p>
      )}

      {/* map */}
      <div ref={boxRef} style={{ height: 235 }} className="w-full rounded-xl border border-white/10 overflow-hidden z-0" aria-label={t("org_ev_location")} />
      <p className="text-[10px] text-white/30 flex items-center justify-between gap-2 px-1">
        <span>{value ? t("org_pick_drag") : t("org_pick_custom")}</span>
        <span className="shrink-0">{t("org_pick_powered")}</span>
      </p>
    </div>
  );
}

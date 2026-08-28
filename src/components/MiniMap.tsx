import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function MiniMap({ lat, lng, label, height = 220 }: { lat: number; lng: number; label: string; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false }).setView([lat, lng], 13);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);
    L.circleMarker([lat, lng], { radius: 12, color: "#FFD700", weight: 2, fillColor: "#9B30FF", fillOpacity: 0.55 })
      .addTo(map)
      .bindPopup(`<b style="color:#FFD700">${label}</b>`);
    L.circle([lat, lng], { radius: 900, color: "#9B30FF", weight: 1, fillColor: "#9B30FF", fillOpacity: 0.08 }).addTo(map);
    mapRef.current = map;
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, label]);

  return <div ref={ref} style={{ height }} className="w-full rounded-xl border border-white/10 overflow-hidden z-0" aria-label={label} />;
}

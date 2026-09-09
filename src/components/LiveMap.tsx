import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { addDarkTiles } from "./mapTiles";
import type { EventItem } from "../data";

const pinIcon = (color: string, live: boolean) =>
  L.divIcon({
    html: `<div class="af-map-pin" style="--pin:${color}">${live ? '<span class="af-map-pin-live"></span>' : ""}</div>`,
    className: "",
    iconSize: [26, 34],
    iconAnchor: [13, 32],
    popupAnchor: [0, -32],
  });

export default function LiveMap({ events }: { events: EventItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false }).setView([22, 0], 2);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    addDarkTiles(map);
    mapRef.current = map;
    const tm = window.setTimeout(() => map.invalidateSize(), 250);
    return () => {
      window.clearTimeout(tm);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Circle) layer.remove();
    });
    const withCoords = events.filter((e) => e.lat && e.lng && e.lat !== 0 && e.lng !== 0);
    withCoords.forEach((e) => {
      const latLng = L.latLng(e.lat, e.lng);
      const live = e.status === "live";
      const color = live ? "#FF4444" : e.banner[0] ?? "#9B30FF";
      L.marker(latLng, { icon: pinIcon(color, live) })
        .addTo(map)
        .bindPopup(`<b style="color:${color}">${live ? "🔴 " : ""}${e.name}</b><br/><span style="color:#aaa;font-size:11px">${e.city || e.address}</span>`);
      L.circle(latLng, { radius: 1200, color, weight: 1, fillColor: color, fillOpacity: 0.08 }).addTo(map);
    });
    if (withCoords.length > 0) {
      const bounds = L.latLngBounds(withCoords.map((e) => [e.lat, e.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    } else {
      map.setView([22, 0], 2);
    }
  }, [events]);

  return <div ref={ref} style={{ height: 360 }} className="w-full rounded-xl border border-white/10 overflow-hidden z-0" aria-label="Mapa de eventos en vivo" />;
}

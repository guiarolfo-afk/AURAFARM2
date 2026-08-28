import L from "leaflet";

/**
 * Adds dark basemap tiles that do NOT require an API key.
 * Primary: Esri "World Dark Gray" (free with attribution).
 * Fallback: standard OpenStreetMap tiles if the primary provider fails,
 * so the map never renders blank or watermarked.
 */
export function addDarkTiles(map: L.Map) {
  const esri = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Tiles © Esri — Esri, Maxar, Earthstar Geographics", maxZoom: 18 }
  );

  let failed = false;
  esri.on("tileerror", () => {
    if (failed) return;
    failed = true;
    esri.remove();
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
  });

  esri.addTo(map);
}

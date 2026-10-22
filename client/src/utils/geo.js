// Distances and directions for the gym map.

const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees) => (degrees * Math.PI) / 180;

// Straight-line distance in km between two points { latitude, longitude } (haversine formula).
export function distanceKm(a, b) {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

// 0.35 → "350 m", 4.27 → "4.3 km", 27.4 → "27 km"
export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 100) * 10} m`;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

// Google Maps route to the gym (opens the Maps app on phones).
export function directionsUrl({ latitude, longitude }) {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

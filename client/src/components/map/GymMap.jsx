import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// An interactive map (Leaflet + OpenStreetMap) with a pin for every gym.
//   gyms:       [{ id, name, latitude, longitude, isMain?, isLocked? }] – isLocked: grey pin (not in the member's plan)
//   selectedId: the gym that is highlighted; the map flies to it
//   onSelect:   called with a gym id when its pin is clicked (or chosen with the keyboard)
//   userPosition: optional { latitude, longitude } – a blue "you are here" dot
//   onMapClick: optional, called with { latitude, longitude } when the map is clicked (admin: choose a position)
// The map is drawn by Leaflet itself, not by React: React only tells it what changed.

const ISTANBUL = [41.02, 29.0];
// Free OpenStreetMap map images. To match our design they are recoloured with CSS filters in
// index.css (.gym-map): calm grey with a touch of green in light mode, dark slate in dark mode.
// tile.openstreetmap.org without the old a./b./c. subdomains, as OpenStreetMap asks today.
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
// The map data is free, but OpenStreetMap asks every map to name them.
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// The pin's look is in index.css (.gym-pin). A dumbbell icon for our own gym, a dot for partners.
function pinIcon({ isMain, isSelected, isLocked }) {
  const size = isMain ? 44 : 34;
  return L.divIcon({
    className: '',
    html: `<span class="gym-pin ${isMain ? 'gym-pin--main' : ''} ${isSelected ? 'gym-pin--selected' : ''} ${isLocked ? 'gym-pin--locked' : ''}"><span class="gym-pin__dot"></span></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

const USER_ICON = L.divIcon({ className: '', html: '<span class="user-pin"></span>', iconSize: [18, 18], iconAnchor: [9, 9] });

function GymMap({ gyms, selectedId, onSelect, onMapClick, userPosition, className = '' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  // Keep the latest callbacks without re-creating the map when they change.
  const callbacks = useRef({ onSelect, onMapClick });
  useEffect(() => {
    callbacks.current = { onSelect, onMapClick };
  });

  // Create the map once.
  useEffect(() => {
    const map = L.map(containerRef.current, { center: ISTANBUL, zoom: 11, scrollWheelZoom: false });
    L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);
    markersRef.current = L.layerGroup().addTo(map);
    map.on('click', (event) => callbacks.current.onMapClick?.({ latitude: event.latlng.lat, longitude: event.latlng.lng }));
    mapRef.current = map;
    return () => map.remove();
  }, []);

  // Draw the pins whenever the gyms or the selection change.
  useEffect(() => {
    const layer = markersRef.current;
    layer.clearLayers();
    for (const gym of gyms) {
      const marker = L.marker([gym.latitude, gym.longitude], {
        icon: pinIcon({ isMain: gym.isMain, isSelected: gym.id === selectedId, isLocked: gym.isLocked }),
        title: gym.name, // tooltip on hover + name for screen readers
        alt: gym.name,
        keyboard: true, // Tab reaches the pin, Enter selects it
        zIndexOffset: gym.id === selectedId ? 1000 : 0,
      });
      marker.on('click', () => callbacks.current.onSelect?.(gym.id));
      layer.addLayer(marker);
    }
    if (userPosition) {
      layer.addLayer(L.marker([userPosition.latitude, userPosition.longitude], { icon: USER_ICON, title: 'You are here', alt: 'You are here', interactive: false }));
    }
  }, [gyms, selectedId, userPosition]);

  // Fly to the selected gym; without a selection, show all gyms.
  useEffect(() => {
    const map = mapRef.current;
    const selected = gyms.find((gym) => gym.id === selectedId);
    if (selected) {
      map.flyTo([selected.latitude, selected.longitude], Math.max(map.getZoom(), 13), { duration: 0.8 });
    } else if (gyms.length > 1 || userPosition) {
      const points = gyms.map((gym) => [gym.latitude, gym.longitude]);
      if (userPosition) points.push([userPosition.latitude, userPosition.longitude]);
      map.fitBounds(points, { padding: [40, 40] });
    } else if (gyms.length === 1) {
      map.setView([gyms[0].latitude, gyms[0].longitude], 14);
    }
  }, [gyms, selectedId, userPosition]);

  return <div ref={containerRef} className={`gym-map isolate ${className}`} />;
}

export default GymMap;

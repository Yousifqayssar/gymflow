import { lazy, Suspense, useState } from 'react';
import { Clock, MapPin, Phone } from 'lucide-react';
import { listPartnerGyms } from '../../api/partnerGyms.js';
import { useApiData } from '../../hooks/useApiData.js';
import { GYM } from '../../config/gym.js';
import { hoursToday, MAIN_GYM_HOURS, openingStatus, WEEKDAY_NAMES } from '../../utils/openingHours.js';

// The map library (Leaflet) is loaded only when this section is shown.
const GymMap = lazy(() => import('../map/GymMap.jsx'));

// Our own gym first (from config/gym.js), then the partner gyms from the API.
const MAIN_GYM = {
  id: 'main',
  isMain: true,
  name: `${GYM.name} (our gym)`,
  address: GYM.address[0],
  district: GYM.address[1],
  phone: GYM.phone,
  latitude: GYM.latitude,
  longitude: GYM.longitude,
  hours: MAIN_GYM_HOURS,
};

// Home page: "Our partner gyms" – a map with every gym we cooperate with and a list with
// their opening hours and whether they are open right now. `now` comes from the home page clock.
function PartnerGymsSection({ now }) {
  const { data, error } = useApiData(listPartnerGyms);
  const [selectedId, setSelectedId] = useState(null);
  const gyms = data ? [MAIN_GYM, ...data.gyms] : null;
  const selected = gyms?.find((gym) => gym.id === selectedId);

  return (
    <section aria-labelledby="partners-heading" className="mt-14">
      <p className="text-sm font-semibold tracking-wide text-brand-700 uppercase dark:text-brand-300">Our network</p>
      <h2 id="partners-heading" className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
        Partner gyms across Istanbul
      </h2>
      <p className="mt-2 max-w-2xl text-muted">
        GymFlow works together with {data ? data.gyms.length : 'several'} gyms in the city. Tap a gym to see where it is and when it is open.
      </p>

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        <div className="relative h-80 overflow-hidden rounded-2xl border border-line shadow-sm lg:col-span-3 lg:h-[30rem]">
          {gyms ? (
            <Suspense fallback={<div className="size-full animate-pulse bg-surface-3" />}>
              <GymMap gyms={gyms} selectedId={selectedId} onSelect={setSelectedId} className="size-full" />
            </Suspense>
          ) : (
            <div className="size-full animate-pulse bg-surface-3" />
          )}
        </div>

        <ul className="space-y-3 lg:col-span-2 lg:max-h-[30rem] lg:overflow-y-auto lg:pr-1" aria-label="Gyms">
          {!gyms && [1, 2, 3].map((n) => <li key={n} className="h-24 animate-pulse rounded-2xl bg-surface-3" />)}
          {gyms?.map((gym) => {
            const status = openingStatus(now, gym.hours);
            const isSelected = gym.id === selectedId;
            return (
              <li key={gym.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(isSelected ? null : gym.id)}
                  aria-pressed={isSelected}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    isSelected ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/30 dark:bg-brand-500/10' : 'border-line bg-surface hover:border-line-strong hover:shadow-md'
                  }`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink">{gym.name}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                        <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                        {gym.address}, {gym.district}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        status.isOpen ? 'bg-brand-100 text-brand-800 dark:bg-brand-500/15 dark:text-brand-300' : 'bg-surface-3 text-ink-3'
                      }`}
                    >
                      {status.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </span>
                  <span className="mt-2 flex items-center gap-1.5 text-sm text-ink-3">
                    <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                    {status.text}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Details of the chosen gym: the whole week and the phone number */}
      {selected && (
        <div className="mt-5 grid gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:grid-cols-2">
          <div>
            <h3 className="font-semibold text-ink">{selected.name}</h3>
            <p className="mt-1 text-sm text-muted">Today: {hoursToday(now, selected.hours)}</p>
            {selected.phone && (
              <a href={`tel:${selected.phone.replaceAll(' ', '')}`} className="mt-3 inline-flex min-h-6 items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 dark:text-brand-300">
                <Phone className="size-4" aria-hidden="true" />
                {selected.phone}
              </a>
            )}
          </div>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const row = selected.hours.find((h) => h.day === day);
              return (
                <li key={day} className="flex justify-between gap-2">
                  <span className="text-muted">{WEEKDAY_NAMES[day].slice(0, 3)}</span>
                  <span className={`font-mono ${row ? 'text-ink-2' : 'text-faint'}`}>{row ? `${row.open}–${row.close}` : 'closed'}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

export default PartnerGymsSection;

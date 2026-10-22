import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router';
import { BadgeCheck, Clock, Crown, Footprints, LocateFixed, Lock, MapPin, Navigation, Phone } from 'lucide-react';
import { listPartnerGyms } from '../../api/partnerGyms.js';
import { useApiData } from '../../hooks/useApiData.js';
import { useAuth } from '../../auth/useAuth.js';
import { GYM } from '../../config/gym.js';
import { hoursToday, MAIN_GYM_HOURS, openingStatus, WEEKDAY_NAMES } from '../../utils/openingHours.js';
import { directionsUrl, distanceKm, formatDistance } from '../../utils/geo.js';
import Button from '../ui/Button.jsx';

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

const FILTERS = [
  { value: 'all', label: 'All gyms' },
  { value: 'open', label: 'Open now' },
  { value: 'mine', label: 'In my plan', membersOnly: true },
];

// What the member's plan allows, shown above the map.
function AccessBanner({ access, partnerCount }) {
  if (access === 'PREMIUM') {
    return (
      <p className="mt-5 flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200">
        <BadgeCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <span>
          <strong>Your Premium membership works at all {partnerCount + 1} gyms.</strong> Show your QR code at the front desk of any partner gym.
        </span>
      </p>
    );
  }
  if (access === 'BASIC') {
    return (
      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <Lock className="size-5 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 basis-60">
          <strong>Your Basic plan is for {GYM.name} only.</strong> Premium adds all {partnerCount} partner gyms and 10 classes a month.
        </span>
        <Button as={Link} to="/membership" icon={Crown} size="sm" variant="secondary">
          See Premium
        </Button>
      </div>
    );
  }
  if (access === 'NONE') {
    return (
      <p className="mt-5 flex items-start gap-3 rounded-2xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink-3">
        <Lock className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <span>
          You have no active membership. <Link to="/membership" className="font-semibold text-brand-700 underline dark:text-brand-300">Choose a plan</Link> to train at our gyms.
        </span>
      </p>
    );
  }
  return null;
}

// Home page: "Our network" – our gym and every partner gym on a map. For members it shows where their
// plan lets them train (Premium: everywhere, Basic: our gym only), how far each gym is, whether it is
// open now, how often they trained there, and buttons for directions and calling.
// Staff see how many visits each gym had this month. `now` comes from the home page clock.
function PartnerGymsSection({ now }) {
  const { user } = useAuth();
  const isMember = user.role === 'MEMBER';
  const { data, error } = useApiData(listPartnerGyms);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [position, setPosition] = useState(null); // { latitude, longitude } once the member shares it
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const gyms = data
    ? [{ ...MAIN_GYM, ...data.homeGym }, ...data.gyms].map((gym) => ({
        ...gym,
        status: openingStatus(now, gym.hours),
        distance: position ? distanceKm(position, gym) : null,
        // For members: pins of gyms outside their plan are grey.
        isLocked: isMember && !gym.canTrainHere,
      }))
    : null;
  const shown = gyms
    ?.filter((gym) => (filter === 'open' ? gym.status.isOpen : filter === 'mine' ? gym.canTrainHere : true))
    .sort((a, b) => (position ? a.distance - b.distance : 0));
  const selected = gyms?.find((gym) => gym.id === selectedId);
  const nearestOpen = position && gyms?.filter((gym) => gym.status.isOpen && (!isMember || gym.canTrainHere)).sort((a, b) => a.distance - b.distance)[0];

  function locate() {
    if (!navigator.geolocation) {
      setLocationError('Your browser cannot share your location.');
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ latitude: coords.latitude, longitude: coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError('Location not shared – allow it in your browser to see the nearest gym.');
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  return (
    <section aria-labelledby="partners-heading" className="mt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-brand-700 uppercase dark:text-brand-300">Our network</p>
          <h2 id="partners-heading" className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
            {data ? `${data.gyms.length + 1} gyms across Istanbul` : 'Gyms across Istanbul'}
          </h2>
          <p className="mt-2 max-w-2xl text-muted">
            {isMember
              ? 'Find the nearest gym your membership covers, see if it is open, and get directions.'
              : 'Our gym and our partner gyms, with this month’s visits of GymFlow members.'}
          </p>
        </div>
        <Button variant="secondary" icon={LocateFixed} onClick={locate} disabled={locating}>
          {locating ? 'Finding you…' : position ? 'Update my location' : 'Use my location'}
        </Button>
      </div>

      {isMember && data && <AccessBanner access={data.access} partnerCount={data.gyms.length} />}
      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {locationError && <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">{locationError}</p>}
      {nearestOpen && (
        <p className="mt-3 flex items-center gap-2 text-sm text-ink-2">
          <Navigation className="size-4 text-brand-600" aria-hidden="true" />
          Nearest open gym{isMember ? ' in your plan' : ''}: <strong>{nearestOpen.name}</strong> · {formatDistance(nearestOpen.distance)}
          <button type="button" onClick={() => setSelectedId(nearestOpen.id)} className="font-semibold text-brand-700 underline dark:text-brand-300">
            Show
          </button>
        </p>
      )}

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Filter gyms">
        {FILTERS.filter((f) => isMember || !f.membersOnly).map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value ? 'border-brand-700 bg-brand-700 text-white' : 'border-line-strong bg-surface text-ink-2 hover:bg-surface-2'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-5">
        <div className="relative h-80 overflow-hidden rounded-2xl border border-line shadow-sm lg:col-span-3 lg:h-[32rem]">
          {gyms ? (
            <Suspense fallback={<div className="size-full animate-pulse bg-surface-3" />}>
              <GymMap gyms={shown} selectedId={selectedId} onSelect={setSelectedId} userPosition={position} className="size-full" />
            </Suspense>
          ) : (
            <div className="size-full animate-pulse bg-surface-3" />
          )}
        </div>

        <ul className="space-y-3 lg:col-span-2 lg:max-h-[32rem] lg:overflow-y-auto lg:pr-1" aria-label="Gyms">
          {!gyms && [1, 2, 3].map((n) => <li key={n} className="h-28 animate-pulse rounded-2xl bg-surface-3" />)}
          {shown?.length === 0 && <li className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">No gym matches this filter right now.</li>}
          {shown?.map((gym) => {
            const isSelected = gym.id === selectedId;
            return (
              <li key={gym.id}>
                <div
                  className={`rounded-2xl border p-4 transition ${
                    isSelected ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/30 dark:bg-brand-500/10' : 'border-line bg-surface hover:border-line-strong hover:shadow-md'
                  } ${gym.isLocked ? 'opacity-80' : ''}`}
                >
                  <button type="button" onClick={() => setSelectedId(isSelected ? null : gym.id)} aria-pressed={isSelected} className="w-full text-left">
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
                          gym.status.isOpen ? 'bg-brand-100 text-brand-800 dark:bg-brand-500/15 dark:text-brand-300' : 'bg-surface-3 text-ink-3'
                        }`}
                      >
                        {gym.status.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-3">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                        {gym.status.text}
                      </span>
                      {gym.distance !== null && <span className="font-medium text-ink-2">{formatDistance(gym.distance)}</span>}
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      {isMember && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
                            gym.canTrainHere ? 'bg-brand-100 text-brand-800 dark:bg-brand-500/15 dark:text-brand-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                          }`}
                        >
                          {gym.canTrainHere ? <BadgeCheck className="size-3.5" aria-hidden="true" /> : <Lock className="size-3.5" aria-hidden="true" />}
                          {gym.canTrainHere ? 'In your plan' : gym.isMain ? 'Needs a membership' : 'Premium only'}
                        </span>
                      )}
                      {isMember && gym.myVisits > 0 && (
                        <span className="inline-flex items-center gap-1 text-muted">
                          <Footprints className="size-3.5" aria-hidden="true" />
                          You trained here {gym.myVisits}×
                        </span>
                      )}
                      {!isMember && (
                        <span className="inline-flex items-center gap-1 text-muted">
                          <Footprints className="size-3.5" aria-hidden="true" />
                          {gym.visitsThisMonth ?? 0} visits this month
                        </span>
                      )}
                    </span>
                  </button>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button as="a" href={directionsUrl(gym)} target="_blank" rel="noreferrer" size="sm" variant="secondary" icon={Navigation}>
                      Directions
                    </Button>
                    {gym.phone && (
                      <Button as="a" href={`tel:${gym.phone.replaceAll(' ', '')}`} size="sm" variant="ghost" icon={Phone}>
                        Call
                      </Button>
                    )}
                  </div>
                </div>
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

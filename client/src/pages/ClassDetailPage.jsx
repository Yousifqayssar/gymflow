import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Backpack, Ban, CalendarDays, ChevronLeft, Clock, Gauge, HeartPulse, MapPin, Signal, Users } from 'lucide-react';
import { getClass } from '../api/classes.js';
import Avatar from '../components/ui/Avatar.jsx';
import Card from '../components/ui/Card.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import ClassBanner from '../components/classes/ClassBanner.jsx';
import BookingPanel from '../components/classes/BookingPanel.jsx';
import StaffClassActions from '../components/classes/StaffClassActions.jsx';
import { useAuth } from '../auth/useAuth.js';
import SpotsBar from '../components/classes/SpotsBar.jsx';
import PageTitle from '../components/ui/PageTitle.jsx';
import {
  CATEGORY_DISPLAY,
  formatDuration,
  formatLongDay,
  formatTime,
  INTENSITY_DISPLAY,
  LEVEL_LABELS,
} from '../utils/classDisplay.js';

// One fact about the class: icon, label and value.
function Fact({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <div className="font-medium text-slate-900">{children}</div>
      </div>
    </div>
  );
}

function IntensityDots({ intensity }) {
  const { label, dots } = INTENSITY_DISPLAY[intensity];
  return (
    <span className="flex items-center gap-2">
      <span className="flex gap-1" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} className={`size-2 rounded-full ${n <= dots ? 'bg-brand-500' : 'bg-slate-200'}`} />
        ))}
      </span>
      {label}
    </span>
  );
}

// Everything about one class, so members understand it before booking.
function ClassDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const [gymClass, setGymClass] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    getClass(id)
      .then((data) => {
        if (!ignore) setGymClass(data.class);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (!gymClass) return <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />;

  const category = CATEGORY_DISPLAY[gymClass.category];
  const isMember = user.role === 'MEMBER';

  return (
    // On phones members get a booking bar fixed to the bottom; pb-40 keeps content visible above it.
    <div className={`space-y-6 ${isMember ? 'pb-40 lg:pb-0' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/classes" className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ChevronLeft className="size-4" aria-hidden="true" />
          All classes
        </Link>
        {/* The API only sends `attendees` to people who may manage this class. */}
        {gymClass.attendees && <StaffClassActions gymClass={gymClass} onChange={setGymClass} />}
      </div>

      {gymClass.isCancelled && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          <Ban className="size-5 shrink-0" aria-hidden="true" />
          <p className="font-medium">This class has been cancelled.</p>
        </div>
      )}

      {/* Big colourful banner in the category's colours */}
      <ClassBanner category={gymClass.category} size="banner" className="rounded-3xl px-6 py-8 shadow-lg sm:px-10 sm:py-12">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur-sm">
          <category.icon className="size-4" aria-hidden="true" />
          {category.label}
        </span>
        <PageTitle>{gymClass.title}</PageTitle>
        <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold tracking-tight drop-shadow-sm sm:text-6xl">{gymClass.title}</h1>
        <p className="mt-3 text-lg font-medium text-white/90">
          {formatLongDay(gymClass.startsAt)} · {formatTime(gymClass.startsAt)} – {formatTime(gymClass.endsAt)}
        </p>
        <p className="mt-1 text-white/80">
          {LEVEL_LABELS[gymClass.level]} · {INTENSITY_DISPLAY[gymClass.intensity].label} · with {gymClass.trainer.firstName}
        </p>
      </ClassBanner>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="About this class">
            <p className="whitespace-pre-line leading-relaxed text-slate-700">{gymClass.description}</p>
          </Card>

          {gymClass.whatToBring && (
            <Card title="What to bring">
              <p className="flex gap-3 text-slate-700">
                <Backpack className="mt-0.5 size-5 shrink-0 text-slate-400" aria-hidden="true" />
                {gymClass.whatToBring}
              </p>
            </Card>
          )}

          {gymClass.healthNotes && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="flex items-center gap-2 font-semibold text-amber-900">
                <HeartPulse className="size-5" aria-hidden="true" />
                Health notes
              </h2>
              <p className="mt-2 leading-relaxed text-amber-900">{gymClass.healthNotes}</p>
            </section>
          )}
        </div>

        <div className="space-y-6">
          {isMember && (
            <>
              {/* Desktop: card at the top of the side column. Phones: bar fixed to the bottom. */}
              <div className="hidden lg:block">
                <BookingPanel gymClass={gymClass} onChange={setGymClass} />
              </div>
              <div className="lg:hidden">
                <BookingPanel gymClass={gymClass} onChange={setGymClass} variant="bar" />
              </div>
            </>
          )}

          <Card>
            <div className="space-y-5">
              <Fact icon={CalendarDays} label="Date">
                {formatLongDay(gymClass.startsAt)}
              </Fact>
              <Fact icon={Clock} label="Time">
                {formatTime(gymClass.startsAt)} – {formatTime(gymClass.endsAt)}{' '}
                <span className="font-normal text-slate-500">({formatDuration(gymClass.durationMinutes)})</span>
              </Fact>
              <Fact icon={MapPin} label="Meeting point">
                {gymClass.location}
              </Fact>
              <Fact icon={Signal} label="Level">
                {LEVEL_LABELS[gymClass.level]}
              </Fact>
              <Fact icon={Gauge} label="Intensity">
                <IntensityDots intensity={gymClass.intensity} />
              </Fact>
              <Fact icon={Users} label="Trainer">
                <span className="flex items-center gap-2">
                  <Avatar firstName={gymClass.trainer.firstName} lastName={gymClass.trainer.lastName} size="sm" />
                  {gymClass.trainer.firstName} {gymClass.trainer.lastName}
                </span>
              </Fact>
            </div>

            {!gymClass.isCancelled && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <SpotsBar capacity={gymClass.capacity} bookedCount={gymClass.bookedCount} spotsLeft={gymClass.spotsLeft} />
              </div>
            )}
          </Card>

          {/* Only the class's trainer and admins receive the list of booked members from the API. */}
          {gymClass.attendees && (
            <Card title="Booked members" description={`${gymClass.attendees.length} of ${gymClass.capacity}`} padded={false}>
              {gymClass.attendees.length === 0 ? (
                <p className="px-5 py-4 text-sm text-slate-500">Nobody has booked yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {gymClass.attendees.map((attendee) => (
                    <li key={attendee.id} className="flex items-center gap-3 px-5 py-2.5">
                      <Avatar firstName={attendee.firstName} lastName={attendee.lastName} size="sm" />
                      <span className="text-sm font-medium text-slate-900">
                        {attendee.firstName} {attendee.lastName}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClassDetailPage;

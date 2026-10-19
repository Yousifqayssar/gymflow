import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, m } from 'motion/react';
import { CalendarDays, Plus } from 'lucide-react';
import { useAuth } from '../auth/useAuth.js';
import Button from '../components/ui/Button.jsx';
import { listClasses } from '../api/classes.js';
import CategoryFilter from '../components/classes/CategoryFilter.jsx';
import ClassCard from '../components/classes/ClassCard.jsx';
import DayPicker from '../components/classes/DayPicker.jsx';
import NextClassHero from '../components/classes/NextClassHero.jsx';
import ClassBalanceCard from '../components/classes/ClassBalanceCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Stagger, StaggerItem, TiltCard } from '../components/ui/motion.jsx';
import { dayKey, formatDayHeading } from '../utils/classDisplay.js';

// The countdown in the "Up next" card is refreshed this often.
const CLOCK_TICK_MS = 30_000;

// Groups classes (already sorted by time) by calendar day: [{ key, startsAt, classes, count, hasMine }]
function groupByDay(classes) {
  const groups = new Map();
  for (const gymClass of classes) {
    const key = dayKey(gymClass.startsAt);
    if (!groups.has(key)) groups.set(key, { key, startsAt: gymClass.startsAt, classes: [] });
    groups.get(key).classes.push(gymClass);
  }
  return [...groups.values()].map((day) => ({
    ...day,
    count: day.classes.length,
    hasMine: day.classes.some((c) => c.isBookedByMe && !c.isCancelled),
  }));
}

// The class schedule for the next 14 days: an "Up next" card, a day picker,
// category chips and the classes of the chosen day.
function ClassesPage() {
  const { user } = useAuth();
  const isStaff = user.role === 'ADMIN' || user.role === 'TRAINER';
  const [category, setCategory] = useState('');
  const [selectedDay, setSelectedDay] = useState(null); // null = the first day with classes
  const [data, setData] = useState(null); // { classes }
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let ignore = false;
    listClasses({ category })
      .then((result) => {
        if (!ignore) setData({ classes: result.classes });
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, [category]);

  // A clock for "Today" and the countdown; components must not read the clock while rendering.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  function handleCategoryChange(newCategory) {
    setCategory(newCategory);
    setData(null);
  }

  const days = data ? groupByDay(data.classes) : [];
  // Keep the chosen day when the category changes; if it has no classes any more, use the first day.
  const shownDay = days.find((day) => day.key === selectedDay) ?? days[0];

  // Members see their next booked class first; otherwise the next class of the gym.
  const upcoming = data?.classes.filter((c) => !c.isCancelled && new Date(c.startsAt) > now) ?? [];
  const nextMine = upcoming.find((c) => c.isBookedByMe);
  const nextClass = nextMine ?? upcoming[0];

  return (
    <div>
      <PageHeader
        title="Classes"
        description="Group classes for the next two weeks. Pick a day, then tap a class for all details."
        actions={
          isStaff && (
            <Button as={Link} to="/classes/new" icon={Plus}>
              New class
            </Button>
          )
        }
      />

      {!isStaff && <ClassBalanceCard className="mb-6" />}

      {nextClass && <NextClassHero gymClass={nextClass} now={now} isMine={Boolean(nextMine)} />}

      <CategoryFilter value={category} onChange={handleCategoryChange} />

      <ErrorMessage>{error}</ErrorMessage>

      {!data && !error && (
        <>
          <div className="mb-6 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-24 w-[4.5rem] animate-pulse rounded-2xl bg-surface-3" />
            ))}
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-72 animate-pulse rounded-2xl bg-surface-3" />
            ))}
          </div>
        </>
      )}

      {data?.classes.length === 0 && (
        <div className="rounded-2xl border border-line bg-surface">
          <EmptyState
            icon={CalendarDays}
            title="No classes planned"
            description={category ? 'There are no classes in this category in the next two weeks.' : 'New classes will appear here.'}
          />
        </div>
      )}

      {shownDay && (
        <>
          <DayPicker days={days} selectedKey={shownDay.key} onSelect={setSelectedDay} todayKey={dayKey(now)} />

          <h2 className="mb-4 flex items-baseline gap-3">
            <span className="font-display text-2xl font-bold tracking-tight text-ink">{formatDayHeading(shownDay.startsAt, now)}</span>
            <span className="text-sm text-muted">
              {shownDay.count} {shownDay.count === 1 ? 'class' : 'classes'}
            </span>
          </h2>

          {/* A new day or category: the old cards fade out, the new ones come in one after another */}
          <AnimatePresence mode="wait">
            <m.div key={`${shownDay.key}-${category}`} exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}>
              <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {shownDay.classes.map((gymClass) => (
                  <StaggerItem key={gymClass.id}>
                    <TiltCard className="h-full">
                      <ClassCard gymClass={gymClass} />
                    </TiltCard>
                  </StaggerItem>
                ))}
              </Stagger>
            </m.div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

export default ClassesPage;

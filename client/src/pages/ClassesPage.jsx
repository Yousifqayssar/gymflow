import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { CalendarDays, Plus } from 'lucide-react';
import { useAuth } from '../auth/useAuth.js';
import Button from '../components/ui/Button.jsx';
import { listClasses } from '../api/classes.js';
import ClassCard from '../components/classes/ClassCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { CATEGORY_DISPLAY, dayKey, formatDayHeading } from '../utils/classDisplay.js';

// Groups classes (already sorted by time) by calendar day: [[dayKey, [class, ...]], ...]
function groupByDay(classes) {
  const groups = new Map();
  for (const gymClass of classes) {
    const key = dayKey(gymClass.startsAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(gymClass);
  }
  return [...groups.entries()];
}

// The class schedule for the next 14 days, grouped by day, with a category filter.
function ClassesPage() {
  const { user } = useAuth();
  const isStaff = user.role === 'ADMIN' || user.role === 'TRAINER';
  const [category, setCategory] = useState('');
  const [data, setData] = useState(null); // { classes, loadedAt }
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    listClasses({ category })
      .then((result) => {
        // `loadedAt` is used for "Today"/"Tomorrow"; read here, not while rendering.
        if (!ignore) setData({ classes: result.classes, loadedAt: new Date() });
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, [category]);

  function handleCategoryChange(newCategory) {
    setCategory(newCategory);
    setData(null);
  }

  const filters = [['', 'All'], ...Object.entries(CATEGORY_DISPLAY).map(([key, display]) => [key, display.label])];

  return (
    <div>
      <PageHeader
        title="Classes"
        description="Group classes for the next two weeks. Tap a class to see all details."
        actions={
          isStaff && (
            <Button as={Link} to="/classes/new" icon={Plus}>
              New class
            </Button>
          )
        }
      />

      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Filter by category">
        {filters.map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={category === value}
            onClick={() => handleCategoryChange(value)}
            className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              category === value
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-line-strong bg-surface text-ink-2 hover:bg-surface-2'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ErrorMessage>{error}</ErrorMessage>

      {!data && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 animate-pulse rounded-2xl bg-surface-4" />
          ))}
        </div>
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

      <div className="space-y-8">
        {data &&
          groupByDay(data.classes).map(([key, classes]) => (
            <section key={key}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                {formatDayHeading(classes[0].startsAt, data.loadedAt)}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {classes.map((gymClass) => (
                  <ClassCard key={gymClass.id} gymClass={gymClass} />
                ))}
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}

export default ClassesPage;

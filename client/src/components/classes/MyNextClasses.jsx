import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { listMyBookings } from '../../api/me.js';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import ErrorMessage from '../ErrorMessage.jsx';
import { CATEGORY_DISPLAY, formatLongDay, formatTime } from '../../utils/classDisplay.js';

const SHOWN = 3;

// The member's next booked classes, for the home page.
function MyNextClasses() {
  const [classes, setClasses] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    listMyBookings()
      .then((data) => {
        if (!ignore) setClasses(data.classes);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <Card
      title="My next classes"
      padded={false}
      actions={
        classes?.length > 0 && (
          <Link to="/classes" className="text-sm font-medium text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-300">
            All classes
          </Link>
        )
      }
    >
      {error && (
        <div className="p-5">
          <ErrorMessage>{error}</ErrorMessage>
        </div>
      )}
      {!classes && !error && <div className="m-5 h-16 animate-pulse rounded-xl bg-surface-3" />}

      {classes?.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="No classes booked yet"
          description="Running Club, yoga, boxing and more – find a class that suits you."
          action={
            <Button as={Link} to="/classes">
              Browse classes
            </Button>
          }
        />
      )}

      <ul className="divide-y divide-line-soft">
        {classes?.slice(0, SHOWN).map((gymClass) => (
          <li key={gymClass.id}>
            <Link to={`/classes/${gymClass.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-2">
              <img
                src={CATEGORY_DISPLAY[gymClass.category].photo}
                alt=""
                className="size-14 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{gymClass.title}</p>
                <p className="text-sm text-muted">
                  {formatLongDay(gymClass.startsAt)} · {formatTime(gymClass.startsAt)}
                </p>
                <p className="truncate text-sm text-faint">{gymClass.location}</p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-faint" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default MyNextClasses;

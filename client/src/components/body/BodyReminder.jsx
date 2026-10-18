import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { getMyBody } from '../../api/body.js';
import { useApiData } from '../../hooks/useApiData.js';
import Button from '../ui/Button.jsx';
import BodyForm from './BodyForm.jsx';

// Member home: a reminder when the monthly body check-in is due (or was never done).
// The form opens right here; after saving, the reminder disappears.
function BodyReminder() {
  const { data, reload } = useApiData(getMyBody);
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (!data?.isDue) return null;

  return (
    <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-500/30 dark:bg-amber-500/10">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md">
        <CalendarClock className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-amber-900 dark:text-amber-200">
          {data.latest ? 'Time for your monthly check-in' : 'Tell us about yourself'}
        </p>
        <p className="text-sm text-amber-800 dark:text-amber-300">
          {data.latest
            ? 'It has been a month – update your weight so your trainer can follow your progress.'
            : 'Add your height, weight and goal so your trainer can plan the right workouts for you.'}
        </p>
      </div>
      <Button onClick={() => setIsFormOpen(true)}>{data.latest ? 'Update now' : 'Add my details'}</Button>
      <BodyForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} latest={data.latest} onSaved={reload} />
    </div>
  );
}

export default BodyReminder;

import { useState } from 'react';
import { Clock, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { createPartnerGym, deletePartnerGym, listPartnerGyms, updatePartnerGym } from '../api/partnerGyms.js';
import { useApiData } from '../hooks/useApiData.js';
import PartnerGymForm from '../components/map/PartnerGymForm.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { useToast } from '../components/ui/useToast.js';
import { WEEKDAY_NAMES } from '../utils/openingHours.js';

// "Mon–Fri 06:00–23:00 · Sat 08:00–22:00": the week in one short line.
function hoursSummary(hours) {
  if (hours.length === 0) return 'No opening hours';
  const groups = [];
  for (const row of hours) {
    const last = groups.at(-1);
    if (last && last.open === row.open && last.close === row.close && last.to === row.day - 1) {
      last.to = row.day;
    } else {
      groups.push({ from: row.day, to: row.day, open: row.open, close: row.close });
    }
  }
  const name = (day) => WEEKDAY_NAMES[day].slice(0, 3);
  return groups.map((g) => `${name(g.from)}${g.to !== g.from ? `–${name(g.to)}` : ''} ${g.open}–${g.close}`).join(' · ');
}

// Admin page: the partner gyms shown on the home page map.
function LocationsPage() {
  const showToast = useToast();
  const { data, error, reload } = useApiData(listPartnerGyms);
  const [editing, setEditing] = useState(null); // null = closed, 'new', or the gym being edited
  const [deleteError, setDeleteError] = useState('');

  async function handleSubmit(values) {
    if (editing === 'new') {
      await createPartnerGym(values);
      showToast('Partner gym added');
    } else {
      await updatePartnerGym(editing.id, values);
      showToast('Partner gym saved');
    }
    setEditing(null);
    reload();
  }

  async function handleDelete(gym) {
    if (!window.confirm(`Remove ${gym.name} from the map?`)) return;
    setDeleteError('');
    try {
      await deletePartnerGym(gym.id);
      showToast('Partner gym removed');
      reload();
    } catch (err) {
      setDeleteError(err.message);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Locations"
        description="Partner gyms on the home page map. Members see where they are and when they are open."
        actions={
          <Button icon={Plus} onClick={() => setEditing('new')}>
            Add partner gym
          </Button>
        }
      />

      <ErrorMessage>{error || deleteError}</ErrorMessage>

      <Card padded={false}>
        {!data && !error && <div className="m-5 h-32 animate-pulse rounded-xl bg-surface-3" />}
        {data?.gyms.length === 0 && <EmptyState icon={MapPin} title="No partner gyms yet" description="Add the first one with “Add partner gym”." />}
        <ul className="divide-y divide-line-soft">
          {data?.gyms.map((gym) => (
            <li key={gym.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                <MapPin className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{gym.name}</p>
                <p className="text-sm text-muted">
                  {gym.address}, {gym.district}
                  {gym.phone && ` · ${gym.phone}`}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-faint">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {hoursSummary(gym.hours)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditing(gym)}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDelete(gym)}>
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Modal isOpen={editing !== null} title={editing === 'new' ? 'Add partner gym' : 'Edit partner gym'} onClose={() => setEditing(null)}>
        {editing !== null && (
          <PartnerGymForm
            key={editing === 'new' ? 'new' : editing.id}
            initialGym={editing === 'new' ? null : editing}
            submitLabel={editing === 'new' ? 'Add gym' : 'Save changes'}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}

export default LocationsPage;

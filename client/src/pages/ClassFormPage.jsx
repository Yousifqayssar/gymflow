import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { createClass, getClass, updateClass } from '../api/classes.js';
import { listUsers } from '../api/users.js';
import { useAuth } from '../auth/useAuth.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { useToast } from '../components/ui/useToast.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import FormField from '../components/FormField.jsx';
import SelectField from '../components/SelectField.jsx';
import TextAreaField from '../components/TextAreaField.jsx';
import CategoryPicker from '../components/classes/CategoryPicker.jsx';
import ClassCard from '../components/classes/ClassCard.jsx';
import { toFieldErrors } from '../utils/fieldErrors.js';
import {
  fromGymDateTime,
  INTENSITY_DISPLAY,
  LEVEL_LABELS,
  previewClassFromForm,
  toGymDateTime,
} from '../utils/classDisplay.js';

const EMPTY_FORM = {
  category: '',
  title: '',
  description: '',
  location: '',
  date: '',
  time: '',
  durationMinutes: '60',
  capacity: '12',
  level: 'ALL_LEVELS',
  intensity: 'MEDIUM',
  whatToBring: '',
  healthNotes: '',
  trainerId: '',
};

// Turns a class from the API into form values (everything as text, like inputs need).
function formFromClass(gymClass) {
  return {
    ...EMPTY_FORM,
    ...fromGymDateTime(gymClass.startsAt),
    category: gymClass.category,
    title: gymClass.title,
    description: gymClass.description,
    location: gymClass.location,
    durationMinutes: String(gymClass.durationMinutes),
    capacity: String(gymClass.capacity),
    level: gymClass.level,
    intensity: gymClass.intensity,
    whatToBring: gymClass.whatToBring,
    healthNotes: gymClass.healthNotes,
    trainerId: String(gymClass.trainer.id),
  };
}

// Create a new class (/classes/new) or edit one (/classes/:id/edit). Admins and trainers.
function ClassFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const isAdmin = user.role === 'ADMIN';
  const navigate = useNavigate();
  const showToast = useToast();

  const [form, setForm] = useState(EMPTY_FORM);
  const [trainers, setTrainers] = useState([]);
  const [isLoading, setIsLoading] = useState(isEdit || isAdmin);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load the class to edit and, for admins, the list of trainers to choose from.
  useEffect(() => {
    if (!isEdit && !isAdmin) return;

    let ignore = false;
    Promise.all([isEdit ? getClass(id) : null, isAdmin ? listUsers({ role: 'TRAINER' }) : null])
      .then(([classData, trainerData]) => {
        if (ignore) return;
        if (classData) setForm(formFromClass(classData.class));
        if (trainerData) setTrainers(trainerData.users);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!ignore) setLoadError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, [id, isEdit, isAdmin]);

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  const handleChange = (event) => setField(event.target.name, event.target.value);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    setIsSubmitting(true);

    const payload = {
      category: form.category,
      title: form.title,
      description: form.description,
      location: form.location,
      startsAt: toGymDateTime(form.date, form.time),
      durationMinutes: Number(form.durationMinutes),
      capacity: Number(form.capacity),
      level: form.level,
      intensity: form.intensity,
      whatToBring: form.whatToBring,
      healthNotes: form.healthNotes,
      ...(isAdmin && form.trainerId ? { trainerId: Number(form.trainerId) } : {}),
    };

    try {
      const data = isEdit ? await updateClass(id, payload) : await createClass(payload);
      showToast(isEdit ? 'Class updated' : 'Class created');
      navigate(`/classes/${data.class.id}`);
    } catch (err) {
      const errors = toFieldErrors(err.details);
      // The API reports the start time as "startsAt"; in the form it belongs to the date field.
      if (errors.startsAt) errors.date = errors.startsAt;
      setError(err.message);
      setFieldErrors(errors);
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (loadError) return <ErrorMessage>{loadError}</ErrorMessage>;
  if (isLoading) return <div className="h-96 animate-pulse rounded-2xl bg-surface-4" />;

  const chosenTrainer = isAdmin ? trainers.find((t) => String(t.id) === form.trainerId) : user;
  const preview = previewClassFromForm(form, chosenTrainer);

  return (
    <div>
      <Link
        to={isEdit ? `/classes/${id}` : '/classes'}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-3 hover:text-ink"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Back
      </Link>
      <PageHeader
        title={isEdit ? 'Edit class' : 'New class'}
        description="Give members all the information they need to decide whether to book."
      />

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ErrorMessage>{error}</ErrorMessage>

          <Card title="Basics">
            <div className="space-y-5">
              <CategoryPicker value={form.category} onChange={(value) => setField('category', value)} error={fieldErrors.category} />
              <FormField label="Title" name="title" required placeholder="e.g. Running Club" value={form.title} onChange={handleChange} error={fieldErrors.title} />
              <TextAreaField
                label="Description"
                name="description"
                rows={5}
                required
                maxLength={2000}
                placeholder="What happens in the class? Route, exercises, pace, how it ends…"
                hint="At least 20 characters. Write it for someone who has never done this class."
                value={form.description}
                onChange={handleChange}
                error={fieldErrors.description}
              />
            </div>
          </Card>

          <Card title="When & where">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Date" name="date" type="date" required value={form.date} onChange={handleChange} error={fieldErrors.date} />
              <FormField label="Start time (gym time)" name="time" type="time" required value={form.time} onChange={handleChange} />
              <FormField
                label="Duration (minutes)"
                name="durationMinutes"
                type="number"
                min={15}
                max={300}
                step={5}
                required
                value={form.durationMinutes}
                onChange={handleChange}
                error={fieldErrors.durationMinutes}
              />
              <FormField
                label="Meeting point"
                name="location"
                required
                placeholder="e.g. Bebek Park, main entrance"
                value={form.location}
                onChange={handleChange}
                error={fieldErrors.location}
              />
            </div>
          </Card>

          <Card title="Group">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Capacity (spots)"
                name="capacity"
                type="number"
                min={1}
                max={200}
                required
                value={form.capacity}
                onChange={handleChange}
                error={fieldErrors.capacity}
              />
              <SelectField
                label="Level"
                name="level"
                options={Object.entries(LEVEL_LABELS)}
                value={form.level}
                onChange={handleChange}
                error={fieldErrors.level}
              />
              {isAdmin && (
                <SelectField
                  label="Trainer"
                  name="trainerId"
                  required
                  placeholder="Choose a trainer…"
                  options={trainers.map((t) => [String(t.id), `${t.firstName} ${t.lastName}`])}
                  value={form.trainerId}
                  onChange={handleChange}
                  error={fieldErrors.trainerId}
                />
              )}
              <fieldset className="sm:col-span-2">
                <legend className="mb-1.5 text-sm font-medium text-ink-2">Intensity</legend>
                <div className="grid grid-cols-3 gap-2" role="radiogroup">
                  {Object.entries(INTENSITY_DISPLAY).map(([value, { label, dots }]) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={form.intensity === value}
                      onClick={() => setField('intensity', value)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium ${
                        form.intensity === value
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-800 dark:text-brand-300 ring-2 ring-brand-100 dark:ring-brand-500/25'
                          : 'border-line-strong bg-surface text-ink-2 hover:bg-surface-2'
                      }`}
                    >
                      <span className="flex gap-1" aria-hidden="true">
                        {[1, 2, 3].map((n) => (
                          <span key={n} className={`size-2 rounded-full ${n <= dots ? 'bg-brand-500' : 'bg-surface-4'}`} />
                        ))}
                      </span>
                      {label.replace(' intensity', '')}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          </Card>

          <Card title="Good to know">
            <div className="space-y-5">
              <TextAreaField
                label="What to bring"
                name="whatToBring"
                maxLength={300}
                placeholder="e.g. Running shoes, water bottle"
                value={form.whatToBring}
                onChange={handleChange}
                error={fieldErrors.whatToBring}
              />
              <TextAreaField
                label="Health notes"
                name="healthNotes"
                maxLength={500}
                placeholder="Who should be careful or not join? e.g. Not suitable with knee injuries."
                hint="Shown highlighted on the class page."
                value={form.healthNotes}
                onChange={handleChange}
                error={fieldErrors.healthNotes}
              />
            </div>
          </Card>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting} className="px-6">
              {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create class'}
            </Button>
            <Button as={Link} to={isEdit ? `/classes/${id}` : '/classes'} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>

        {/* Live preview: how the class will look in the schedule */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-2 text-sm font-medium text-muted">Preview</p>
          {/* inert: the preview cannot be clicked or reached with the keyboard */}
          <div inert>
            <ClassCard gymClass={preview} />
          </div>
        </aside>
      </form>
    </div>
  );
}

export default ClassFormPage;

import { listClasses } from '../../api/classes.js';
import { useApiData } from '../../hooks/useApiData.js';
import Avatar from '../ui/Avatar.jsx';
import { Stagger, StaggerItem, TiltCard } from '../ui/motion.jsx';
import { CATEGORY_DISPLAY } from '../../utils/classDisplay.js';

// The trainers and what they teach, taken from the class schedule (every user may read it).
function trainersFromClasses(classes) {
  const trainers = new Map();
  for (const gymClass of classes) {
    if (gymClass.isCancelled) continue;
    const { id, firstName, lastName, avatar } = gymClass.trainer;
    if (!trainers.has(id)) trainers.set(id, { id, firstName, lastName, avatar, categories: new Set(), classCount: 0 });
    const trainer = trainers.get(id);
    trainer.categories.add(gymClass.category);
    trainer.classCount += 1;
  }
  return [...trainers.values()];
}

// "Meet our trainers": a card per trainer with the photo of their main class type.
function TrainersSection() {
  const { data } = useApiData(listClasses);
  const trainers = data ? trainersFromClasses(data.classes) : null;

  if (trainers?.length === 0) return null;

  return (
    <section aria-labelledby="trainers-heading" className="mt-14">
      <p className="text-sm font-semibold tracking-wide text-brand-700 uppercase dark:text-brand-300">Our team</p>
      <h2 id="trainers-heading" className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
        Meet our trainers
      </h2>

      {!trainers && <div className="mt-6 h-56 animate-pulse rounded-2xl bg-surface-3" />}

      <Stagger className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {trainers?.map((trainer) => {
          const categories = [...trainer.categories];
          return (
            <StaggerItem key={trainer.id}>
              <TiltCard className="h-full">
                <article className="h-full overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
                  <div className="relative h-28">
                    <img src={CATEGORY_DISPLAY[categories[0]].photo} alt="" className="size-full object-cover" />
                    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  <div className="px-5 pb-5">
                    <span className="relative -mt-8 inline-block rounded-full bg-surface p-1 shadow-md">
                      <Avatar firstName={trainer.firstName} lastName={trainer.lastName} avatar={trainer.avatar} size="lg" />
                    </span>
                    <h3 className="mt-2 text-lg font-semibold text-ink">
                      {trainer.firstName} {trainer.lastName}
                    </h3>
                    <p className="text-sm text-muted">
                      {trainer.classCount} {trainer.classCount === 1 ? 'class' : 'classes'} in the next two weeks
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {categories.map((category) => {
                        const { icon: Icon, label, soft } = CATEGORY_DISPLAY[category];
                        return (
                          <span key={category} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${soft}`}>
                            <Icon className="size-3.5" aria-hidden="true" />
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </article>
              </TiltCard>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}

export default TrainersSection;

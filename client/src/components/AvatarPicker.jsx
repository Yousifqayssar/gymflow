import { useState } from 'react';
import { Check } from 'lucide-react';
import { m } from 'motion/react';
import { updateMyAvatar } from '../api/account.js';
import { useAuth } from '../auth/useAuth.js';
import { BADGE_AVATARS, CHARACTER_GROUPS } from '../utils/avatars.js';
import Avatar from './ui/Avatar.jsx';
import Button from './ui/Button.jsx';
import Modal from './ui/Modal.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import { useToast } from './ui/useToast.js';

const SECTIONS = [
  ...CHARACTER_GROUPS.map((group) => ({ title: `${group.label} characters`, ids: group.avatars.map((a) => a.id) })),
  { title: 'Sport badges', ids: BADGE_AVATARS.map((a) => a.id) },
];

// One choice in the grid: the avatar with a green ring and a tick when selected.
function Choice({ user, avatar, label, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={label}
      title={label}
      className={`relative rounded-full p-1 transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
        isSelected ? 'ring-[3px] ring-brand-500' : 'ring-1 ring-line hover:ring-line-strong'
      }`}
    >
      <Avatar firstName={user.firstName} lastName={user.lastName} avatar={avatar} size="lg" />
      {isSelected && (
        <m.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          className="absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full bg-brand-600 text-white ring-2 ring-surface"
        >
          <Check className="size-3" strokeWidth={3} aria-hidden="true" />
        </m.span>
      )}
    </button>
  );
}

// "Choose your avatar": every user (member, trainer, admin) can pick a character, a sport badge
// or their initials. The choice is saved on the server, so it shows everywhere and on every device.
function AvatarPicker({ isOpen, onClose }) {
  const { user, updateCurrentUser } = useAuth();
  const showToast = useToast();
  const [selected, setSelected] = useState(user.avatar ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  function handleClose() {
    setSelected(user.avatar ?? null); // forget unsaved choices
    setError('');
    onClose();
  }

  async function handleSave() {
    setIsSaving(true);
    setError('');
    try {
      const { user: updated } = await updateMyAvatar(selected);
      updateCurrentUser(updated);
      showToast('Your avatar is updated');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} title="Choose your avatar" onClose={handleClose}>
      <div className="space-y-6">
        {/* Big preview of the current choice */}
        <div className="flex items-center gap-4 rounded-2xl bg-surface-2 p-4">
          <m.span key={selected ?? 'initials'} initial={{ scale: 0.8, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
            <Avatar firstName={user.firstName} lastName={user.lastName} avatar={selected} size="xl" />
          </m.span>
          <div>
            <p className="font-semibold text-ink">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-muted">Everyone at the gym sees this picture next to your name.</p>
          </div>
        </div>

        <section>
          <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">Simple</h3>
          <Choice user={user} avatar={null} label="My initials" isSelected={selected === null} onSelect={() => setSelected(null)} />
        </section>

        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">{section.title}</h3>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {section.ids.map((id, index) => (
                <Choice
                  key={id}
                  user={user}
                  avatar={id}
                  label={`${section.title} ${index + 1}`}
                  isSelected={selected === id}
                  onSelect={() => setSelected(id)}
                />
              ))}
            </div>
          </section>
        ))}

        <ErrorMessage>{error}</ErrorMessage>

        <div className="sticky bottom-0 -mx-6 -mb-6 flex justify-end gap-2 border-t border-line bg-surface px-6 py-4">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || selected === (user.avatar ?? null)}>
            {isSaving ? 'Saving…' : 'Save avatar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default AvatarPicker;

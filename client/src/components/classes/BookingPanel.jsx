import { useState } from 'react';
import { CalendarCheck, CircleCheck, Clock } from 'lucide-react';
import { bookClass, cancelBooking } from '../../api/classes.js';
import Button from '../ui/Button.jsx';
import ErrorMessage from '../ErrorMessage.jsx';
import Modal from '../ui/Modal.jsx';
import { useToast } from '../ui/useToast.js';

// What the member can do with this class right now. The server checks every rule again;
// this only decides which button to show.
function bookingState(gymClass) {
  if (gymClass.isCancelled) return 'CANCELLED';
  if (gymClass.hasStarted) return 'STARTED';
  if (gymClass.isBookedByMe) return 'BOOKED';
  if (gymClass.spotsLeft === 0) return 'FULL';
  return 'OPEN';
}

// Book / cancel booking for members. `variant="card"` for desktop, `variant="bar"` for the
// bar fixed to the bottom of the screen on phones. `onChange` receives the updated class.
function BookingPanel({ gymClass, onChange, variant = 'card' }) {
  const showToast = useToast();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const state = bookingState(gymClass);
  if (state === 'CANCELLED') return null; // the page already shows a "cancelled" banner

  async function run(action, successMessage) {
    setIsBusy(true);
    setError('');
    try {
      const data = await action(gymClass.id);
      onChange(data.class);
      showToast(successMessage);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsBusy(false);
    }
  }

  const handleBook = () => run(bookClass, `You're booked for ${gymClass.title}!`);
  const handleCancel = async () => {
    setIsConfirmOpen(false);
    await run(cancelBooking, 'Your booking was cancelled');
  };

  const spotsText = state === 'FULL' ? 'No spots left' : `${gymClass.spotsLeft} of ${gymClass.capacity} spots left`;

  const content = (
    <>
      {state === 'BOOKED' && (
        <p className="flex items-center gap-2 font-semibold text-brand-700 dark:text-brand-300">
          <CircleCheck className="size-5" aria-hidden="true" />
          You're booked
        </p>
      )}
      {state === 'STARTED' && (
        <p className="flex items-center gap-2 text-sm font-medium text-muted">
          <Clock className="size-4" aria-hidden="true" />
          This class has already started
        </p>
      )}
      {(state === 'OPEN' || state === 'FULL') && <p className="text-sm text-muted">{spotsText}</p>}

      {state === 'OPEN' && (
        <Button icon={CalendarCheck} onClick={handleBook} disabled={isBusy} className="w-full py-3 text-base">
          {isBusy ? 'Booking…' : 'Book this class'}
        </Button>
      )}
      {state === 'FULL' && (
        <Button disabled variant="secondary" className="w-full py-3">
          Class is full
        </Button>
      )}
      {state === 'BOOKED' && (
        <Button variant="danger" onClick={() => setIsConfirmOpen(true)} disabled={isBusy} className="w-full">
          {isBusy ? 'Cancelling…' : 'Cancel booking'}
        </Button>
      )}
    </>
  );

  return (
    <>
      {variant === 'card' ? (
        <section className="space-y-3 rounded-2xl border border-line bg-surface p-5 shadow-sm">
          {content}
          <ErrorMessage>{error}</ErrorMessage>
        </section>
      ) : (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur">
          <div className="mx-auto max-w-md space-y-2">
            <ErrorMessage>{error}</ErrorMessage>
            {content}
          </div>
        </div>
      )}

      <Modal isOpen={isConfirmOpen} title="Cancel your booking?" onClose={() => setIsConfirmOpen(false)}>
        <p className="text-ink-3">
          Your spot in <strong>{gymClass.title}</strong> will be given to someone else. You can book again later if
          spots are still free.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setIsConfirmOpen(false)}>
            Keep my spot
          </Button>
          <Button variant="danger" onClick={handleCancel}>
            Yes, cancel
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default BookingPanel;

import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { CalendarCheck, CircleAlert, CircleCheck, Clock, CreditCard, Crown, Flag, QrCode } from 'lucide-react';
import { bookAndPay, bookClass, cancelBooking } from '../../api/classes.js';
import Button from '../ui/Button.jsx';
import ErrorMessage from '../ErrorMessage.jsx';
import Modal from '../ui/Modal.jsx';
import CardCheckout from '../payments/CardCheckout.jsx';
import { useToast } from '../ui/useToast.js';
import { formatDate, formatPrice } from '../../utils/format.js';
import { formatTime } from '../../utils/classDisplay.js';

// What the member can do with this class right now. The server checks every rule again;
// this only decides which button to show.
// `now` decides whether class check-in (scanning the trainer's QR) is open.
// `quote` (GET /api/classes/:id/booking-quote): free with the membership, or a price to pay
// (Basic members: the class price; Premium members with no classes left that month: with a discount).
function bookingState(gymClass, now, quote) {
  if (gymClass.isCancelled) return 'CANCELLED';
  if (gymClass.myAttendance === 'ATTENDED') return 'ATTENDED';
  if (gymClass.myAttendance === 'MISSED') return 'MISSED';
  const hasEnded = now > Date.parse(gymClass.endsAt);
  if (gymClass.isBookedByMe && !hasEnded && now >= Date.parse(gymClass.attendanceOpensAt)) return 'CHECK_IN';
  if (hasEnded) return 'ENDED';
  if (gymClass.hasStarted) return 'STARTED';
  if (gymClass.isBookedByMe) return 'BOOKED';
  if (gymClass.spotsLeft === 0) return 'FULL';
  if (quote?.mustPay) return 'PAY';
  return 'OPEN';
}

// Book / cancel booking for members. `variant="card"` for desktop, `variant="bar"` for the
// bar fixed to the bottom of the screen on phones. `onChange` receives the updated class.
//   quote: what booking this class costs the member, loaded by the class page.
function BookingPanel({ gymClass, quote, onChange, variant = 'card' }) {
  const showToast = useToast();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Check the clock every 15 seconds, so "Scan the trainer's QR" appears when check-in opens.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15 * 1000);
    return () => clearInterval(id);
  }, []);

  const state = bookingState(gymClass, now, quote);
  if (state === 'CANCELLED') return null; // the page already shows a "cancelled" banner

  async function run(action, successMessage) {
    setIsBusy(true);
    setError('');
    try {
      const data = await action(gymClass.id);
      onChange(data.class);
      showToast(successMessage(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsBusy(false);
    }
  }

  const handleBook = () => run(bookClass, () => `You're booked for ${gymClass.title}!`);
  const handleCancel = async () => {
    setIsConfirmOpen(false);
    await run(cancelBooking, (data) => (data.refunded ? `Booking cancelled – ${formatPrice(data.refunded)} refunded to your card` : 'Your booking was cancelled'));
  };
  function handlePaid(data) {
    setIsPayOpen(false);
    onChange(data.class);
    showToast(`Paid ${formatPrice(data.payment.amount)} – you're booked for ${gymClass.title}!`);
  }

  const spotsText = state === 'FULL' ? 'No spots left' : `${gymClass.spotsLeft} of ${gymClass.capacity} spots left`;
  const hasDiscount = quote?.discountPercent > 0;
  const isBar = variant === 'bar'; // the phone bar is kept short: only the essentials

  const content = (
    <>
      {state === 'BOOKED' && (
        <p className="flex flex-wrap items-center gap-x-2 font-semibold text-brand-700 dark:text-brand-300">
          <CircleCheck className="size-5" aria-hidden="true" />
          You're booked
          {gymClass.isMyBookingPaid && <span className="text-sm font-normal text-muted">· paid by card</span>}
        </p>
      )}
      {state === 'ATTENDED' && (
        <p className="flex items-center gap-2 font-semibold text-brand-700 dark:text-brand-300">
          <CircleCheck className="size-5" aria-hidden="true" />
          You attended this class
        </p>
      )}
      {state === 'MISSED' && (
        <div className="text-red-700 dark:text-red-300">
          <p className="flex items-center gap-2 font-semibold">
            <CircleAlert className="size-5" aria-hidden="true" />
            You missed this class · −10 points
          </p>
          <p className="mt-1 text-sm">You booked a spot but did not scan the trainer’s QR code.</p>
        </div>
      )}
      {state === 'CHECK_IN' && (
        <>
          <p className="flex items-center gap-2 font-semibold text-brand-700 dark:text-brand-300">
            <QrCode className="size-5" aria-hidden="true" />
            Check-in is open
          </p>
          <Button as={Link} to={`/attend/${gymClass.id}`} icon={QrCode} className="w-full py-3 text-base">
            Scan the trainer’s QR
          </Button>
        </>
      )}
      {state === 'ENDED' && (
        <p className="flex items-center gap-2 text-sm font-medium text-muted">
          <Flag className="size-4" aria-hidden="true" />
          This class has ended
        </p>
      )}
      {state === 'STARTED' && (
        <p className="flex items-center gap-2 text-sm font-medium text-muted">
          <Clock className="size-4" aria-hidden="true" />
          This class has already started
        </p>
      )}
      {(state === 'OPEN' || state === 'FULL' || (state === 'PAY' && !isBar)) && <p className="text-sm text-muted">{spotsText}</p>}

      {/* Pay per class: Basic members, or Premium members who used this month's classes */}
      {state === 'PAY' && isBar && (
        <div className="flex items-center gap-3">
          <p className="min-w-0 flex-1 text-sm leading-tight text-ink-3">
            {quote.reason === 'BASIC_PLAN' ? 'Pay per class' : `Premium −${quote.discountPercent}%`}
            <span className="block font-display text-2xl font-bold text-ink">{formatPrice(quote.price)}</span>
          </p>
          <Button icon={CreditCard} onClick={() => setIsPayOpen(true)} className="py-3 text-base">
            Book &amp; pay
          </Button>
        </div>
      )}
      {state === 'PAY' && !isBar && (
        <>
          <p className="text-sm text-ink-3">
            {quote.reason === 'BASIC_PLAN' ? (
              <>
                <strong className="text-ink">Pay for this class</strong> – your Basic plan is gym only.
              </>
            ) : (
              <>
                <strong className="text-ink">You have used this month’s classes.</strong> Book this one with your {quote.discountPercent}% Premium discount
                {quote.resetsOn && <> – or wait for new classes on {formatDate(quote.resetsOn)}</>}.
              </>
            )}
          </p>
          <p className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-ink">{formatPrice(quote.price)}</span>
            {hasDiscount && <span className="text-sm text-faint line-through">{formatPrice(quote.listPrice)}</span>}
          </p>
          <Button icon={CreditCard} onClick={() => setIsPayOpen(true)} className="w-full py-3 text-base">
            Book &amp; pay {formatPrice(quote.price)}
          </Button>
          {quote.reason === 'BASIC_PLAN' && (
            <Link to="/membership" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline dark:text-brand-300">
              <Crown className="size-4" aria-hidden="true" />
              Or go Premium – 10 classes every month
            </Link>
          )}
        </>
      )}

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
      {(state === 'BOOKED' || state === 'OPEN' || (state === 'PAY' && !isBar)) && (
        <p className="flex gap-2 text-xs text-muted">
          <QrCode className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {state === 'BOOKED' ? 'Scan the trainer’s QR at the class' : 'Booked members scan the trainer’s QR at the class'} – or lose 10 points.
        </p>
      )}
      {(state === 'BOOKED' || (state === 'CHECK_IN' && !gymClass.hasStarted)) && (
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
        // Sits right on top of the bottom tab bar (4rem high, plus the phone's safe area).
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-line bg-surface/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur">
          <div className="mx-auto max-w-md space-y-2">
            <ErrorMessage>{error}</ErrorMessage>
            {content}
          </div>
        </div>
      )}

      <Modal isOpen={isConfirmOpen} title="Cancel your booking?" onClose={() => setIsConfirmOpen(false)}>
        <p className="text-ink-3">
          Your spot in <strong>{gymClass.title}</strong> will be given to someone else.
          {gymClass.isMyBookingPaid ? ' You paid for this class, so the money goes back to your card.' : ' You can book again later if spots are still free.'}
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

      {quote?.mustPay && (
        <Modal isOpen={isPayOpen} title={`Book & pay: ${gymClass.title}`} onClose={() => setIsPayOpen(false)}>
          <CardCheckout
            stacked
            summary={{
              title: `${gymClass.title} class`,
              subtitle: `${formatDate(gymClass.startsAt)} · ${formatTime(gymClass.startsAt)} – ${formatTime(gymClass.endsAt)}`,
              listPrice: quote.listPrice,
              discountLabel: `Premium discount (−${quote.discountPercent}%)`,
              price: quote.price,
            }}
            pay={(payment) => bookAndPay(gymClass.id, payment)}
            onPaid={handlePaid}
          />
        </Modal>
      )}
    </>
  );
}

export default BookingPanel;

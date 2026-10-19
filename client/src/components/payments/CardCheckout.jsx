import { useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { ArrowLeft, Lock, ShieldCheck, XCircle } from 'lucide-react';
import { useAuth } from '../../auth/useAuth.js';
import CardPreview from './CardPreview.jsx';
import FormField from '../FormField.jsx';
import Button from '../ui/Button.jsx';
import { toFieldErrors } from '../../utils/fieldErrors.js';
import { checkCard, digitsOnly, formatCardNumber, formatExpiry, SERVER_FIELDS, TEST_CARDS } from '../../utils/cards.js';
import { formatPrice } from '../../utils/format.js';

// The "processing" animation is shown at least this long, so the member sees that something happened.
const MIN_PROCESSING_MS = 1200;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const EMPTY_CARD = { holderName: '', number: '', expiry: '', cvc: '' };

// Paying by card (test gateway), used for memberships and for single classes.
//   summary: { title, subtitle, listPrice, discountLabel, price } – what is bought and what it costs
//   pay({ checkoutId, card }): sends the payment to the server and returns its answer (may throw an ApiError)
//   onPaid(answer): called after a successful payment
//   onBack / backLabel: optional link back, e.g. "Choose another plan"
//   stacked: card picture above the form (for the narrow pop-up) instead of side by side
function CardCheckout({ summary, pay, onPaid, onBack, backLabel, stacked = false }) {
  const { user } = useAuth();
  const [card, setCard] = useState(EMPTY_CARD);
  const [errors, setErrors] = useState({});
  const [declined, setDeclined] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // One id per payment attempt: if "Pay" is sent twice, the server charges only once.
  const [checkoutId, setCheckoutId] = useState(() => crypto.randomUUID());

  const discount = Number(summary.listPrice) - Number(summary.price);

  function update(field, value) {
    setCard((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setDeclined('');
  }

  function fillTestCard(number) {
    setCard({ holderName: `${user.firstName} ${user.lastName}`, number, expiry: '12/28', cvc: '123' });
    setErrors({});
    setDeclined('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = checkCard(card);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const [month, year] = card.expiry.split('/');
    setIsProcessing(true);
    setIsFlipped(false);
    const [result] = await Promise.allSettled([
      pay({
        checkoutId,
        card: { holderName: card.holderName, number: digitsOnly(card.number), expMonth: Number(month), expYear: Number(year), cvc: card.cvc },
      }),
      wait(MIN_PROCESSING_MS),
    ]);
    setIsProcessing(false);

    if (result.status === 'fulfilled') {
      onPaid(result.value);
      return;
    }
    const error = result.reason;
    // Every new try is a new payment attempt.
    setCheckoutId(crypto.randomUUID());
    if (error.code === 'CARD_DECLINED') {
      setDeclined(error.message);
    } else if (error.details?.length) {
      const fieldErrors = {};
      for (const [field, message] of Object.entries(toFieldErrors(error.details))) fieldErrors[SERVER_FIELDS[field] ?? field] = message;
      setErrors(fieldErrors);
    } else {
      setDeclined(error.message);
    }
  }

  return (
    <div className={stacked ? 'space-y-5' : 'grid gap-8 lg:grid-cols-2 lg:items-start'}>
      {/* ---------- Card and test cards ---------- */}
      <div className={stacked ? 'space-y-4' : 'space-y-6 lg:sticky lg:top-24'}>
        <CardPreview {...card} flipped={isFlipped} processing={isProcessing} />

        <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-500/40 dark:bg-amber-500/10">
          <p className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Test mode – no real money is taken
          </p>
          <p className="mt-1 text-amber-800 dark:text-amber-300">Tap a test card to fill in the form:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TEST_CARDS.map((test) => (
              <button
                key={test.number}
                type="button"
                onClick={() => fillTestCard(test.number)}
                className="min-h-10 rounded-lg border border-amber-300 bg-surface px-3 text-left text-xs text-ink-2 transition hover:border-amber-500 dark:border-amber-500/40"
              >
                <span className="block font-mono">•••• {test.number.slice(-4)}</span>
                <span className="text-muted">{test.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Form and summary ---------- */}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AnimatePresence>
          {declined && (
            <m.p
              role="alert"
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: [0, -8, 8, -5, 5, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
            >
              <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                <strong className="block">Payment failed</strong>
                {declined} Nothing was charged.
              </span>
            </m.p>
          )}
        </AnimatePresence>

        <FormField
          label="Name on card"
          name="holderName"
          autoComplete="cc-name"
          value={card.holderName}
          onChange={(e) => update('holderName', e.target.value)}
          error={errors.holderName}
        />
        <FormField
          label="Card number"
          name="number"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="1234 5678 9012 3456"
          value={card.number}
          onChange={(e) => update('number', formatCardNumber(e.target.value))}
          error={errors.number}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Expiry date"
            name="expiry"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            value={card.expiry}
            onChange={(e) => update('expiry', formatExpiry(e.target.value))}
            error={errors.expiry}
          />
          <FormField
            label="Security code (CVC)"
            name="cvc"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            maxLength={3}
            value={card.cvc}
            onChange={(e) => update('cvc', digitsOnly(e.target.value).slice(0, 3))}
            onFocus={() => setIsFlipped(true)}
            onBlur={() => setIsFlipped(false)}
            error={errors.cvc}
          />
        </div>

        {/* ---------- Summary ---------- */}
        <div className="rounded-2xl border border-line bg-surface-2 p-4 text-sm">
          <div className="flex justify-between gap-4">
            <span className="font-semibold text-ink">{summary.title}</span>
            <span className="text-ink-2">{formatPrice(summary.listPrice)}</span>
          </div>
          {summary.subtitle && <p className="mt-0.5 text-muted">{summary.subtitle}</p>}
          {discount > 0 && (
            <div className="mt-2 flex justify-between gap-4 text-brand-700 dark:text-brand-300">
              <span>{summary.discountLabel}</span>
              <span>−{formatPrice(discount)}</span>
            </div>
          )}
          <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-line pt-3">
            <span className="font-semibold text-ink">Total</span>
            <span className="font-display text-3xl font-bold text-ink">{formatPrice(summary.price)}</span>
          </div>
        </div>

        <Button type="submit" icon={Lock} disabled={isProcessing} className="w-full py-3 text-base">
          {isProcessing ? 'Processing payment…' : `Pay ${formatPrice(summary.price)}`}
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {onBack && (
            <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack} disabled={isProcessing}>
              {backLabel}
            </Button>
          )}
          <p className="text-xs text-muted">Your full card number is never saved.</p>
        </div>
      </form>
    </div>
  );
}

export default CardCheckout;

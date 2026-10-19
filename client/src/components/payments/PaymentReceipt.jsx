import { m } from 'motion/react';
import { Printer } from 'lucide-react';
import CardBrandLogo from './CardBrandLogo.jsx';
import Button from '../ui/Button.jsx';
import { formatDate, formatPrice } from '../../utils/format.js';

// Shown right after a successful payment: an animated tick and the receipt.
function PaymentReceipt({ payment, onDone }) {
  const rows = [
    { label: 'Receipt', value: <span className="font-mono">{payment.reference}</span> },
    { label: 'Plan', value: payment.plan.name },
    { label: 'Valid', value: `${formatDate(payment.membership.startDate)} – ${formatDate(payment.membership.endDate)}` },
    {
      label: 'Paid with',
      value: (
        <span className="inline-flex items-center gap-2">
          <CardBrandLogo brand={payment.card.brand} className="text-xs" />
          •••• {payment.card.last4}
        </span>
      ),
    },
    { label: 'Date', value: formatDate(payment.createdAt) },
  ];
  if (payment.discountPercent > 0) rows.splice(2, 0, { label: 'Loyalty discount', value: `${payment.discountPercent}%` });

  return (
    <m.section
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 140, damping: 18 }}
      className="mx-auto max-w-md rounded-3xl border border-line bg-surface p-6 text-center shadow-xl sm:p-8"
      aria-labelledby="receipt-title"
    >
      <m.div
        className="mx-auto flex size-20 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/15"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 12, delay: 0.1 }}
      >
        <svg viewBox="0 0 24 24" className="size-10 text-brand-600 dark:text-brand-300" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <m.path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.35 }} />
        </svg>
      </m.div>
      <h2 id="receipt-title" className="mt-4 font-display text-3xl font-bold text-ink">
        Payment successful
      </h2>
      <p className="mt-1 text-muted">Your membership is ready. See you at the gym!</p>
      <p className="mt-4 font-display text-5xl font-bold text-ink">{formatPrice(payment.amount)}</p>

      <dl className="mt-6 divide-y divide-line-soft rounded-2xl border border-line text-left text-sm">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-4 px-4 py-2.5">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap justify-center gap-2 print:hidden">
        <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
          Print receipt
        </Button>
        <Button onClick={onDone}>Done</Button>
      </div>
    </m.section>
  );
}

export default PaymentReceipt;

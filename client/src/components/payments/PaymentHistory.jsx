import { Banknote, CheckCircle2, ReceiptText, XCircle } from 'lucide-react';
import CardBrandLogo from './CardBrandLogo.jsx';
import Card from '../ui/Card.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Avatar from '../ui/Avatar.jsx';
import { formatDate, formatPrice } from '../../utils/format.js';

// "Visa •••• 4242" or "Paid at the front desk"
function PaidWith({ payment }) {
  if (payment.method === 'DESK') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Banknote className="size-4 text-faint" aria-hidden="true" />
        Front desk
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <CardBrandLogo brand={payment.card.brand} className="text-[11px]" />
      <span className="font-mono">•••• {payment.card.last4}</span>
    </span>
  );
}

// A list of payments (receipts). `showMember` adds who paid (for the admin).
function PaymentHistory({ payments, title = 'Payment history', description, showMember = false, emptyText = 'No payments yet.' }) {
  return (
    <Card title={title} description={description} padded={false}>
      {!payments && (
        <div className="space-y-2 p-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-14 animate-pulse rounded-xl bg-surface-3" />
          ))}
        </div>
      )}
      {payments?.length === 0 && (
        <div className="p-5">
          <EmptyState icon={ReceiptText} title="Nothing here yet" description={emptyText} />
        </div>
      )}
      {payments?.length > 0 && (
        <ul className="divide-y divide-line-soft">
          {payments.map((payment) => {
            const isPaid = payment.status === 'PAID';
            return (
              <li key={payment.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                {showMember && payment.member && (
                  <Avatar firstName={payment.member.firstName} lastName={payment.member.lastName} avatar={payment.member.avatar} size="sm" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">
                    {showMember && payment.member ? `${payment.member.firstName} ${payment.member.lastName} · ` : ''}
                    {payment.plan.name}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                    <span>{formatDate(payment.createdAt)}</span>
                    <span aria-hidden="true">·</span>
                    <PaidWith payment={payment} />
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{payment.reference}</span>
                  </p>
                  {!isPaid && payment.declineReason && <p className="mt-0.5 text-xs text-red-700 dark:text-red-300">{payment.declineReason}</p>}
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isPaid ? 'text-ink' : 'text-faint line-through'}`}>{formatPrice(payment.amount)}</p>
                  <p
                    className={`inline-flex items-center gap-1 text-xs font-medium ${isPaid ? 'text-brand-700 dark:text-brand-300' : 'text-red-700 dark:text-red-300'}`}
                  >
                    {isPaid ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : <XCircle className="size-3.5" aria-hidden="true" />}
                    {isPaid ? 'Paid' : 'Declined'}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export default PaymentHistory;

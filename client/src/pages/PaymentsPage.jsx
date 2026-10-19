import { useEffect, useMemo, useState } from 'react';
import { Banknote, CircleX, Landmark, ReceiptText, Search } from 'lucide-react';
import { listPayments } from '../api/payments.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import PaymentHistory from '../components/payments/PaymentHistory.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import { formatPrice } from '../utils/format.js';

// Status filters ('' = all). The server filters; the counts come from the totals.
const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'PAID', label: 'Paid' },
  { value: 'DECLINED', label: 'Declined' },
];

// Admin: every payment (online card payments and front-desk sales), with this month's revenue.
// Declined card attempts are listed too, so the admin can help a member whose card did not work.
function PaymentsPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [data, setData] = useState(null); // { payments, totals }
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    listPayments({ status })
      .then((result) => {
        if (!ignore) setData(result);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, [status]);

  // Searching happens in the browser: the list is at most the latest 200 payments.
  const shown = useMemo(() => {
    const words = search.trim().toLowerCase();
    if (!data?.payments || !words) return data?.payments ?? null;
    return data.payments.filter((p) =>
      [p.member ? `${p.member.firstName} ${p.member.lastName}` : '', p.reference, p.plan.name].some((text) => text.toLowerCase().includes(words)),
    );
  }, [data, search]);

  const totals = data?.totals;

  function handleStatusChange(value) {
    setStatus(value);
    setData((current) => current && { ...current, payments: null }); // keep the totals, show the list loading
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Online card payments and front-desk sales. Declined cards are listed too." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue this month" value={totals && formatPrice(totals.revenueThisMonth)} icon={Banknote} />
        <StatCard label="Payments this month" value={totals?.paymentsThisMonth} icon={ReceiptText} tone="blue" />
        <StatCard
          label="Declined this month"
          value={totals?.declinedThisMonth}
          icon={CircleX}
          tone={totals?.declinedThisMonth ? 'red' : 'slate'}
          onClick={() => handleStatusChange(status === 'DECLINED' ? '' : 'DECLINED')}
          isSelected={status === 'DECLINED'}
        />
        <StatCard label={totals ? `Revenue all time · ${totals.paymentsAllTime} ${totals.paymentsAllTime === 1 ? 'payment' : 'payments'}` : 'Revenue all time'} value={totals && formatPrice(totals.revenueAllTime)} icon={Landmark} tone="amber" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter by status">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={status === filter.value}
              onClick={() => handleStatusChange(filter.value)}
              className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                status === filter.value ? 'border-brand-700 bg-brand-700 text-white' : 'border-line-strong bg-surface text-ink-2 hover:bg-surface-2'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search member, plan or reference…"
            aria-label="Search member, plan or reference"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-line-strong bg-surface py-2 pr-3 pl-9 text-ink shadow-sm outline-none transition placeholder:text-faint focus:border-brand-500 focus:ring-4 focus:ring-brand-100 dark:focus:ring-brand-500/25"
          />
        </div>
      </div>

      <ErrorMessage>{error}</ErrorMessage>

      <PaymentHistory
        payments={shown}
        title={STATUS_FILTERS.find((f) => f.value === status).label + ' payments'}
        description={shown ? `${shown.length} shown, newest first` : undefined}
        showMember
        emptyText={search ? 'No payment matches this search.' : status === 'DECLINED' ? 'No declined cards – good news.' : 'No payments yet.'}
      />
    </div>
  );
}

export default PaymentsPage;

import { checkout } from '../../api/payments.js';
import CardCheckout from './CardCheckout.jsx';
import { formatDate } from '../../utils/format.js';

// Pay for one plan by card. `preview` comes from the server (price after the loyalty discount, dates).
// onPaid({ membership, payment }) is called after a successful payment.
function CheckoutPanel({ preview, onPaid, onBack }) {
  const summary = {
    title: preview.plan.name,
    subtitle: `${formatDate(preview.startDate)} – ${formatDate(preview.endDate)}`,
    listPrice: preview.listPrice,
    discountLabel: `${preview.level} discount (−${preview.discountPercent}%)`,
    price: preview.price,
  };

  return (
    <CardCheckout
      summary={summary}
      pay={(payment) => checkout({ planId: preview.plan.id, ...payment })}
      onPaid={onPaid}
      onBack={onBack}
      backLabel="Choose another plan"
    />
  );
}

export default CheckoutPanel;

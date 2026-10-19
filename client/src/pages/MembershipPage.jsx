import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { ArrowRight, BadgePercent } from 'lucide-react';
import { listPlans } from '../api/plans.js';
import { getMyVisits } from '../api/me.js';
import { listMyPayments, previewMyMembership } from '../api/payments.js';
import { useApiData } from '../hooks/useApiData.js';
import MyMembershipCard from '../components/MyMembershipCard.jsx';
import CheckoutPanel from '../components/payments/CheckoutPanel.jsx';
import PaymentHistory from '../components/payments/PaymentHistory.jsx';
import PaymentReceipt from '../components/payments/PaymentReceipt.jsx';
import PlanPicker from '../components/payments/PlanPicker.jsx';
import CardBrandLogo from '../components/payments/CardBrandLogo.jsx';
import Button from '../components/ui/Button.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { LEVELS } from '../utils/levels.js';
import { formatDate } from '../utils/format.js';

const STEP_MOTION = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 }, transition: { duration: 0.25 } };

// Members: see their membership, buy or renew a plan by card, and see their receipts.
// Steps: choose a plan → pay → receipt.
function MembershipPage() {
  const [step, setStep] = useState('choose');
  const [planId, setPlanId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState('');
  const [paid, setPaid] = useState(null);
  // Changing the key reloads the membership card after a payment.
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: planData, error: planError } = useApiData(listPlans);
  const { data: visits } = useApiData(getMyVisits);
  const loadPayments = useCallback(() => listMyPayments(), []);
  const { data: paymentData, reload: reloadPayments } = useApiData(loadPayments);

  const plans = planData?.plans.filter((p) => p.isActive) ?? [];
  const discountPercent = LEVELS.find((level) => level.name === visits?.level)?.discountPercent ?? 0;

  // The exact price and dates come from the server (same rules as the front desk).
  useEffect(() => {
    if (!planId) return undefined;
    let ignore = false;
    previewMyMembership(planId)
      .then((result) => !ignore && setPreview(result.preview))
      .catch((err) => !ignore && setPreviewError(err.message));
    return () => {
      ignore = true;
    };
  }, [planId]);

  // A new plan: forget the old preview until the server answers.
  function selectPlan(id) {
    setPlanId(id);
    setPreview(null);
    setPreviewError('');
  }

  function handlePaid(result) {
    setPaid(result);
    setStep('done');
    setRefreshKey((k) => k + 1);
    reloadPayments();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startAgain() {
    setStep('choose');
    setPlanId(null);
    setPaid(null);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Membership"
        description="Renew online in a minute. Your loyalty discount is applied automatically."
        actions={
          <span className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2 text-xs text-muted shadow-sm">
            We accept
            <CardBrandLogo brand="VISA" className="text-sm" />
            <CardBrandLogo brand="MASTERCARD" className="text-sm" />
          </span>
        }
      />

      <AnimatePresence mode="wait">
        {step === 'done' && paid && (
          <m.div key="done" {...STEP_MOTION}>
            <PaymentReceipt payment={paid.payment} onDone={startAgain} />
          </m.div>
        )}

        {step === 'pay' && preview && (
          <m.section key="pay" {...STEP_MOTION} aria-labelledby="pay-title">
            <h2 id="pay-title" className="mb-5 font-display text-2xl font-bold text-ink">
              Pay by card
            </h2>
            <CheckoutPanel preview={preview} onPaid={handlePaid} onBack={() => setStep('choose')} />
          </m.section>
        )}

        {step === 'choose' && (
          <m.div key="choose" {...STEP_MOTION} className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <MyMembershipCard key={refreshKey} />
              </div>
              <section className="space-y-4 lg:col-span-3" aria-labelledby="plans-title">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <h2 id="plans-title" className="font-display text-2xl font-bold text-ink">
                    Choose a plan
                  </h2>
                  {discountPercent > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-800 dark:bg-brand-500/15 dark:text-brand-300">
                      <BadgePercent className="size-4" aria-hidden="true" />
                      {visits.level}: {discountPercent}% off
                    </span>
                  )}
                </div>
                <ErrorMessage>{planError}</ErrorMessage>
                {!planData && <div className="h-48 animate-pulse rounded-2xl bg-surface-3" />}
                {planData && <PlanPicker plans={plans} selectedId={planId} onSelect={selectPlan} discountPercent={discountPercent} />}

                {planId && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
                    <p className="text-sm text-ink-3" aria-live="polite">
                      {preview
                        ? `${preview.plan.name}: ${formatDate(preview.startDate)} – ${formatDate(preview.endDate)}`
                        : previewError || 'Checking the dates…'}
                    </p>
                    <Button icon={ArrowRight} disabled={!preview} onClick={() => setStep('pay')}>
                      Continue to payment
                    </Button>
                  </div>
                )}
              </section>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <PaymentHistory payments={paymentData?.payments} title="My payments" description="Receipts of your memberships" emptyText="Your payments will appear here." />
    </div>
  );
}

export default MembershipPage;

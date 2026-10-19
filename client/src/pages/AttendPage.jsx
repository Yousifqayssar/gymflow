import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { m } from 'motion/react';
import { CalendarX, CircleCheck, Clock, Flag, Loader2, MapPin, QrCode, ScanLine, ShieldX } from 'lucide-react';
import { attendClass } from '../api/classes.js';
import Button from '../components/ui/Button.jsx';
import PageTitle from '../components/ui/PageTitle.jsx';
import { formatTime } from '../utils/classDisplay.js';

// The camera scanner is only downloaded when a member needs to scan again.
const QrScannerCard = lazy(() => import('../components/checkIn/QrScannerCard.jsx'));

// How each error from POST /api/classes/:id/attend is shown. `scanAgain`: offer the scanner.
const ERRORS = {
  INVALID_CODE: { icon: ScanLine, title: 'Scan the QR code again', scanAgain: true },
  NOT_BOOKED: { icon: CalendarX, title: 'You haven’t booked this class' },
  TOO_EARLY: { icon: Clock, title: 'Too early to check in', scanAgain: true },
  CLASS_ENDED: { icon: Flag, title: 'This class is over' },
  CLASS_CANCELLED: { icon: ShieldX, title: 'This class was cancelled' },
};
const OTHER_ERROR = { icon: ShieldX, title: 'Check-in did not work', scanAgain: true };

// Reads a scanned class QR: "https://…/attend/12?code=AbC…" → { classId: '12', code: 'AbC…' }, otherwise null.
function parseClassQr(text) {
  try {
    const url = new URL(text, window.location.origin);
    const match = /^\/attend\/(\d+)$/.exec(url.pathname);
    const code = url.searchParams.get('code');
    return match && code ? { classId: match[1], code } : null;
  } catch {
    return null;
  }
}

function Success({ result }) {
  const { gymClass, alreadyAttended } = result;
  return (
    <div className="flex flex-col items-center text-center">
      {/* A green circle that pops in, then the tick */}
      <m.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 16 }}
        className="flex size-28 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-xl shadow-brand-700/30"
      >
        <m.span initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, type: 'spring', stiffness: 500, damping: 14 }}>
          <CircleCheck className="size-14" aria-hidden="true" />
        </m.span>
      </m.span>
      <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <p className="mt-6 text-sm font-medium uppercase tracking-wide text-brand-700 dark:text-brand-300">
          {alreadyAttended ? 'Already checked in' : 'You’re checked in'}
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">{gymClass.title}</h1>
        <p className="mt-2 flex items-center justify-center gap-2 text-muted">
          <MapPin className="size-4" aria-hidden="true" />
          {gymClass.location} · {formatTime(gymClass.startsAt)}
        </p>
        <p className="mt-5 text-ink-3">Enjoy the class! Your attendance is saved – no points lost.</p>
        <Button as={Link} to={`/classes/${gymClass.id}`} variant="secondary" className="mt-6">
          View class
        </Button>
      </m.div>
    </div>
  );
}

// Members land here after scanning the trainer's QR code with their phone camera
// (/attend/12?code=…), or open it from the class page to scan with GymFlow's own scanner.
function AttendPage() {
  const { classId } = useParams();
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const navigate = useNavigate();
  const [status, setStatus] = useState(code ? 'sending' : 'scan'); // sending | done | error | scan
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const sentRef = useRef(''); // the code already sent – React's development mode runs effects twice

  useEffect(() => {
    if (!code || sentRef.current === `${classId}:${code}`) return;
    sentRef.current = `${classId}:${code}`;
    setStatus('sending');
    attendClass(classId, code)
      .then((data) => {
        setResult(data);
        setStatus('done');
      })
      .catch((err) => {
        setError(err);
        setStatus('error');
      });
  }, [classId, code]);

  function handleScan(text) {
    const qr = parseClassQr(text);
    if (!qr) {
      setError({ message: 'That is not a class QR code. Scan the code on the trainer’s screen.' });
      setStatus('error');
      return;
    }
    navigate(`/attend/${qr.classId}?code=${encodeURIComponent(qr.code)}`, { replace: true });
  }

  const shown = status === 'error' ? (ERRORS[error.code] ?? OTHER_ERROR) : null;

  return (
    <div className="mx-auto max-w-md space-y-6 py-6">
      <PageTitle>Class check-in</PageTitle>

      {status === 'sending' && (
        <div className="flex flex-col items-center gap-4 py-16 text-center text-muted" role="status">
          <Loader2 className="size-10 animate-spin text-brand-600" aria-hidden="true" />
          Checking you in…
        </div>
      )}

      {status === 'done' && <Success result={result} />}

      {status === 'error' && (
        <div className="flex flex-col items-center text-center" role="alert">
          <span className="flex size-20 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            <shown.icon className="size-10" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-ink">{shown.title}</h1>
          <p className="mt-2 text-ink-3">{error.message}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {shown.scanAgain && (
              <Button icon={QrCode} onClick={() => setStatus('scan')}>
                Scan again
              </Button>
            )}
            <Button as={Link} to={`/classes/${classId}`} variant="secondary">
              View class
            </Button>
          </div>
        </div>
      )}

      {status === 'scan' && (
        <Suspense fallback={<div className="aspect-square animate-pulse rounded-2xl bg-surface-4" />}>
          <QrScannerCard
            onCode={handleScan}
            title="Scan the class QR code"
            description="Point your camera at the QR code on the trainer’s screen."
            fallback="Use your phone’s camera app to scan the code instead."
          />
        </Suspense>
      )}
    </div>
  );
}

export default AttendPage;

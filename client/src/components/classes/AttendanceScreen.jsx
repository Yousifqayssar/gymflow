import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { m } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Clock, Flag, RotateCcw, Smartphone, UserCheck, X } from 'lucide-react';
import { getAttendance, markAttendance } from '../../api/classes.js';
import Avatar from '../ui/Avatar.jsx';
import Button from '../ui/Button.jsx';
import ErrorMessage from '../ErrorMessage.jsx';
import { formatTime } from '../../utils/classDisplay.js';

const POLL_MS = 3000; // how often the screen asks who has arrived (and for the next QR code)
const CODE_LIFETIME_MS = 30 * 1000; // the server changes the code every 30 seconds

// Loads the attendance every few seconds while the screen is open.
// `clockOffset` = server clock − this device's clock, so the countdown is right even if the tablet's clock is off.
function useLiveAttendance(classId) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [clockOffset, setClockOffset] = useState(0);

  const show = useCallback((result) => {
    setData(result);
    setClockOffset(Date.parse(result.serverTime) - Date.now());
    setError('');
  }, []);

  useEffect(() => {
    let alive = true; // false once the screen closes, so a late answer does not start a new timer
    let timer = null;
    async function refresh() {
      try {
        const result = await getAttendance(classId);
        if (alive) show(result);
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) timer = setTimeout(refresh, POLL_MS);
      }
    }
    refresh();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [classId, show]);

  return { data, error, clockOffset, show };
}

// Keeps the trainer's screen from going dark while members scan (where the browser supports it).
function useWakeLock() {
  useEffect(() => {
    let lock = null;
    let released = false;
    navigator.wakeLock
      ?.request('screen')
      .then((l) => {
        if (released) l.release();
        else lock = l;
      })
      .catch(() => {}); // not allowed / not supported: the screen just follows its normal timeout
    return () => {
      released = true;
      lock?.release().catch(() => {});
    };
  }, []);
}

// A ring that empties in 30 seconds, until the QR code changes.
function CountdownRing({ expiresAt, clockOffset }) {
  const [now, setNow] = useState(() => Date.now() + clockOffset);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() + clockOffset), 200);
    return () => clearInterval(id);
  }, [clockOffset]);

  const left = Math.max(0, Math.min(CODE_LIFETIME_MS, Date.parse(expiresAt) - now));
  const seconds = Math.ceil(left / 1000);
  const radius = 22;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-3 text-sm text-muted">
      <svg viewBox="0 0 52 52" className="size-12 -rotate-90" aria-hidden="true">
        <circle cx="26" cy="26" r={radius} fill="none" strokeWidth="5" className="stroke-surface-4" />
        <circle
          cx="26"
          cy="26"
          r={radius}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          className={`transition-[stroke-dashoffset] duration-200 ease-linear ${seconds <= 5 ? 'stroke-amber-500' : 'stroke-brand-600'}`}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - left / CODE_LIFETIME_MS)}
        />
      </svg>
      <p>
        New code in <span className="font-mono text-base font-bold tabular-nums text-ink">{seconds}s</span>
      </p>
    </div>
  );
}

// The left side: the big QR code, or why there is none right now.
function QrPanel({ data, clockOffset }) {
  if (data.qr) {
    // Any phone camera can scan it: it is a link to GymFlow's "I'm here" page with the code.
    const link = `${window.location.origin}${data.qr.path}?code=${data.qr.code}`;
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <m.div
          key={data.qr.code}
          initial={{ opacity: 0.3, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-[min(88vw,26rem)] rounded-3xl bg-white p-5 shadow-lg ring-1 ring-black/5"
        >
          {/* Black on white with a quiet zone: the easiest QR code for any camera to read. */}
          <QRCodeSVG value={link} size={512} level="M" marginSize={2} title="Class check-in QR code" className="h-auto w-full" />
        </m.div>
        <CountdownRing expiresAt={data.qr.expiresAt} clockOffset={clockOffset} />
        <p className="flex max-w-sm items-center gap-2 text-ink-3">
          <Smartphone className="size-5 shrink-0 text-faint" aria-hidden="true" />
          Members scan this with their phone camera to check in.
        </p>
      </div>
    );
  }

  const hasEnded = Date.parse(data.serverTime) > Date.parse(data.closesAt);
  const Icon = hasEnded ? Flag : Clock;
  return (
    <div className="flex max-w-sm flex-col items-center gap-3 rounded-3xl border border-dashed border-line-strong px-8 py-12 text-center">
      <Icon className="size-10 text-faint" aria-hidden="true" />
      {hasEnded ? (
        <>
          <p className="text-xl font-semibold text-ink">This class has ended</p>
          <p className="text-muted">You can still correct who was present. Members who booked but did not come lose 10 points.</p>
        </>
      ) : (
        <>
          <p className="text-xl font-semibold text-ink">Check-in opens at {formatTime(data.opensAt)}</p>
          <p className="text-muted">The QR code appears here 15 minutes before the class starts. Keep this screen open.</p>
        </>
      )}
    </div>
  );
}

const METHOD_LABELS = { QR: 'Scanned QR', TRAINER: 'Marked by trainer' };

// One booked member: present (with a ✓ that pops in when they scan) or not yet, plus the manual button.
function AttendeeRow({ attendee, canMark, isBusy, onMark }) {
  const isPresent = Boolean(attendee.attendedAt);
  return (
    <li className={`flex items-center gap-3 px-4 py-3 transition-colors ${isPresent ? 'bg-brand-50/70 dark:bg-brand-500/10' : ''}`}>
      <div className="relative shrink-0">
        <Avatar firstName={attendee.firstName} lastName={attendee.lastName} avatar={attendee.avatar} size="md" />
        {isPresent && (
          <m.span
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 14 }}
            className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-brand-600 text-white ring-2 ring-surface"
          >
            <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
          </m.span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">
          {attendee.firstName} {attendee.lastName}
        </p>
        <p className={`text-xs ${isPresent ? 'text-brand-700 dark:text-brand-300' : 'text-faint'}`}>
          {isPresent ? `Present · ${METHOD_LABELS[attendee.attendanceMethod]} · ${formatTime(attendee.attendedAt)}` : 'Not here yet'}
        </p>
      </div>
      {canMark &&
        (isPresent ? (
          <Button variant="ghost" size="sm" icon={RotateCcw} disabled={isBusy} onClick={() => onMark(attendee, false)}>
            Undo
          </Button>
        ) : (
          <Button variant="secondary" size="sm" icon={UserCheck} disabled={isBusy} onClick={() => onMark(attendee, true)}>
            Mark present
          </Button>
        ))}
    </li>
  );
}

// Full-screen attendance view for the class's trainer (or an admin): a QR code that changes every
// 30 seconds and a live list of who has arrived. Opening it during the class "takes attendance".
function AttendanceScreen({ gymClass, onClose }) {
  const { data, error, clockOffset, show } = useLiveAttendance(gymClass.id);
  const [busyId, setBusyId] = useState(null);
  const [markError, setMarkError] = useState('');
  const closeRef = useRef(null);
  useWakeLock();

  // While open: no page scrolling behind it, Escape closes, focus starts on "Close".
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  async function handleMark(attendee, present) {
    setBusyId(attendee.id);
    setMarkError('');
    try {
      show(await markAttendance(gymClass.id, attendee.id, present));
    } catch (err) {
      setMarkError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  // Manual marking works from the moment check-in opens (also after the class, to fix mistakes).
  const canMark = data && Date.parse(data.serverTime) >= Date.parse(data.opensAt);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby="attendance-title" className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-surface-2">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-line bg-surface/90 px-4 py-3 backdrop-blur sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-faint">Attendance</p>
          <h2 id="attendance-title" className="truncate font-display text-2xl font-bold text-ink">
            {gymClass.title}
          </h2>
        </div>
        <p className="hidden text-sm text-muted sm:block">
          {formatTime(gymClass.startsAt)} – {formatTime(gymClass.endsAt)} · {gymClass.location}
        </p>
        <Button ref={closeRef} variant="secondary" icon={X} onClick={onClose}>
          Close
        </Button>
      </header>

      <div className="flex-1 px-4 py-6 sm:px-6 lg:py-10">
        {!data ? (
          error ? (
            <ErrorMessage>{error}</ErrorMessage>
          ) : (
            <div className="mx-auto size-80 animate-pulse rounded-3xl bg-surface-4" />
          )
        ) : (
          <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="flex justify-center lg:sticky lg:top-24">
              <QrPanel data={data} clockOffset={clockOffset} />
            </div>

            <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
              <div className="flex items-end justify-between gap-3 border-b border-line-soft px-4 py-4">
                <h3 className="font-semibold text-ink">Booked members</h3>
                {/* aria-live: screen readers hear the count go up when someone scans */}
                <p aria-live="polite" className="text-sm text-muted">
                  <span className="font-display text-3xl font-bold tabular-nums text-ink">{data.presentCount}</span> / {data.attendees.length} present
                </p>
              </div>
              {(markError || error) && (
                <div className="px-4 pt-3">
                  <ErrorMessage>{markError || error}</ErrorMessage>
                </div>
              )}
              {data.attendees.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted">Nobody has booked this class.</p>
              ) : (
                <ul className="divide-y divide-line-soft">
                  {data.attendees.map((attendee) => (
                    <AttendeeRow key={attendee.id} attendee={attendee} canMark={canMark} isBusy={busyId === attendee.id} onMark={handleMark} />
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default AttendanceScreen;

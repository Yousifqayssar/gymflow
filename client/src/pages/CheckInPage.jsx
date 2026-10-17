import { useRef, useState } from 'react';
import { checkInMember, listTodaysCheckIns } from '../api/checkIns.js';
import { useApiData } from '../hooks/useApiData.js';
import CheckInResult from '../components/checkIn/CheckInResult.jsx';
import ManualCheckInForm from '../components/checkIn/ManualCheckInForm.jsx';
import QrScannerCard from '../components/checkIn/QrScannerCard.jsx';
import TodaysCheckIns from '../components/checkIn/TodaysCheckIns.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';

// The same code within this time is ignored: a member holding their phone in front of
// the camera would otherwise be sent to the server every second.
const REPEAT_SCAN_MS = 10_000;

// What to show when the server says no.
function resultForError(error) {
  // The business rule refused entry (expired, not started yet or no membership).
  if (error.code === 'MEMBERSHIP_NOT_ACTIVE') {
    return { type: 'refused', message: error.message };
  }
  // The problem is the staff login, not the member: e.g. someone logged in as a member in another tab.
  if (error.status === 401 || error.status === 403) {
    return {
      type: 'error',
      message: 'You are not logged in as staff',
      hint: 'This browser is now logged in with an account that cannot check members in. Log in again as an admin or trainer.',
    };
  }
  return { type: 'error', message: error.message };
}

// Staff check-in screen at the gym entrance (Admin, Trainer):
// scan the member's QR code or type their member number, see the result, see today's visits.
function CheckInPage() {
  const [result, setResult] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const lastScan = useRef({ code: '', at: 0 });
  const { data: today, error: todayError, reload: reloadToday } = useApiData(listTodaysCheckIns);

  // Sends one code to the server and shows the answer. Returns true when the server answered.
  async function handleCode(code) {
    const now = Date.now();
    const isRepeat = code === lastScan.current.code && now - lastScan.current.at < REPEAT_SCAN_MS;
    if (isBusy || isRepeat) return false;
    lastScan.current = { code, at: now };

    setIsBusy(true);
    try {
      const data = await checkInMember(code);
      setResult({ type: data.alreadyCheckedIn ? 'already' : 'success', data });
      if (!data.alreadyCheckedIn) reloadToday();
      return true;
    } catch (error) {
      setResult(resultForError(error));
      return error.status !== 0;
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Check-in" description="Scan a member’s QR code or type their member number." />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <QrScannerCard onCode={handleCode} isBusy={isBusy}>
            <ManualCheckInForm onCode={handleCode} isBusy={isBusy} />
          </QrScannerCard>
        </div>
        <div className="space-y-6 lg:col-span-2">
          <CheckInResult result={result} />
          <TodaysCheckIns today={today} error={todayError} />
        </div>
      </div>
    </div>
  );
}

export default CheckInPage;

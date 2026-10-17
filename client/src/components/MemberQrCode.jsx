import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, Sun } from 'lucide-react';
import { getMyQrCode, resetMyQrCode } from '../api/me.js';
import { useAuth } from '../auth/useAuth.js';
import { useApiData } from '../hooks/useApiData.js';
import Button from './ui/Button.jsx';
import Modal from './ui/Modal.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import { useToast } from './ui/useToast.js';
import { formatMemberNumber } from '../utils/format.js';

// The member's personal QR code to show at the entrance, with the member number
// (for typing it in by hand) and a button to replace the code if it was shared.
//   size="large" on the "My QR code" page, size="small" on the profile.
function MemberQrCode({ size = 'large' }) {
  const { user } = useAuth();
  const showToast = useToast();
  const { data, error, reload } = useApiData(getMyQrCode);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [resetError, setResetError] = useState('');
  const isLarge = size === 'large';

  async function handleReset() {
    setResetError('');
    try {
      await resetMyQrCode();
      setIsConfirmOpen(false);
      reload();
      showToast('Your new QR code is ready');
    } catch (err) {
      setResetError(err.message);
    }
  }

  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  return (
    <div className="flex flex-col items-center text-center">
      <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${isLarge ? 'p-5' : 'p-3'}`}>
        {data ? (
          // Black on white with a quiet zone: the easiest QR code for any camera to read.
          <QRCodeSVG
            value={data.qrContent}
            size={isLarge ? 240 : 150}
            level="M"
            marginSize={2}
            title={`QR code of ${user.firstName} ${user.lastName}`}
          />
        ) : (
          <div className={`animate-pulse rounded-lg bg-slate-100 ${isLarge ? 'size-[240px]' : 'size-[150px]'}`} />
        )}
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">Member number</p>
      <p className={`font-mono font-bold tracking-widest text-slate-900 ${isLarge ? 'text-2xl' : 'text-lg'}`}>
        {formatMemberNumber(user.id)}
      </p>

      {isLarge && (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <Sun className="size-4 shrink-0" aria-hidden="true" />
          Turn up your screen brightness at the entrance.
        </p>
      )}

      <Button variant="ghost" size="sm" icon={RefreshCw} className="mt-3" onClick={() => setIsConfirmOpen(true)}>
        Get a new code
      </Button>

      <Modal isOpen={isConfirmOpen} title="Get a new QR code?" onClose={() => setIsConfirmOpen(false)}>
        <p className="text-slate-600">
          Your current QR code will stop working immediately. Do this if someone else may have a photo of your code.
        </p>
        <div className="mt-4">
          <ErrorMessage>{resetError}</ErrorMessage>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setIsConfirmOpen(false)}>
            Keep my code
          </Button>
          <Button onClick={handleReset}>Get a new code</Button>
        </div>
      </Modal>
    </div>
  );
}

export default MemberQrCode;

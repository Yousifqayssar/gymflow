import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Camera, CameraOff, ScanLine } from 'lucide-react';
import '../../utils/qrScanner.js';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import ErrorMessage from '../ErrorMessage.jsx';

// Camera problems explained for gym staff (the library reports a `kind` for each problem).
const CAMERA_ERRORS = {
  'permission-denied': 'Camera access was blocked. Allow the camera in the browser’s address bar and try again.',
  'no-camera': 'No camera was found on this device. Type the member number instead.',
  'in-use': 'The camera is being used by another app. Close it and try again.',
  'insecure-context': 'The camera only works on localhost or over HTTPS.',
  unsupported: 'This browser cannot use the camera. Type the member number instead.',
};

// Scans member QR codes with the device camera. `onCode` gets the text inside the QR code.
// The camera only starts when staff press "Start camera", so the browser asks for permission on purpose.
// `children` is shown below the camera (the manual member-number form).
function QrScannerCard({ onCode, isBusy, children }) {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');

  function startCamera() {
    setCameraError('');
    setIsCameraOn(true);
  }

  function handleError(error) {
    setCameraError(CAMERA_ERRORS[error.kind] ?? 'The camera could not be started. Type the member number instead.');
    setIsCameraOn(false);
  }

  return (
    <Card
      title="Scan member QR code"
      description="Ask the member to open “My QR” in GymFlow and hold it up to the camera."
      actions={
        isCameraOn && (
          <Button variant="secondary" size="sm" icon={CameraOff} onClick={() => setIsCameraOn(false)}>
            Stop camera
          </Button>
        )
      }
    >
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-slate-900">
        {isCameraOn ? (
          <Scanner
            onScan={(codes) => codes[0] && onCode(codes[0].rawValue)}
            onError={handleError}
            formats={['qr_code']}
            constraints={{ facingMode: 'environment' }}
            // Report the same code again (at most once a second): otherwise a member who was refused could
            // not be scanned again after renewing. The page itself ignores quick repeats of one code.
            allowMultiple
            scanDelay={1000}
            sound={false}
            // While a check-in is being saved the picture freezes, so the same code is not sent twice.
            paused={isBusy}
            components={{ finder: true }}
            styles={{ container: { width: '100%', height: '100%' }, video: { objectFit: 'cover' } }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-white/10 text-white">
              <ScanLine className="size-8" aria-hidden="true" />
            </span>
            <p className="text-sm text-white/70">The camera is off.</p>
            <Button icon={Camera} onClick={startCamera}>
              Start camera
            </Button>
          </div>
        )}
      </div>

      {cameraError && (
        <div className="mx-auto mt-4 max-w-sm">
          <ErrorMessage>{cameraError}</ErrorMessage>
        </div>
      )}

      {children}
    </Card>
  );
}

export default QrScannerCard;

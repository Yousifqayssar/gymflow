import { AnimatePresence, m } from 'motion/react';
import { Loader2, Wifi } from 'lucide-react';
import CardBrandLogo from './CardBrandLogo.jsx';
import { detectBrand, digitsOnly } from '../../utils/cards.js';

// The card colour follows the brand, like real cards look different.
const FACES = {
  VISA: 'from-[#1a3a8f] via-[#1f4fb5] to-[#0f1f5c]',
  MASTERCARD: 'from-slate-800 via-slate-900 to-black',
  none: 'from-brand-700 via-brand-800 to-slate-900',
};

// "42424" → "4242 4••• •••• ••••": typed digits, the rest as dots.
function maskedNumber(number) {
  const digits = digitsOnly(number).slice(0, 16).padEnd(16, '•');
  return digits.replace(/(.{4})(?=.)/g, '$1 ');
}

// A 3D credit card that fills in while the member types and flips over for the security code.
// Decorative only (aria-hidden): the form fields next to it hold the real information.
function CardPreview({ number, holderName, expiry, cvc, flipped, processing }) {
  const brand = detectBrand(digitsOnly(number));
  const face = FACES[brand ?? 'none'];

  return (
    <div className="mx-auto w-full max-w-sm [perspective:1200px]" aria-hidden="true">
      <m.div
        className="relative aspect-[1.586] w-full [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
      >
        {/* ---------- Front ---------- */}
        <div className={`absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-2xl [backface-visibility:hidden] ${face} transition-colors duration-500`}>
          <div className="absolute -top-20 -right-16 size-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 -left-10 size-56 rounded-full bg-white/5" />
          {/* A light reflection that moves across while the payment is processing */}
          {processing && (
            <m.div
              className="absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
              initial={{ left: '-40%' }}
              animate={{ left: '120%' }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="text-sm font-semibold tracking-wide text-white/90">GymFlow Pay</span>
              <AnimatePresence mode="wait">
                <m.span key={brand ?? 'none'} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="text-lg">
                  {brand ? <CardBrandLogo brand={brand} onCard /> : <Wifi className="size-6 rotate-90 text-white/70" />}
                </m.span>
              </AnimatePresence>
            </div>

            {/* Chip */}
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-12 grid-cols-3 gap-px overflow-hidden rounded-md bg-gradient-to-br from-yellow-200 via-amber-300 to-yellow-500 p-1 shadow-inner">
                {Array.from({ length: 6 }, (_, i) => (
                  <span key={i} className="rounded-[2px] border border-amber-600/40" />
                ))}
              </div>
              {processing && <Loader2 className="size-5 animate-spin text-white/80" />}
            </div>

            <p className="font-mono text-[clamp(1rem,5vw,1.35rem)] tracking-[0.12em] whitespace-nowrap [text-shadow:0_1px_2px_rgb(0_0_0/0.4)]">{maskedNumber(number)}</p>

            <div className="flex items-end justify-between gap-4 text-xs">
              <div className="min-w-0">
                <p className="text-[10px] tracking-widest text-white/60 uppercase">Card holder</p>
                <p className="truncate text-sm font-semibold tracking-wide uppercase">{holderName.trim() || 'Your name'}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] tracking-widest text-white/60 uppercase">Expires</p>
                <p className="font-mono text-sm font-semibold">{expiry || 'MM/YY'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Back ---------- */}
        <div className={`absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br text-white shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)] ${face}`}>
          <div className="mt-6 h-11 bg-black/80" />
          <div className="mt-5 flex items-center gap-3 px-5">
            <div className="h-9 flex-1 rounded bg-[repeating-linear-gradient(135deg,#f8fafc_0_6px,#e2e8f0_6px_12px)]" />
            <div className="flex h-9 w-16 items-center justify-center rounded bg-white font-mono text-base font-bold tracking-widest text-slate-900 italic">
              {cvc.padEnd(3, '•')}
            </div>
          </div>
          <p className="mt-2 px-5 text-right text-[10px] tracking-widest text-white/60 uppercase">Security code</p>
          <div className="absolute right-5 bottom-4 text-lg">{brand && <CardBrandLogo brand={brand} onCard />}</div>
        </div>
      </m.div>
    </div>
  );
}

export default CardPreview;

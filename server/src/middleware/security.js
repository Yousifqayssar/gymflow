import helmet from 'helmet';
import { MemoryStore, rateLimit } from 'express-rate-limit';

// Security headers for every response (helmet). The Content Security Policy tells the browser
// what the website may load: only its own files, plus OpenStreetMap tiles for the partner-gym map.
// 'wasm-unsafe-eval' lets the QR scanner run its WebAssembly decoder; inline styles are needed
// because React and the map set style attributes. Inline scripts stay forbidden.
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://*.tile.openstreetmap.org'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'", 'blob:'],
      workerSrc: ["'self'", 'blob:'],
      manifestSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
});

// Against password guessing: at most 10 login or registration attempts per 15 minutes from one
// address. A successful login does not count, so a member who logs in normally is never blocked.
export const AUTH_LIMIT = 10;
export const AUTH_WINDOW_MS = 15 * 60 * 1000;

// Exported so tests can start every test with a clean counter.
export const authLimiterStore = new MemoryStore();

export const authLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  limit: AUTH_LIMIT,
  store: authLimiterStore,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  // Same JSON shape as every other error of the API.
  handler: (req, res) => {
    res.status(429).json({
      error: { message: 'Too many attempts. Please wait 15 minutes and try again.', code: 'TOO_MANY_ATTEMPTS' },
    });
  },
});

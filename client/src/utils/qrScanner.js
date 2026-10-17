import { setZXingModuleOverrides } from '@yudiel/react-qr-scanner';
import zxingWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

// Browsers without a built-in QR reader (e.g. Chrome and Firefox on Windows) decode with a
// WebAssembly file. By default it is downloaded from a CDN; this makes Vite serve our own copy,
// so scanning also works without internet (e.g. during a demo).
setZXingModuleOverrides({
  locateFile: (path, prefix) => (path.endsWith('.wasm') ? zxingWasmUrl : prefix + path),
});

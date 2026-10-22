// Runs before every screen test.
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
// Adds matchers like expect(button).toBeDisabled() and toBeInTheDocument().
import '@testing-library/jest-dom/vitest';

// Remove what the previous test rendered, and forget its mocked calls.
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// jsdom (the simulated browser) has <dialog> but not its showModal()/close(): add simple versions.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}

// jsdom has no matchMedia (used for dark mode and reduced motion).
if (!window.matchMedia) {
  window.matchMedia = (query) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
}

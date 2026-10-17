import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// A dialog window on top of the page, e.g. for "New plan" or "Add person".
// Uses the browser's built-in <dialog> element, which already handles focus,
// the Escape key and the dark backdrop, and is accessible for screen readers.
function Modal({ isOpen, title, onClose, children }) {
  const dialogRef = useRef(null);

  // Open or close the real <dialog> whenever `isOpen` changes.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  // Clicking the dark area around the box closes the dialog.
  function handleClick(event) {
    if (event.target === dialogRef.current) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault(); // Escape key: let React decide (keeps `isOpen` in sync)
        onClose();
      }}
      onClick={handleClick}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-surface p-0 shadow-xl backdrop:bg-slate-900/40"
    >
      {isOpen && (
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-m-1 rounded-lg p-1 text-faint hover:bg-surface-3 hover:text-ink-3"
            >
              <X className="size-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export default Modal;

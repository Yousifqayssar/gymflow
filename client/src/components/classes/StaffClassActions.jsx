import { useState } from 'react';
import { Link } from 'react-router';
import { Ban, Pencil } from 'lucide-react';
import { cancelClass } from '../../api/classes.js';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import ErrorMessage from '../ErrorMessage.jsx';
import { useToast } from '../ui/useToast.js';

// Edit / Cancel class, for the class's own trainer and admins.
// Only shown while the class can still be changed (not cancelled, not started).
function StaffClassActions({ gymClass, onChange }) {
  const showToast = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  if (gymClass.isCancelled || gymClass.hasStarted) return null;

  async function handleCancelClass() {
    setIsBusy(true);
    setError('');
    try {
      const data = await cancelClass(gymClass.id);
      onChange({ ...gymClass, ...data.class }); // keep the attendee list
      setIsConfirmOpen(false);
      showToast('The class was cancelled');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button as={Link} to={`/classes/${gymClass.id}/edit`} icon={Pencil} variant="secondary">
          Edit class
        </Button>
        <Button icon={Ban} variant="danger" onClick={() => setIsConfirmOpen(true)}>
          Cancel class
        </Button>
      </div>

      <Modal isOpen={isConfirmOpen} title="Cancel this class?" onClose={() => setIsConfirmOpen(false)}>
        <p className="text-slate-600">
          <strong>{gymClass.title}</strong> will be marked as cancelled. It stays visible in the schedule so the{' '}
          {gymClass.bookedCount} booked {gymClass.bookedCount === 1 ? 'member sees' : 'members see'} what happened. This cannot be undone.
        </p>
        <div className="mt-4">
          <ErrorMessage>{error}</ErrorMessage>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setIsConfirmOpen(false)}>
            Keep the class
          </Button>
          <Button variant="danger" onClick={handleCancelClass} disabled={isBusy}>
            {isBusy ? 'Cancelling…' : 'Yes, cancel class'}
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default StaffClassActions;

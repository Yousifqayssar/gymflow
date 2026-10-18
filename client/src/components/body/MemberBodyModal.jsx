import { useEffect, useState } from 'react';
import { getMemberBody } from '../../api/body.js';
import Modal from '../ui/Modal.jsx';
import ErrorMessage from '../ErrorMessage.jsx';
import BodyCard from './BodyCard.jsx';

// Trainers and admins: a member's body details in a popup (e.g. from a class's booked members).
// `member` is { id, firstName, lastName } or null when closed.
function MemberBodyModal({ member, onClose }) {
  const [state, setState] = useState({ memberId: null, overview: null, error: '' });

  useEffect(() => {
    if (!member) return undefined;
    let ignore = false;
    getMemberBody(member.id)
      .then((overview) => {
        if (!ignore) setState({ memberId: member.id, overview, error: '' });
      })
      .catch((err) => {
        if (!ignore) setState({ memberId: member.id, overview: null, error: err.message });
      });
    return () => {
      ignore = true;
    };
  }, [member]);

  // Only show data that belongs to the member that is open now (not the previous one).
  const isCurrent = member && state.memberId === member.id;

  return (
    <Modal isOpen={Boolean(member)} title={member ? `${member.firstName} ${member.lastName}` : ''} onClose={onClose}>
      {isCurrent && state.error ? <ErrorMessage>{state.error}</ErrorMessage> : <BodyCard overview={isCurrent ? state.overview : null} title="Body details" />}
    </Modal>
  );
}

export default MemberBodyModal;

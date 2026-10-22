import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookingPanel from './BookingPanel.jsx';
import { renderWithApp } from '../../test/render.jsx';
import { bookAndPay, bookClass, cancelBooking } from '../../api/classes.js';

// The panel talks to the API through these functions; the tests replace them with stand-ins.
vi.mock('../../api/classes.js', () => ({ bookClass: vi.fn(), cancelBooking: vi.fn(), bookAndPay: vi.fn() }));

const IN_TWO_DAYS = Date.now() + 2 * 24 * 60 * 60 * 1000;
function makeClass(overrides = {}) {
  return {
    id: 12,
    title: 'Morning Yoga',
    startsAt: new Date(IN_TWO_DAYS).toISOString(),
    endsAt: new Date(IN_TWO_DAYS + 60 * 60 * 1000).toISOString(),
    attendanceOpensAt: new Date(IN_TWO_DAYS - 15 * 60 * 1000).toISOString(),
    capacity: 12,
    spotsLeft: 5,
    price: '150.00',
    isCancelled: false,
    hasStarted: false,
    isBookedByMe: false,
    isMyBookingPaid: false,
    myAttendance: null,
    ...overrides,
  };
}
const FREE = { mustPay: false, reason: null, listPrice: '150.00', discountPercent: 0, price: '0.00', resetsOn: '2026-11-09' };
const BASIC = { mustPay: true, reason: 'BASIC_PLAN', listPrice: '150.00', discountPercent: 0, price: '150.00', resetsOn: null };
const NO_CLASSES_LEFT = { mustPay: true, reason: 'NO_CLASSES_LEFT', listPrice: '200.00', discountPercent: 30, price: '140.00', resetsOn: '2026-11-09' };

describe('BookingPanel', () => {
  it('Premium with classes left: books for free and says so', async () => {
    const onChange = vi.fn();
    bookClass.mockResolvedValue({ class: makeClass({ isBookedByMe: true }) });
    const { showToast } = renderWithApp(<BookingPanel gymClass={makeClass()} quote={FREE} onChange={onChange} />);

    expect(screen.getByText('5 of 12 spots left')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Book this class' }));

    expect(bookClass).toHaveBeenCalledWith(12);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ isBookedByMe: true }));
    expect(showToast).toHaveBeenCalledWith("You're booked for Morning Yoga!");
  });

  it('Basic member: shows the class price, "Book & pay" and the way to Premium – no free booking', () => {
    renderWithApp(<BookingPanel gymClass={makeClass()} quote={BASIC} onChange={vi.fn()} />);

    expect(screen.getByText(/your Basic plan is gym only/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Book & pay ₺150.00' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Or go Premium/ })).toHaveAttribute('href', '/membership');
    expect(screen.queryByRole('button', { name: 'Book this class' })).not.toBeInTheDocument();
  });

  it('Premium with no classes left: shows the 30% discount price and the old price crossed out', () => {
    renderWithApp(<BookingPanel gymClass={makeClass({ price: '200.00' })} quote={NO_CLASSES_LEFT} onChange={vi.fn()} />);

    expect(screen.getByText(/You have used this month’s classes/)).toBeInTheDocument();
    expect(screen.getByText(/30% Premium discount/)).toBeInTheDocument();
    expect(screen.getByText('₺200.00')).toHaveClass('line-through');
    expect(screen.getByRole('button', { name: 'Book & pay ₺140.00' })).toBeInTheDocument();
  });

  it('pays by card in the pop-up and books the class', async () => {
    const onChange = vi.fn();
    bookAndPay.mockResolvedValue({ class: makeClass({ isBookedByMe: true, isMyBookingPaid: true }), payment: { amount: '150.00' } });
    const { showToast } = renderWithApp(<BookingPanel gymClass={makeClass()} quote={BASIC} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Book & pay ₺150.00' }));
    await userEvent.click(screen.getByRole('button', { name: /4242/ })); // fills the Visa test card
    await userEvent.click(screen.getByRole('button', { name: 'Pay ₺150.00' }));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Paid ₺150.00 – you're booked for Morning Yoga!"), { timeout: 3000 });
    expect(bookAndPay).toHaveBeenCalledWith(12, {
      checkoutId: expect.any(String),
      card: { holderName: 'Elif Yilmaz', number: '4242424242424242', expMonth: 12, expYear: 28, cvc: '123' },
    });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ isMyBookingPaid: true }));
  });

  it('paid booking: cancelling warns about the refund and reports it', async () => {
    cancelBooking.mockResolvedValue({ class: makeClass(), refunded: '150.00' });
    const { showToast } = renderWithApp(<BookingPanel gymClass={makeClass({ isBookedByMe: true, isMyBookingPaid: true })} quote={BASIC} onChange={vi.fn()} />);

    expect(screen.getByText('· paid by card')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel booking' }));
    expect(screen.getByText(/the money goes back to your card/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Yes, cancel' }));

    expect(cancelBooking).toHaveBeenCalledWith(12);
    expect(showToast).toHaveBeenCalledWith('Booking cancelled – ₺150.00 refunded to your card');
  });

  it('full class: the button is disabled', () => {
    renderWithApp(<BookingPanel gymClass={makeClass({ spotsLeft: 0 })} quote={FREE} onChange={vi.fn()} />);

    expect(screen.getByText('No spots left')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Class is full' })).toBeDisabled();
  });

  it('shows the server’s message when booking fails', async () => {
    bookClass.mockRejectedValue(new Error('This class is full'));
    renderWithApp(<BookingPanel gymClass={makeClass()} quote={FREE} onChange={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Book this class' }));

    expect(await screen.findByText('This class is full')).toBeInTheDocument();
  });

  it('missed class: shows the −10 points penalty and no booking buttons', () => {
    const past = Date.now() - 2 * 24 * 60 * 60 * 1000;
    const gymClass = makeClass({ isBookedByMe: true, hasStarted: true, myAttendance: 'MISSED', startsAt: new Date(past).toISOString(), endsAt: new Date(past + 3600000).toISOString() });
    renderWithApp(<BookingPanel gymClass={gymClass} quote={null} onChange={vi.fn()} />);

    expect(screen.getByText(/You missed this class · −10 points/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

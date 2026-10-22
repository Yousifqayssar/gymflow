import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CardCheckout from './CardCheckout.jsx';
import { renderWithApp } from '../../test/render.jsx';
import { ApiError } from '../../api/client.js';

const SUMMARY = { title: 'Premium Monthly', subtitle: '22 Oct 2026 – 21 Nov 2026', listPrice: '1500.00', discountLabel: 'Silver discount (−5%)', price: '1425.00' };

function setup(pay = vi.fn()) {
  const onPaid = vi.fn();
  const view = renderWithApp(<CardCheckout summary={SUMMARY} pay={pay} onPaid={onPaid} />);
  return { ...view, pay, onPaid };
}

describe('CardCheckout', () => {
  it('shows what is bought, the discount and the total', () => {
    setup();

    expect(screen.getByText('Premium Monthly')).toBeInTheDocument();
    expect(screen.getByText('Silver discount (−5%)')).toBeInTheDocument();
    expect(screen.getByText('−₺75.00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pay ₺1,425.00' })).toBeInTheDocument();
  });

  it('checks the card in the browser first and sends nothing while it is wrong', async () => {
    const { pay } = setup();

    await userEvent.type(screen.getByLabelText('Card number'), '4242 4242 4242 4241'); // wrong check digit
    await userEvent.click(screen.getByRole('button', { name: 'Pay ₺1,425.00' }));

    expect(screen.getByText('Enter the name on the card')).toBeInTheDocument();
    expect(screen.getByText('This card number is not valid – check for a typo')).toBeInTheDocument();
    expect(screen.getByText('Use MM/YY, e.g. 12/28')).toBeInTheDocument();
    expect(screen.getByText('3 digits on the back')).toBeInTheDocument();
    expect(pay).not.toHaveBeenCalled();
  });

  it('formats what the member types: groups of four digits and MM/YY', async () => {
    setup();

    await userEvent.type(screen.getByLabelText('Card number'), '5555555555554444');
    await userEvent.type(screen.getByLabelText('Expiry date'), '1229');

    expect(screen.getByLabelText('Card number')).toHaveValue('5555 5555 5555 4444');
    expect(screen.getByLabelText('Expiry date')).toHaveValue('12/29');
  });

  it('pays with a test card: sends only digits and a checkout id, then reports success', async () => {
    const answer = { membership: { id: 3 }, payment: { amount: '1425.00' } };
    const { pay, onPaid } = setup(vi.fn().mockResolvedValue(answer));

    await userEvent.click(screen.getByRole('button', { name: /4242/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Pay ₺1,425.00' }));

    await waitFor(() => expect(onPaid).toHaveBeenCalledWith(answer), { timeout: 3000 });
    expect(pay).toHaveBeenCalledWith({
      checkoutId: expect.stringMatching(/^[0-9a-f-]{36}$/),
      card: { holderName: 'Elif Yilmaz', number: '4242424242424242', expMonth: 12, expYear: 28, cvc: '123' },
    });
  });

  it('declined card: explains it, charges nothing, and the next try is a new payment attempt', async () => {
    const pay = vi.fn().mockRejectedValue(new ApiError(402, 'Your card was declined. Please use another card.', [], 'CARD_DECLINED'));
    const { onPaid } = setup(pay);

    await userEvent.click(screen.getByRole('button', { name: /0002/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Pay ₺1,425.00' }));

    expect(await screen.findByText('Payment failed', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText(/Your card was declined\. Please use another card\. Nothing was charged\./)).toBeInTheDocument();
    expect(onPaid).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Pay ₺1,425.00' }));
    await waitFor(() => expect(pay).toHaveBeenCalledTimes(2), { timeout: 3000 });
    // A double click is never charged twice, but a real second try must be a different attempt.
    expect(pay.mock.calls[1][0].checkoutId).not.toBe(pay.mock.calls[0][0].checkoutId);
  });

  it('shows the server’s field errors next to the right input', async () => {
    const pay = vi.fn().mockRejectedValue(new ApiError(400, 'Validation failed', [{ field: 'card.expYear', message: 'This card has expired' }]));
    setup(pay);

    await userEvent.click(screen.getByRole('button', { name: /4242/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Pay ₺1,425.00' }));

    expect(await screen.findByText('This card has expired', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByLabelText('Expiry date')).toHaveAttribute('aria-invalid', 'true');
  });
});

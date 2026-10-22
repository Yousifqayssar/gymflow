import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CheckInPage from './CheckInPage.jsx';
import { renderWithApp } from '../test/render.jsx';
import { checkInMember, listTodaysCheckIns } from '../api/checkIns.js';
import { ApiError } from '../api/client.js';

vi.mock('../api/checkIns.js', () => ({ checkInMember: vi.fn(), listTodaysCheckIns: vi.fn() }));
vi.mock('../api/partnerGyms.js', () => ({
  listPartnerGyms: vi.fn().mockResolvedValue({ access: null, homeGym: {}, gyms: [{ id: 3, name: 'Besiktas Strength Studio' }] }),
}));
// The camera cannot run in the simulated browser: keep only what is shown below the camera (the manual form).
vi.mock('../components/checkIn/QrScannerCard.jsx', () => ({ default: ({ children }) => <div>{children}</div> }));

const STAFF = { id: 2, firstName: 'Mert', lastName: 'Aydin', role: 'TRAINER' };
const EMPTY_DAY = { date: '2026-10-22', count: 0, checkIns: [] };

function member(overrides = {}) {
  return {
    member: { id: 4, firstName: 'Elif', lastName: 'Yilmaz', avatar: null, membership: { status: 'ACTIVE', plan: { name: 'Premium 3 Months' }, endDate: '2026-12-08', daysRemaining: 47 }, ...overrides },
    checkIn: { checkedInAt: '2026-10-22T07:30:00.000Z', method: 'MANUAL' },
    points: 200,
    level: 'Silver',
    alreadyCheckedIn: false,
  };
}

async function typeAndCheckIn(text) {
  await userEvent.type(screen.getByLabelText('Member number'), text);
  await userEvent.click(screen.getByRole('button', { name: 'Check in' }));
}

describe('CheckInPage', () => {
  it('checks a member in by member number and welcomes them', async () => {
    listTodaysCheckIns.mockResolvedValue(EMPTY_DAY);
    checkInMember.mockResolvedValue(member());
    renderWithApp(<CheckInPage />, { user: STAFF });

    expect(await screen.findByText('Waiting for a member')).toBeInTheDocument();
    await typeAndCheckIn('GF-00004');

    expect(checkInMember).toHaveBeenCalledWith('GF-00004', null); // null = our own gym
    expect(await screen.findByText('Welcome, Elif!')).toBeInTheDocument();
    expect(screen.getByText('Checked in')).toBeInTheDocument();
    expect(screen.getByLabelText('Member number')).toHaveValue(''); // ready for the next member
    expect(listTodaysCheckIns).toHaveBeenCalledTimes(2); // today's list is reloaded
  });

  it('refuses a member without a valid membership and shows the reason', async () => {
    listTodaysCheckIns.mockResolvedValue(EMPTY_DAY);
    checkInMember.mockRejectedValue(new ApiError(403, 'Membership expired on 30 Sep 2026', [], 'MEMBERSHIP_NOT_ACTIVE'));
    renderWithApp(<CheckInPage />, { user: STAFF });

    await typeAndCheckIn('GF-00011');

    expect(await screen.findByText('Entry refused')).toBeInTheDocument();
    expect(screen.getByText('Membership expired on 30 Sep 2026')).toBeInTheDocument();
  });

  it('a second check-in on the same day says so (no extra points)', async () => {
    listTodaysCheckIns.mockResolvedValue(EMPTY_DAY);
    checkInMember.mockResolvedValue({ ...member(), alreadyCheckedIn: true });
    renderWithApp(<CheckInPage />, { user: STAFF });

    await typeAndCheckIn('GF-00004');

    expect(await screen.findByText('Already checked in today')).toBeInTheDocument();
    expect(listTodaysCheckIns).toHaveBeenCalledTimes(1); // nothing new to show
  });

  it('explains when the browser is logged in as a member instead of staff', async () => {
    listTodaysCheckIns.mockResolvedValue(EMPTY_DAY);
    checkInMember.mockRejectedValue(new ApiError(403, 'You do not have permission to do this'));
    renderWithApp(<CheckInPage />, { user: STAFF });

    await typeAndCheckIn('GF-00004');

    expect(await screen.findByText('You are not logged in as staff')).toBeInTheDocument();
  });

  it('checks members in at the chosen partner gym, and remembers the choice on this device', async () => {
    listTodaysCheckIns.mockResolvedValue(EMPTY_DAY);
    checkInMember.mockResolvedValue(member());
    renderWithApp(<CheckInPage />, { user: STAFF });

    await userEvent.selectOptions(await screen.findByLabelText('Checking in at'), await screen.findByRole('option', { name: /Besiktas Strength Studio/ }));
    await typeAndCheckIn('GF-00004');

    expect(checkInMember).toHaveBeenCalledWith('GF-00004', 3);
    expect(localStorage.getItem('gymflow_checkin_location')).toBe('3');
    localStorage.removeItem('gymflow_checkin_location');
  });

  it('refuses a Basic member at a partner gym and says how to get access', async () => {
    listTodaysCheckIns.mockResolvedValue(EMPTY_DAY);
    checkInMember.mockRejectedValue(new ApiError(403, 'Can has a Basic membership, which is for our own gym only.', [], 'PARTNER_GYM_PREMIUM_ONLY'));
    renderWithApp(<CheckInPage />, { user: STAFF });

    await typeAndCheckIn('GF-00005');

    expect(await screen.findByText('Entry refused')).toBeInTheDocument();
    expect(screen.getByText(/upgrade to Premium/)).toBeInTheDocument();
  });

  it('cannot send an empty member number', async () => {
    listTodaysCheckIns.mockResolvedValue(EMPTY_DAY);
    renderWithApp(<CheckInPage />, { user: STAFF });

    expect(screen.getByRole('button', { name: 'Check in' })).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Member number'), '   ');
    expect(screen.getByRole('button', { name: 'Check in' })).toBeDisabled();
  });
});

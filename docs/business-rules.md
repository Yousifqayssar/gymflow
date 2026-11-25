# GymFlow – Business Rules

The rules GymFlow enforces, in the server's services and – for the most important ones – also in the database. Back to the [README](../README.md).

## Memberships

- A plan has a name, a duration in months (1–60) and a positive price. Plans are deactivated, never deleted once sold.
- A membership of _N_ months starting on a day _D_ ends the day before _D_ in month _N_ later (1 Oct → 31 Oct). If that day does not exist, it ends on the last day of that month (31 Jan → 28/29 Feb).
- Without a chosen start date, a new membership starts today, or the day after the member's current membership ends (renewal). Start dates in the past and overlapping memberships are rejected.
- The price is copied into the membership when it is sold.
- Status is calculated, not stored: **Active**, **Expiring soon** (ends within 7 days), **Expired**, **Upcoming**, **No membership**.

## Classes and bookings

- A class has a title, category, description, meeting point, start time, duration (15–300 min), capacity (> 0), level, intensity, and optional "what to bring" and health notes – everything a member needs before booking.
- Trainers create and manage only their own classes; admins manage all classes and choose the trainer.
- Classes must start in the future. A class that has started, or was cancelled, cannot be changed. Capacity cannot be lowered below the number of bookings. Cancelled classes stay visible.
- **Booking** (members only):
  - not beyond capacity (409),
  - not twice for the same class (409, also enforced by a unique index),
  - not after the class has started (400),
  - only with a membership valid on the day of the class, in the gym's time zone (403).
- Booking runs in a transaction with a row lock, so two members can never take the last spot at the same time.
- A booking can be cancelled until the class starts.

## Payments, points and classes per month

- Card numbers and CVC codes are never stored – only the card brand and the last 4 digits. A unique checkout id makes sure the same payment is never charged twice.
- Every gym visit gives 10 loyalty points, at most once per day. Levels: Silver from 100 points (5% off the next membership), Gold from 300 (10%), Platinum from 600 (15%).
- Premium includes 10 classes per membership month; unused classes do not carry over. Basic members – and Premium members with no classes left – pay per class (Premium: 30% cheaper). A cancelled booking gives the class or the payment back.
- A booked member who does not come to a class where the trainer took attendance loses 10 points.

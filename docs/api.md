# GymFlow – API Reference

The REST API of the GymFlow server (`server/src/routes/`). All paths start with `/api`. Back to the [README](../README.md).

## Endpoints

| Method | Path | Access | Description |
| ------ | ---- | ------ | ----------- |
| GET | `/api/health` | public | API and database status (200 ok / 503 error) |
| POST | `/api/auth/register` | public | Create a member account → `{ user, token }` |
| POST | `/api/auth/login` | public | Log in → `{ user, token }` |
| GET | `/api/auth/me` | logged in | The current user |
| GET | `/api/plans` | logged in | Membership plans (non-admins only see active ones) |
| POST | `/api/plans` | Admin | Create a plan |
| PATCH | `/api/plans/:id` | Admin | Edit or (de)activate a plan |
| GET | `/api/users?role=&status=&search=` | Admin | List users; members include their membership status and `counts` per status |
| POST | `/api/users` | Admin | Create a Member or Trainer account |
| GET | `/api/users/:id` | Admin | A member with status and membership history |
| GET | `/api/users/:id/memberships/preview?planId=&startDate=` | Admin | Calculated dates and price, without saving |
| POST | `/api/users/:id/memberships` | Admin | Assign a plan to a member |
| GET | `/api/me/membership` | Member | The logged-in member's own membership |
| GET | `/api/me/membership/preview?planId=` | Member | Dates and price (with loyalty discount) before paying |
| POST | `/api/me/checkout` | Member | Pay for a membership by card (test gateway) |
| GET | `/api/me/payments` | Member | The member's own payments and receipts |
| GET | `/api/me/bookings` | Member | The member's upcoming booked classes |
| GET | `/api/me/class-balance` | Member | Classes left this membership month |
| GET | `/api/me/qr` | Member | The member's check-in QR code |
| POST | `/api/me/qr/reset` | Member | Make a new QR code (the old one stops working) |
| GET | `/api/me/visits` | Member | Visits, points, level and missed classes |
| GET / POST | `/api/me/body` | Member | Read or record a body check-in (weight, measurements) |
| GET | `/api/me/workout-plans` | Member | Workout plans written for the member |
| GET / POST | `/api/me/workouts` | Member | Read or log a workout |
| GET | `/api/me/progress` | Member | Data for the progress charts |
| PUT | `/api/account/avatar` | logged in | Change the profile picture |
| GET | `/api/classes?category=&from=&to=` | logged in | Class schedule (default: next 14 days) with spots left and "booked by me" |
| GET | `/api/classes/:id` | logged in | One class; its trainer and admins also get the list of booked members |
| POST | `/api/classes` | Admin, Trainer | Create a class |
| PATCH | `/api/classes/:id` | Admin, own Trainer | Edit a class |
| POST | `/api/classes/:id/cancel` | Admin, own Trainer | Cancel a class |
| POST | `/api/classes/:id/book` | Member | Book a spot (uses the monthly class allowance) |
| DELETE | `/api/classes/:id/book` | Member | Cancel the booking |
| GET | `/api/classes/:id/booking-quote` | Member | Price of a single class for members who pay per class |
| POST | `/api/classes/:id/book-and-pay` | Member | Book and pay for one class by card |
| GET | `/api/classes/:id/attendance` | Admin, own Trainer | Attendance list and the changing attendance QR code |
| PUT | `/api/classes/:id/attendance/:memberId` | Admin, own Trainer | Mark a member present or absent by hand |
| POST | `/api/classes/:id/attend` | Member | Scan the attendance QR code of a booked class |
| POST | `/api/check-ins` | Admin, Trainer | Check a member in by QR code or member number |
| GET | `/api/check-ins/today` | Admin, Trainer | Today's check-ins |
| GET | `/api/members` | Admin, Trainer | Members list for trainers |
| GET | `/api/members/:id/body` · `/workouts` · `/progress` | Admin, Trainer | A member's body check-ins, workouts and progress |
| GET | `/api/exercises` | logged in | Exercise library |
| POST / PUT | `/api/exercises` · `/api/exercises/:id` | Admin, Trainer | Add or edit an exercise |
| GET | `/api/workout-plans` | Admin, Trainer | All workout plans |
| GET | `/api/workout-plans/:id` | logged in | One plan (members only their own) |
| POST / PUT | `/api/workout-plans` · `/api/workout-plans/:id` | Admin, Trainer | Write or edit a workout plan |
| GET | `/api/partner-gyms` | logged in | Partner gyms for the map |
| POST / PUT / DELETE | `/api/partner-gyms` · `/api/partner-gyms/:id` | Admin | Manage partner gyms |
| GET | `/api/payments` | Admin | All payments with totals |
| GET | `/api/gym/stats` | logged in | Gym numbers on the home page (members, trainers, classes, visits) |
| GET | `/api/gym/admin-dashboard` | Admin | Revenue, visits and membership numbers for the dashboard |
| POST | `/api/nutrition/analyze` | logged in | Estimate the calories of a meal photo (Google Gemini) |

Status filters for `/api/users`: `active` (includes expiring soon), `expiring`, `expired`, `upcoming`, `none`. Prices are returned as exact strings, e.g. `"1500.00"`. Class times are exact moments with a time zone, e.g. `"2026-10-24T08:00:00+03:00"`.

Protected endpoints expect the header `Authorization: Bearer <token>`.

| Status | Meaning |
| --- | --- |
| 400 | Invalid input (`error.details` lists the fields) |
| 401 | Not logged in, or invalid/expired token, or wrong credentials |
| 402 | Card declined by the test payment gateway (`error.code` = `CARD_DECLINED`) |
| 403 | Logged in, but the role is not allowed, or a business rule forbids it (e.g. membership expired at check-in) |
| 404 | Not found (unknown plan, user or class) |
| 409 | Conflict, e.g. email already registered, plan name taken, overlapping membership, class full, already booked |
| 429 | Too many failed logins: 10 per 15 minutes per address |

Every error has the same shape: `{ "error": { "message": "…", "code": "…", "details": [{ "field": "…", "message": "…" }] } }`.

Test cards for the payment gateway (any future expiry date, any 3-digit CVC):

| Card number | Result |
| --- | --- |
| 4242 4242 4242 4242 | Paid (Visa) |
| 5555 5555 5555 4444 | Paid (Mastercard) |
| 4000 0000 0000 0002 | Declined |
| 4000 0000 0000 9995 | Declined – insufficient funds |

# GymFlow – Final Demonstration Plan (8 minutes)

A working system, not slides. The live demo is the main use case: **a member books a class, the front desk checks her in, the system refuses what breaks the rules**.

## The day before

- [ ] Refresh the online demo data (the demo classes only cover 14 days): from `server/`, the reseed command in the deployment notes – or ask for it to be done.
- [ ] Open https://gymflow-bw46.onrender.com once, so the free server is awake (it sleeps when unused and needs up to a minute).
- [ ] Log in once with each account below and check that the Classes page shows classes.
- [ ] Backup: the screenshots in `docs/screenshots/` and, on the laptop, the local version (`docker compose up -d`, then `npm run dev` in `server/` and `client/`).

## Browser setup

Two windows side by side – **left: Elif (member)** in a normal window, **right: Admin** in a private window. Zoom 110–125% so the audience can read.

| Account | Password | Use |
| --- | --- | --- |
| `elif@demo.gymflow.local` | `demo1234` | Member (Premium) |
| `can@demo.gymflow.local` | `demo1234` | Member (Basic) – paying for a class |
| Admin (`SEED_ADMIN_EMAIL`) | (your own) | Dashboard, check-in desk |

## Timeline

| Time | Show | Say (key points) |
| --- | --- | --- |
| 0:00–1:00 | Front page `/welcome` | The problem (paper cards, spreadsheets), the three users, the objective. |
| 1:00–2:00 | Architecture diagram (README) | Browser → Express layers → PostgreSQL; why one web service; why transactions. Point at the dashed boxes: what was added during development. |
| 2:00–3:30 | **Elif:** Home → Classes → a class → **Book this class** | Input: the tap. Processing: token check, role check, transaction with row lock, membership and capacity rules. Output: "You're booked", one spot less, one class less this month. I built every layer of this. |
| 3:30–4:15 | **Admin:** Check-in → type Elif's number (from her **My QR** page) → **Check in** | The desk sees her membership and points; an expired member is refused with the reason. |
| 4:15–5:00 | **Can:** book a class → pay with `4000 0000 0000 0002` (declined), then `4242 4242 4242 4242` | Test payment gateway: declined cards are saved but not booked; the same payment is never charged twice. |
| 5:00–6:30 | VS Code: `server/src/services/booking.service.js` (lockAndCheck) and a test; terminal: test summary | Testing on three levels, 732 tests; the role check over every endpoint. **Challenge:** the food scanner took 195 s → found hidden retries → 30-second budget, 9–19 s. |
| 6:30–8:00 | README: Known Limitations, Future Improvements; traceability table | Test gateway, AI estimates not measured, real-phone install not tested; next: real payments, reminders. |

## If something fails

- **Live site slow or down:** switch to the local version or the screenshots and say so honestly ("the free hosting is asleep – here is the same flow locally").
- **No classes shown:** the demo data has expired – use the local version (reload it with `npm run db:seed:demo`).
- **Questions about code:** every box of the architecture diagram is a folder in `server/src` or `client/src` – open it.

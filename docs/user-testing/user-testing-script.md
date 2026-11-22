# GymFlow – User Testing Script (Stage 5)

This script is for the person running the test sessions (the facilitator). Each session takes about **30 minutes** with one tester. The aim is to see where real people get stuck, not to test the people.

Plan for **5 testers**: 3 members (one of them a brand-new visitor), 1 trainer, 1 admin. Five testers usually find most of the big usability problems.

---

## 1. Before the session day

1. **Refresh the online demo data** (demo classes only exist for 14 days after loading). From the `server` folder in PowerShell, one line at a time:
   ```
   $env:DATABASE_URL = (Select-String '^DATABASE_URL=' .env.neon).Line -replace '^DATABASE_URL=',''
   ```
   ```
   npx prisma migrate deploy
   ```
   ```
   node prisma/seed-demo.js
   ```
   Do this **once, before the first tester** – not between testers. Reloading the data logs everyone out.
2. **Wake the site up** 2 minutes before each session: open https://gymflow-bw46.onrender.com once (the free server sleeps after 15 minutes and needs about 50 seconds to start).
3. **Two phones:** some tasks need a second screen (the member shows a QR code, the trainer scans it). Use your own phone as the second device.
4. **Print** section 4 (task cards) and section 5 (questionnaire) – one copy per tester.

### Accounts

Give each tester a different account, so one tester's bookings do not confuse the next.

| Tester | Account | Password | Notes |
| --- | --- | --- | --- |
| Member A | elif@demo.gymflow.local | demo1234 | Premium – 10 classes per month included |
| Member B | can@demo.gymflow.local | demo1234 | Basic – gym only, pays for each class |
| Member C (new visitor) | creates their own account | – | Starts from the front page |
| Trainer | mert@demo.gymflow.local | demo1234 | |
| Admin | admin@gymflow.local | (your admin password – type it in for them) | |

### Test cards (no real money moves)

| Card number | Result |
| --- | --- |
| 4242 4242 4242 4242 | Approved |
| 4000 0000 0000 0002 | Declined |

Any future expiry date and any 3-digit CVC work.

---

## 2. During the session

Read this to the tester at the start:

> "Thank you for helping. I am testing the app, not you – if something is hard, that is the app's fault and exactly what I need to find. Please **think aloud**: say what you are looking for and what you expect to happen. I will not help unless you are really stuck. It takes about 30 minutes. Is it OK if I take notes?"

Rules for the facilitator:

- **Do not point or explain.** If the tester asks "where is…?", answer "Where would you expect it to be?"
- Help only after **2 minutes** of being stuck, and write down that you helped.
- Write down **what they say**, especially surprise ("Oh", "Hmm", "Where is…").
- Use a timer for each task.
- Do not defend the app. Just say "Thanks, that's useful."

---

## 3. Recording results

For every task, mark one result:

- **✓** completed alone
- **H** completed with help
- **✗** gave up or did it wrong

| Tester | Task | Result (✓ / H / ✗) | Time | What happened / what they said |
| --- | --- | --- | --- | --- |
| | | | | |

A problem seen by **2 or more testers** goes on the fix list first.

---

## 4. Task cards (give these to the tester)

The tasks describe a goal, not the buttons to press, so they don't give away the answer.

### Member A (Premium) – on their own phone

1. Put GymFlow on your phone's home screen so it opens like an app.
2. Find a **yoga class** this week and book a place.
3. How many classes do you have **left this month**?
4. You have changed your mind. **Cancel** the yoga class.
5. You arrive at the gym. Show what you need to get in. *(Facilitator: scan it with the trainer account on your phone.)*
6. Take a photo of a meal or a snack and find out roughly **how many calories** it has.
7. How many **loyalty points** do you have, and what is the next reward?

### Member B (Basic) – on their own phone

1. Book a **HIIT class**. *(Basic members pay per class.)* Pay with the card **4000 0000 0000 0002**.
2. Something went wrong. Try again with the card **4242 4242 4242 4242**.
3. Where can you see the payment you just made?
4. Can you train at one of the **partner gyms** in Istanbul? Find the nearest one.

### Member C (new visitor) – on their own phone

1. You saw GymFlow advertised. Open https://gymflow-bw46.onrender.com and find out **how much the Premium plan costs** per month.
2. Create an account.
3. Buy a **Premium Monthly** membership. Use the card **4242 4242 4242 4242**.
4. Book any class for tomorrow.

### Trainer

1. A member is at the front desk. **Check them in.** *(Facilitator: show the QR code from Member A's account on your phone.)*
2. Create a new class that **starts in 10 minutes** (any type, 30 minutes long, 5 places).
3. *(Facilitator: with a member account on your phone, book that class now.)* The class is starting. **Take attendance** so the member can mark themselves present.
4. One member's phone battery is dead. Mark them as present **by hand**.

### Admin

1. How much money did the gym take **this month**? Which of the last 6 months was the best?
2. Out of all booked members, what share actually **came to their classes** recently?
3. Which members need to **renew** their membership this week?
4. Find the member **Can Ozturk** and look at their payments.
5. Add a new plan: **"Student Monthly"**, 1 month, ₺700, Basic.

---

## 5. Questionnaire (after the tasks)

### System Usability Scale (SUS)

Circle one number for each sentence: **1 = strongly disagree, 5 = strongly agree.**

| # | Statement | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | I think that I would like to use this app frequently. | | | | | |
| 2 | I found the app unnecessarily complex. | | | | | |
| 3 | I thought the app was easy to use. | | | | | |
| 4 | I think that I would need the support of a technical person to be able to use this app. | | | | | |
| 5 | I found the various functions in this app were well integrated. | | | | | |
| 6 | I thought there was too much inconsistency in this app. | | | | | |
| 7 | I would imagine that most people would learn to use this app very quickly. | | | | | |
| 8 | I found the app very cumbersome to use. | | | | | |
| 9 | I felt very confident using the app. | | | | | |
| 10 | I needed to learn a lot of things before I could get going with this app. | | | | | |

### Three open questions

1. What did you like most?
2. What was the most confusing or annoying moment?
3. If you could change one thing, what would it be?

---

## 6. After all sessions

### Scoring SUS

For each tester:

- Odd statements (1, 3, 5, 7, 9): **answer − 1**
- Even statements (2, 4, 6, 8, 10): **5 − answer**
- Add the ten numbers and multiply by **2.5** → a score from 0 to 100.

Average is about **68**. Above 68 is better than most apps; above 80 is excellent.

### Summary for the report

| Measure | Result |
| --- | --- |
| Testers | |
| Tasks completed alone (✓) | __ of __ (__ %) |
| Average SUS score | |
| Problems found by 2+ testers | |

Then list each problem with: **what happened**, **how many testers**, **how serious** (blocks the task / slows down / cosmetic), and **the fix**. This list becomes the Stage 5 fix plan and a section of the Week 8 report.

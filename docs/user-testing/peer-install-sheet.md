# GymFlow – Peer Installation Test (Week 7, R01–R06)

**For the tester:** please install GymFlow on **your own computer** using **only** the [README](../../README.md). Do not ask the developer for help unless you are completely stuck – every question you have shows where the instructions must improve. It takes about 30 minutes (plus downloading Node.js and Docker Desktop if you do not have them).

| Item | Fill in |
| --- | --- |
| Tester name | |
| Date | |
| Computer and operating system | e.g. Windows 11 laptop |
| Node.js version (`node --version`) | |
| Docker version (`docker --version`) | |
| Repository commit (`git log --oneline -1`) | |

## Results

Write what you **actually saw**. Status: **Pass**, **Fail** or **Not applicable** (with the reason).

| ID | Operation | README section | Expected result | Actual result | Status |
| --- | --- | --- | --- | --- | --- |
| R01 | Clone repository | Getting started | Folder `gymflow` downloaded | | |
| R02 | Install dependencies | Steps 3 and 4 (`npm install` in `server` and `client`) | Both finish without errors | | |
| R03 | Configure system | Steps 1 and 2 (`.env` files, `docker compose up -d`) | Database shows "healthy" | | |
| R04 | Build / start | Steps 3 and 4 (`npm run dev`) | <http://localhost:4000/api/health> shows `"status": "ok"`; website opens on <http://localhost:5173> | | |
| R05 | Main use case | Step 5 (demo data), then log in as `elif@demo.gymflow.local` / `demo1234` and book a class | "Booked" appears on the class | | |
| R06 | Run tests | Running tests (`npm test` in `server`, `client`, `e2e`) | All tests pass | | |

## Problems and unclear instructions

| # | Step | What happened or was unclear | How you solved it (if you did) |
| --- | --- | --- | --- |
| 1 | | | |
| 2 | | | |
| 3 | | | |

**Time needed in total:** ______ minutes

Please also take a screenshot of the health check and of the booked class.

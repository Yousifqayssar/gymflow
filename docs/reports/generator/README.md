# Report generator

Scripts that build the weekly Word reports in the same format as Weeks 1–7.

| File | What it does |
| --- | --- |
| `report-lib.js` | Shared look: cover page, headings, tables, figures, header and footer |
| `build-week6.js` | Builds the Week 6 report (Testing and Validation guide structure) |
| `build-week7.js` | Builds the Week 7 report (Reproducibility, Installation and Integration) from `../evidence/week-07-fresh-install.json` (copy it next to the script) |
| `build-week8.js` | Builds the Week 8 report (Report completion and GitHub portfolio); images: the architecture diagram and the final screenshots in `img/` |
| `build-week9.js` | Builds the Week 9 report (Final demonstration and career presentation) from `../evidence/week-09-final-audit.json` (copy it next to the script) |
| `evidence.mjs` | Runs the documented test cases T01–T18 against the app and records the real results |
| `retest.json` | Results of the automated suites and retests used in the Week 6 report |

## Re-running

1. Start the app in production mode on port 4300 (build the client first):
   ```
   cd client
   npx vite build
   cd ../server
   $env:NODE_ENV = "production"; $env:PORT = "4300"; node src/server.js
   ```
2. In a second terminal, from the project root, record the test cases (T18 needs a freshly started server, so restart it between the two lines):
   ```
   node docs/reports/generator/evidence.mjs server/.env evidence.json main
   node docs/reports/generator/evidence.mjs server/.env evidence.json limit
   ```
3. Build the report in a separate folder that contains these scripts, `evidence.json`, `retest.json` and an `img/` folder with the screenshots, after `npm install docx@9.5.1`:
   ```
   node build-week6.js week-06-report.docx
   ```

The recorded results of the Week 6 run are in `../evidence/week-06-test-cases.json`.

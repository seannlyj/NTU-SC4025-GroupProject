# Rewards Tracker MVP

A mobile-first web prototype of the **Rewards Tracker** feature for OCBC 365 credit cardholders, built for
NTU SC4025 Digital Product Management (Group 6). It shows how close a cardholder is to the monthly minimum
spend that unlocks full cashback, which transactions count, and what they have earned over time.

> Coursework prototype. It uses **mock data only**: no real OCBC APIs, branding assets, logos or customer data.

The wireframes it reproduces are in [`design/finished`](design/finished) (source of truth) and
[`design/low-fi`](design/low-fi).

## Setup

Requires Node.js 20 or later (tested on 20.17) and npm.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit and screen tests (Vitest + Testing Library)
npm run build      # type-check and production build into dist/
npm run preview    # serve the production build
```

The app is designed at 390px wide. Open it in a phone-sized window, or use your browser's device toolbar.

## Screen-to-route map

| # | Screen | Route | Wireframe |
|---|--------|-------|-----------|
| – | Home (filler banking home, not a wireframe screen; the app opens here) | `/` | – |
| 1 | Dashboard (Rewards Tracker) | `/rewards` | `Dashboard.png` |
| 2 | No OCBC 365 card | `/no-card` | `No card.png` |
| 3 | Service unavailable (Retry) | `/unavailable` | `Data unavailable.png` |
| 4 | Transactions | `/transactions` | `Transactions.png` |
| 5 | Filter sheet | `/transactions/filter` | `Filter.png` |
| 6 | No matching transactions | `/transactions/empty` | `No matches.png` |
| 7 | Eligibility ("Why isn't this counted?") | `/eligibility` (`?rule=payments-and-top-ups` opens a rule) | `Eligibility.png` |
| 8 | Spending history, last 6 months | `/history` | `History last 6 months.png` |
| 9 | Spending history, this month | `/history/month` | `History this month.png` |
| 10 | No history yet | `/history/empty` | `No history yet.png` |
| 11 | Cashback report | `/report` | `Report.png` |
| 12 | Report with bad dates | `/report/error` | `Report, bad dates.png` |
| 13 | PDF report | `/report/pdf?from=2026-04-01&to=2026-09-30` | `Report PDF.png` |

The app opens on `/`, a filler banking home screen, so a demo starts where a customer would: its **Rewards
Tracker** quick action (in place of Bill payment) opens the Dashboard at `/rewards`, and the **Home** tab leads back.
Everything else on it is decorative. The brief put the Dashboard at `/`; it moved to `/rewards` to make room for
Home, and every other route is unchanged.

Filters live in the URL (`/transactions?status=posted&category=1,3&from=2026-10-01&to=2026-10-12`), so every
filtered view can be linked to. Changing filters updates the list in place rather than adding a history step,
so Back from Transactions always returns to the screen you came from. When filters return nothing, the app moves
to `/transactions/empty`.

## Demo states

Every error, empty and loading state is a real state of the app, driven by the mock API:

- **Routes:** `/no-card`, `/unavailable` and `/history/empty` always show their state.
- **`?state=` on any route:** `normal`, `nocard`, `unavailable`, `nohistory` or `loading`
  (for example `/rewards?state=nocard`, `/history?state=nohistory` or `/rewards?state=loading`).
- **Demo panel:** open the app with `?demo=1`, or press **Shift+D**. A small "Demo" button appears bottom left.
  It lists all 13 screens and switches the data state for the browser tab. `?demo=0` hides it again.

In the unavailable state the mock fails once; **Retry** then succeeds and returns to the Dashboard.
The loading state never finishes, so the skeletons stay on screen.

## Motion

Motion works on two layers.

**Between screens** (the browser's View Transitions API, through React Router's `viewTransition` option):

- **Going deeper** (Dashboard → Transactions, "Why?", shortcuts, Get PDF report): the old screen drifts left and
  fades out quickly, then the new one drifts in from the right on an emphasised deceleration curve.
- **Back:** the mirror image. The screen you return to is simply there (no replayed entrance) and keeps its
  scroll position.
- **Retry, list ↔ no matches, Demo panel jumps:** a short crossfade.
- **Filter sheet:** slides up over a fading backdrop, slides down when closed; the list underneath stays still.
- The tab bar stays fixed while screens move underneath it. So does the top bar (Scan, bell, Logout) when moving
  between Home and Rewards Tracker, which share it.

**Inside each screen** ([Motion](https://motion.dev), the React animation library formerly called Framer
Motion), elements ease in on a choreographed timeline:

- **Dashboard:** title, then the two cards rise in turn. Cashback, eligible spend and total spend count up from
  zero, the progress bars fill, the expected credit date eases in under the cap, the split bar's three segments fill
  one after another, the "to go" chip pops, recent rows slide in, the category tiles ripple in and the shortcut icons
  pop.
- **Transactions:** date groups rise one after another and the Filter button springs in. Changing filters makes
  chips pop in and out while groups that leave fade away and the rest glide into place.
- **Filter sheet:** its sections cascade in as it opens; ticking a box fills it and draws the tick; the match count
  rolls like an odometer. Its handle (or its title row) can be dragged: up to cover the screen, down to shrink back
  or, pulled down far enough or flicked, to close it. Tapping the handle (or Enter, Space or the arrow keys on it)
  switches between full screen and normal height.
- **History:** the red tab pill glides between tabs; month bars grow from the baseline in turn; a month bar turns
  red and dips the moment it is pressed, and picking it quickly tweens the total, every category amount and every
  bar to the new values; this month's bars fill, then the "Your usual" markers drop in.

The slow, staggered timings are for a screen's entrance only. Anything that answers a tap or click starts at once
and settles within about 0.4s.
- **Eligibility:** the figures count up, the rules cascade in, and each rule eases open with a turning chevron.
- **Report:** a bad date range expands the error and shakes the To field when you press Get PDF report.
- **PDF preview:** the page rises in, its chart columns grow, and the Download button turns into a spinner, then a tick.
- Skeletons shimmer while data loads; tappable things dip slightly when pressed.

With *reduce motion* turned on in the OS, movement is dropped and only short fades remain. Browsers without view
transitions change screens instantly; the in-screen motion still plays.

Durations, curves and springs are tokens in [`src/motion/tokens.ts`](src/motion/tokens.ts); the reusable pieces
(rise, pop, count-up, bar fill) are in [`src/motion/primitives.tsx`](src/motion/primitives.tsx); screen-change
rules are in [`src/app/navigation.tsx`](src/app/navigation.tsx) and the end of [`src/index.css`](src/index.css).
To review animations slowly while developing, add `?slowmo=8` to any URL (8× slower; `?slowmo=1` resets).

## Business rules

Pure, unit-tested functions in [`src/domain`](src/domain):

- Currency is SGD, shown as `S$1,234.56`, and held in whole cents.
- Monthly minimum: S$800 of **eligible** spend. Cap: S$160. Below the minimum, cashback is a flat 0.25%.
- Status is exactly **Eligible**, **Pending** or **Not eligible**. Only Eligible counts and earns.
  Pending is excluded until it clears. Not eligible never counts and shows a "Why?" link.
- Total card spending = eligible + pending + not eligible. "To go" = max(0, 800 − eligible).
- Cashback is calculated per transaction (rounded half up), summed and capped. Tiers above the minimum can be added in
  [`src/config/policy.ts`](src/config/policy.ts).
- Expected credit date (US11): the 16th of the following month, moved to the Monday if it falls on a weekend, shown
  as "Mon, 16 Nov" under the monthly cap. The rule is not decided; change it in
  [`src/domain/creditDate.ts`](src/domain/creditDate.ts).

Easy-to-change configuration lives in [`src/config`](src/config): category names (`categories.ts`), the cashback
policy (`policy.ts`), the mock clock (`clock.ts`) and the eligibility rules (`eligibilityRules.ts`, summarised from
OCBC's published 365 cashback terms and exclusion list; update the text and version dates together when OCBC
revises them).

Every default and design decision is listed in [`ASSUMPTIONS.md`](ASSUMPTIONS.md).

## Seed data

October 2026, last updated 12 Oct, 22:10: total S$2,100.00 = Eligible S$620.00 + Pending S$300.00 +
Not eligible S$1,180.00, so S$620.00 / S$800.00 with S$180.00 to go and S$1.55 cashback, expected to be credited on
Mon, 16 Nov 2026.
[`src/api/seed/seed.test.ts`](src/api/seed/seed.test.ts) proves the seed tallies with the brief and the wireframes,
and [`src/screens/screens.test.tsx`](src/screens/screens.test.tsx) checks the numbers on every screen.

The wireframe's category figures cannot be rebuilt from the 13 October transactions, so they are stored as a
category summary that reconciles with the totals (decision B, ASSUMPTIONS.md item 7).

## Project structure

```
design/            wireframe PNGs (finished = source of truth, low-fi = structure)
src/config/        categories, cashback policy, mock clock, eligibility copy
src/domain/        business rules (money, cashback, summary, filters, history, report) + tests
src/api/           RewardsApi interface, mock implementation, demo scenarios, seed data
src/components/    shared UI: Card, StatusLabel, ProgressBar, SplitBar, BottomNav, TransactionRow, ...
src/screens/       one file per screen (+ screen tests)
src/report/        report chart geometry, HTML document and PDF generator
src/app/           routes, layout, data hooks, demo state and Demo panel
```

## Using a real backend

All data comes through the `RewardsApi` interface in [`src/api/types.ts`](src/api/types.ts). Write a client that
implements it (for example with `fetch`) and export it from [`src/api/index.ts`](src/api/index.ts) in place of the mock.

## Tech stack

React 19, TypeScript, Vite 6, React Router 7 (data router, for view transitions), Tailwind CSS 4 (design tokens in [`src/index.css`](src/index.css)),
TanStack Query, Motion (in-screen animation), jsPDF (loaded only when a PDF is generated) and Vitest with
Testing Library. Charts are inline SVG.
Vite 6 was chosen over Vite 7 because it supports Node 20.17.

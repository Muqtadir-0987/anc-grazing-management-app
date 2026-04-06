# ANC Grazing App — Demo Guide

**Audience:** Justin Howes (ANC client) + MBIS5015 Lecturer
**Duration:** 15–20 minutes
**Branch to use:** `demo` (no backend or database required)

---

## Part 1 — Before the Demo (Do this first, in private)

### 1. Start the app

```bash
# If you haven't already installed dependencies
cd client
npm install

# Start the app
npm run dev
```

Open **http://localhost:5173** in Chrome or Safari. Keep this tab open throughout.

### 2. Open on your phone as well (strongly recommended)

The app is mobile-first. Showing it on a phone is far more impressive than a laptop browser.

On your phone, connect to the same Wi-Fi as your laptop, then open:

```
http://<your-laptop-IP>:5173
```

To find your laptop IP:
- **macOS:** `ipconfig getifaddr en0` in Terminal
- **Windows:** `ipconfig` in Command Prompt — look for IPv4 Address

Or run the frontend with:
```bash
npm run dev -- --host
```
Vite will print a Network URL you can open directly on your phone.

### 3. Reset to a clean state

To ensure a consistent demo, clear the browser's localStorage before you begin:

Open **DevTools → Application → Local Storage → http://localhost:5173 → Clear All**

Or paste this into the browser console:
```js
localStorage.clear()
```

This clears any paddocks or queue items from previous runs.

### 4. Have these URLs ready in separate tabs

| Tab | URL | When to switch to it |
|---|---|---|
| Tab 1 | `http://localhost:5173/login` | Start here |
| Tab 2 | `http://localhost:5173/setup` | After Dashboard |
| Tab 3 | `http://localhost:5173/log-event` | The 60-second test |

---

## Part 2 — The Demo Sequence

Walk through each screen in the order below. The story you are telling is:

> *A grazier sets up their property, plans their season, and logs a field event — all from their phone.*

---

### Screen 1 — Login `(~1 min)`

**URL:** http://localhost:5173 → redirects to `/login`

**What to show:**
- Green ANC-branded hero at the top — point out the logo and "Australian Natural Capital" tagline
- Card-on-hero layout — a standard mobile pattern
- Labels above fields (not placeholder-only) — graziers can see what they're filling in even mid-form
- Eye icon on the password field — "graziers in the field often have gloves on or bright sunlight, this lets them check what they typed"
- "Keep me logged in" checkbox — "so they don't re-authenticate every time they open the app in a paddock"
- Footer: leaf, mountain, tractor icons — reinforces agricultural identity

**Action:** Type any email and password. Tap **Sign in**.

> In the demo, any credentials work. In production this validates against your user database.

---

### Screen 2 — Dashboard `(~3 min)`

**URL:** `/dashboard`

**What to show, in order:**

**Top bar:**
- "Good morning/afternoon, Grazier" — time-aware greeting, uses grazier's first name in production
- Property name "Granite Downs" below the greeting
- "Dormant season" badge top-right — the app knows which season it is, and calculations change accordingly
- Avatar initials circle — tapping this opens profile/logout in the full build

**Amber alert banner:**
- This is the most important element on the whole screen
- Fires automatically when SR:CC approaches 1.0
- "Right now it reads: SR:CC at 0.91 — approaching threshold. Review paddock allocation for North Flats mob."
- In production this is driven by live data. At 1.0+ the banner turns red and says "Action required"
- This replaces the manual SR:CC calculation your graziers currently do in the spreadsheet

**4 metric cards:**
- **Feed days remaining — 47 days** — "The number graziers worry about most in dormant season. Green when healthy, turns amber then red as it drops."
- **Total KgDM demand — 3,840** — "How much feed the entire herd consumes per day"
- **Total LSU — 320** — "Normalised livestock weight — feeds into the SR:CC calculation"
- **Active paddocks — 6** — "Quick check that rotation is happening"

**SR:CC ratio card:**
- Walk through the number (0.91), the progress bar, and the three labels (Understocked / Optimal / Overstocked)
- "The bar is almost full — the grazier is close to their limit. This is far easier to read at a glance than the number alone, especially on a phone in a paddock."

**Mobs section:**
- Three mob cards: North Flats Mob (120 head, Paddock 14B), Hill Country Steers (85, Ridge View), Replacement Heifers (115, The Gums)
- "At a glance the grazier knows where every mob is. That information currently lives in the spreadsheet or in their head."
- Three-dot icon on each card will open Move / Edit / View details

**Bottom navigation:**
- Point out the five tabs: Home, Log, Planner, Season, Reports
- "Fixed at the bottom of every screen. The active tab is always highlighted."

---

### Screen 3 — Property & Paddock Setup `(~3 min)`

**URL:** Switch to Tab 2 → `/setup`

> This shows how a grazier or ANC advisor configures a new property for the first time.

**What to show:**

**Step progress indicator:**
- Three steps with connecting lines — tick on completed steps, active step highlighted
- "The grazier is never dropped into a long form with no end in sight"

**Step 1 — Property details** *(demo branch shows Step 2, but explain Step 1)*
- "Step 1 captures the property name, total area in hectares, location, and financial year start month"
- In the full build, this creates the property record in the database before any paddocks can be added

**Step 2 — Paddocks:**
- Tap **+ Add paddock**
- Fill in: **Name** = "River Flats", **Size** = `42`, tap **STAC rating = 9**
- Point out how the STAC rating buttons replace free-text entry — "no typing a number, just tap"
- Tap **Save Paddock**
- The card appears with the **KgDM/ha value calculated automatically** (9 × 11.25 = 101.25)
- "The grazier never has to calculate this themselves. They give us the STAC rating — the app does the rest."
- Add a second paddock: "The Gums", `28` ha, STAC 6
- Show the edit (pencil) and delete (bin) buttons on each card

**Step 3 — Mobs:**
- Tap **Continue** to advance
- Type mob name: "Dry Cows"
- Tap stock class chips: **Cows** + **Cull Cows** — they toggle green
- Tap **Save Mob**
- "These stock classes drive the weight range validation when events are logged — you can't log 5 Cows deaths if only 3 are recorded in the mob"

---

### Screen 4 — Stock Flow Planner `(~2 min)`

**URL:** Tap the **Planner** tab in bottom nav → `/stock-flow`

**What to show:**
- Season indicator cards at the top — dormant (amber) and growing (green)
- Mob selector tabs — tap between mobs to switch
- Horizontally scrollable table — scroll right to see all months
- "CLASS column is frozen on the left — it stays visible as you scroll"
- The editable cells (No. and Av Wt columns) — tap one, type a value
- LSU, KgDMU, KgDM Total columns are **read-only** — calculated by the server
- "The grazier enters head count and average weight. The app calculates everything else — LSU, daily feed demand, total KgDM. Those are the numbers that go into SR:CC and feed planning."
- FAQ accordion at the bottom — show the formulas

---

### Screen 5 — Field Event Log — THE 60-SECOND TEST `(~2 min)`

**URL:** Tap the **Log** tab in bottom nav → `/log-event`

> This is the most important screen. Time it live.

**Say:** *"Let's do the 60-second test. I'm going to log a stock event from scratch — watch the clock."*

**Start the timer. Walk through:**

1. Event type grid — tap **Death** (or **Vaccination** to show something more routine)
2. Select mob — tap the dropdown, choose "North Flats Mob" — head count hint appears below
3. Select stock class — "Cows"
4. Quantity stepper — tap **+** three times to set 3, or type `3`
5. Date — already defaults to today, no change needed
6. Notes — skip (optional)
7. Tap **Save event**

**Stop the timer.**

> Typically under 20 seconds. The screen confirms "Event saved" and resets — ready for the next event without navigating away.

**Then show the offline capability:**
- Point to the cloud icon at the bottom: *"Saved events sync automatically when online"*
- "If the grazier has no signal in a remote paddock, they fill in the form, hit Save — it queues locally. The moment they get signal, it syncs automatically. They get a confirmation either way."

---

### Screen 6 — Feed Demand Summary `(~2 min)`

**URL:** Navigate to `/feed-demand`

**What to show:**
- Two season total cards at the top — dormant total vs growing total KgDM
- The line chart — seasonal bands alternate between dormant (amber) and growing (green)
- "This chart shows 24 months of feed demand. The alternating bands make it immediately obvious which season each peak belongs to."
- **Feed days remaining** row — highlighted in amber: 47 days
- Mob breakdown table at the bottom — one row per mob, shows head count, average weight, LSU, daily KgDM, total KgDM, and the season totals
- Grand totals row at the bottom
- Export as PDF and Export as CSV buttons at the top

---

### Screen 7 — Closed Season Grazing Plan `(~3 min)`

**URL:** Navigate to `/closed-plan`

> This is the most complex screen — it replaces the most complex tab in the spreadsheet.

**What to show:**

**SR:CC card:**
- The ratio (0.91), the progress bar, the three zone labels
- "This updates in real time as allocations are added. If the grazier over-allocates stock, the bar fills past the threshold line and turns red immediately."

**Plan info strip:**
- Start date, end date, total plan days — at a glance

**Allocation cards:**
- Each card shows: paddock name, mob chip, graze period (days), surplus/deficit KgDM, a mini progress bar
- "Graze period is calculated automatically: total paddock KgDM ÷ mob's daily KgDM demand. The grazier never touches this number."
- Surplus/deficit: green if the paddock has feed left over, red if the mob will exhaust it before the plan ends

**Add an allocation live:**
- Tap **+ Add allocation**
- Select a paddock from the dropdown
- Select a mob
- Point out the **"Estimated graze period: X days"** preview appearing immediately — "before even saving, the grazier can see if this allocation makes sense"
- Tap **Add allocation**

**FAQ accordion:**
- Open it and show the six formulas — "full transparency into how every number is calculated"

---

### Screen 8 — Reports `(~1 min)`

**URL:** Tap the **Reports** tab → `/reports`

**What to show:**
- Report type selector: Weekly / Monthly / Quarterly — tap each to show selection
- Month navigator with prev/next arrows
- Report preview panel: property name, period, mob count, SR:CC status, KgDM
- "Export as PDF" (green, primary) and "Export as CSV" (outlined, secondary) buttons
- Recent reports list — shows download history
- "The ANC advisor or grazier selects the period, hits Export, and gets a ready-to-send PDF. No spreadsheet export, no manual formatting."

---

## Part 3 — Closing (1 min)

**Say:**

> "That's the full app as it stands. To summarise what you've seen:
>
> — The Login and Dashboard are fully built and production-ready
> — Property Setup, Stock Flow, Feed Demand, the Closed Season Plan, Field Event Log, and Reports are all complete
> — Every calculation — LSU, KgDM, SR:CC, graze period — runs on the server. The grazier enters raw data and the app does the rest
> — The Field Event Log works offline. No signal, no problem.
>
> The only remaining screen is the All Properties admin view — that's the next sprint.
>
> Happy to answer any questions or go back to any screen."

---

## Part 4 — Common Questions

**Q: Does it work on any phone?**
> Yes. It's a web app — it opens in any phone browser. No app store download required. We've tested on iOS Safari and Chrome for Android.

**Q: What happens with no signal?**
> The Field Event Log queues events locally. Everything else needs a connection and shows a clear message if signal drops.

**Q: How do grazier accounts get created?**
> An ANC advisor logs in as admin and creates the account. Graziers can't self-register — every user is a verified ANC client.

**Q: Is the data safe if the grazier loses their phone?**
> All data lives in the database on the server, not on the phone. If the phone is lost, the grazier just logs in on a new device.

**Q: Can multiple graziers use the same property?**
> Yes. Multiple accounts can be linked to one property. Every event is timestamped and attributed to the user who logged it.

**Q: What about the spreadsheet data they already have?**
> A one-time migration can import property, paddock, and mob data from the existing spreadsheet into the database. Ongoing, everything lives in the app.

**Q: When will it be fully deployed?**
> The MVP is scope-complete. Production deployment (hosted database, domain, SSL) is the final step after university assessment. Timeline depends on ANC's go-live preference.

---

## Part 5 — For the Lecturer (Additional talking points)

If your lecturer asks about technical decisions:

**Why React + Vite?**
Component-based UI maps cleanly to the screen-by-screen spec. Vite gives fast hot-reload in development and a highly optimised production bundle.

**Why CSS Modules instead of Tailwind?**
The design system is token-based (CSS custom properties for colour, typography, spacing). CSS Modules keep styles scoped per component with zero class-name collisions, and no build-time dependency on a utility framework.

**Why all calculations server-side?**
Single source of truth. If a calculation formula changes (e.g. KgDMU multiplier), it changes in one place (`server/src/services/calculations.js`) and all clients get the updated value immediately. No risk of frontend and backend diverging.

**How is offline handled?**
`navigator.onLine` + the browser `online` event. Events are serialised to `localStorage` as a JSON array (`anc_offline_queue`). On reconnection, the `useOfflineQueue` hook POSTs each queued item to the API sequentially and removes successes.

**Why JWT in localStorage instead of httpOnly cookies?**
Known XSS trade-off — documented in CLAUDE.md. Accepted for MVP given the controlled user base (ANC clients only). Post-MVP, we'd move to httpOnly cookies to mitigate XSS exposure.

**Database design decision:**
All calculated fields (`lsu`, `kgdmPerHa`, `grazePeriodDays`, etc.) are stored denormalised alongside the source data. This avoids expensive recalculation on every read while keeping the write-time calculation centralised in the services layer.

---

## Part 6 — Reset Between Runs

If you need to demo again from a clean state:

```js
// Paste into browser console
localStorage.clear()
```

Then refresh to `/login`. Everything resets to the mock data defaults.

---

*ANC Grazing Management App — MBIS5015 Capstone — Group 13 — 2026*

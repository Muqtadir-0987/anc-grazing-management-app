# ANC Grazing App — Demo Flow
**For: Justin Howes (ANC client) + MBIS5015 Lecturer**
**Duration: ~20 minutes**

---

## Before You Start

Make sure both servers are running:

```bash
# Terminal 1 — backend
cd anc-grazing-management-app/server
node src/index.js

# Terminal 2 — frontend
cd anc-grazing-management-app/client
npm run dev
```

Open **http://localhost:5173** in Chrome.

**Two accounts ready to use:**

| Account | Email | Password | What it shows |
|---|---|---|---|
| Admin | `admin@aus-nc.com` | `changeme123` | Multi-property management view |
| Grazier | `grazier@granitedowns.com` | `grazier123` | Full grazier dashboard with live data |

---

## Part 1 — Admin View (3 min)

### Step 1 · Log in as Admin

Go to **http://localhost:5173** → you land on the Login screen.

Point out:
- ANC branded green header
- Show/hide password toggle (eye icon) — important for field use with gloves
- "Keep me logged in" checkbox — graziers shouldn't have to re-enter credentials every visit
- Footer: "Accounts are set up by ANC advisors" — no self-registration

Enter `admin@aus-nc.com` / `changeme123` → tap **Sign in**.

---

### Step 2 · Create a Property via Setup

Go to **http://localhost:5173/setup**

**Step 1 — Property details:**
- Property Name: `Woolshed Creek`
- Total Area: `3500`
- Location: `Roma QLD`
- Financial Year Start: `July`
- Tap **Continue** → this does a real `POST /api/properties` to PostgreSQL

**Step 2 — Add a paddock:**
- Tap **+ Add paddock**
- Name: `Back Paddock`
- Size: `400`
- STAC Rating: tap **9** (ankle height)
- Tap **Save Paddock**

> Point out: KgDM/ha appears instantly — `101.25 KgDM/ha`. That's the server calculating
> `STAC × 11.25 = 9 × 11.25`. The grazier never touches a calculator.

Add a second paddock:
- Name: `Creek Flats`
- Size: `250`
- STAC Rating: tap **6**
- **Save Paddock** → shows `67.5 KgDM/ha`

Tap **Continue**.

**Step 3 — Add a mob:**
- Mob Name: `Breeding Cows`
- Tap stock classes: **Cows** + **Calves**
- Tap **Save Mob**
- Tap **Continue** → redirects to Dashboard

> **For lecturer:** The property, paddocks, and mob were just written to three separate
> PostgreSQL tables in real time. The KgDM/ha values are calculated server-side on write
> and stored as denormalised fields — so reads are fast and never need recalculation.

---

### Step 3 · Log out

Open DevTools → Application → Local Storage → delete `anc_auth_token`
(or just navigate to `/login` which will redirect there).

---

## Part 2 — Grazier View (15 min)

### Step 4 · Log in as Grazier

Enter `grazier@granitedowns.com` / `grazier123` → **Sign in**.

---

### Step 5 · Dashboard

Point out each element:

**Top bar:**
- Greeting uses time of day — "Good morning/afternoon/evening"
- Property name: Granite Downs
- Season badge: Dormant / Growing — drives all calculations

**Metric cards (all live from the database):**
- **Feed days remaining** — total paddock KgDM ÷ daily demand
- **Total KgDM demand: 159,220** — sum of all mob daily feed demand
- **Total LSU: 167.7** — normalised livestock weight across both mobs
- **Active paddocks: 3**

**SR:CC card:**
- Ratio: `0.02` — well below 1.0, property is healthy
- Progress bar is visual — grazier can read it at a glance without knowing the formula
- Labels: Understocked / Optimal / Overstocked

**Mobs section:**
- **Dry Cows** — 120 head
- **Steers** — 85 head

> **For client:** Everything here replaces the manual spreadsheet calculation.
> A grazier can see the health of their property in under 5 seconds.

---

### Step 6 · Stock Flow Planner — Enter Head Count

Tap **Planner** in the bottom nav → `/stock-flow`

Point out:
- Mob tabs at the top — tap between **Dry Cows** and **Steers**
- Season bands: amber = Dormant (Jul–Oct), green = Growing (Nov–Jun)
- The table already has data for this month from the seed

**Add a new month entry:**
- Select the **Dry Cows** tab
- Find a month that's empty (any month without numbers)
- Enter **No.:** `125`
- Enter **Av Wt (kg):** `460`
- Tab out of the field

> Watch LSU, KgDMU, and KgDM Total fill in automatically within half a second.
> That's `POST /api/mobs/:id/stock-flow` → server calculates:
> LSU = (125 × 460) ÷ 450 = **127.8**
> KgDMU = 127.8 × 8.5 = **1086.1**
> KgDM Total = 1086.1 × 125 = **135,764**

Go back to the Dashboard → the metrics have updated to reflect the new entry.

> **For lecturer:** The frontend sends only `numberOfAnimals` and `averageWeightKg`.
> All three calculated fields come back from the server. The frontend never runs
> the formula — the source of truth is always the database.

---

### Step 7 · Feed Demand Summary

Tap **Season** → then navigate to `/feed-demand`

Point out:
- Total dormant vs growing season demand
- Per-mob breakdown
- Feed days remaining
- The line chart shows demand trend across the financial year

---

### Step 8 · Field Event Log — The 60-Second Test

Tap **Log** in the bottom nav → `/log-event`

Say: *"This is the most important screen in the app. Time me."*

1. **Mob** — select `Dry Cows`
2. **Stock class** — select `Cows`
3. **Event type** — tap the **Death** tile
4. **Quantity** — tap `+` twice → `2`
5. **Date** — already set to today
6. **Notes** — type `found near fence line`
7. Tap **Submit**

> Green confirmation: "Event logged." Form clears, ready for the next entry.
> The grazier can log another event immediately without navigating away.

**Now demo the offline queue:**

- Open Chrome DevTools → Network tab → change throttle to **Offline**
- Fill in another event: Mob = Dry Cows, Class = Cows, Event = Death, Qty = 1
- Tap **Submit**

> Instead of an error, a **sync-pending banner** appears: "Saved locally — will sync when signal returns."
> The event is queued in localStorage.

- Switch Network back to **Online**

> The banner disappears within 2 seconds as the queue flushes automatically.
> The event is now in PostgreSQL.

> **For client:** This is critical for remote paddocks with no mobile signal.
> The grazier never loses data — they just keep logging and the app handles sync.

---

### Step 9 · Closed Season Grazing Plan

Navigate to `/closed-plan`

1. Tap **Create Plan**
2. Set start date (e.g. 1 July 2026), end date (31 October 2026)

**Add an allocation:**
- Select paddock: `North Flats`
- Select mob: `Dry Cows`

> The **graze period preview** appears instantly — e.g. "42 days". That's:
> Total paddock KgDM ÷ mob daily demand. Calculated the moment you select both.

- Tap **Add Allocation**

> SR:CC bar updates in real time as you add mobs to paddocks.
> The plan warns if you're heading toward overstocking before you commit.

Add a second allocation:
- Paddock: `Hill Country`, Mob: `Steers`

> SR:CC ratio increases. If it crosses 1.0, the bar turns red and an alert appears.

> **For lecturer:** Each allocation triggers `POST /api/plans/:id/allocations`.
> The server recalculates SR:CC = total farm LSU ÷ total carrying capacity LSU
> on every write and returns the updated ratio to the frontend.

---

### Step 10 · Reports

Tap **Reports** in the bottom nav → `/reports`

Point out:
- Property selector, period selector (weekly / monthly / quarterly)
- PDF and CSV download options
- Recent reports list

---

## Summary Talking Points

| What you showed | What it replaces |
|---|---|
| Dashboard metric cards | Manual spreadsheet summary tab |
| Stock Flow Planner | Stock flow tab (manual LSU/KgDMU calculations) |
| Feed Demand Summary | Feed budget tab |
| Closed Season Plan | Closed season grazing plan tab |
| Field Event Log | Paper logbook / ad-hoc spreadsheet entries |
| Reports | Manual PDF exports |

**The 60-second test:** From opening the app to logging a stock event — under 60 seconds on a phone.

**Offline support:** Field Event Log works with no signal. All other screens require connectivity.

**Role separation:** Admin creates properties and grazier accounts. Graziers only see their own property. All role enforcement is on the server — the frontend only hides/shows screens.

---

## Common Questions

**Q: What if the grazier has no signal?**
The Field Event Log queues events locally and syncs automatically when signal returns. All other screens show an error if offline.

**Q: Can the admin see all grazier data?**
Yes. Admin can view all properties, generate reports for any property, and create new accounts.

**Q: Where is the data stored?**
PostgreSQL database. Not on the grazier's phone — losing the phone loses nothing. Daily backups can be configured on the hosted server.

**Q: Can multiple graziers share one property?**
Yes. Multiple user accounts can be linked to one property. Every event is timestamped and attributed to the user who logged it.

**Q: What happens to the spreadsheet data?**
One-time migration — the team imports property, paddock, and mob data from the spreadsheet into the database. After that, everything lives in the app.

**Q: How is SR:CC calculated?**
`SR:CC = total farm LSU ÷ total carrying capacity LSU`. Carrying capacity is derived from paddock sizes and STAC ratings. All calculated server-side.

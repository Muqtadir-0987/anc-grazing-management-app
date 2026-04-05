# ANC Grazing App — Client Walkthrough Script

**Audience:** Justin Howes, Australian Natural Capital (ANC)
**Presenter:** Developer (Muqtadir / Team)
**Duration:** ~20–25 minutes
**Demo URL:** http://localhost:5173

> **Presenter notes** are in *italics* — don't read these aloud, they're your cues.
> Bold text marks what you're pointing at on screen.

---

## Before You Begin

- App is running at http://localhost:5173
- Open it on your phone as well if possible (it's mobile-first)
- Have a second window ready to show the Setup screen at /setup

---

## Opening (1 min)

"Justin, thanks for your time today. What we're going to show you is the working demo of the ANC Grazing app — the digital replacement for the Grazing_Plan_Simple_V13 spreadsheet your graziers are currently using.

The core idea is simple: a grazier should be able to pull out their phone in a paddock, log a stock event, and be done in under 60 seconds. No laptop, no spreadsheet, no signal required for field entries.

We'll walk through every screen together. Feel free to stop me at any point."

---

## Screen 1 — Login `/login`

*Navigate to http://localhost:5173 — it will redirect to the Login screen.*

---

### What the grazier sees first

"This is the first screen any user sees when they open the app."

**Green header panel at the top:**
"The green hero area at the top carries the ANC brand — the logo icon, the app name 'ANC Grazing', and the tagline 'Australian Natural Capital'. This establishes immediately that this is your organisation's tool, not a generic off-the-shelf product."

**'Sign in' heading:**
"Below the green section, the white card lifts up and presents the login form. We use a card-on-hero layout — it's a common mobile pattern that feels clean on a phone."

**Email address field:**
"Standard email input. The label sits above the field — not as a placeholder inside it — so the grazier always knows what they're typing into, even after they've started typing."

**Password field:**
"The password field has a **show/hide toggle** — the eye icon on the right. Graziers in the field often struggle with passwords, especially with gloves on or bright sunlight. This lets them verify what they've typed before submitting."

**'Forgot?' link:**
"The Forgot password link sits right next to the Password label so it's easy to find without scrolling. In the full build this will trigger a password reset email."

**'Keep me logged in' checkbox:**
"This keeps the grazier logged in for 24 hours so they don't have to re-enter credentials every time they open the app. Important for field use — they shouldn't have to think about authentication."

**Error message area:**
"If someone enters the wrong credentials, a plain-language error message appears here — something like 'Incorrect email or password.' Importantly, we never tell them *which* one is wrong — that's a security best practice."

**'Sign in' button:**
"Large, full-width, green button. 44px tall minimum — meets accessibility touch target guidelines. When you tap it, the button text changes to 'Signing in…' so the user knows something is happening."

**Footer — 'Don't have an account?' text:**
"The footer explains that accounts are set up by ANC advisors — graziers can't self-register. That keeps the system clean and ensures every user is a verified ANC client."

**Footer icons (leaf, mountain, tractor):**
"The three small icons at the very bottom — leaf, mountain, tractor — reinforce the agricultural identity of the product. Subtle but intentional."

*Now log in: type any email and password, tap Sign in.*

"In this demo, any email and password will work — it's mock data. In the production build, it will validate against your real user database."

---

## Screen 2 — Dashboard `/dashboard`

*You should now be on the Dashboard.*

---

"This is the home screen — the first thing a grazier sees every morning. The goal is to answer three questions at a glance: How's my feed looking? How are my mobs? Is anything at risk?"

### Top app bar

**Greeting — 'Good morning, Grazier':**
"The greeting changes based on time of day — morning, afternoon, evening. It also uses the grazier's first name once they're set up. Small touch, but it makes the app feel personal."

**Property name — 'Granite Downs':**
"Below the greeting is the property name. If an ANC advisor manages multiple properties, they'd see a different property here. In the demo we're showing Granite Downs."

**Season badge — 'Dormant season':**
"Top right. This tells the grazier which season they're in — Dormant (dry/winter) or Growing (wet/summer). The app's calculations change depending on season, so this is important context."

**Avatar initials:**
"The circle with the user's initial — tapping this in the full build opens profile settings and logout."

---

### Alert banner

**Amber warning strip:**
"This amber banner is one of the most important elements in the whole app. It fires automatically when the SR:CC ratio — that's Stocking Rate to Carrying Capacity — approaches or exceeds 1.0.

Right now it reads: *'SR:CC at 0.91 — approaching threshold. Review paddock allocation for North Flats mob.'*

In the full build this is driven by live data. When a property hits 1.0 or above, the banner turns red and the language gets more urgent — 'Action required.' This replaces the manual calculation your graziers currently have to do in the spreadsheet."

---

### Metric cards (2×2 grid)

"Below the alert we have four quick-read metric cards. These are the numbers a grazier checks first thing in the morning."

**Feed days remaining — 47 days:**
"How many days of feed is left on the property at current stocking levels. This is the number graziers worry about most during dormant season. It's shown in green when healthy, and will turn amber or red as it drops. This comes from the feed demand calculations we do in the background — it replaces the manual counting in the spreadsheet."

**Total KgDM demand — 3,840:**
"KgDM stands for Kilograms of Dry Matter. This is the total amount of feed the entire herd is consuming each day. It helps the grazier understand the pressure their stock is putting on the land."

**Total LSU — 320:**
"LSU is Livestock Standard Unit — a normalised way to compare animals of different sizes. A 450kg cow is 1 LSU. A weaner is less. This total tells the grazier the equivalent 'weight' of all their stock combined. It feeds directly into the SR:CC calculation."

**Active paddocks — 6:**
"How many paddocks are currently being grazed. Useful at a glance to see if the property is being managed with rotation or if too many paddocks are open at once."

---

### SR:CC ratio card

"This is the most technical card on the dashboard — let me walk through it carefully."

**Title and subtitle — 'SR:CC ratio' / 'Stocking Rate vs Carrying Capacity':**
"We spell out the full name in the subtitle so graziers who aren't familiar with the abbreviation can still understand it."

**The ratio number — 0.91:**
"Shown top-right of the card, in amber because it's approaching 1.0. If it were above 1.0 it would be red. Below 0.85 it would be neutral. This number tells the grazier: for every unit of carrying capacity on your land, you have 0.91 units of stock. You're close to the limit."

**The progress bar:**
"The horizontal bar visually represents the same ratio. The amber fill goes from left (understocked) to right (overstocked). At 0.91, the bar is nearly full. This is far easier to read at a glance than the number alone — especially on a phone in a paddock."

**Labels — Understocked / Optimal / Overstocked:**
"Three labels under the bar give the grazier plain-language context for where they sit. No jargon."

---

### Mobs section

**'Mobs' heading with 'View all' link:**
"The mobs section shows the grazier their stock groups at a glance. 'View all' will navigate to the Stock Flow Planner — a more detailed screen we'll build in the next sprint."

**Mob cards — North Flats Mob, Hill Country Steers, Replacement Heifers:**
"Each mob card shows:
- A colour dot to quickly distinguish mobs visually
- The mob name
- Head count
- Which paddock they're currently in

So at a glance the grazier knows: 120 head of my North Flats Mob are in Paddock 14B. That's information that currently lives in the spreadsheet or in the grazier's head."

**Three-dot icon on each card:**
"The vertical dots on the right will open a context menu — Move mob, Edit, View details. That's coming in the next sprint."

---

### Bottom navigation bar

"Fixed at the bottom of every screen. Five tabs:"

**Home (house icon):**
"Takes you back to this dashboard from anywhere."

**Log (clipboard icon):**
"Quick access to the Field Event Log — the screen for recording deaths, sales, purchases, treatments. The most important screen for daily use."

**Planner (calendar icon):**
"The Stock Flow Planner — where graziers plan rotations and track mob movements."

**Season (sun/cloud icon):**
"The Closed Season Grazing Plan — the dormant season planning tool that replaces the most complex tab in the spreadsheet."

**Reports (bar chart icon):**
"PDF and CSV report generation — weekly, monthly, or quarterly."

"The active tab is highlighted so the grazier always knows where they are."

---

## Screen 3 — Property & Paddock Setup `/setup`

*Navigate to http://localhost:5173/setup or tap the Setup option.*

---

"This screen is for first-time setup — or any time a grazier needs to update their property configuration. It's a three-step wizard."

### Step progress indicator

**Steps 1, 2, 3 with connecting lines:**
"The stepper at the top shows where the grazier is in the setup process. Completed steps show a green tick. The active step is highlighted. Steps not yet reached are greyed out. This gives a clear sense of progress — they're not dropped into a long form with no end in sight."

---

### Step 1 — Property details

*This step is greyed out in the demo — we start at Step 2.*

"Step 1 captures the property name, location, total area in hectares, and financial year start month. This maps directly to what's at the top of the spreadsheet. We skip past it in this demo."

---

### Step 2 — Paddocks

**'Your paddocks' heading with 'Add paddock' button:**
"This is the paddock management section. The '+ Add paddock' button opens the inline form below."

*Click '+ Add paddock' to show the form.*

**Paddock Name field:**
"Free-text input for the paddock name — whatever the grazier calls it. River Flats, The Gums, Paddock 14B. We don't impose naming conventions."

**Size (ha) field:**
"The paddock size in hectares. This feeds into the feed capacity calculation — the bigger the paddock, the more feed it can hold."

**STAC Rating buttons — 3, 6, 9, 12:**
"STAC is a pasture height rating your graziers already use. 3 is Sole height, 6 is Toe, 9 is Ankle, 12 is Calf. The grazier taps one of the four buttons — no typing required. This is important for field use.

The STAC rating drives the KgDM per hectare calculation: STAC × 11.25. So a paddock rated 9 has 101.25 KgDM per hectare of available feed. The app does that calculation automatically."

**Calculated KgDM/ha display:**
"Once the paddock is saved, the calculated value appears on the paddock card — shown as a read-only number. The grazier never has to calculate this themselves."

*Fill in a paddock name, size, and STAC rating. Click Save Paddock.*

**Paddock card (after saving):**
"The saved paddock appears as a card. It shows the name, size, STAC pills (with the selected one highlighted), and the calculated KgDM/ha value.

The pencil icon edits the paddock. The bin icon deletes it — with a confirmation prompt so nothing is deleted accidentally."

*Add a second paddock to show the list building up.*

"The grazier works through all their paddocks one by one. In a real setup, a property like Granite Downs might have 15–20 paddocks. This replaces the paddock tab in the spreadsheet."

**Continue button:**
"Once all paddocks are entered, the grazier taps Continue to move to Step 3."

---

### Step 3 — Mobs and classes

*Click Continue to advance to Step 3.*

**Mob Name field:**
"The grazier enters a name for their mob — 'Dry Cows', 'Weaners', 'North Flats Mob' — whatever they call the group."

**Stock Class chips — Calves, Weaners, Cows, Bulls, Cull Cows:**
"The grazier taps the stock classes that make up this mob. These are the same classes used in the ANC methodology. The chip toggles on and off — selected ones are highlighted green.

This tells the system what weight ranges to validate against when a grazier logs a stock event. For example, you can't log a death of 5 Cows if only 3 Cows are recorded in that mob."

**Save Mob button:**
"Saves the mob. The grazier can then add another mob. A property typically has 2–5 named mobs."

**Continue / Back navigation:**
"The Back button returns to the previous step without losing data. Continue from Step 3 navigates to the Dashboard."

---

## Screens Coming in Next Sprint

*Navigate to the bottom nav tabs to show the placeholder screens.*

"These screens are built and wired up — you can see them in the navigation. They show a 'Coming in the next sprint' placeholder. Let me quickly describe what each one will do."

**Field Event Log `/log-event`:**
"The most important screen in the whole app. A simple form — Mob, Stock class, Event type, Quantity, Date, Notes. The event types are: death, purchase, sale, transfer, vaccination, treatment.

This works offline — if the grazier has no signal in a remote paddock, they fill in the form, hit Submit, and the event is queued locally. The moment they get signal, it syncs automatically. The grazier gets a confirmation either way — 'Saved' if online, 'Queued — will sync when signal returns' if offline."

**Stock Flow Planner `/stock-flow`:**
"A monthly view of all mobs — head count, average weight, LSU, daily KgDM demand. This replaces the stock flow tab in the spreadsheet. All the LSU and KgDM calculations happen on the server — the grazier just enters head count and average weight."

**Feed Demand Summary `/feed-demand`:**
"An aggregated view across all mobs showing total daily feed demand for the property. Used for planning — 'Do I have enough feed to last to the end of the dormant season?' Feeds directly into the Feed days remaining number on the dashboard."

**Closed Season Grazing Plan `/closed-plan`:**
"The digital version of the closed season tab in the spreadsheet. The grazier allocates mobs to paddocks for the dormant season. The app calculates graze period — how many days a mob can graze each paddock — and flags the SR:CC ratio in real time as allocations are made."

**Reports `/reports`:**
"PDF and CSV export. The grazier or ANC advisor selects a property, a date range (weekly, monthly, quarterly), and downloads a report covering mob summary, stock flow, feed demand, and SR:CC status. Admin users can pull reports for any property."

---

## Closing (2 min)

"That's the full demo of what's built so far.

To summarise what you're seeing:
- A mobile-first app designed specifically for graziers in the field
- The Login and Dashboard are fully complete
- Property and Paddock Setup is complete
- The remaining screens — Field Event Log, Stock Flow Planner, Feed Demand, Closed Season Plan, Reports — are being built in the current and next sprint

Everything we've shown replaces manual calculations in the spreadsheet with automatic, server-side computation. The grazier enters the raw data — head count, weight, STAC rating — and the app does the rest.

Justin, happy to take any questions or go back and look at anything in more detail."

---

## Common Questions & Suggested Answers

**Q: What happens if the grazier has no phone signal?**
> The Field Event Log screen works fully offline. Events are saved locally and sync automatically when signal returns. All other screens require a connection and will show an error message if there's no signal.

**Q: Can an ANC advisor see all properties?**
> Yes. Admin accounts can see all properties, generate reports for any client, and create new grazier accounts. Grazier accounts only see their own property.

**Q: How do we get graziers set up with accounts?**
> An ANC advisor logs in as admin and creates a grazier account via the admin panel. The grazier gets their credentials and logs in — they never self-register.

**Q: Will the SR:CC alert go to their phone?**
> In the MVP, the alert appears on the dashboard every time they open the app. Push notifications are out of scope for the MVP but can be added post-launch.

**Q: What happens to the existing spreadsheet data?**
> The team can assist with a one-time data migration — importing property, paddock, and mob data from the spreadsheet into the database. Ongoing, all data lives in the app.

**Q: Is data backed up?**
> The database runs on a hosted PostgreSQL server with automated daily backups. Data is not lost if a grazier loses their phone.

**Q: Can multiple graziers access the same property?**
> Yes. Multiple user accounts can be linked to one property. All events are timestamped and attributed to the user who logged them.

---

*End of script.*

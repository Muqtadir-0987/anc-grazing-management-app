# CLAUDE.md — ANC Grazing Management Web App
 
This file is the single source of truth for Claude Code when working on this project.
Read this before touching any file.
 
---
 
## Project Context
 
**Client:** Australian Natural Capital (ANC), Toowong QLD
**Contact:** Justin Howes — justin@aus-nc.com
**Project:** MBIS5015 Capstone — Masters of Business Information Systems
**Status:** Development phase — Sprint 2 onward
 
This app replaces a complex Excel spreadsheet (Grazing_Plan_Simple_V13) used by
ANC's grazier clients. The north star metric is: **a grazier can log a stock event
in under 60 seconds from a phone in a paddock.**
 
Users are cattle/sheep farmers in rural Australia. Many are not tech-savvy. Keep
the UI simple, large touch targets, plain language everywhere.
 
---
 
## Team Roles (for context)
 
| Name | Role |
|---|---|
| Kajal Bibyan | Team Lead & Scrum Master |
| Abdul Saud Khan | Back End Developer |
| Muqtadir Ahmed Mohammed | Front End Developer |
| Mohd Abdul Muqeet | Full Stack Developer / DevOps |
| Prabhjot Kaur | UX/UI Designer |
| Rohit Sharma | Business Analyst & QA Lead |
 
---
 
## Tech Stack
 
| Layer | Technology | Version |
|---|---|---|
| Frontend | React.js | 18.x |
| Build tool | Vite | 5.x |
| Backend | Node.js + Express | 20.x LTS / 4.x |
| ORM | Prisma | 5.x |
| Database | PostgreSQL | 16.x |
| Auth | JWT (jsonwebtoken) | 9.x |
| Charts | Chart.js | 4.x |
| PDF export | jsPDF | 2.x |
| CSV export | Node.js built-in | — |
| Offline queue | localStorage | — |
| Version control | GitHub | — |
| Task management | GitHub Projects (Kanban) | — |
 
---
 
## Repository Structure
 
```
/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── pages/           # One file per screen
│       ├── components/      # Reusable UI pieces (MobRow, PaddockCard, EventForm)
│       ├── services/        # Functions that call the API (api.js, auth.js, etc.)
│       └── hooks/           # useOfflineQueue, useAuth
├── server/                  # Node.js + Express backend
│   └── src/
│       ├── routes/          # HTTP request handling only
│       ├── services/        # Business logic and all calculations
│       └── models/          # Prisma database queries
├── prisma/
│   └── schema.prisma        # Database schema
└── .env.example             # Placeholder env vars — never commit .env
```
 
---
 
## Frontend Screens
 
These are all the screens to build. Build them in this order of priority.
 
| Screen | URL | Who sees it | Priority |
|---|---|---|---|
| Login | `/login` | Everyone | Must Have |
| Dashboard | `/dashboard` | Admin + Grazier | Must Have |
| Field Event Log | `/log-event` | Grazier | Must Have |
| Property & Paddock Setup | `/setup` | Grazier | Must Have |
| Stock Flow Planner | `/stock-flow` | Grazier | Must Have |
| Feed Demand Summary | `/feed-demand` | Grazier | Must Have |
| Closed Season Grazing Plan | `/closed-plan` | Grazier | Must Have |
| Reports | `/reports` | Admin + Grazier | Must Have |
| All Properties (admin view) | `/admin/properties` | Admin only | Must Have |
 
**Out of scope for MVP:**
- Open season (growing) grazing plan
- Feed-on-hand projection graph (add only if sprint capacity allows)
- Live rainfall API
- Satellite imagery / NDVI
 
---
 
## Authentication
 
- Login is email + password
- Backend returns a JWT token on success
- Store token in `localStorage` as `anc_auth_token`
- Every API call sends the token in the `Authorization: Bearer <token>` header
- Token contains `userId`, `role`, and `propertyId`
- Token expires after 24 hours
- Two roles: `admin` and `grazier`
- Role checks live in the **backend**. The frontend just hides/shows screens.
  Never trust frontend-only role checks for security.
- Return the same error message for wrong email or wrong password (don't leak
  which emails are registered)
 
### useAuth hook
 
```js
// hooks/useAuth.js
// Exposes: user, token, login(), logout(), isAdmin()
// Reads from localStorage on mount
// Clears localStorage on logout
```
 
---
 
## Offline Support
 
Only the **Field Event Log screen** works offline. Everything else requires a
connection — show an error message if they try to load other screens without signal.
 
### How it works
 
1. On dashboard load, cache these to localStorage:
   - `anc_mobs` — mob list for the property
   - `anc_stock_classes` — stock class lookup list
   - `anc_event_types` — event types list
   - `anc_offline_queue` — pending events not yet synced (starts empty)
 
2. When user submits an event form:
   - **If online:** POST to `/api/events` immediately
   - **If offline:** Save event to `anc_offline_queue` in localStorage, show
     sync-pending banner
 
3. Detect connection using `navigator.onLine` and the browser `online` event
 
4. When signal returns, flush the queue automatically:
   - POST each queued event to `/api/events`
   - On success: remove from queue
   - On failure (e.g. server rejects due to conflict): keep in queue, show the
     user which event failed and why
 
5. Always show a banner when `anc_offline_queue` has items
 
### useOfflineQueue hook
 
```js
// hooks/useOfflineQueue.js
// Exposes: queue, addToQueue(), flushQueue(), queueLength
// Listens for window 'online' event and triggers flush automatically
```
 
**Known limitation:** If the browser tab is closed before syncing, the queue is
lost. This is accepted for the MVP.
 
---
 
## API Reference
 
Base URL: `http://localhost:3000/api`
 
All endpoints except `/auth/login` require `Authorization: Bearer <token>` header.
 
### Status codes
 
| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad request or validation error |
| 401 | Not logged in |
| 403 | Wrong role or wrong property |
| 404 | Not found |
| 500 | Server error |
 
### Auth
 
```
POST   /api/auth/login           Log in, returns JWT token
POST   /api/auth/create-user     Admin creates a grazier account
```
 
### Properties & Paddocks
 
```
GET    /api/properties                          Grazier: own only. Admin: all.
POST   /api/properties                          Admin only — create a property
GET    /api/properties/:id                      One property with its paddocks
POST   /api/properties/:id/paddocks             Add a paddock
PUT    /api/paddocks/:id                        Update a paddock
DELETE /api/paddocks/:id                        Delete a paddock
```
 
### Mobs & Stock Flow
 
```
GET    /api/properties/:id/mobs                 All mobs for a property
POST   /api/properties/:id/mobs                 Create a mob
GET    /api/stock-classes                       Stock class lookup list
GET    /api/mobs/:id/stock-flow                 Stock flow entries for a mob
POST   /api/mobs/:id/stock-flow                 Save entry (LSU etc. calculated server-side)
GET    /api/properties/:id/feed-demand          Aggregated feed demand summary
```
 
### Stock Events
 
```
GET    /api/properties/:id/events               All events for a property
POST   /api/events                              Log a stock event
```
 
### Grazing Plans
 
```
POST   /api/properties/:id/plans                Create a closed season plan
GET    /api/plans/:id                           Get plan with all allocations
POST   /api/plans/:id/allocations               Allocate paddock to a mob
DELETE /api/allocations/:id                     Remove an allocation
```
 
### Dashboard & Reports
 
```
GET    /api/dashboard                           All dashboard data in one call
POST   /api/properties/:id/reports              Generate and download a report
```
 
### Example: Log a stock event
 
Request:
```json
POST /api/events
{
  "mobId": "uuid",
  "stockClass": "Cows",
  "eventType": "death",
  "quantity": 2,
  "date": "2026-03-18",
  "notes": "found near fence line"
}
```
 
Validation failure:
```json
400 Bad Request
{ "error": "Quantity (2) exceeds current Cows total (1)." }
```
 
### Example: Stock flow entry response (server calculates fields)
 
```json
201 Created
{
  "id": "uuid",
  "numberOfAnimals": 120,
  "averageWeightKg": 480,
  "lsu": 128,
  "kgdmu": 1088,
  "kgdmTotal": 130560
}
```
 
---
 
## Domain Glossary
 
Understanding this is essential. These terms come from the spreadsheet and ANC's
methodology. Use these exact terms in variable names, labels, and comments.
 
| Term | Meaning |
|---|---|
| **Mob** | A named group of livestock on a property (e.g. "Dry Cows", "Weaners") |
| **Paddock** | A fenced area of land on the property |
| **LSU** | Livestock Standard Unit — a normalised measure of animal size |
| **KgDM** | Kilograms Dry Matter — the unit for measuring feed |
| **KgDMU** | KgDM per unit — daily feed demand per LSU |
| **STAC rating** | Pasture height rating: 3 (Sole), 6 (Toe), 9 (Ankle), or 12 (Calf) |
| **SR:CC** | Stocking Rate to Carrying Capacity ratio. > 1.0 means overstocked. |
| **Dormant season** | The dry/winter period — non-growing season |
| **Growing season** | The wet/summer period — feed is actively growing |
| **Closed season plan** | The dormant season grazing plan (MVP scope) |
| **Open season plan** | The growing season plan — out of scope for MVP |
| **Graze period** | How many days a mob can graze a paddock before feed runs out |
 
---
 
## Agricultural Calculations
 
**These run server-side only.** The frontend displays the values returned by the
API. Do not recalculate in the frontend — the source of truth is always the server.
 
```
LSU = (numberOfAnimals × averageWeightKg) / 450
KgDMU = LSU × 8.5
KgDM Total = KgDMU × numberOfAnimals
KgDM per ha = STAC rating × 11.25
Total paddock KgDM = paddock size (ha) × KgDM per ha
Graze period (days) = total paddock KgDM / mob daily KgDM demand
SR:CC = total farm LSU / total carrying capacity LSU
```
 
---
 
## Input Validation Rules
 
These run on the backend. The frontend should show the error returned by the API
on the same screen, without clearing the user's input.
 
### Weight ranges by stock class
 
| Stock class | Min (kg) | Max (kg) |
|---|---|---|
| Calves / Lambs | 30 | 200 |
| Weaners | 80 | 300 |
| Cows / Ewes | 250 | 700 |
| Bulls | 350 | 900 |
| Cull Cows | 200 | 650 |
 
### Other validation rules
 
- Event quantity cannot exceed current mob total for that stock class
- STAC rating must be 3, 6, 9, or 12 — no other values allowed
- Stock flow entries require both number of animals and average weight
- SR:CC > 1.0 triggers a red warning — flag it visually in the UI
 
---
 
## Database Schema Summary
 
10 tables total. Everything connects back to `Property`.
 
| Table | Key fields |
|---|---|
| `User` | id, name, email, passwordHash, role (admin/grazier), propertyId |
| `Property` | id, name, location, totalAreaHa, financialYearStart |
| `Paddock` | id, propertyId, name, sizeHa, stacRating, kgdmPerHa*, totalKgdm* |
| `Mob` | id, propertyId, name |
| `StockClass` | id, name, minWeightKg, maxWeightKg (lookup table) |
| `StockFlowEntry` | id, mobId, stockClassId, month, year, seasonType, numberOfAnimals, averageWeightKg, lsu*, kgdmu*, kgdmTotal* |
| `StockEvent` | id, mobId, stockClassId, eventType, quantity, date, notes, createdAt, createdByUserId |
| `GrazingPlan` | id, propertyId, seasonType, startDate, endDate, totalPlanDays*, srccRatio*, srccStatus* |
| `PaddockAllocation` | id, planId, paddockId, mobId, grazePeriodDays*, surplusDeficitKgdm* |
| `FeedEstimate` | id, paddockId, date, estimatedBiomassKgDmPerHa, growthRateKgDmPerHaPerDay |
 
`*` = calculated server-side on write, never entered by user
 
`seasonType` enum: `'dormant'` or `'growing'`
`srccStatus` enum: `'balanced'` or `'overstocked'`
`eventType` enum: `death`, `purchase`, `sale`, `transfer`, `vaccination`, `treatment`
`role` enum: `'admin'` or `'grazier'`
 
---
 
## localStorage Keys
 
| Key | What it stores | When it's set |
|---|---|---|
| `anc_auth_token` | JWT token | On login |
| `anc_mobs` | Mob list for the property | On dashboard load |
| `anc_stock_classes` | Stock class list | On dashboard load |
| `anc_event_types` | Event types list | On dashboard load |
| `anc_offline_queue` | Pending unsynced events (array) | When event saved offline |
 
---
 
## Non-Functional Requirements to Keep in Mind
 
| Requirement | Target |
|---|---|
| Core screens load | Within 3 seconds on 4G |
| Field event screen interactive | Within 2 seconds |
| Calculated fields update | Within 500ms of input change |
| SR:CC recalculates | Within 2 seconds of allocation change |
| Report generation | Within 10 seconds |
| Min viewport | 375px wide (mobile-first) |
| Touch targets | Minimum 44×44px for all buttons and inputs |
| Field event screen reachable | In 4 taps or fewer from dashboard |
| Error messages | Say which field failed and why, in plain language |
 
---
 
## UI/UX Rules
 
These are non-negotiable. The users are graziers in the field, not tech workers.
 
1. **Mobile-first.** Design for 375px width first. Desktop is secondary.
2. **Large touch targets.** Every button and input must be at least 44×44px.
3. **Plain language.** No jargon in labels, error messages, or button text unless
   it's a domain term from the glossary above (e.g. "LSU", "STAC").
4. **No data loss.** Never clear a form on validation failure. Show the error
   next to the field. Keep the user's values.
5. **SR:CC > 1.0 = red.** Always visually highlight overstocked status in red.
6. **Offline banner.** When `anc_offline_queue` is not empty, show a persistent
   banner at the top of the Field Event Log screen.
7. **Calculated fields are read-only.** LSU, KgDMU, KgDM Total, graze period,
   SR:CC — display these but never let the user type into them.
8. **Sync feedback.** When online events are saved, confirm success. When offline,
   confirm queued. Don't leave the user guessing.
9. **Accessible.** All form elements need labels. Don't rely on placeholder text
   as the only label.
 
---
 
## Security Rules
 
1. **Never store plaintext passwords.** Backend uses bcrypt.
2. **Never commit `.env`.** A `.env.example` with placeholder values is fine.
3. **JWT in localStorage.** Known XSS risk — accepted for MVP. Note for post-MVP:
   move to httpOnly cookies.
4. **Role checks are backend-only.** The frontend hides screens from graziers but
   the backend enforces it. Frontend role checks are just UX.
5. **Property isolation.** Graziers can only access their own property's data.
   The backend gets `propertyId` from the JWT token — never from the URL.
6. **Same error for wrong email or wrong password.** Prevents email enumeration.
 
---
 
## Report Export
 
- PDF: generated server-side using `jsPDF`. Returns as a file download.
- CSV: generated server-side using Node.js built-in string building. No library.
- Report contents: property name, period, mob summary, stock flow data, feed demand,
  SR:CC status.
- Available intervals: weekly, monthly, quarterly.
- Admin users can generate reports for any property.
- Grazier users can only generate reports for their own property.
 
---
 
## What NOT to Build (Out of Scope)
 
- Open season / growing season grazing plan
- Live rainfall API integration
- Satellite imagery or NDVI data
- Scenario planning tools
- AI-generated recommendations
- Emissions tracking
- NLIS (National Livestock Identification System) integration
- Production cloud deployment (demo runs on localhost)
- Feed-on-hand projection graph — only build this if sprint capacity allows after
  all Must Have features are done
 
---
 
## Quick Reference: Field Event Log Screen
 
This is the most important screen in the app. It must be fast, simple, and work
offline.
 
Fields on the form:
- Mob (dropdown — populated from `anc_mobs` cache)
- Stock class (dropdown — populated from `anc_stock_classes` cache)
- Event type (dropdown: death, purchase, sale, transfer, vaccination, treatment)
- Quantity (number input)
- Date (date picker — defaults to today)
- Notes (optional text area)
 
Submit behaviour:
- Validate quantity against current mob total before submitting
- If online: POST to `/api/events`
- If offline: save to `anc_offline_queue`, show banner
- On success: clear form, show confirmation, stay on screen (grazier may log more)
- On validation error: show error next to the failing field, keep all other values
 
---
 
## Quick Reference: Dashboard
 
Data comes from a single `GET /api/dashboard` call.
 
For grazier role, show:
- Mob locations (which paddock each mob is in)
- Feed-on-hand status per paddock
- Days of feed remaining
- SR:CC status with red highlight if > 1.0
 
For admin role, show:
- Summary card per client property
- Highlight properties that are near or over SR:CC threshold
 
---
 
## Dev Notes
 
- **No Redux or Zustand.** React component state is enough. The only global state
  is the JWT token and user role, both from localStorage.
- **No separate mobile app.** Graziers open the web app in their phone browser.
- **Calculations are pure functions on the backend.** They take numbers in and
  return numbers out. Keep them in `server/src/services/calculations.js`.
- **Don't cross layers.** Routes call services. Services call models. Models talk
  to Prisma. Nothing else.
- **Test the offline flow.** Use Chrome DevTools → Network → Offline to simulate
  no signal. The queue banner must appear and events must sync when you go back online.
- **The 60-second test.** From opening the app to successfully logging a field event
  must be completable in under 60 seconds on a phone. Test this regularly.
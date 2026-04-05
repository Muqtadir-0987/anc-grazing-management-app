# ANC Grazing Management App

A mobile-first web application built for Australian Natural Capital (ANC) as part of the MBIS5015 Capstone project. It replaces a complex Excel spreadsheet (Grazing_Plan_Simple_V13) used by ANC grazier clients to manage livestock, paddocks, and feed planning in the field.

**North star metric:** A grazier can log a stock event in under 60 seconds from a phone in a paddock.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Two Ways to Run](#two-ways-to-run)
3. [Tech Stack](#tech-stack)
4. [Team](#team)
5. [Prerequisites](#prerequisites)
6. [Option A — Demo Mode (Frontend Only)](#option-a--demo-mode-frontend-only)
7. [Option B — Full Stack (Development Branch)](#option-b--full-stack-development-branch)
   - [Step 1 — Clone the repository](#step-1--clone-the-repository)
   - [Step 2 — Install Node.js](#step-2--install-nodejs)
   - [Step 3 — Install PostgreSQL](#step-3--install-postgresql)
   - [Step 4 — Create the database](#step-4--create-the-database)
   - [Step 5 — Configure and start the backend](#step-5--configure-and-start-the-backend)
   - [Step 6 — Install and start the frontend](#step-6--install-and-start-the-frontend)
8. [Default Login Credentials](#default-login-credentials)
9. [Screens](#screens)
10. [Project Structure](#project-structure)
11. [Available Scripts](#available-scripts)
12. [Agricultural Calculations](#agricultural-calculations)
13. [Domain Glossary](#domain-glossary)
14. [Troubleshooting](#troubleshooting)

---

## Project Overview

ANC grazier clients currently manage livestock, paddocks, and feed planning through a multi-sheet Excel spreadsheet. This app replaces that system with a mobile-responsive web application that works in the field — including in areas with limited or no phone signal.

The app handles two user roles:
- **Grazier** — manages their own property, logs field events, plans rotations
- **Admin (ANC advisor)** — can view and report on all client properties

---

## Two Ways to Run

| Mode | Branch | Needs backend? | Needs database? | Best for |
|---|---|---|---|---|
| **Demo** | `demo` | No | No | Client demonstrations, UI review |
| **Full Stack** | `development` | Yes | Yes | Development, testing, full functionality |

The `demo` branch uses mock data throughout — no backend or database is required. The `development` branch connects to a real Express + PostgreSQL backend.

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

---

## Team

**Group 13 — MBIS5015 Capstone 2026**

| Name | Role |
|---|---|
| Kajal Bibyan | Team Lead & Scrum Master |
| Abdul Saud Khan | Back End Developer |
| Muqtadir Ahmed Mohammed | Front End Developer |
| Mohd Abdul Muqeet | Full Stack Developer & DevOps |
| Prabhjot Kaur | UX/UI Designer |
| Rohit Sharma | Business Analyst & QA Lead |

**Client:** Australian Natural Capital (ANC) — Justin Howes (justin@aus-nc.com)

---

## Prerequisites

| Tool | Purpose | How to check |
|---|---|---|
| Git | Clone the repository | `git --version` |
| Node.js 20+ | Run frontend and backend | `node --version` |
| npm 10+ | Install packages | `npm --version` |
| PostgreSQL 16 | Database (full stack only) | `psql --version` |

---

## Option A — Demo Mode (Frontend Only)

Use this if you just want to show the UI without setting up a database or backend. All data is mocked — no credentials required.

**1. Clone the repository and switch to the demo branch:**

```bash
git clone https://github.com/Muqtadir-0987/anc-grazing-management-app.git
cd anc-grazing-management-app
git checkout demo
```

**2. Install frontend dependencies:**

```bash
cd client
npm install
```

**3. Start the frontend:**

```bash
npm run dev
```

**4. Open the app:**

Go to **http://localhost:5173** in your browser.

Type any email and any password on the login screen — the demo accepts all credentials and loads mock data.

> The demo works entirely in the browser. No terminal needs to stay open for a backend.

---

## Option B — Full Stack (Development Branch)

Follow all steps below in order. You need two terminal windows running at the same time by the end — one for the backend, one for the frontend.

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/Muqtadir-0987/anc-grazing-management-app.git
cd anc-grazing-management-app
git checkout development
```

Verify you're on the right branch:

```bash
git branch
# * development
```

---

### Step 2 — Install Node.js

**Check if you already have it:**

```bash
node --version   # needs to be v20.x.x or higher
npm --version    # needs to be v10.x.x or higher
```

**If not installed:**

Go to **https://nodejs.org** and download the **LTS** version (20.x or higher). Run the installer and follow the prompts. Re-run the version checks above to confirm.

---

### Step 3 — Install PostgreSQL

#### macOS (Homebrew — recommended)

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PostgreSQL 16
brew install postgresql@16

# Start PostgreSQL as a background service (runs automatically on login)
brew services start postgresql@16

# Verify PostgreSQL is running — look for postgresql@16 with status "started"
brew services list
```

#### Windows

1. Download the PostgreSQL 16 installer from **https://www.postgresql.org/download/windows/**
2. Run the installer. When prompted:
   - Set a password for the `postgres` superuser — **write this down, you will need it in Step 5**
   - Keep the default port: `5432`
   - Keep the default locale
3. Complete the installation
4. Open **pgAdmin** (installed alongside PostgreSQL) to confirm it is working

#### Linux (Ubuntu / Debian)

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

### Step 4 — Create the database

#### macOS / Linux

```bash
createdb anc_grazing
```

If that gives a "role does not exist" error, try:

```bash
psql -U postgres -c "CREATE DATABASE anc_grazing;"
```

Verify the database was created:

```bash
psql -U postgres -l
# anc_grazing should appear in the list
```

#### Windows

**Option 1 — pgAdmin:**
1. Open pgAdmin
2. In the left panel, expand **Servers → PostgreSQL 16 → Databases**
3. Right-click **Databases** → **Create → Database**
4. Enter `anc_grazing` as the name and click **Save**

**Option 2 — Command line (run as Administrator):**

```bash
psql -U postgres
```

Then inside the psql prompt:

```sql
CREATE DATABASE anc_grazing;
\q
```

---

### Step 5 — Configure and start the backend

Open a terminal and navigate to the `server` folder.

#### 5a — Create the environment file

```bash
cd server
cp .env.example .env
```

Open `server/.env` in any text editor. It will look like this:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/anc_grazing"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=3000
```

Edit the two values:

- **`DATABASE_URL`** — replace `password` with the PostgreSQL password you set in Step 3.
  - On macOS with Homebrew, if you never set a password, use: `postgresql://postgres@localhost:5432/anc_grazing`
  - On Windows, it will be: `postgresql://postgres:YOUR_PASSWORD@localhost:5432/anc_grazing`
- **`JWT_SECRET`** — replace with any long random string, e.g. `myapp-super-secret-jwt-key-2026`

Save the file.

#### 5b — Install backend dependencies

```bash
# Make sure you are inside the server/ folder
npm install
```

This installs Express, Prisma, bcrypt, jsonwebtoken, and all other backend packages.

#### 5c — Generate the Prisma client

Prisma reads the database schema and generates typed query helpers. Run this once (and again any time `prisma/schema.prisma` changes):

```bash
npm run db:generate
```

Expected output:
```
✔ Generated Prisma Client (v5.x.x)
```

#### 5d — Run the database migration

This creates all 10 tables in your PostgreSQL database:

```bash
npm run db:migrate
```

When prompted for a migration name, type `init` and press Enter.

Expected output:
```
✔ Generated Prisma Client
✔ The migration `20260324000000_init` was applied successfully
```

If you see an error about the database not being found, double-check the `DATABASE_URL` in `server/.env` and confirm the `anc_grazing` database exists (Step 4).

#### 5e — Seed the database

This creates the stock class lookup data and a default admin account:

```bash
npm run db:seed
```

Expected output:
```
Seeding stock classes...
✓ Stock classes seeded
✓ Admin user created — email: admin@aus-nc.com  password: changeme123
  ⚠️  Change the admin password immediately after first login!
```

If it prints `✓ Admin user already exists`, the seed has already run — that is fine.

#### 5f — Start the backend server

```bash
npm run dev
```

Expected output:
```
Server running on http://localhost:3000
```

**Keep this terminal open.** The backend must stay running while you use the app.

---

### Step 6 — Install and start the frontend

Open a **second terminal window** (leave the backend terminal from Step 5 running).

```bash
# From the project root
cd client
npm install
```

Then start the frontend:

```bash
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Open your browser and go to http://localhost:5173**

The frontend automatically proxies all `/api` requests to `http://localhost:3000`, so the two servers work together seamlessly.

---

## Default Login Credentials

After running `npm run db:seed`, use these to log in:

| Field | Value |
|---|---|
| Email | `admin@aus-nc.com` |
| Password | `changeme123` |
| Role | Admin |

> Change this password after your first login.

**To create a grazier account:**
Log in as admin, then use `POST /api/auth/create-user` with the grazier's name, email, password, and `propertyId`.

---

## Screens

All screens are built and routed. The `development` branch connects each screen to the real API; the `demo` branch uses mock data.

| Screen | URL | Role | Notes |
|---|---|---|---|
| Login | `/login` | Everyone | JWT auth, "Keep me logged in" |
| Dashboard | `/dashboard` | Admin + Grazier | SR:CC alert, feed days, mob summary |
| Field Event Log | `/log-event` | Grazier | Works offline — queues to localStorage |
| Property & Paddock Setup | `/setup` | Grazier | 3-step wizard, STAC rating picker |
| Stock Flow Planner | `/stock-flow` | Grazier | Monthly table, inline editing, LSU calculated |
| Feed Demand Summary | `/feed-demand` | Grazier | Line chart, mob breakdown, export buttons |
| Closed Season Grazing Plan | `/closed-plan` | Grazier | Real-time SR:CC, graze period preview |
| Reports | `/reports` | Admin + Grazier | Weekly/monthly/quarterly, PDF + CSV export |
| All Properties (Admin) | `/admin/properties` | Admin | Placeholder — next sprint |

---

## Project Structure

```
anc-grazing-management-app/
├── client/                        # React 18 frontend (Vite 5)
│   ├── public/
│   └── src/
│       ├── assets/                # Logo SVG
│       ├── components/
│       │   └── BottomNav.jsx      # Fixed bottom navigation bar
│       ├── hooks/
│       │   ├── useAuth.js         # JWT token read/write, login(), logout(), isAdmin()
│       │   └── useOfflineQueue.js # localStorage queue, auto-flush on reconnect
│       ├── pages/
│       │   ├── Login.jsx + .module.css
│       │   ├── Dashboard.jsx + .module.css
│       │   ├── Setup.jsx + .module.css
│       │   ├── StockFlow.jsx + .module.css
│       │   ├── FeedDemand.jsx + .module.css
│       │   ├── ClosedPlan.jsx + .module.css
│       │   ├── Reports.jsx + .module.css
│       │   └── LogEvent.jsx + .module.css
│       ├── App.jsx                # Route definitions
│       ├── main.jsx               # React entry point
│       └── index.css              # Design tokens (CSS custom properties)
│
├── server/                        # Node.js + Express backend
│   └── src/
│       ├── index.js               # App entry point, CORS, routes wired up
│       ├── seed.js                # One-time seed: stock classes + admin user
│       ├── lib/
│       │   └── prisma.js          # Singleton Prisma client
│       ├── middleware/
│       │   └── auth.js            # JWT verification middleware
│       ├── routes/                # HTTP handlers (thin layer — call services)
│       │   ├── auth.js
│       │   ├── properties.js
│       │   ├── paddocks.js
│       │   ├── mobs.js
│       │   ├── stockFlow.js
│       │   ├── events.js
│       │   ├── plans.js
│       │   ├── dashboard.js
│       │   └── reports.js
│       └── services/
│           └── calculations.js    # Pure functions: LSU, KgDMU, SR:CC, graze period
│
├── prisma/
│   └── schema.prisma              # 10-table schema: User, Property, Paddock, Mob,
│                                  # StockClass, StockFlowEntry, StockEvent,
│                                  # GrazingPlan, PaddockAllocation, FeedEstimate
│
├── .env.example                   # Template — copy to server/.env and fill in values
├── CLAUDE.md                      # Developer instructions (AI coding assistant config)
├── DEMO_SCRIPT.md                 # Client walkthrough script for Justin Howes (ANC)
└── README.md
```

---

## Available Scripts

### Backend — run from the `server/` folder

```bash
cd server
```

| Script | Command | What it does |
|---|---|---|
| Start (development) | `npm run dev` | Start Express with nodemon auto-reload |
| Start (production) | `npm start` | Start Express without auto-reload |
| Generate Prisma client | `npm run db:generate` | Regenerate after schema changes |
| Apply migrations | `npm run db:migrate` | Create/update tables in PostgreSQL |
| Seed database | `npm run db:seed` | Load stock classes + create admin user |

### Frontend — run from the `client/` folder

```bash
cd client
```

| Script | Command | What it does |
|---|---|---|
| Start (development) | `npm run dev` | Start Vite at http://localhost:5173 |
| Build for production | `npm run build` | Output optimised files to `client/dist/` |
| Preview production build | `npm run preview` | Serve the built output locally |

---

## Agricultural Calculations

All calculations run on the **server only** (`server/src/services/calculations.js`). The frontend displays values returned by the API and never recalculates.

| Calculation | Formula |
|---|---|
| LSU | `(numberOfAnimals × averageWeightKg) / 450` |
| KgDMU (daily demand per LSU) | `LSU × 8.5` |
| KgDM Total (mob daily demand) | `KgDMU × numberOfAnimals` |
| KgDM per ha (paddock) | `STAC rating × 11.25` |
| Total paddock KgDM | `paddock size (ha) × KgDM per ha` |
| Graze period | `total paddock KgDM / mob daily KgDM demand` |
| SR:CC ratio | `total farm LSU / total carrying capacity LSU` |

STAC ratings: `3` (Sole) · `6` (Toe) · `9` (Ankle) · `12` (Calf)

SR:CC thresholds: `< 0.85` balanced · `0.85–1.0` approaching limit · `> 1.0` overstocked (shown in red)

---

## Domain Glossary

| Term | Meaning |
|---|---|
| **Mob** | A named group of livestock on a property (e.g. "Dry Cows", "North Flats Mob") |
| **Paddock** | A fenced area of land on the property |
| **LSU** | Livestock Standard Unit — a normalised measure of animal size (1 LSU = 450 kg cow) |
| **KgDM** | Kilograms of Dry Matter — the unit for measuring available pasture feed |
| **KgDMU** | KgDM per unit — daily feed demand per LSU |
| **STAC rating** | Pasture height rating: 3 (Sole), 6 (Toe), 9 (Ankle), or 12 (Calf) |
| **SR:CC** | Stocking Rate to Carrying Capacity ratio — above 1.0 means overstocked |
| **Dormant season** | The dry/winter period — pasture is not actively growing |
| **Growing season** | The wet/summer period — pasture is actively growing |
| **Closed season plan** | The dormant season grazing plan (allocate mobs to paddocks) |
| **Graze period** | How many days a mob can graze a paddock before feed runs out |

---

## Troubleshooting

### "Cannot connect to database" / Prisma connection error

1. Confirm PostgreSQL is running:
   - macOS: `brew services list` — look for `postgresql@16` with status `started`
   - Linux: `sudo systemctl status postgresql`
   - Windows: Open Services and check PostgreSQL is running
2. Check `server/.env` — `DATABASE_URL` must have the correct password and database name
3. Confirm the database exists: `psql -U postgres -l` — `anc_grazing` should appear

### "Port 3000 already in use"

Another process is on port 3000. Either stop it, or:
1. Change `PORT=3001` in `server/.env`
2. Update the proxy in `client/vite.config.js`:
```js
proxy: {
  '/api': 'http://localhost:3001'
}
```

### "Port 5173 already in use"

Another Vite server is running. Stop it, or run:
```bash
npm run dev -- --port 5174
```

### "Prisma client not generated" error on server start

```bash
cd server
npm run db:generate
```

### Migration fails

Confirm your `DATABASE_URL` is correct and the `anc_grazing` database exists. Then retry:

```bash
cd server
npm run db:migrate
```

To fully reset during development (this deletes all data):

```bash
npx prisma migrate reset --schema=../prisma/schema.prisma
```

### App loads but shows a blank white screen

Open the browser console (F12 → Console tab). The most common causes:
- **Backend not running** — make sure `npm run dev` is running in `server/`
- **Wrong branch** — confirm you're on `development` for full stack, or `demo` for demo mode
- **Stale auth token** — open DevTools → Application → Local Storage → clear `anc_auth_token`

### Login redirects back to login immediately

A stale or expired JWT token is stored in localStorage. Clear it:
- DevTools → Application → Local Storage → `http://localhost:5173` → delete `anc_auth_token`
- Or open the browser console and run: `localStorage.clear()`

### `npm install` fails

Make sure Node.js is 20 or higher: `node --version`. If it shows v18 or below, download the LTS from https://nodejs.org and reinstall.

### The offline queue is not syncing

1. Open DevTools → Application → Local Storage → check `anc_offline_queue`
2. Make sure the backend is running on port 3000
3. Check that your auth token (`anc_auth_token`) is not expired
4. Navigate to the Field Event Log screen — syncing triggers automatically when the `online` event fires

---

*MBIS5015 Capstone — Masters of Business Information Systems — Group 13 — 2026*

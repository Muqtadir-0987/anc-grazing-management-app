# ANC Grazing Management App

A mobile-first web application built for Australian Natural Capital (ANC) as part of the MBIS5015 Capstone project. It replaces a complex Excel spreadsheet used by grazier clients to manage livestock, paddocks, and feed planning in the field.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Team](#team)
4. [Prerequisites](#prerequisites)
5. [Getting Started](#getting-started)
   - [Step 1 — Clone the repository](#step-1--clone-the-repository)
   - [Step 2 — Install Node.js](#step-2--install-nodejs)
   - [Step 3 — Install PostgreSQL](#step-3--install-postgresql)
   - [Step 4 — Create the database](#step-4--create-the-database)
   - [Step 5 — Set up the backend](#step-5--set-up-the-backend)
   - [Step 6 — Set up the frontend](#step-6--set-up-the-frontend)
   - [Step 7 — Run the app](#step-7--run-the-app)
6. [Default Login](#default-login)
7. [Project Structure](#project-structure)
8. [Available Scripts](#available-scripts)
9. [Features (MVP)](#features-mvp)
10. [Domain Glossary](#domain-glossary)
11. [Troubleshooting](#troubleshooting)

---

## Project Overview

ANC grazier clients currently manage livestock, paddocks, and feed planning through a multi-sheet Excel spreadsheet (Grazing_Plan_Simple_V13). This app replaces that system with a mobile-responsive web application that works in the field — even with limited connectivity.

**North star metric:** A grazier can log a stock event in under 60 seconds from a phone in a paddock.

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

Before you begin, make sure you have the following installed. If you are not sure, the steps below will guide you through each one.

| Tool | Purpose | Check if installed |
|---|---|---|
| Git | Clone the repository | `git --version` |
| Node.js 20+ | Run the frontend and backend | `node --version` |
| npm 10+ | Install dependencies | `npm --version` |
| PostgreSQL 16 | Database | `psql --version` |

---

## Getting Started

### Step 1 — Clone the repository

Open a terminal and run:

```bash
git clone https://github.com/your-org/anc-grazing-management-app.git
cd anc-grazing-management-app
```

> If you don't have Git, download it from https://git-scm.com

---

### Step 2 — Install Node.js

1. Go to https://nodejs.org and download the **LTS** version (20.x or higher)
2. Run the installer and follow the prompts
3. Verify the installation:

```bash
node --version   # should print v20.x.x or higher
npm --version    # should print 10.x.x or higher
```

---

### Step 3 — Install PostgreSQL

#### macOS (recommended: Homebrew)

```bash
# Install Homebrew first if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PostgreSQL
brew install postgresql@16

# Start PostgreSQL as a background service
brew services start postgresql@16

# Verify it's running
brew services list
```

#### Windows

1. Download the PostgreSQL 16 installer from https://www.postgresql.org/download/windows/
2. Run the installer. When prompted:
   - Set a password for the `postgres` user — **write this down, you'll need it**
   - Keep the default port: `5432`
   - Keep the default locale
3. Finish the installation
4. Open **pgAdmin** (installed alongside PostgreSQL) to verify it's working

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

### Step 4 — Create the database

#### macOS / Linux

```bash
createdb anc_grazing
```

If that gives a permission error, try:

```bash
psql -U postgres -c "CREATE DATABASE anc_grazing;"
```

#### Windows

Open **pgAdmin**, right-click **Databases** in the left panel, choose **Create > Database**, and enter `anc_grazing` as the name.

Or use the command line (run as Administrator):

```bash
psql -U postgres
```

Then inside the psql prompt:

```sql
CREATE DATABASE anc_grazing;
\q
```

---

### Step 5 — Set up the backend

#### 5a — Create the environment file

```bash
cd server
cp .env.example .env
```

Open `server/.env` in any text editor and fill in your details:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/anc_grazing"
JWT_SECRET="pick-any-long-random-string-here"
PORT=3000
```

> Replace `YOUR_PASSWORD` with the PostgreSQL password you set in Step 3.
> On macOS with Homebrew, if you never set a password, try `postgresql://postgres@localhost:5432/anc_grazing` (no password).

#### 5b — Install backend dependencies

```bash
# Make sure you're inside the server/ folder
npm install
```

#### 5c — Generate the Prisma client

Prisma needs to read the database schema and generate type-safe code from it:

```bash
npm run db:generate
```

#### 5d — Run the database migration

This creates all the tables in your PostgreSQL database:

```bash
npm run db:migrate
```

When prompted for a migration name, type something like `init` and press Enter.

If successful, you'll see output like:
```
✔ Generated Prisma Client
✔ The migration `20260324_init` was applied
```

#### 5e — Seed the database

This loads the required stock class data and creates a default admin account:

```bash
npm run db:seed
```

Output should include:
```
✓ Stock classes seeded
✓ Admin user created — email: admin@aus-nc.com  password: changeme123
```

---

### Step 6 — Set up the frontend

Open a **new terminal window** (keep the backend one open), then:

```bash
# From the project root
cd client
npm install
```

---

### Step 7 — Run the app

You need two terminals running at the same time.

**Terminal 1 — Backend:**

```bash
cd server
npm run dev
```

You should see:
```
Server running on http://localhost:3000
```

**Terminal 2 — Frontend:**

```bash
cd client
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

Open your browser and go to **http://localhost:5173**

---

## Default Login

After seeding, use these credentials to log in for the first time:

| Field | Value |
|---|---|
| Email | admin@aus-nc.com |
| Password | changeme123 |
| Role | Admin |

> **Important:** Change the admin password immediately after your first login.

To create a grazier account, log in as admin and use the **Create User** API or the admin panel.

---

## Project Structure

```
anc-grazing-management-app/
├── client/                    # React frontend (Vite)
│   └── src/
│       ├── pages/             # One file per screen
│       ├── components/        # Reusable UI components
│       ├── services/          # API call functions
│       └── hooks/             # useAuth, useOfflineQueue
├── server/                    # Node.js + Express backend
│   └── src/
│       ├── index.js           # App entry point
│       ├── middleware/        # Auth, error handling
│       ├── routes/            # HTTP request handling only
│       ├── services/          # Business logic + calculations
│       └── lib/               # Shared utilities (Prisma client)
├── prisma/
│   └── schema.prisma          # Database schema (10 tables)
└── README.md
```

---

## Available Scripts

### Backend (`cd server`)

| Script | What it does |
|---|---|
| `npm run dev` | Start the server with auto-reload (development) |
| `npm start` | Start the server without auto-reload (production) |
| `npm run db:generate` | Regenerate the Prisma client after schema changes |
| `npm run db:migrate` | Apply schema changes to the database |
| `npm run db:seed` | Load stock classes and create the default admin user |

### Frontend (`cd client`)

| Script | What it does |
|---|---|
| `npm run dev` | Start the development server at http://localhost:5173 |
| `npm run build` | Build the app for production |
| `npm run preview` | Preview the production build locally |

---

## Features (MVP)

- Role-based login — Admin and Grazier roles
- Property and paddock setup with STAC rating
- Stock flow planning across multiple mobs and stock classes
- Automatic calculations — LSU, KgDMU, KgDM Total, SR:CC (server-side only)
- Closed season (dormant) grazing plan
- Field event logging — deaths, purchases, sales, transfers, vaccinations, treatments
- Feed demand summary and SR:CC monitoring with overstocked alerts
- Dashboard with at-a-glance property status
- Report export in PDF and CSV formats
- Offline event logging with automatic sync when signal returns

**Out of scope for MVP:** open season plan, live rainfall API, satellite imagery, AI recommendations, cloud deployment.

---

## Domain Glossary

| Term | Meaning |
|---|---|
| Mob | A named group of livestock on a property (e.g. "Dry Cows", "Weaners") |
| Paddock | A fenced area of land on the property |
| LSU | Livestock Standard Unit — a normalised measure of animal size |
| KgDM | Kilograms Dry Matter — the unit for measuring feed |
| KgDMU | KgDM per unit — daily feed demand per LSU |
| STAC rating | Pasture height rating: 3 (Sole), 6 (Toe), 9 (Ankle), or 12 (Calf) |
| SR:CC | Stocking Rate to Carrying Capacity ratio. > 1.0 means overstocked |
| Dormant season | The dry/winter period — non-growing season |
| Graze period | How many days a mob can graze a paddock before feed runs out |

---

## Troubleshooting

### "Cannot connect to database"

- Check that PostgreSQL is running: `brew services list` (macOS) or `sudo systemctl status postgresql` (Linux)
- Double-check the `DATABASE_URL` in `server/.env` — make sure the password and database name are correct
- Make sure the `anc_grazing` database exists: `psql -U postgres -l`

### "Port 3000 already in use"

Another process is using port 3000. Either stop that process, or change the port in `server/.env` to `PORT=3001` and update `client/vite.config.js`:

```js
proxy: {
  '/api': 'http://localhost:3001'
}
```

### "Prisma client not generated"

Run `npm run db:generate` inside the `server/` folder.

### "Migration failed"

Make sure the database exists and your `DATABASE_URL` is correct. Then try:

```bash
npx prisma migrate reset --schema=../prisma/schema.prisma
```

> Warning: this will delete all data. Only use during development.

### The app shows a blank screen

Open the browser console (F12 → Console tab) and look for errors. The most common cause is the backend not running — make sure `npm run dev` is running in the `server/` folder.

### npm install fails

Make sure you're running Node.js 20+: `node --version`. If you have an older version, download the LTS from https://nodejs.org.

---

*MBIS5015 Capstone — Masters of Business Information Systems — 2026*

# ANC Grazing Management App — Demo

A mobile-first web application built for Australian Natural Capital (ANC) as part of the MBIS5015 Capstone project.

> **This is the `demo` branch.**
> It runs entirely in the browser with mock data — **no database or backend required.**
> For the full working app, see the `main` or `development` branch.

---

## What You Can Demo

All screens are fully built and wired with mock data — no backend required.

| Screen | URL | What it shows |
|---|---|---|
| Login | `/login` | Sign-in screen — enter any email and password to proceed |
| Dashboard | `/dashboard` | SR:CC alert, feed days remaining, mob list, metric cards |
| Property & Paddock Setup | `/setup` | 3-step wizard — property details, paddocks, mobs |
| Stock Flow Planner | `/stock-flow` | Monthly mob table with inline editing, LSU and KgDM calculations |
| Feed Demand Summary | `/feed-demand` | Season totals, line chart, mob breakdown, export buttons |
| Field Event Log | `/log-event` | Event type grid, mob + quantity form, offline queue indicator |
| Closed Season Grazing Plan | `/closed-plan` | SR:CC ratio bar, paddock allocations, graze period preview |
| Reports | `/reports` | Report type selector, preview panel, PDF + CSV export buttons |

---

## Requirements

You only need **two things** installed:

| Tool | Version | Check |
|---|---|---|
| Node.js | 20 or higher | `node --version` |
| npm | 10 or higher | `npm --version` |

No PostgreSQL. No backend. No `.env` file needed.

> **Don't have Node.js?**
> Download the LTS version from https://nodejs.org — run the installer and you're done.

---

## Running the Demo

### Step 1 — Clone the repository

```bash
git clone -b demo https://github.com/Muqtadir-0987/anc-grazing-management-app.git
cd anc-grazing-management-app
```

### Step 2 — Install dependencies

```bash
cd client
npm install
```

This takes about a minute the first time.

### Step 3 — Start the app

```bash
npm run dev
```

You will see:

```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### Step 4 — Open in browser

Go to **http://localhost:5173**

---

## Logging In

Enter **any email and password** — no real credentials are checked in demo mode.

Example:
- Email: `demo@aus-nc.com`
- Password: `demo1234`

Click **Sign in** and you'll land on the Dashboard.

---

## What the Dashboard Shows

The dashboard is populated with realistic mock data for a property called **Granite Downs**:

| Metric | Value |
|---|---|
| Property | Granite Downs |
| Season | Dormant |
| Feed days remaining | 47 days |
| Total KgDM demand | 3,840 kg/day |
| Total LSU | 320 |
| Active paddocks | 6 |
| SR:CC ratio | 0.91 (approaching threshold) |

**Mobs on property:**
- North Flats Mob — 120 head, Paddock 14B
- Hill Country Steers — 85 head, Ridge View
- Replacement Heifers — 115 head, The Gums

The SR:CC alert banner at the top is intentionally shown to demonstrate how the app warns graziers when stocking rate is approaching the carrying capacity limit.

---

## Stopping the App

Press `Ctrl + C` in the terminal to stop the development server.

---

## Branches

| Branch | Purpose |
|---|---|
| `demo` | Frontend only, mock data — this branch |
| `main` | Interim submission — Login + Dashboard + working auth backend |
| `development` | Full build — all screens and all backend routes |

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

*MBIS5015 Capstone — Masters of Business Information Systems — 2026*

# RealEstate CRM — Lead & Deal Management System

A self-hosted, offline-capable **Real Estate Lead & Deal Management CRM** built for real estate developers, agencies, and plotted township projects to streamline lead qualification, agent calling workflows, plot inventory allocation, and deal closing.

---

## 🌟 Key Features

### 👥 1. Lead Pipeline & Ingestion
- **Full Lead Capture**: 12 data attributes including primary/alternate phone, WhatsApp, email, city, project preference, budget, plot size, and notes.
- **Round-Robin Auto-Assignment**: Newly ingested leads are automatically distributed among active agents based on their active workload.
- **Real-Time Duplicate Detection**: Phone number validation on blur and during CSV bulk imports with existing lead warnings.
- **Enforced State Machine**: Validates status progression:
  $$\text{New} \rightarrow \text{Contacted} \rightarrow \text{Interested} \rightarrow \text{Site Visit Scheduled} \rightarrow \text{Site Visit Done} \rightarrow \text{Negotiation} \rightarrow \text{Booked} \rightarrow \text{Deal Confirmed} \rightarrow \text{Lost}$$
- **Lead Temperature Tagging**: Track interest intensity across `Hot`, `Warm`, `Cold`, and `Unqualified`.
- **Dual Pipeline Views**: Switch seamlessly between an interactive **DataGrid Table** (with multi-column search & filters) and a **Pipeline Kanban Board**.

### 📞 2. Agent Calling Workflow & Audio Storage
- **Call Attempt Logger**: Log outcomes (`Connected`, `Callback Scheduled`, `No Answer`, `Busy`, `Switched Off`, `Wrong Number`, `Not Interested`) with free-text notes.
- **Local Call Recordings**: Upload audio files (`.mp3`, `.wav`, `.m4a`) directly to local filesystem storage with in-app audio playback.
- **Callback Reminders**: Track scheduled follow-ups with dashboard alerts and automated reminder generation.

### 🏢 3. Multi-Project & Plot Inventory
- **Multi-Society Management**: Support for multiple township layouts, phases, and societies.
- **Comprehensive Plot Attributes**: Plot number, block/sector, area in sq.ft, facing direction (East/West/North/South/Corner), plot type (Residential/Commercial/Mixed), rate per sq.ft, total price, dimensions, and amenities.
- **Real-Time Availability**: Plots automatically toggle status (`Available` $\rightarrow$ `Reserved` $\rightarrow$ `Sold`).

### 🤝 4. Deals & Payment Milestones
- **Deal Allocation**: Maps an interested lead customer to an available plot inventory item.
- **Lifecycle Side-Effects**:
  - Creating a Deal $\rightarrow$ Sets Plot to `Reserved` and Lead to `Booked`.
  - Confirming a Deal $\rightarrow$ Sets Plot to `Sold` and Lead to `Deal Confirmed`.
  - Cancelling a Deal $\rightarrow$ Releases Plot back to `Available`.
- **Milestone Financials**: Track Token Amount, Down Payment, and Final Registry Payment with due dates, paid dates, and one-click payment verification.

### 📊 5. 9-Widget Analytical Dashboard
1. **Pipeline Funnel**: Lead distribution across all 9 stages.
2. **Today's Callbacks**: Urgent follow-up queue for the day.
3. **Lead Sources**: Donut chart tracking Facebook Ads, WhatsApp, Referrals, Website, etc.
4. **Lead Temperature**: Hot / Warm / Cold breakdown.
5. **Agent Performance**: Calls made, leads assigned, conversions, and closed deals per agent.
6. **Plot Inventory Overview**: Stacked bar chart of available, reserved, and sold plots per project.
7. **Revenue & Deal Values**: Confirmed revenue, active booking pipeline, and cancelled deals.
8. **Lead Aging Report**: Alerts for leads inactive for >7, >14, or >30 days.
9. **Recent Activity Feed**: Immutable audit timeline of system events.

### 📥 6. Bulk CSV Import & One-Click Data Exports
- **CSV Import Wizard**: Step-by-step upload with downloadable sample template, duplicate detection report, and row-level error reporting.
- **Export Center**: One-click operational CSV exports for Leads, Deals, and Plot inventory.

---

## 🛠 Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Backend API** | Python 3.12+ / Django 5.1 | Django REST Framework (DRF) |
| **Authentication** | SimpleJWT | Stateless JWT access + refresh tokens with automatic rotation |
| **Frontend** | React 18 / Next.js 14 | App Router with Material UI (MUI v5) & Recharts |
| **Database** | PostgreSQL 16 (or SQLite locally) | Relational integrity with unique constraints & indexes |
| **Reverse Proxy** | Nginx | Single-entry proxy on port 80 routing API, Media, and UI |
| **Orchestration** | Docker Compose | Multi-container setup for on-premise local deployment |

---

## 📁 Project Structure

```
RealStateCRM/
├── docker-compose.yml          # Multi-container orchestration (DB, API, Web, Proxy)
├── .env.example                # Environment variable configuration template
├── nginx/
│   └── nginx.conf              # Reverse proxy routing config
├── backend/                    # Django REST Framework Backend
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── config/                 # Project settings & URL routing
│   ├── accounts/               # User model, roles, JWT auth, permissions, seeder
│   ├── projects/               # Real estate projects & societies
│   ├── plots/                  # Plot inventory & pricing
│   ├── leads/                  # Lead pipeline, calling logs, round-robin, CSV import
│   ├── deals/                  # Plot bookings & payment milestones
│   ├── notifications/          # In-app notifications & reminder tasks
│   ├── audit/                  # Thread-local audit logging & signals
│   └── dashboard/              # 9 aggregation endpoints & CSV exporters
└── frontend/                   # Next.js React Material-UI Frontend
    ├── Dockerfile
    ├── package.json
    ├── next.config.js
    ├── tsconfig.json
    └── src/
        ├── app/                # Next.js App Router pages (Dashboard, Leads, Deals, Plots...)
        ├── components/         # Reusable MUI components (Kanban, Charts, Tables, Dialogs)
        ├── contexts/           # AuthContext & state providers
        ├── hooks/              # useAuth, useApi, useNotifications
        ├── lib/                # Axios instance with JWT interceptors & constants
        └── types/              # TypeScript interfaces for all domain models
```

---

## 🚀 Quick Start Guide

### Option 1: Running with Docker Compose (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sachinvrm392/RealStateCRM.git
   cd RealStateCRM
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

3. **Build and launch containers**:
   ```bash
   docker compose up --build
   ```

4. **Initialize database and seed demo data**:
   ```bash
   docker compose exec backend python manage.py migrate
   docker compose exec backend python manage.py seed_demo_data
   ```

5. **Open in browser**:
   - 🌐 **CRM Frontend App**: [http://localhost](http://localhost) (or [http://localhost:3000](http://localhost:3000))
   - ⚙️ **Django Admin**: [http://localhost/admin/](http://localhost/admin/)
   - 🔌 **REST API Docs**: [http://localhost/api/](http://localhost/api/)

---

### Option 2: Running Locally (Native Python & Node.js)

#### 1. Backend Setup:
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver 0.0.0.0:8000
```

#### 2. Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

- **Frontend URL**: [http://localhost:3000/login](http://localhost:3000/login)
- **Backend API URL**: [http://localhost:8000/api/](http://localhost:8000/api/)
- **Django Admin URL**: [http://localhost:8000/admin/login/](http://localhost:8000/admin/login/)

---

## 🔑 Demo Login Credentials

The `seed_demo_data` command creates sample accounts, projects, plot inventory, leads across pipeline stages, call logs, and active deals:

| Role | Username | Password | Permissions & Access Scope |
|---|---|---|---|
| **Super Admin** | `admin` | `admin123` | Full access: User provisioning, Audit logs, Projects, Plots, All Leads, Deals, Reports |
| **Manager** | `manager` | `manager123` | Projects, Plots inventory, Lead assignments & CSV imports, Deals, Full Dashboard & Reports |
| **Agent 1** | `agent_rahul` | `agent123` | Own assigned leads, Log calls with recordings, Update pipeline status & temperature |
| **Agent 2** | `agent_priya` | `agent123` | Own assigned leads, Log calls with recordings, Update pipeline status & temperature |

---

## 🔐 User Roles & Permissions Matrix

| Module / Action | Super Admin | Manager | Agent |
|---|:---:|:---:|:---:|
| **User Account Management** | ✅ Full | ❌ | ❌ |
| **System Audit Logs** | ✅ Full | ❌ | ❌ |
| **Create Projects / Societies** | ✅ | ✅ | ❌ |
| **Manage Plot Inventory** | ✅ | ✅ | ❌ (Read Only) |
| **Bulk Import Leads (CSV)** | ✅ | ✅ | ❌ |
| **View All Leads** | ✅ | ✅ | ❌ (Assigned Only) |
| **Assign / Reassign Leads** | ✅ | ✅ | ❌ |
| **Log Call Attempts & Audio** | ✅ | ✅ | ✅ (Own Leads) |
| **Create & Confirm Deals** | ✅ | ✅ | ❌ (Read Only) |
| **Dashboard Analytics** | ✅ Full Suite | ✅ Full Suite | 🔒 Own Metrics Only |
| **Export Data (CSV)** | ✅ | ✅ | ❌ |

---

## 🔌 API Endpoints Summary

### Authentication (`/api/auth/`)
- `POST /api/auth/login/` — Authenticate and receive JWT access & refresh tokens
- `POST /api/auth/refresh/` — Refresh expired access token
- `GET /api/auth/me/` — Retrieve current authenticated user profile

### Leads (`/api/leads/`)
- `GET /api/leads/` — List leads (role-filtered, searchable & filterable)
- `POST /api/leads/` — Register new lead (auto-assigns agent via round-robin)
- `GET /api/leads/{id}/` — Retrieve lead details and full call attempt history
- `PATCH /api/leads/{id}/` — Update lead status (state machine validated) or temperature
- `POST /api/leads/{id}/calls/` — Log call attempt with audio recording upload
- `POST /api/leads/import_csv/` — Bulk import leads from CSV file with duplicate phone detection
- `GET /api/leads/export/` — Download master leads dataset as CSV
- `GET /api/leads/check_duplicates/?phone=...` — Real-time duplicate phone validation

### Plot Inventory (`/api/plots/`)
- `GET /api/plots/` — List plots (filterable by project, status, type, facing)
- `POST /api/plots/` — Add new plot to inventory with automatic price calculation
- `GET /api/plots/export/` — Export plot inventory as CSV

### Deals & Milestones (`/api/deals/`)
- `GET /api/deals/` — List all deals and booking statuses
- `POST /api/deals/` — Create deal (automatically reserves plot and marks lead as booked)
- `PATCH /api/deals/{id}/` — Confirm deal (marks plot sold) or Cancel deal (releases plot)
- `GET /api/deals/{id}/milestones/` — List payment milestones for a deal
- `POST /api/deals/{id}/milestones/` — Add payment milestone
- `PATCH /api/deals/{id}/milestones/{milestone_id}/` — Toggle milestone payment status (paid/pending)
- `GET /api/deals/export/` — Export deals dataset as CSV

### Dashboard (`/api/dashboard/`)
- `GET /api/dashboard/funnel/` — Lead pipeline stage counts
- `GET /api/dashboard/callbacks/` — Today's scheduled callback list
- `GET /api/dashboard/sources/` — Ingestion source breakdown
- `GET /api/dashboard/temperature/` — Hot / Warm / Cold distribution
- `GET /api/dashboard/agent-performance/` — Calls, leads, and conversion metrics per agent
- `GET /api/dashboard/plots-summary/` — Available vs reserved vs sold units per project
- `GET /api/dashboard/revenue/` — Confirmed revenue & pipeline value metrics
- `GET /api/dashboard/aging/` — Stale leads inactive for >7, >14, or >30 days
- `GET /api/dashboard/activity/` — Recent audit log events

---

## 📄 License

Private & Proprietary. All rights reserved.
# 🚚 SwiftLastMile — Last-Mile Delivery Tracker

> 🌐 **Live Deployed Application**:
> - **Frontend Web App (Vercel)**: [https://last-minute-delivery-v2-95ia.vercel.app/](https://last-minute-delivery-v2-95ia.vercel.app/)
> - **Backend REST API (Render)**: [https://last-minute-delivery-v2.onrender.com](https://last-minute-delivery-v2.onrender.com)
> - **API Healthcheck**: [https://last-minute-delivery-v2.onrender.com/api/health](https://last-minute-delivery-v2.onrender.com/api/health)

A type-safe, resilient logistics platform featuring a dynamic **Rate Calculation Engine**, an automated **Delivery Agent Assignment Engine** with Haversine proximity fallback, **Immutable Audit Tracking Timelines**, and **Failed Delivery Rescheduling Recovery**.

![Architecture Diagram](C:/Users/KARTIK/.gemini/antigravity/brain/1f5b1a09-e2e4-4e70-9834-ea96e606e013/.user_uploaded/media_1787206488198.png)

---

## 🌟 Key Features & Highlights

- **Dynamic Rate Engine**: Computes volumetric weight vs actual weight billed charges, intra/inter-zone rates, base charge thresholds, and COD surcharges without hardcoding formulas in application routes.
- **Auto-Assignment Engine**: Prefers available delivery agents in the pickup zone with tie-breaking for fewest active orders; falls back to Haversine distance calculations when no in-zone agent is available.
- **Immutable Tracking History**: Append-only `order_status_history` table records every state change (`CREATED` $\rightarrow$ `ASSIGNED` $\rightarrow$ `PICKED_UP` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED` / `FAILED`), serving as the single source of truth.
- **Failed Delivery Recovery**: Enables customers to reschedule failed attempts, advancing status to `RESCHEDULED` and re-running auto-assignment.
- **Three Dedicated Portals**:
  - **Customer Portal**: Interactive rate estimator, order placement, live status timeline.
  - **Agent Portal**: Duty status toggle (Available/Busy/Offline), assigned task list, 1-click status state advancement.
  - **Admin Dashboard**: System metrics, configurable rate cards, dispatch grid, manual & auto-assignment controls, and privileged status overrides.
- **Full Containerization & CI/CD**: Includes Dockerfiles for server & client, `docker-compose.yml`, and GitHub Actions workflow for automated testing and builds.

---

## 🔑 Evaluator Quick-Login Demo Accounts

The application includes an instant **Demo Role Switcher** in the top navigation bar. Alternatively, sign in using these seeded credentials:

| Role | Email | Password | Scope & Capabilities |
|---|---|---|---|
| **Admin** | `admin@delivery.com` | `admin123` | Full dispatch control, zone/rate card CRUD, manual/auto assign, privileged overrides |
| **Customer** | `customer@delivery.com` | `password123` | Rate quotes, shipment registration, tracking timeline, failed delivery rescheduling |
| **Agent** | `agent.rahul@delivery.com` | `password123` | Availability toggle, assigned orders dashboard, status progression |

---

## 🧮 Rate Engine Formula & Worked Example

### Mathematical Formulas
1. **Volumetric Weight (kg)**:
   $$\text{Volumetric Weight} = \frac{\text{Length (cm)} \times \text{Breadth (cm)} \times \text{Height (cm)}}{5000}$$
2. **Billed Weight (kg)**:
   $$\text{Billed Weight} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$
3. **Base Charge (₹)**:
   $$\text{Base Charge} = \max(\text{BaseCharge}_{\text{card}}, \text{MinCharge}_{\text{card}}, \text{Billed Weight} \times \text{RatePerKg}_{\text{card}})$$
4. **COD Surcharge (₹)**:
   $$\text{COD Surcharge} = \begin{cases} \text{Flat Value} & \text{if SurchargeType = FLAT} \\ \text{Base Charge} \times \left(\frac{\text{Percent}}{100}\right) & \text{if SurchargeType = PERCENT} \end{cases}$$
5. **Total Charge (₹)**:
   $$\text{Total Charge} = \text{Base Charge} + \text{COD Surcharge}$$

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- **Node.js**: v18+ or v20+
- **npm**: v9+

### 2. Backend Setup (`/server`)
```bash
cd server
npm install
npx prisma db push     # Initializes SQLite database dev.db
npx tsx prisma/seed.ts  # Seeds demo users, zones, rate cards, and agents
npm dev                 # Starts REST API on http://localhost:5001
```

### 3. Frontend Setup (`/client`)
```bash
cd client
npm install
npm dev                 # Starts React + Vite UI on http://localhost:5173
```

---

## 📁 Repository Directory Map

```text
.
├── .github/
│   └── workflows/ci.yml # GitHub Actions CI/CD automated pipeline
├── server/               # Express + TypeScript + Prisma REST API
│   ├── prisma/           # Database schema & seed script
│   ├── src/
│   │   ├── controllers/  # Auth, Order, Agent, Zone handlers
│   │   ├── middleware/   # JWT authGuard & roleGuard
│   │   ├── services/     # Pure rate calculation & auto-assignment engines
│   │   └── index.ts      # Server entry point
│   ├── tests/            # Jest unit tests (100% pass)
│   ├── Dockerfile
│   └── .env.example
├── client/               # React + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/   # Navbar & Shared UI
│   │   ├── context/      # AuthContext state manager
│   │   ├── pages/        # Customer, Agent, Admin Portals & Login
│   │   └── services/     # Axios API client
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .env.example
├── docs/                 # System Design (<800 words)
├── docker-compose.yml    # 1-command container deployment
└── README.md             # Complete documentation
```

# 🚚 SwiftLastMile — Last-Mile Delivery Tracker

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

<<<<<<< HEAD
=======
### Worked Example
Suppose a customer ships a package from **Bangalore Central (Pincode: 560001)** to **Koramangala (Pincode: 560034)**:
- Both pincodes belong to `Zone: BANGALORE_SOUTH` $\rightarrow$ **Relation: INTRA**.
- Dimensions: $50 \text{ cm} \times 40 \text{ cm} \times 30 \text{ cm}$. Actual Weight = $5 \text{ kg}$.
- Volumetric Weight = $\frac{50 \times 40 \times 30}{5000} = 12 \text{ kg}$.
- Billed Weight = $\max(5, 12) = 12 \text{ kg}$ (Volumetric weight used).
- Rate Card (`B2C` / `INTRA`): Rate per kg = ₹15, Base Charge = ₹50.
- Base Charge = $12 \text{ kg} \times ₹15/\text{kg} = ₹180$.
- Payment Method = `COD` (Flat Surcharge = ₹30).
- **Total Charge** = $₹180 + ₹30 = \mathbf{₹210}$.

---

## 🤖 Auto-Assignment Logic & Haversine Fallback

When auto-assigning an order, the system executes the following pure decision engine (`autoAssignAgent`):

1. **Availability Filter**: Selects agents with `status = 'AVAILABLE'`.
2. **Primary Match (In-Zone)**: Selects agents whose `currentZoneId` matches `order.pickupZoneId`.
   - *Tie-Break*: If multiple agents match, selects the agent with the **fewest active, non-terminal orders**.
3. **Fallback Proximity Match**: If no in-zone agents are online, calculates spherical Haversine distance between agent coordinates $(lat_1, lon_1)$ and pickup coordinates $(lat_2, lon_2)$:
   $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
   Filters agents within max radius ($50 \text{ km}$), sorted by distance ascending, then active order load.
4. **Safety State**: If zero agents qualify, order remains `UNASSIGNED` for admin intervention.

---

## 📡 REST API Surface Summary

| Endpoint | Method | Role Guard | Description |
|---|---|---|---|
| `/api/auth/login` | `POST` | Public | Authenticates user & returns JWT token |
| `/api/auth/profile` | `GET` | Authenticated | Retrieves current authenticated profile |
| `/api/orders/quote` | `POST` | Public | Calculates quote & volumetric breakdown (No DB write) |
| `/api/orders` | `POST` | Authenticated | Creates shipment & appends initial status history |
| `/api/orders` | `GET` | Authenticated | Lists orders (Customer sees own, Agent sees assigned, Admin sees all) |
| `/api/orders/:id/timeline` | `GET` | Public | Stream of ordered, immutable status history logs |
| `/api/orders/:id/auto-assign` | `POST` | Admin | Executes auto-assignment pure decision engine |
| `/api/orders/:id/assign` | `PATCH` | Admin | Manually assigns selected delivery agent |
| `/api/orders/:id/status` | `PATCH` | Agent / Admin | Advances delivery status (`PICKED_UP`, `IN_TRANSIT`, `DELIVERED`, `FAILED`) |
| `/api/orders/:id/override-status` | `PATCH` | Admin | Privileged status override with audit logging |
| `/api/orders/:id/reschedule` | `POST` | Customer | Reschedules failed delivery and resets state for re-assignment |
| `/api/rate-cards` | `GET / PUT` | Admin | Read and configure rate cards dynamically |

>>>>>>> 8a68ee4da18ef3b1b9cef647ea61162d7651ea7c
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

<<<<<<< HEAD
---

## 🚀 Vercel Cloud Deployment Configuration

When deploying the frontend to **Vercel**:
1. Set **Root Directory**: `client` (or `unthinkable/client` if deploying from root repository).
2. Set **Framework Preset**: `Vite`.
3. Set **Environment Variable**: `VITE_API_URL` $\rightarrow$ `https://your-backend.onrender.com` (Your backend API URL).
=======
### 4. Running Automated Unit Tests
```bash
cd server
npm test                # Runs 12/12 Jest unit tests for Rate & Assignment engines
```

---

## 🐳 Docker & Docker Compose Execution

To run the entire full-stack application inside isolated containers:

```bash
docker compose up --build
```

- **Backend REST API**: `http://localhost:5001`
- **Nginx Frontend App**: `http://localhost:8080`

---

## 🚀 Cloud Deployment Guide

### Deploying Backend to Render / Railway
1. Connect GitHub repository to Render/Railway.
2. Root Directory: `/server`
3. Build Command: `npm install && npx prisma db push && npx tsx prisma/seed.ts && npm run build`
4. Start Command: `npm start`
5. Environment Variables: `PORT=5001`, `JWT_SECRET`, `DATABASE_URL`

### Deploying Frontend to Vercel
1. Import repository in Vercel.
2. Root Directory: `/client`
3. Framework Preset: **Vite**
4. Build Command: `npx vite build`
5. Output Directory: `dist`

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
│   │   └── index.ts      # Server entry point (with port fallback)
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
>>>>>>> 8a68ee4da18ef3b1b9cef647ea61162d7651ea7c

# Last-Mile Delivery Tracker — System Design Document

## 1. Overview
The Last-Mile Delivery Tracker is a resilient, type-safe logistics engine engineered to compute dynamic shipping quotes, match available delivery agents to orders, record immutable delivery timelines, and manage failed delivery recovery workflows.

---

## 2. Core Architecture & Logic Engines

### A. Rate Calculation Engine
The rate engine runs as a pure, side-effect-free function: `calculateQuote(input, rateCard, codConfig)`.

1. **Volumetric Weight Calculation**:
   $$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Breadth (cm)} \times \text{Height (cm)}}{5000}$$
2. **Billed Weight Determination**:
   $$\text{Billed Weight} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$
3. **Zone Relation Detection**:
   If $\text{Pickup Zone ID} = \text{Drop Zone ID}$, relation is **INTRA**; otherwise, relation is **INTER**.
4. **Base Charge Calculation**:
   Calculated as $\max(\text{Base Charge}, \text{Minimum Charge}, \text{Billed Weight} \times \text{Rate per Kg})$.
5. **COD Surcharge Application**:
   If payment type is `COD`, a flat fee or percentage of base charge is added to compute the final **Total Charge**.

### B. Zone Detection Engine
To eliminate dependency on expensive paid map APIs, the system maps physical addresses to zones via an administrative pincode lookup table (`zone_areas`). Pincode lookups resolve `pickup_pincode` and `drop_pincode` directly to their associated `zone_id`.

### C. Auto-Assignment Engine
Order assignment evaluates online delivery agents (`status = 'AVAILABLE'`) through a multi-tiered decision matrix:
1. **Primary Match (In-Zone)**: Selects agents currently located within the order's pickup zone.
2. **Tie-Break Rule**: If multiple agents are in-zone, the engine assigns the agent with the **lowest count of active, non-terminal orders** to maintain load balance.
3. **Fallback Match (Haversine Proximity)**: If no agents are in-zone, the engine calculates the spherical distance between pickup coordinates $(lat_1, lon_1)$ and agent coordinates $(lat_2, lon_2)$:
   $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
   Agents within a configurable radius (e.g. 50 km) are sorted by distance ascending, then active order load.
4. **Unassigned Safety State**: If zero agents qualify, the order remains in an `UNASSIGNED` state and surfaces in the Admin Dashboard for manual intervention.

### D. Immutable Tracking Lifecycle & Failed Delivery Recovery
- **Immutable Timeline**: The `order_status_history` table is append-only. No row is ever updated or deleted. Every state change (`CREATED` $\rightarrow$ `ASSIGNED` $\rightarrow$ `PICKED_UP` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED` or `FAILED`) writes a new history log containing status, actor role, timestamp, and audit remarks.
- **Failed Delivery Flow**: When an agent flags an attempt as `FAILED`, the agent's availability is reset to `AVAILABLE`, an email notification is dispatched to the customer, and a reschedule window opens.
- **Reschedule Loop**: The customer selects a new delivery date, creating a `reschedule_requests` record. The order status advances to `RESCHEDULED`, clearing the assigned agent and re-triggering the Auto-Assignment Engine.

---

## 3. Data Integrity & Verification
- **Pure Function Separation**: Rate and assignment engines have zero DB side-effects, enabling 100% Jest unit test coverage.
- **Role-Based Guards**: JWT tokens enforce role isolation (`CUSTOMER`, `AGENT`, `ADMIN`), with administrative overrides logged explicitly in the audit trail.

# OE Manager – Open Elective Allocation System

A full-stack **elective allocation system** for colleges: students submit preferences, admin uploads official CGPA data, verifies records, and runs an **AI-based allocation** that assigns electives by merit (CGPA, backlogs) and seat limits. Faculty mentors can view allocated and flagged students.

---

## Tech Stack

| Layer    | Stack |
|----------|--------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, React Router |
| Backend  | Node.js, Express, TypeScript |
| Database | MongoDB (Mongoose) |
| Auth     | JWT, bcrypt |

---

## Overall Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 1. SETUP (Admin)                                                                 │
│    • Add electives (code, name, seats, department, semester)                     │
│    • Upload official CGPA CSV per branch + semester (3-1, 3-2, etc.)             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 2. STUDENTS                                                                      │
│    • Register / Login → Complete profile (branch, semester, CGPA, backlogs)       │
│    • Elective Selection → Choose ≥3 preferences (ranked)                        │
│    • Checkout → Save draft or Submit preferences                                │
│    • After results announced → Cannot edit preferences (locked)                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 3. CGPA VERIFICATION (Admin)                                                     │
│    • Select semester slot (3-1, 3-2, …) and department (CSE, ECE, …)            │
│    • Click "Verify CGPA" → Compares student-entered CGPA with official CSV data  │
│    • Matched → Verified, eligible for allocation                                │
│    • Mismatch or missing in CSV → Flagged; excluded from allocation              │
│    • Flagged students → Visible to department mentor; can "Forward to mentor"     │
│      (their submission is cancelled; they must re-apply later)                   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 4. RUN ALLOCATION (Admin)                                                        │
│    • Only verified, submitted students (no open CGPA flags) are considered       │
│    • Algorithm sorts by CGPA (high first), then backlogs, then submission time   │
│    • Each student gets first available choice from their preference list         │
│    • Each elective has a seat limit; when full, no more students get that elective│
│    • Result: allocated + unallocated lists; rounds by CGPA bands                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 5. POST-ALLOCATION                                                               │
│    • Lock Allocation (optional)                                                 │
│    • Announce Results → Students see allocated elective; preferences locked      │
│    • Allocated Students (admin/faculty) → View by branch, semester, round        │
│    • Reset → Clears unannounced allocations only (for re-run)                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## How Run Allocation Works (Detailed)

### Who is included?

- **Included:** Students with **submitted** preferences who are **not** already **announced** and **not** in the **CGPA-flagged** list.
- **Excluded:**  
  - Students whose result was already **announced** (they keep their previous allocation).  
  - Students with an **open CGPA flag** (mismatch or missing official data).

### Processing order (priority)

1. **Sort** all eligible students by:
   - **CGPA** (descending – higher CGPA first)
   - **Backlogs** (ascending – fewer backlogs first)
   - **Submission time** (earlier first)
   - **Name** (alphabetical)

2. **One pass:** For each student in this order, the algorithm looks at their **preference list** (rank 1, 2, 3, …) and assigns the **first elective that still has a free seat**.  
   - If elective A is full, the student’s next preference (B, then C, …) is checked.  
   - If no preference has seats left, the student is **unallocated**.

### What happens when an elective exceeds its limit?

- Each elective has a **seat limit** (e.g. 70).
- The system keeps a **running count** of how many seats are left per elective.
- When a student is assigned an elective, that elective’s **remaining seats decrease by 1**.
- When **remaining seats = 0**, that elective is **full**:
  - Any **later** student (lower priority) who had it as choice 1 (or 2, 3, …) will **not** get it; the algorithm moves to their next preference.
- So: **only the first N students** (by priority) who chose that elective get it; the rest are either assigned a different preference or end up **unallocated**.

No elective ever gets *more* than its limit; “over demand” is handled by **rejecting** lower-priority students for that elective and giving them the next available choice or no seat.

### How rounds are evaluated (CGPA bands)

- Students are grouped into **CGPA bands** for reporting only (they are **not** processed in separate rounds):
  - **Round 1:** CGPA 9.0 – 10.0  
  - **Round 2:** CGPA 8.0 – 8.9  
  - **Round 3:** CGPA 7.0 – 7.9  
  - **Round 4:** CGPA &lt; 7.0  

- The **same single-pass algorithm** runs over the **full sorted list** (all bands together). The “round” shown in the UI is just the **band** the student’s CGPA falls into, for analytics (e.g. how many 9+ CGPA got allocated vs unallocated).

### Output

- **Allocated list:** `{ studentId, electiveId }` for each assigned student.  
- **Unallocated list:** students who got no elective.  
- **Seat utilization:** per elective, `filled` and `capacity`.  
- **Rounds:** per band, counts of allocated vs unallocated.

---

## Roles & Features

| Role    | Main actions |
|--------|-------------------------------|
| Student | Register, profile, select electives (≥3), submit preferences, view allocation result. After results are announced, preferences are locked. |
| Admin   | Dashboard, manage electives, view students, **upload official CGPA CSV** (by branch + semester), **CGPA Verification** (verify / flag), **Run Allocation**, Lock / Announce / Reset, view Allocated Students, Analytics. |
| Faculty | Dashboard, view **Allocated Students** for department, view **Flagged Students** (CGPA mismatch), resolve flags. |

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone and install

```bash
git clone <your-repo-url>
cd hackathon
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment

**Backend (`backend/.env`):**

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/elective-db
JWT_SECRET=your-secret-key
# Optional: OPENAI_API_KEY for AI features
```

**Frontend (`frontend/.env`):**

```env
VITE_API_URL=http://localhost:4000
```

### 3. Run

**Terminal 1 – Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 – Frontend:**

```bash
cd frontend
npm run dev
```

- Frontend: http://localhost:8080 (or the port Vite shows)  
- Backend API: http://localhost:4000  

### 4. Default logins (after seed)

- **Admin:** username `admin`, password from your seed (e.g. in `adminSeed.ts`).  
- **Faculty:** username `mentor`, password from your seed (e.g. in `mentorSeed.ts`).  
- **Students:** use seed scripts (see below) or register manually.

---

## Seeding Data

- **Electives & admin/mentor:** Created on first server start (see `backend/src/seed/`).
- **Students (3-2, 200):**  
  `cd backend && npm run seed:200`  
  Creates 100 CSE + 100 ECE for 6th sem (3-2); 20 with wrong CGPA (flagged). Login: roll number, password `student123`.
- **Students (3-1, 200):**  
  `cd backend && npm run seed:200-31`  
  Creates 100 CSE + 100 ECE for 5th sem (3-1). Upload the CSVs in `backend/seed-data/` (3-1, CSE and ECE) before or after seeding; then run CGPA verification for 3-1.

---

## Project Structure (high level)

```
hackathon/
├── backend/
│   ├── src/
│   │   ├── models/          # User, Elective, Preference, Allocation, OfficialCgpaSnapshot, CgpaFlag, StudentProfile
│   │   ├── routes/          # auth, student, electives, admin, allocation, faculty, ai
│   │   ├── services/        # allocationService (run allocation logic)
│   │   ├── seed/            # electives, admin, mentor, seed200CseEce, seed200CseEce31
│   │   ├── app.ts
│   │   └── server.ts
│   └── seed-data/           # Sample CSVs for 3-1 (CSE, ECE)
├── frontend/
│   └── src/
│       ├── pages/           # Landing, Login, Dashboards, ElectiveSelection, AdminAllocation, AdminCgpaVerification, etc.
│       ├── api/             # HTTP client, admin, student, faculty
│       └── components/     # Layout, UI, AppSidebar
└── README.md                # This file
```

---

## Summary for Presentation

- **Workflow:** Setup electives and official CGPA → Students submit preferences → Admin verifies CGPA (matched vs flagged) → Admin runs allocation → Announce results → Students see result; preferences locked after announce.
- **Run allocation:** One merit-based pass (CGPA ↑, backlogs ↓, time ↑). First-come-first-seat within that order; each elective has a hard cap; when full, later students get next preference or stay unallocated.
- **Over limit:** Elective never exceeds its seat limit; excess demand is handled by not assigning that elective to lower-priority students and moving to their next choice (or leaving them unallocated).
- **Rounds:** Reporting only (CGPA bands); allocation is a single pass over the full sorted list.

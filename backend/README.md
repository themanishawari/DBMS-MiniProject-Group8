# CCMS Backend API (Node.js + Express + MySQL 8.0)

A production-grade, secure, and beginner-friendly REST API backend for the **College Complaint Management System (CCMS)**.

---

## 1. Architecture & Folder Structure

The backend follows the standard **Controller-Service-Repository / MVC** design pattern, keeping concerns cleanly separated:

```
backend/
├── .env.example                 # Template for configuration environment variables
├── .env                         # Local configuration with database credentials (DO NOT commit passwords)
├── package.json                 # Backend dependencies and run scripts
├── database/
│   ├── schema.mysql.sql         # Production MySQL 8.0 schema and seed migration script
│   └── README.md                # MySQL Workbench execution & relational schema documentation
├── src/
│   ├── server.js                # Express application entry point & middleware pipeline
│   ├── config/
│   │   └── db.js                # MySQL 8.0 connection pool & ACID transaction runner (mysql2/promise)
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication & Role-Based Access Control (RBAC)
│   │   └── errorHandler.js      # Centralized error handler capturing SQL and HTTP exceptions
│   ├── utils/
│   │   └── mappers.js           # Translates MySQL snake_case rows into frontend camelCase contracts
│   ├── controllers/
│   │   ├── authController.js        # Login, registration, profile lookups with bcrypt hashing
│   │   ├── complaintController.js   # Complaint submission, role-scoped queries, transitions, assignments
│   │   ├── commentController.js     # Public discussion thread and confidential staff notes
│   │   ├── feedbackController.js    # Student star ratings, review submission, and ticket closure
│   │   ├── categoryController.js    # Grievance category & subcategory management
│   │   ├── departmentController.js  # Department catalog with active staff headcount
│   │   ├── userController.js        # User directory, role assignment, and account status
│   │   ├── notificationController.js# Real-time in-app notification polling and read tracking
│   │   ├── slaController.js         # SLA target turnaround hours per priority level
│   │   ├── auditController.js       # Tamper-evident administrative audit trail
│   │   ├── analyticsController.js   # SQL aggregate queries for dashboard KPIs & charts
│   │   └── devController.js         # Demonstration database reset utility
│   ├── routes/                      # Express sub-routers mapping REST endpoints to controllers
│   │   ├── authRoutes.js
│   │   ├── complaintRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── departmentRoutes.js
│   │   ├── userRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── slaRoutes.js
│   │   ├── auditRoutes.js
│   │   ├── analyticsRoutes.js
│   │   └── devRoutes.js
│   └── scripts/
│       └── testConnection.js    # Standalone script to verify MySQL connection & table counts
└── README.md                    # This documentation guide
```

---

## 2. Prerequisites

- **Node.js**: v18.0.0+ (tested on Node v25.9.0)
- **MySQL Server**: 8.0+ (tested on MySQL Server 8.0.46)
- **MySQL Workbench** or command-line client

---

## 3. Step-by-Step Setup Guide

### Step 1: Create the Database & Tables
If you haven't already executed the MySQL schema script:
1. Open **MySQL Workbench** and connect to your local MySQL instance.
2. Open the file `backend/database/schema.mysql.sql`.
3. Click the yellow lightning bolt icon (⚡) or press `Ctrl + Shift + Enter`.
4. This creates the database `ccms_db` with all 13 relational tables, UUID generation triggers, foreign key constraints, and initial reference seed data.

### Step 2: Install Dependencies
Open your terminal or PowerShell, navigate to the `backend` directory, and run:

```powershell
cd backend
npm install
```

This installs:
- `express`: Fast, minimalist web framework.
- `mysql2`: MySQL driver supporting promises, connection pooling, and prepared statements.
- `dotenv`: Loads environment variables from `.env`.
- `cors`: Cross-Origin Resource Sharing middleware for Vite.
- `bcryptjs`: Secure password hashing without native binary compilation.
- `jsonwebtoken`: Standards-compliant JWT token generation and verification.
- `nodemon`: Auto-reloads server upon code changes during development.

### Step 3: Configure Environment Variables
Open `backend/.env` in your editor and enter your local MySQL credentials:

```ini
PORT=5000
NODE_ENV=development

# MySQL 8.0 Connection Pool Settings
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_mysql_password_here
DB_NAME=ccms_db

# Security & CORS
JWT_SECRET=ccms_jwt_secure_key_2026_super_secret_for_college_grievances
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

> **Security Note**: Never commit your password to Git. `backend/.env` is ignored by `.gitignore`.

### Step 4: Verify Database Connection
Run the connection test script:

```powershell
npm run test:db
```

If successful, you will see output similar to:
```
--- Testing CCMS MySQL 8.0 Connection Pool ---
[MySQL 8] Connected successfully to "ccms_db" (Server version: 8.0.46)
[Database] Found 13 tables in current database:
  - audit_logs
  - complaint_attachments
  - complaint_categories
  - complaint_comments
  - complaint_feedback
  - complaint_status_history
  - complaint_subcategories
  - complaints
  - departments
  - escalation_rules
  - notifications
  - roles
  - users

[Database] Master Table Counts:
  - Users: 7
  - Departments: 8
  - Categories: 9
  - Complaints: 1

SUCCESS: Database connection and schema verified successfully!
```

### Step 5: Start the Backend Server
To run in development mode with auto-reload:

```powershell
npm run dev
```

Or for standard execution:

```powershell
npm start
```

The server will display:
```
======================================================================
 College Complaint Management System (CCMS) - Node.js Express Server
======================================================================
[MySQL 8] Connected successfully to "ccms_db" (Server version: 8.0.46)
[Server] CCMS REST API active and listening on: http://localhost:5000
[Server] Base API Endpoint: http://localhost:5000/api/v1
[Server] Health Check:     http://localhost:5000/api/v1/health
======================================================================
```

---

## 4. API Endpoints Catalog

All endpoints are prefixed with `/api/v1`.

### 1. Health Check
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/health` | Server uptime and health verification | None |

### 2. Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Authenticate user, verify bcrypt password, issue JWT | `{ email, password }` |
| `POST` | `/api/v1/auth/register` | Register student account with hashed password | `{ name, email, password, studentId, phone }` |
| `GET` | `/api/v1/auth/me` | Return authenticated user's profile | Bearer Token |
| `PATCH`| `/api/v1/auth/profile`| Update phone, name, or avatar | `{ name, phone, avatarUrl }` |

### 3. Complaints & Lifecycle (`/api/v1/complaints`)
| Method | Endpoint | Description | Key Features |
|---|---|---|---|
| `GET` | `/api/v1/complaints` | Fetch list of complaints | Scoped to user role (students only see their own tickets; staff see department queue; admins see all). Supports search, status/priority filtering, and pagination. |
| `GET` | `/api/v1/complaints/:id` | Fetch ticket details | Includes attachments, feedback, and permission check. |
| `POST` | `/api/v1/complaints` | Submit grievance | Transactional: generates `CCMS-YYYY-XXXX` ID, computes SLA deadline from priority rule, writes initial status history, audit log, and creates in-app notifications. |
| `PATCH`| `/api/v1/complaints/:id` | Update ticket / Transition status | Enforces state machine transition rules (`ALLOWED_TRANSITIONS`), updates resolution notes, increments reopen count. |
| `POST` | `/api/v1/complaints/:id/assign` | Assign handler | Sets department and designated staff member. |
| `POST` | `/api/v1/complaints/:id/archive`| Soft-archive | Sets `is_archived = TRUE` (Admin only). |
| `GET` | `/api/v1/complaints/:id/history`| Status audit trail | Chronological state transitions with actor name and remarks. |
| `GET` | `/api/v1/complaints/:id/comments`| Communication thread| Hides staff-only internal notes from students. |
| `POST` | `/api/v1/complaints/:id/comments`| Post comment | Supports `isInternal = true` for staff/admin internal notes. |
| `POST` | `/api/v1/complaints/:id/feedback`| Post feedback | Accepts 1–5 star rating and remarks; automatically closes complaint. |

### 4. Reference Data & Master Tables
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/categories` | Categories with nested subcategories |
| `POST` | `/api/v1/categories` | Create category & subcategories (Admin) |
| `PATCH`| `/api/v1/categories/:id` | Update category & subcategories (Admin) |
| `GET` | `/api/v1/departments` | Department directory with active staff headcount |
| `POST` | `/api/v1/departments` | Create department (Admin) |
| `PATCH`| `/api/v1/departments/:id` | Update department details (Admin) |
| `GET` | `/api/v1/users` | User directory (omits password hashes) |
| `POST` | `/api/v1/users` | Provision user account with bcrypt password (Admin) |
| `PATCH`| `/api/v1/users/:id` | Update user or toggle active status (Admin / Self) |
| `GET` | `/api/v1/notifications?userId=:id` | Fetch user notification feed |
| `POST` | `/api/v1/notifications/:id/read` | Mark notification as read |
| `POST` | `/api/v1/notifications/read-all?userId=:id` | Mark all user notifications as read |
| `GET` | `/api/v1/sla-rules` | SLA turnaround hours matrix |
| `PUT` | `/api/v1/sla-rules` | Update SLA turnaround hours per priority (Admin) |
| `GET` | `/api/v1/audit-logs` | Tamper-evident administrative audit log (Admin) |
| `GET` | `/api/v1/analytics` | High-performance SQL aggregated KPI dashboard metrics |
| `POST` | `/api/v1/dev/reset` | Restore demo seed tickets (Development utility) |

---

## 5. How to Test the APIs (Examples)

You can test the endpoints using PowerShell, cURL, or Postman:

### 1. Test Server Health
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/health" -Method Get
```

### 2. Login as Demo Administrator
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email": "admin@college.edu", "password": "password123"}'

$token = $response.token
Write-Host "JWT Token received: $token"
```

### 3. Fetch All Complaints (Using Admin JWT)
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/complaints" `
  -Method Get `
  -Headers @{ Authorization = "Bearer $token" }
```

### 4. Fetch Master Categories & Nested Subcategories
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/categories" -Method Get
```

### 5. Fetch Real-time Analytics Dashboard Statistics
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/analytics" `
  -Method Get `
  -Headers @{ Authorization = "Bearer $token" }
```

### 6. Submit a New Complaint
```powershell
$loginStudent = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email": "rahul.sharma@college.edu", "password": "password123"}'

$studentToken = $loginStudent.token

$newComplaint = @{
  title = "Water leakage in Room 204 washroom"
  description = "The ceiling pipe has been dripping continuous water onto the electrical light switch since morning."
  categoryId = "cat-hostel"
  subcategoryId = "sub-hostel-2"
  departmentId = "dept-hostel"
  priority = "high"
  campusArea = "Boys Hostel Complex (Hostel 1 & 2)"
  building = "Block 2"
  floor = "2nd Floor"
  roomNumber = "Room 204"
  preferredContact = "portal"
  isSensitive = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/v1/complaints" `
  -Method Post `
  -Headers @{ Authorization = "Bearer $studentToken" } `
  -ContentType "application/json" `
  -Body $newComplaint
```

---

## 6. Simple Explanation of Every Important File

### `src/server.js` (Server Core)
- The main door of the backend.
- Sets up Express, configures CORS so Vite (`http://localhost:5173`) can communicate with it, enables JSON body parsing, and logs every incoming HTTP request.
- Connects to MySQL on boot and mounts all sub-routes under `/api/v1`.

### `src/config/db.js` (Database Connection Pool)
- Uses `mysql2/promise` to maintain a pool of 15 reusable database connections.
- Contains `query(sql, params)` to execute parameterized queries safely.
- Contains `withTransaction(async (conn) => { ... })`: executes multi-table modifications inside a single ACID transaction. If an error occurs halfway through, it rolls back all changes automatically so the database never gets corrupted.

### `src/middleware/auth.js` (Security Guard)
- Extracts the JWT Bearer token from the `Authorization` header.
- Decodes the token, checks the user in MySQL to make sure their account is still active, and attaches `req.user` (`{ id, role, email, departmentId }`).
- Contains `requireRole('admin', 'staff')` which blocks unauthorized roles before they can touch sensitive endpoints.

### `src/middleware/errorHandler.js` (Error Safety Net)
- Catches errors from all routes and formats them into clean JSON error responses (`{ success: false, message: ... }`).
- Recognizes MySQL errors (such as duplicate keys or foreign key violations) and translates them into readable HTTP status codes (409 Conflict, 400 Bad Request).

### `src/utils/mappers.js` (Data Translator)
- Translates MySQL database rows (which use `snake_case` like `student_id`, `created_at`) into the exact `camelCase` structure expected by the React frontend components (`studentId`, `createdAt`, `location: { campusArea, ... }`).

### `src/controllers/complaintController.js` (Complaint Brain)
- Manages the entire grievance lifecycle:
  - Scopes searches based on role (students only get their own records, staff get their department tickets).
  - Calculates dynamic SLA deadlines from the `escalation_rules` table.
  - Enforces the status state machine (`ALLOWED_TRANSITIONS`).
  - Records status transitions in `complaint_status_history` and system actions in `audit_logs`.

### `src/controllers/authController.js` (Identity & Passwords)
- Validates logins using `bcrypt.compare` to compare the entered password with the hashed password stored in MySQL.
- Registers students, hashes passwords with salt, and generates secure JWT tokens.

### `src/controllers/commentController.js` (Discussion Thread)
- Saves comments between students and staff.
- Implements the privacy rule: internal notes flagged with `is_internal = TRUE` are visible only to staff and administrators.

### `src/controllers/feedbackController.js` (Student Reviews)
- Allows the student who submitted the ticket to record a 1 to 5 star rating and review after resolution.
- Automatically transitions the ticket status from `resolved` to `closed`.

### `src/controllers/analyticsController.js` (Dashboard Metrics)
- Computes aggregated counts (active, resolved, overdue), resolution durations, and category/priority breakdowns directly using SQL queries (`COUNT`, `AVG`, `SUM`, `GROUP BY`) so dashboard charts render instantaneously.

---

## 7. Security Best Practices Enforced

1. **No SQL Injection**: Every single query uses parameterized SQL (`?` placeholders). No user input is ever concatenated into SQL strings.
2. **No Plain-Text Passwords**: Passwords are encrypted using `bcryptjs` with salt rounds.
3. **No Unprotected Roles**: Roles are verified server-side through signed JWT tokens and active database user lookups, never trusting arbitrary role parameters sent from browser state.
4. **Data Isolation**: Student and staff queries are strictly scoped in SQL (`WHERE student_id = ?` / `WHERE department_id = ?`), preventing unauthorized cross-user access.
5. **ACID Transactions**: Multi-table operations (complaint + history + notification + audit) are wrapped in atomic transactions.

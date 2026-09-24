# Campus Desk: Student Support & Ticket Management System

Full-stack platform where students raise support requests (fees, attendance, ID cards, certificates, exams, hostel, transport, library, IT, general) and staff, managers and administrators process, assign, monitor and audit them.

## Main features
- Four roles: Student, Support Staff, Manager, Administrator (backend-enforced authorization and department scoping)
- Ticket lifecycle with server-validated status transitions, human-readable numbers (`TKT-2026-000001`, atomic counter)
- Public replies, internal notes (never returned to students), attachments (PDF/JPG/PNG/DOC/DOCX, 10 MB, max 5, MIME + magic-byte validation)
- Configurable SLA policies stored in DB, stored deadlines, Due Soon / Breached detection (background job every 60 s), ageing buckets
- Assignment / reassignment with validation, inactive-staff handling, in-app notifications, append-only audit log
- Dashboards per role, reports (summary, staff workload, SLA monitoring, ageing), server-side search/filter/pagination
- Admin: users, departments, categories/subcategories, SLA policies, audit logs, system settings

## Stack
React 18 + Vite, React Router, Axios · Node.js, Express 4, Mongoose · MongoDB · JWT + bcrypt · Multer, Helmet, CORS, express-rate-limit, Zod

## Structure
```
backend/  src/{config,controllers,models,routes,middleware,services,utils,seed}  uploads/  tests/
frontend/ src/{components,pages,layouts,services,context,hooks,utils}
```
Controllers are thin; business logic lives in `services/`. The frontend talks to the API only through `services/`.

## Prerequisites
Node.js 18+ and MongoDB 6+ (local or Atlas).

## Setup
```bash
# MongoDB: run locally (mongod) or use an Atlas URI in backend/.env
cd backend
cp .env.example .env        # then set MONGO_URI and a long random JWT_SECRET
npm install
npm run seed                # DEV ONLY: wipes the DB and loads demo data
npm run dev                 # http://localhost:5000

cd ../frontend
cp .env.example .env        # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                 # http://localhost:5173
```

### Environment variables
Backend: `PORT, NODE_ENV, MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN, CLIENT_URL (comma separated origins), UPLOAD_DIR, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD`
Frontend: `VITE_API_URL` only. Never put secrets in frontend variables. `.env` files are git-ignored.

## Demo accounts (DEVELOPMENT ONLY)
All use the password `Password@123`.

| Role | Email |
|---|---|
| Administrator | admin@college.edu |
| Manager (CSE) | manager1@college.edu (manager2@college.edu for ECE) |
| Support staff (CSE) | staff1@college.edu … staff3@college.edu (staff4/5 are ECE) |
| Student (CSE) | student1@college.edu … student20@college.edu |

Never use these in production. Seeding creates 1 admin, 2 managers, 5 staff, 20 students, 4 departments, 10 categories, 4 SLA policies, 36 tickets with messages, internal notes, notifications and audit logs.

## Demo workflow
Student1 creates an Attendance ticket → Manager1 assigns it to Staff1 (staff notified) → Staff1 moves it to In Progress and replies → student replies → staff adds an internal note and resolves → student closes → manager dashboard and the ticket's activity history reflect every step.

## Roles and scope
- **Student**: own tickets only; create, reply, attach, close resolved, reopen resolved (or closed within the reopen window, default 7 days).
- **Staff**: tickets assigned to them or in their department; reply, internal notes, status, priority (own tickets).
- **Manager**: tickets in their department (all if no department); assign/reassign, priority, workload, reports, ticket audit history.
- **Admin**: everything, including users, configuration, audit logs and permanent ticket deletion.

## Ticket lifecycle
`Open → Assigned | In Progress`, `Assigned → In Progress | Pending`, `In Progress → Pending | Resolved`, `Pending → In Progress | Resolved`, `Resolved → Closed | Reopened`, `Closed → Reopened`, `Reopened → In Progress`. Enforced in `ticket.service.js`; each change writes an audit record, updates the activity timestamp and notifies the relevant users.

## API overview (`/api`, JSON `{success, message, data}` / `{success:false, message, error}`)
- Auth: `POST /auth/register|login|logout`, `GET|PATCH /auth/me`
- Tickets: `POST|GET /tickets`, `GET|PATCH|DELETE /tickets/:id`, `PATCH /tickets/:id/status|priority|assign`, `POST /tickets/:id/reopen|close`, `GET /tickets/:id/history`
- Messages: `GET|POST /tickets/:ticketId/messages` (multipart, field `attachments`), `GET /files/:filename` (authorized download)
- Dashboard: `GET /dashboard/student|staff|manager|admin|workload`
- Notifications: `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`
- Admin: `/users`, `/categories`, `/departments`, `/sla-policies` (DELETE deactivates so history is preserved), `GET /audit-logs`, `GET|PATCH /settings`
- Ticket list query: `page, limit, search, status, priority, category, department, assignedTo (id|unassigned|inactive), from, to, slaStatus, age (lt1d|1to3d|3to7d|7to14d|gt14d), open, sort`

## Attachments
Stored in `backend/uploads` (git-ignored) with random names; only metadata is in MongoDB. Files are served through an authorization check. Uploads that fail validation or DB writes are deleted. To use cloud storage, replace the Multer storage engine in `middleware/upload.js` and the file lookup in `ticket.service.getFile`.

## Tests
`cd backend && npm test`. Unit tests run standalone; the integration workflow test needs MongoDB reachable at `MONGO_URI` and a seeded database (`npm run seed`).

## Troubleshooting
- *Startup failed / ECONNREFUSED*: MongoDB is not running or `MONGO_URI` is wrong.
- *Missing required environment variable*: create `backend/.env` from `.env.example`.
- *CORS error*: add the frontend origin to `CLIENT_URL`.
- *Cannot reach the server*: check `VITE_API_URL` and that the backend is running.
- *Too many attempts*: the auth rate limiter (20 / 15 min in production) was hit.

## Production notes
Set `NODE_ENV=production`, a strong `JWT_SECRET`, an Atlas/managed `MONGO_URI`, exact `CLIENT_URL`; serve the frontend from `npm run build` output behind HTTPS; do not run the seed; move uploads to object storage; run behind a reverse proxy; run a single SLA job instance (or move it to a scheduler) when scaling horizontally; add SMTP delivery if email notifications are required.

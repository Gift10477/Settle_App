# SettleIn

Student accommodation search and reservation system for Software Engineering deliverables 1 and 2. Existing search, listing details and account screens are retained.

Students submit reservations and track approval in **My reservations**. Administrators sign in and select **Admin panel** to manage listings, verify publication, approve/reject/cancel reservations, manage roles, reset passwords, inspect audit logs and create filtered reservation reports (CSV or print/save as PDF). Approval reduces vacancy atomically; cancellation restores it. New listings require verification before appearing publicly. Public sign-up permits student and landlord accounts, never administrator accounts.

## Database

This project uses **settlein_se_db** exclusively. The backend refuses any other DB_NAME to protect the previous project. The local database was rebuilt from the project schema after its InnoDB tables became unreadable; the old source records and passwords were not restored. The schema seeds four demonstration properties and one account without a usable password. Create a fresh administrator before using the admin panel. No live payment processor is configured.

On another machine, copy server/.env.example to server/.env and configure local MySQL credentials with DB_NAME=settlein_se_db. Run npm.cmd install and npm.cmd run db:copy from server, then npm.cmd run db:normalize to move legacy amenities/group-member lists into relationship tables and enforce foreign keys. The copy command reads the source database and refuses to overwrite an existing target. The normalization step stops if legacy orphan records need reconciliation; it will not silently discard them. Set SOURCE_DB_NAME if needed. Without a source database, import server/database/schema.sql instead. Never import it into the original project's database.

## Administrator setup

This checkout has a local administrator account; its access details are in the Git-ignored `server/admin-access.local.txt`. Rotate the password before deployment. On another machine, choose a new ADMIN_EMAIL and ADMIN_PASSWORD (8-128 characters) in the local server/.env, then run npm.cmd run admin:create from server. The script creates an administrator and refuses to overwrite an existing account. Remove ADMIN_PASSWORD from the file afterward. Public registration cannot create administrators.

## Run

Start MySQL and run npm.cmd start in server (port 5001). In a second terminal run npm.cmd install and npm.cmd run dev in app. Open http://localhost:5173. The React app uses its local server connection to query MySQL; database credentials stay in server/.env. Login sessions authorize private requests and expire after one hour or server restart. Production hosting must forward /data to this app server.

## Checks and limits

Frontend: npm.cmd run lint, npm.cmd run build, and npm.cmd test from app. Backend: npm.cmd test from server. A real MySQL workflow check is available as node scripts/verify-management.cjs; it removes its temporary fixtures afterward. Use [the user guide](docs/USER-GUIDE.md) for workflows and [the database guide](docs/DATABASE.md) for relationships and status rules.

The original deliverables PDFs are retained. Administrators can upload JPEG, PNG and WebP photos up to 5 MB or use image URLs. Uploaded files stay in server/uploads and must be included in deployment backups. Password recovery is admin-assisted; email-based self-service recovery is not configured. Payments are displayed only when records exist; reservations do not fabricate payments.

## Production deployment

Set `NODE_ENV=production`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=settlein_se_db`, and `CORS_ORIGINS` to the exact frontend origin before starting the API. Production startup refuses missing DB credentials or an empty CORS allowlist. Use a least-privilege database account, TLS, a persistent session store for multi-instance deployments, backups, and a production host/reverse proxy that forwards `/data` to the API. This repository documents local development; a public deployment URL, installer, and presentation evidence still need to be supplied by the team.

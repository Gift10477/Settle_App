# SettleIn

Student accommodation search and reservation system for Software Engineering deliverables 1 and 2. Existing search, listing details and account screens are retained.

Students submit reservations and track approval in **My reservations**. Administrators sign in and select **Admin panel** to manage listings, verify publication, approve/reject/cancel reservations, manage roles, reset passwords, inspect audit logs and export reservation reports. Approval reduces vacancy atomically; cancellation restores it. New listings require verification before appearing publicly.

## Database

This copy uses **settlein_se_db** exclusively. The backend refuses any other DB_NAME to protect the previous project. Source records were copied locally from **settlein_db**. Existing passwords and data are retained. The copy adds audit_logs and payments tables. No live payment processor is configured.

On another machine, copy server/.env.example to server/.env and configure local MySQL credentials with DB_NAME=settlein_se_db. Run npm.cmd install and npm.cmd run db:copy from server. The copy command reads the source database and refuses to overwrite an existing target. Set SOURCE_DB_NAME if needed. Without a source database, import server/database/schema.sql instead. Never import it into the original project's database.

## Administrator setup

This checkout has a local admin account. Its credentials are in `server/admin-access.local.txt`, excluded from Git. Sign in and select **Admin panel**.

On another machine, choose a new ADMIN_EMAIL and ADMIN_PASSWORD (8-128 characters) in your local server/.env, then run npm.cmd run admin:create from server. The script creates a new administrator and refuses to overwrite existing accounts. Remove ADMIN_PASSWORD from the file afterward. Public registration creates students only.

## Run

Start MySQL and run npm.cmd start in server (port 5001). In a second terminal run npm.cmd install and npm.cmd run dev in app. Open http://localhost:5173. The React app uses its local server connection to query MySQL; database credentials stay in server/.env. Login sessions authorize private requests and expire after one hour or server restart. Production hosting must forward /data to this app server.

## Checks and limits

Frontend: npm.cmd run build and npm.cmd test from app. Backend: npm.cmd test from server. A real MySQL workflow check is available as node scripts/verify-management.cjs; it removes its temporary fixtures afterward. Database relationships and status rules are documented in [the database guide](docs/DATABASE.md).

The original deliverables PDF is retained. Administrators can upload JPEG, PNG and WebP photos up to 5 MB or use image URLs. Uploaded files stay in server/uploads and must be included in deployment backups. Admin password resets are available; self-service password-reset email is future work. Payments are displayed only when records exist; reservations do not fabricate payments.

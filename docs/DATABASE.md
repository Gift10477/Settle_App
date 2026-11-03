# SettleIn database

The Software Engineering app uses `settlein_se_db`. The previous project's `settlein_db` is a source for the one-time copy only. The backend rejects configuration targeting another database.

| Table | Purpose | Relationships |
| --- | --- | --- |
| users | Accounts, hashed passwords, profile information and student/admin roles | One user submits many bookings |
| properties | Accommodation details, price, image, verification and available units | One property receives many bookings |
| bookings | Student requests, move-in dates, lease dates and reservation status | user_id identifies users; property_id identifies properties |
| payments | Recorded payment amount, reference and status | booking_id references bookings |
| audit_logs | Administrator action, actor, target and timestamp | actor_id identifies the administrator; target_id identifies the affected record |
| group_inquiries | Existing shared-housing inquiries retained from the source | Existing student references are retained |

Existing columns and data are preserved in the copied database. The legacy user/property/booking relationships remain logical references; the copy tool does not retrofit foreign keys or discard rows. Payments have an explicit booking foreign key. Do not claim every relationship has a database-enforced foreign key in the revised ERD.

New reservations start as `pending`. Administrators may approve, reject or cancel them. Approval atomically consumes one vacant unit. Cancellation of an approved reservation restores that unit. Existing `active` bookings remain valid legacy records; cancelling one leaves vacancy unchanged because the previous system did not decrement inventory. Administrators can reconcile legacy inventory through listing edits. Listings with reservation history cannot be deleted; unpublish them instead.

New listings are unpublished until verified. Public users cannot register as administrators. Password changes use salted scrypt hashes and invalidate existing sessions. Audit logs record listing updates/deletions, reservation decisions, role changes and password resets.

The payment table does not imply that M-PESA or another payment gateway is connected. It remains empty until genuine payment records are supplied.

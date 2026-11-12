# SettleIn user guide

## Find accommodation

1. Select **Browse Properties** or search by campus from the home page.
2. Narrow the results by campus, room type, rent, amenities, or search term; use the sort menu to compare listings.
3. Sign in or create a student or landlord account to open a listing's full details.
4. On a listing, choose a move-in date and lease duration, then submit a reservation request.
5. Open **My reservations** to see whether the request is pending, approved, rejected, or cancelled.

An administrator reviews requests. Approval reserves an available unit; cancelling an approved request returns that unit to inventory. SettleIn does not accept online payments.

## List a property

Sign in as a landlord, select **List Your Property**, complete the listing form, and submit it. The listing stays unpublished until an administrator verifies it. Contact an administrator if submitted details need changing.

## Account recovery

Select **Forgot password? Contact an administrator** on the sign-in form and follow the Help instructions. An administrator verifies the request, opens **Admin panel → Users**, selects **Reset password**, and shares the temporary password with the user privately. The user should sign in and request a new password change from their administrator. Email-based self-service recovery is not configured.

## Administrator

1. Sign in using the administrator account configured for the deployment.
2. Open **Admin panel** to add, edit, verify, unpublish, or remove listings; review and decide reservations; manage account roles and password resets; inspect recorded payments; and review the audit log.
3. In **Reservations**, use status, submission-date, student/property search, and sort filters before exporting a CSV or printing/saving a branded report as PDF.
4. Do not treat the payments screen as a payment gateway: it only displays payment records already entered into the database.

## Troubleshooting

- **Listings or dashboard fail to load:** ask the administrator to confirm MySQL, the API server, and the configured database are running. Retry with **Refresh dashboard**.
- **A reservation cannot be approved:** verify the listing is published and has a vacant unit. Another approved reservation may have taken the last unit.
- **A listing is not public:** it must be verified by an administrator.
- **A password is forgotten:** use the admin-assisted recovery steps above.
- **An image upload is rejected:** use a valid JPEG, PNG, or WebP no larger than 5 MB.

## Administrator setup and deployment

For local setup, database initialization, production environment requirements, and checks, see the [project README](../README.md) and [database guide](./DATABASE.md). Production needs a configured MySQL account, TLS at the hosting/reverse-proxy layer, and `CORS_ORIGINS` set to the exact deployed frontend origin. Keep credentials and uploaded listing images in deployment backups.

# Logify Express — Admin Setup

This project already contains the administrator sign-in screen and dashboard. Use this checklist to provision the first administrator safely on Railway.

## 1. Configure Railway variables

On the Logify Express service, open **Variables** and confirm:

- `DATABASE_URL`: the connection URL for the Railway PostgreSQL service.
- `JWT_SECRET`: a new private random secret of at least 32 characters. Do not reuse a secret that has been shared in chat, logs, screenshots, or commits.
- `ADMIN_EMAIL`: the email address you will use to sign in.
- `ADMIN_PASSWORD`: a unique password of at least 12 characters.

Keep these values private. Do not put passwords or database URLs in source control.

## 2. Initialize the database (one time)

After confirming `DATABASE_URL` points to the intended database, run these commands from the project environment connected to that database:

```sh
npm run db:push
npm run db:seed
```

The first command applies the Prisma schema to the database. Check that the database is the correct one before running it, especially if it contains existing data. The seed command creates or updates the administrator specified by `ADMIN_EMAIL` and sets its password from `ADMIN_PASSWORD`; run it again only when you intentionally want to reset that administrator's password.

If your Railway setup has a one-time/pre-deploy command facility, use it for this initialization only, then remove the seed command from automatic deployment steps. Do not run the seed command on every app start.

## 3. Deploy and verify

1. Deploy the latest `main` branch.
2. Open `/api/health`. A healthy response should have HTTP 200 and `"database":"ok"`.
3. Open `/secure-admin-portal-9x7k`.
4. Sign in with the exact `ADMIN_EMAIL` and `ADMIN_PASSWORD` values configured above.
5. Confirm the dashboard loads shipments, drivers, customers, payments, and alerts.

If health returns HTTP 503 or `"database":"error"`, fix the Railway PostgreSQL connection and database initialization first. Admin login cannot work while Prisma cannot reach the database.

## Security notes

- The admin URL is not a substitute for authentication; every protected API route must still verify the token and role.
- Only database users with the `ADMIN` or `SUPER_ADMIN` role can sign in to the admin workspace.
- Rotate exposed credentials immediately. Never share the value of `JWT_SECRET`, `DATABASE_URL`, or `ADMIN_PASSWORD`.

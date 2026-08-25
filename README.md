# TaskFlow

TaskFlow is a responsive Vanilla JavaScript task manager backed by an Express REST API and MySQL.

## Run locally

1. Install Node.js 18+ and MySQL.
2. Create the database and table with `schema.sql`.
3. Copy `.env.example` to `.env` and set the MySQL credentials.
4. Install dependencies with `npm.cmd install` (PowerShell may block the `npm` shim).
5. Start the app with `npm.cmd start`.
6. Open `http://localhost:5000`.

If the database already existed before reminder support was added, run `migration-reminders.sql` once before restarting the server. For an existing database adding account support, run `migration-auth.sql` after that.

If the API/database is unavailable, the frontend automatically uses a small localStorage demo dataset so the interface can still be explored during development.

## Enable web push reminders

1. Generate VAPID keys: `npx web-push generate-vapid-keys`.
2. Put the public key, private key, and a contact email in `.env` as `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT`.
3. Run TaskFlow over HTTPS in production. `localhost` is allowed by browsers for local development.
4. Open the app, click **Enable alerts**, and allow browser notifications.
5. Use **Test alert** to verify the subscription. When creating a task, the app calculates the reminder automatically from the deadline:
   - more than 3 days away: reminder 3 days before
   - 2-3 days away: reminder 2 days before
   - 1-2 days away: reminder 1 day before
   - less than 1 day away: reminder is sent immediately

The main page also includes a calendar view for the current month, with task deadlines and reminder dates.

Push subscriptions are stored in `data/push-subscriptions.json`; keep that file private and back it up in production. Push notifications require the browser permission to remain enabled.

## Deploy with Coolify

This repository includes `Dockerfile` and `docker-compose.yml`. In Coolify, create a **Docker Compose** resource pointing to this repository, expose the `app` service on port `5000`, and add these environment variables:

```env
MYSQL_PASSWORD=change-this-app-password
MYSQL_ROOT_PASSWORD=change-this-root-password
JWT_SECRET=use-a-long-random-secret
DEFAULT_USERNAME=admin
DEFAULT_PASSWORD=change-this-password
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:you@example.com
```

Attach your domain to the `app` service on port `5000`. Coolify will provide HTTPS, which is required for Web Push in production. The MySQL and push subscription data use persistent Docker volumes.

## Accounts

Open the app and choose **Create an account** on the login page. Each task is stored with the logged-in user's ID, so users only see and manage their own tasks. Alternatively, set `DEFAULT_USERNAME` and `DEFAULT_PASSWORD` in Coolify to create the first account automatically on startup.

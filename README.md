# TDC Meets

Meeting platform for The DarkNet Community. No attendee limit, no Google Meet 100-person cap.

## Run locally

Backend:
```bash
cd meet-platform/backend && npm install && npm run dev
```

Frontend (separate terminal):
```bash
cd meet-platform/frontend && npm install && npm start
```

Open http://localhost:3000

Admin panel: http://localhost:3000/login

## How it works

- **Storage**: JSON files in `backend/data/`. No database server needed.
- **Video**: Jitsi Meet embedded via its public instance, so bandwidth costs nothing.
- **Realtime**: Socket.io for chat and raise-hand.

## Flow

1. Admin logs in and creates a meeting with an unlock time.
2. Admin copies the link, shape `https://yourdomain.com/ROOMID`, and shares it.
3. Attendees open the link, type a name, and join. No account needed.
4. Before unlock time the link shows "Please wait, [workshop] will start at [time]".
5. Admin clicks End, and the link then shows "[workshop] has ended".

## Config

`backend/.env`:

```
JWT_SECRET=change_this_in_production
ADMIN_EMAIL=krish@thedarknetcommunity.com
ADMIN_PASSWORD=Krushial@01
PORT=5000
FRONTEND_URL=http://localhost:3000
```

The admin account is created on first successful login with these credentials.

Frontend reads `REACT_APP_API_URL` to find the backend. Defaults to `http://localhost:5000`.

## Deploy

- Frontend to Vercel, root directory `meet-platform/frontend`, env `REACT_APP_API_URL` pointing at the backend URL.
- Backend to Railway or Render, root `meet-platform/backend`, env vars as above plus `FRONTEND_URL`.
- Point `meet.thedarknetcommunity.com` at the Vercel deployment.

Note: `backend/data/` is ephemeral on Railway and Render free tiers. Attach a persistent volume, or move to a hosted database, if meeting history must survive restarts.

# TDC Meets

Meeting platform for The DarkNet Community workshops, built because Google Meet caps a room at 100 participants.

Live at https://tdc-meets.vercel.app

## Run locally

Backend:
```bash
cd backend && npm install && cp .env.example .env && npm run dev
```

Fill in `.env` before starting. Frontend, in a separate terminal:
```bash
cd frontend && npm install && npm start
```

Open http://localhost:3000, admin panel at http://localhost:3000/login

## How it works

- **Storage**: Supabase when `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set, otherwise JSON files under `backend/data/`. Run `backend/schema.sql` once in the Supabase SQL editor.
- **Video**: Jitsi Meet embedded from a public instance, so bandwidth costs nothing.
- **Realtime**: Socket.io for chat, raised hands and the attendee list.

## Flow

1. Admin logs in and creates a meeting with a link unlock time.
2. Admin shares the link, shaped `https://tdc-meets.vercel.app/ROOMID`.
3. Attendees open it, type a name, and join. No account needed.
4. Before the unlock time the link reads "Please wait, [workshop] will start at [time]".
5. Admin clicks End, and the link then reads "[workshop] has ended".

## Starting the video

meet.jit.si requires the first participant in a room to sign in as moderator. So before each workshop the host clicks **Start Room** on the meeting card, signs in there once, and comes back. Everyone else joins through this app with no account.

Until that happens, attendees see a "Waiting for the host" screen rather than Jitsi's own notice. It clears by itself once the room opens.

This step disappears if the community ever runs its own Jitsi server, see [deploy/SELF_HOSTING.md](deploy/SELF_HOSTING.md).

## Config

Backend reads `backend/.env`, see [.env.example](backend/.env.example) for the full list. The admin account is created on the first successful login with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

Frontend reads `REACT_APP_API_URL` to find the backend, defaulting to `http://localhost:5000`, and `REACT_APP_JITSI_DOMAIN` to pick the Jitsi instance.

## Deploy

See [deploy/VERCEL.md](deploy/VERCEL.md). Frontend goes to Vercel with root directory `frontend`, backend to Render with root directory `backend`.

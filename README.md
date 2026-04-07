# XeyStream (Local Twitch-like Platform)

A full-stack live streaming platform with:
- Node.js + Express backend
- PostgreSQL database
- Socket.io realtime events
- WebRTC live media distribution
- React frontend
- JWT auth + refresh sessions
- Followers, stream discovery, notifications, chat moderation

## IMPORTANT: Why `index.html` looked blank

This project is a **Vite + React app**. You cannot open `frontend/index.html` directly from disk (double-click / `file://...`).
It must be served by the Vite dev server so ES modules and React bundling work.

If you open `index.html` directly, the browser will not load the app correctly and you'll see a blank page.

## Project structure

- `backend/`
  - `controllers/`, `models/`, `routes/`, `services/`, `middleware/`, `socket/`, `db/`, `tests/`
- `frontend/src/`
  - `components/`, `pages/`, `hooks/`, `services/`, `context/`

## Setup

### 1) Prerequisites
- Node.js 20+
- PostgreSQL 14+

### 2) Create DB
```sql
CREATE DATABASE xeytest;
```

### 3) Backend
```bash
cd backend
cp .env.example .env
# edit DATABASE_URL/JWT secrets if needed
npm install
npm run dev
```
Backend runs on `http://localhost:4000`.

### 4) Frontend
Open a **second terminal**:
```bash
cd frontend
npm install
npm run dev
```
Then open:
- `http://localhost:5173`

Do **not** open `frontend/index.html` directly.

## Quick start (copy/paste)

### Terminal 1
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Terminal 2
```bash
cd frontend
npm install
npm run dev
```

### Browser
Open `http://localhost:5173`.

## Troubleshooting blank page

1. Verify frontend dev server is running and you are using `http://localhost:5173`.
2. Open browser DevTools Console:
   - If you see failed network calls to `http://localhost:4000`, start backend.
3. Check backend health:
```bash
curl http://localhost:4000/health
```
Expected:
```json
{"ok":true}
```
4. If backend cannot start, verify PostgreSQL is running and `DATABASE_URL` in `backend/.env` is correct.
5. If ports are busy, change ports and keep frontend/backend URLs aligned.

## Feature walkthrough

### Auth
1. Register user with role viewer/streamer/admin.
2. Login returns access token and sets refresh cookie.
3. Refresh endpoint renews access token.
4. Logout revokes refresh session.

### Streaming (WebRTC)
1. Streamer logs in and clicks **Start stream**.
2. Browser captures camera/mic using MediaDevices.
3. Backend creates live stream and announces via websocket.
4. Viewer selects stream from live list.
5. WebRTC signaling is relayed by socket server; frontend uses browser-native RTCPeerConnection (no simple-peer) and broadcaster publishes a peer connection per viewer.
6. Viewer receives low-latency media stream in `video` element.
7. Disconnects are handled; viewer count auto-updates; dead streams are cleaned when broadcaster disconnects.

### Chat
- Join stream room automatically when viewing.
- Realtime messages with username + timestamp.
- Spam protection (per-user message rate limit).
- Moderation: streamer/admin can delete messages and timeout users.

### Follow + Notifications
- Viewer can follow/unfollow streamer.
- Streamer follower count returned by API.
- When followed streamer goes live, followers connected by websocket receive notification event.

### Discovery
- `/api/streams/live` supports category filter and sorting by viewer count/start time.
- Realtime updates emitted when viewer counts change or streams start/end.

## API quick map
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/users/me`
- `GET /api/users/me/following`
- `GET /api/streams/live`
- `GET /api/streams/live/:streamId`
- `POST /api/streams/start`
- `POST /api/streams/stop/:streamId`
- `POST /api/follows/:streamerId`
- `DELETE /api/follows/:streamerId`

## Testing
Run basic API tests:
```bash
cd backend
npm test
```

## Manual end-to-end validation checklist
1. Register streamer account and viewer account.
2. Login streamer and start stream.
3. Login viewer in another browser/incognito and open same stream.
4. Confirm viewer sees live video.
5. Send chat messages both sides and confirm instant updates.
6. Follow streamer from viewer and verify follow count updates.
7. Stop stream and confirm viewers get stream ended event.
8. Start stream again and verify viewer gets "followed streamer live" notification.
9. Confirm `/api/streams/live` list updates in realtime as viewers join/leave.
10. Confirm browser console and backend logs show no unhandled errors during normal flow.

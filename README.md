# XeyStream (Local Twitch-like Platform)

A full-stack live streaming platform with:
- Node.js + Express backend
- PostgreSQL database
- Socket.io realtime events
- WebRTC live media distribution
- React frontend
- JWT auth + refresh sessions
- Followers, stream discovery, notifications, chat moderation

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
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

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
5. WebRTC signaling is relayed by socket server; broadcaster publishes a peer connection per viewer.
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

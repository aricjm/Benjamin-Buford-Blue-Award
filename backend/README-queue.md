Queued picks backup

- POST /api/queue/picks  -> accepts { week, season, player, picks } and appends to backend/pending-picks.jsonl
- GET /api/queue/picks   -> list pending items (admin)
- POST /api/queue/flush   -> trigger immediate flush (admin)

Flusher:
- backend/flush_pending_picks.js reads pending-picks.jsonl, attempts to write to DB using existing db.savePick, and rewrites remaining items back to file.

Scheduler:
- flusher is invoked during scheduled syncs.

Frontend:
- useBetData.savePicks will attempt normal POST; on server error or network error it will POST to /api/queue/picks and persist a localStorage key `pending_picks_{season}_{week}_{player}` so the client shows pending state.

Run manual flush:

```powershell
cd backend
node -r dotenv/config flush_pending_picks.js
```

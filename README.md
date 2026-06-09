# College Football Bet Tracker

A full stack college football betting tracker for you, Nick, and Cisco. This app stores weekly picks, mandatory televised games, optional games, and automatically updates scores and bet results using The Odds API.

## Stack
- Backend: Node.js + Express
- Database: SQLite for local/dev
- Frontend: React + Vite
- Scheduler: node-cron
- External API: The Odds API

---

## Project structure
- `backend/` — Express API, SQLite data layer, game sync logic
- `frontend/` — React + Vite UI

---

## Local setup step-by-step

### 1) Start the backend

1. Open a terminal and go to the backend folder:
   ```powershell
   cd c:\ProgramData\Development\Benjamin-Buford-Blue-Award\backend
   ```
2. Install backend dependencies:
   ```powershell
   npm install
   ```
3. Initialize the SQLite database:
   ```powershell
   npm run init-db
   ```
4. Start the backend server:
   ```powershell
   npm start
   ```

The backend will run on `http://localhost:4000`.

### 2) Start the frontend

1. Open a second terminal and go to the frontend folder:
   ```powershell
   cd c:\ProgramData\Development\Benjamin-Buford-Blue-Award\frontend
   ```
2. Install frontend dependencies:
   ```powershell
   npm install
   ```
3. Start the frontend dev server:
   ```powershell
   npm run dev
   ```

The app will open in your browser at `http://localhost:5173`.

---

## How to use

- Select which player is picking: `You`, `Nick`, or `Cisco`
- Choose a season and a week from the dropdowns
- The app shows 5 mandatory televised games first
- Pick one side for each mandatory game
- Optionally pick other games as extra
- Use the manual game form to add a game not returned by The Odds API
- Save your picks and they will appear in the weekly summary

---

## New features

- Season selector for multiple college football seasons
- Weekly summary, season summary, and all-time summary pages
- Manual game entry for any game not in The Odds API

---

## Notes

- The backend uses SQLite by default in `backend/data/bets.db`
- The scheduler syncs odds and scores hourly
- If you want to use a different API key, set `ODDS_API_KEY` in your environment

---

## If you want PostgreSQL later

You can replace SQLite with Postgres in `backend/db.js` and update the database connection logic to use `pg` instead of `better-sqlite3`.

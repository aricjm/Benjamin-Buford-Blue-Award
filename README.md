<<<<<<< HEAD
# BenjaminBufordBlueAward
=======
# BenjaminBufordBlueAward (BBBAward)

This repository contains a full-stack app to track college football picks for Aric, Nick, and Cisco using a Google Sheet as the database.

## Features
- Submit weekly picks (5 mandatory televised games + optional games).
- Track picks per week, season, and all-time.
- Automatic result calculation using point spreads.
- Admin page to override scores and mark games final.
- Google Sheet as the single source of truth.

## Repo layout
- `backend/` — Node/Express API that reads/writes the Google Sheet.
- `frontend/` — React single-page app for submitting picks and admin overrides.

## Quick start (local)

### 1) Create Google service account and share the sheet
1. Create a Google Cloud project and a service account.
2. Create and download a JSON key file and place it at `backend/service-account.json`.
3. Share your Google Sheet `Benjamin Buford Blue` with the service account email (Editor).
   - Sheet ID: `16oSWKgLnYY50gcFmSCaBiILd97IYme0BQYLyUAgpqeM`

### 2) Backend
```bash
cd backend
cp .env.example .env
# edit .env to point to your service-account.json and set SYNC_SECRET
npm install
npm start
>>>>>>> 94c2749 (Init commit - BBBAward)

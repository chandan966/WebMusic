# WebMusic — Full-stack music streaming starter

A Spotify-inspired red/black music web app built with React + Vite, Express, and MySQL. Includes responsive UI, search, audio player, registration/login, likes, and playlists.

## Requirements
- Node.js 20+
- MySQL 8+

## Setup
1. Import `backend/database/schema.sql` into MySQL Workbench (or run it in the MySQL CLI).
2. In `backend`, copy `.env.example` to `.env`, edit database credentials, and set a strong random `JWT_SECRET`.
3. Run `npm install` then `npm run dev` in `backend`.
4. In another terminal, run `npm install` then `npm run dev` in `frontend`.
5. Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

The app includes demo audio URLs for development. Replace them with audio you own or are licensed to stream. This starter is not production-ready; add deployment hardening, secure storage/CDN, monitoring, account recovery, and full input validation before launch.

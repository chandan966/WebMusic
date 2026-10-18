# WebMusic

WebMusic is a single Next.js application for the music UI and its API. It uses PostgreSQL for users, tracks, likes, and playlists, and is configured to deploy as one project on Vercel.

## Local setup

Requirements: Node.js 20+ and a PostgreSQL database (Neon is supported).

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `DATABASE_URL` to the Neon PostgreSQL connection URL and set `JWT_SECRET` to a long, random value. Keep `.env.local` private; it is ignored by Git.
4. Set `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` from your Spotify Developer Dashboard to enable Spotify search. Keep the client secret private.
5. Create the tables and starter tracks with `npm run db:setup`.
6. Start the app with `npm run dev` and open the URL shown in the terminal.

The API is served by the same app at `/api`: authentication (`/api/auth/register`, `/api/auth/login`), tracks (`/api/tracks`), Spotify search (`/api/spotify/search?q=...`), admin song/user/branding management (`/api/admin/...`), public branding (`/api/settings`), liked tracks (`/api/tracks/liked`), likes (`/api/tracks/:id/like`), playlists (`/api/playlists`), playlist tracks (`/api/playlists/:id/tracks`), and health (`/api/health`).

### Admin account

To create the initial admin account, set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` in your private `.env.local` (or deployment environment), then run `npm run db:setup` against the intended database. Choose a unique password of at least 12 characters; do not commit or share it. `BOOTSTRAP_ADMIN_NAME` is optional and defaults to `WebMusic Admin`.

The setup creates the account if it does not exist. If that email already belongs to an account, setup promotes it to admin and sets its password to `BOOTSTRAP_ADMIN_PASSWORD`. Then sign out and use **Admin login** with that email and password. Public registration never creates admin accounts. Admins can manage catalogue songs, user roles/accounts, and the visible WebMusic/search-button names. If the production database was initialized before the branding settings table was added, run `npm run db:setup` with its `DATABASE_URL` pointed at that database; the schema setup is idempotent.

## Vercel deployment

Import this repository as one Vercel project. Add `DATABASE_URL`, `JWT_SECRET`, `SPOTIFY_CLIENT_ID`, and `SPOTIFY_CLIENT_SECRET` as Vercel environment variables for each environment, then deploy or redeploy. Run `npm run db:setup` once against the production database before relying on the API; do not run schema setup as part of every deployment.

The supplied MySQL schema has been translated to PostgreSQL in [`database/schema.sql`](./database/schema.sql). Only the schema and sample-track definitions were provided; copying rows from an existing MySQL database requires access to that database and a separate data migration.

The seeded audio URLs are samples. Replace them with audio you own or are licensed to stream.

Spotify search is handled by the server so the client secret is never exposed to the browser. Search results include Spotify metadata and open in Spotify's embedded player; Spotify controls playback and availability. Admins can add a Spotify search result to the WebMusic catalogue; playback remains inside Spotify's official embed.

# WebMusic

WebMusic is a single Next.js application for the music UI and its API. It uses PostgreSQL for users, tracks, likes, and playlists, and is configured to deploy as one project on Vercel.

## Local setup

Requirements: Node.js 20+ and a PostgreSQL database (Neon is supported).

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `DATABASE_URL` to the Neon PostgreSQL connection URL and set `JWT_SECRET` to a long, random value. Keep `.env.local` private; it is ignored by Git.
4. Create the tables and starter tracks with `npm run db:setup`.
5. Start the app with `npm run dev` and open the URL shown in the terminal.

The API is served by the same app at `/api`: authentication (`/api/auth/register`, `/api/auth/login`), tracks (`/api/tracks`), liked tracks (`/api/tracks/liked`), likes (`/api/tracks/:id/like`), playlists (`/api/playlists`), playlist tracks (`/api/playlists/:id/tracks`), and health (`/api/health`).

## Vercel deployment

Import this repository as one Vercel project. Add `DATABASE_URL` and `JWT_SECRET` as Vercel environment variables for each environment, then deploy. Run `npm run db:setup` once against the production database before relying on the API; do not run schema setup as part of every deployment.

The supplied MySQL schema has been translated to PostgreSQL in [`database/schema.sql`](./database/schema.sql). Only the schema and sample-track definitions were provided; copying rows from an existing MySQL database requires access to that database and a separate data migration.

The seeded audio URLs are samples. Replace them with audio you own or are licensed to stream.

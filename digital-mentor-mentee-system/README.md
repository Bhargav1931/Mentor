# MentorBridge — Digital Mentor-Mentee System

A full-stack mentoring platform built with **Next.js (App Router)**, **PostgreSQL** and **Drizzle ORM**.

## Features
- Email/password auth with secure, httpOnly session cookies (roles: **mentor** / **mentee**)
- Profiles with headline, bio, skills, experience, location, availability
- Mentor directory with search + skill filter, ratings and recommendations
- Mentorship requests (send / withdraw / accept / decline)
- Mentorship workspace: private messaging, shared goals (To do → In progress → Done),
  session scheduling with meeting links + notes, two-way feedback & ratings
- Dashboard with stats, upcoming sessions and goal progress

Database tables are created **automatically** on first request and demo data is seeded
when the database is empty.

Demo accounts (password `password123`): `priya@mentor.dev`, `daniel@mentor.dev`,
`aarav@mentee.dev`, `sofia@mentee.dev`.

## Deploy to Vercel
1. Push this project to a GitHub repository.
2. Go to https://vercel.com/new and import the repository (framework: Next.js — auto detected).
3. Add a Postgres database: in the Vercel project open **Storage → Create Database → Neon (Postgres)**
   and connect it to the project, **or** use any hosted Postgres (Neon, Supabase, Railway).
4. Make sure the environment variable `DATABASE_URL` is set (Settings → Environment Variables).
   Hosted providers require SSL, e.g. `postgresql://user:pass@host/db?sslmode=require`.
5. Click **Deploy**. Your app is live at `https://<project-name>.vercel.app`.

Or with the CLI:
```bash
npm i -g vercel
vercel login
vercel env add DATABASE_URL   # paste your Postgres connection string
vercel --prod
```

## Local development
```bash
echo 'DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db' > .env
npm install
npm run dev
```

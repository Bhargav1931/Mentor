import "server-only";
import { scryptSync, timingSafeEqual } from "crypto";
import type { PoolClient } from "pg";
import { pool } from "@/db";

const g = globalThis as typeof globalThis & { __mbBootstrap?: Promise<void> };

const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL,
  headline VARCHAR(200) NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  skills TEXT NOT NULL DEFAULT '',
  years_experience INTEGER NOT NULL DEFAULT 0,
  location VARCHAR(120) NOT NULL DEFAULT '',
  availability VARCHAR(200) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL
);
CREATE TABLE IF NOT EXISTS mentorships (
  id SERIAL PRIMARY KEY,
  mentor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  message TEXT NOT NULL DEFAULT '',
  goals TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  responded_at TIMESTAMP
);
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  mentorship_id INTEGER NOT NULL REFERENCES mentorships(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  mentorship_id INTEGER NOT NULL REFERENCES mentorships(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  due_date VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'todo',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS meetings (
  id SERIAL PRIMARY KEY,
  mentorship_id INTEGER NOT NULL REFERENCES mentorships(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 30,
  meeting_link TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  mentorship_id INTEGER NOT NULL REFERENCES mentorships(id) ON DELETE CASCADE,
  from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
`;

// Run once on existing installations; never delete user-created mentors by role.
async function removeDemoMentors(c: PoolClient) {
  await c.query("CREATE TABLE IF NOT EXISTS app_migrations (name TEXT PRIMARY KEY)");
  const applied = await c.query("SELECT 1 FROM app_migrations WHERE name = 'remove-demo-mentors-v1'");
  if (applied.rowCount) return;
  const demos = await c.query<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE role = 'mentor' AND email = ANY($1::text[])",
    [["priya@mentor.dev", "daniel@mentor.dev", "elena@mentor.dev", "marcus@mentor.dev"]],
  );
  for (const demo of demos.rows) {
    const [salt, digest] = demo.password_hash.split(":");
    if (!salt || !digest) continue;
    const stored = Buffer.from(digest, "hex");
    const expected = scryptSync("password123", salt, 64);
    if (stored.length === expected.length && timingSafeEqual(stored, expected)) {
      // Related demo requests, sessions, goals and messages cascade automatically.
      await c.query("DELETE FROM users WHERE id = $1", [demo.id]);
    }
  }
  await c.query("INSERT INTO app_migrations (name) VALUES ('remove-demo-mentors-v1')");
}

export function ensureDb(): Promise<void> {
  if (!g.__mbBootstrap) {
    g.__mbBootstrap = (async () => {
      const c = await pool.connect();
      try {
        await c.query("BEGIN");
        await c.query("SELECT pg_advisory_xact_lock(424242)");
        await c.query(DDL);
        await removeDemoMentors(c);
        await c.query("COMMIT");
      } catch (e) {
        await c.query("ROLLBACK").catch(() => {});
        throw e;
      } finally {
        c.release();
      }
    })().catch((e) => {
      g.__mbBootstrap = undefined;
      throw e;
    });
  }
  return g.__mbBootstrap;
}

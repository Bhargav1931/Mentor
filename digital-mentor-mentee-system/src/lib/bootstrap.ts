import "server-only";
import { randomBytes, scryptSync } from "crypto";
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

function hash(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
}

const MENTORS = [
  ["Priya Sharma", "priya@mentor.dev", "Senior Software Engineer @ Google", "I've spent 10+ years building large-scale distributed systems. I love helping early-career engineers grow into confident problem solvers, prepare for interviews, and navigate their first promotions.", "JavaScript, React, System Design, Career Growth, Interview Prep", 11, "Bengaluru, India", "Weekday evenings (IST)"],
  ["Daniel Okafor", "daniel@mentor.dev", "Product Design Lead", "Design leader focused on user research and design systems. I mentor designers transitioning into product roles and building strong portfolios.", "UI/UX, Figma, Design Systems, Portfolio Review, User Research", 9, "Lagos, Nigeria", "Weekends"],
  ["Elena Rossi", "elena@mentor.dev", "Data Science Manager", "Former academic turned industry data scientist. Happy to help with ML fundamentals, Python, and breaking into data careers.", "Python, Machine Learning, Statistics, SQL, Career Change", 8, "Milan, Italy", "Tue & Thu mornings (CET)"],
  ["Marcus Chen", "marcus@mentor.dev", "Startup Founder & Engineering Manager", "Two-time founder. I mentor on leadership, entrepreneurship, fundraising and building engineering teams from scratch.", "Leadership, Entrepreneurship, Product Management, Node.js, Public Speaking", 14, "San Francisco, USA", "Flexible — book a slot"],
] as const;

const MENTEES = [
  ["Aarav Patel", "aarav@mentee.dev", "Computer Science Student", "Final-year CS student aiming for a frontend engineering role.", "JavaScript, React, HTML/CSS", 0, "Pune, India", ""],
  ["Sofia Martinez", "sofia@mentee.dev", "Junior UX Designer", "Graphic designer moving into UX. Looking for portfolio guidance.", "Figma, Illustration", 1, "Madrid, Spain", ""],
] as const;

async function seed(c: PoolClient) {
  const { rows } = await c.query<{ c: string }>("SELECT count(*)::text AS c FROM users");
  if (Number(rows[0].c) > 0) return;
  const pw = hash("password123");
  const ids: Record<string, number> = {};
  for (const [role, list] of [["mentor", MENTORS], ["mentee", MENTEES]] as const) {
    for (const u of list) {
      const r = await c.query<{ id: number }>(
        `INSERT INTO users (name,email,password_hash,role,headline,bio,skills,years_experience,location,availability)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (email) DO NOTHING RETURNING id`,
        [u[0], u[1], pw, role, u[2], u[3], u[4], u[5], u[6], u[7]],
      );
      if (r.rows[0]) ids[u[1]] = r.rows[0].id;
    }
  }
  const priya = ids["priya@mentor.dev"], aarav = ids["aarav@mentee.dev"];
  const daniel = ids["daniel@mentor.dev"], sofia = ids["sofia@mentee.dev"];
  const elena = ids["elena@mentor.dev"];
  if (!priya || !aarav || !daniel || !sofia || !elena) return;

  const m1 = await c.query<{ id: number }>(
    `INSERT INTO mentorships (mentor_id, mentee_id, status, message, goals, responded_at)
     VALUES ($1,$2,'active',$3,$4, now()) RETURNING id`,
    [priya, aarav, "Hi Priya! I'd love guidance on landing my first frontend role.", "Land a frontend internship, improve React skills, prepare for interviews"],
  );
  const mid = m1.rows[0].id;
  await c.query(
    `INSERT INTO messages (mentorship_id, sender_id, body, created_at) VALUES
     ($1,$2,'Welcome Aarav! Excited to work together. Let''s start by reviewing your resume.', now() - interval '2 days'),
     ($1,$3,'Thank you! I''ve uploaded my resume and portfolio link in our goals.', now() - interval '1 day')`,
    [mid, priya, aarav],
  );
  await c.query(
    `INSERT INTO goals (mentorship_id, title, description, due_date, status) VALUES
     ($1,'Polish resume','Tailor resume for frontend roles, highlight React projects', to_char(now() + interval '7 days','YYYY-MM-DD'),'in_progress'),
     ($1,'Build a portfolio project','A full React app with API integration and tests', to_char(now() + interval '30 days','YYYY-MM-DD'),'todo'),
     ($1,'Learn JavaScript fundamentals','Closures, promises, event loop', to_char(now() - interval '3 days','YYYY-MM-DD'),'done')`,
    [mid],
  );
  await c.query(
    `INSERT INTO meetings (mentorship_id, title, scheduled_at, duration_min, meeting_link, status, notes) VALUES
     ($1,'Kickoff & goal setting', now() - interval '5 days', 45, 'https://meet.google.com/', 'completed', 'Discussed career goals and set a 3-month roadmap.'),
     ($1,'Resume review', now() + interval '2 days', 30, 'https://meet.google.com/', 'scheduled', '')`,
    [mid],
  );
  await c.query(
    `INSERT INTO mentorships (mentor_id, mentee_id, status, message, goals) VALUES ($1,$2,'pending',$3,$4)`,
    [daniel, sofia, "Hello Daniel, I'm transitioning to UX and would love portfolio feedback.", "Build a UX case study portfolio"],
  );
  const m3 = await c.query<{ id: number }>(
    `INSERT INTO mentorships (mentor_id, mentee_id, status, message, goals, responded_at) VALUES ($1,$2,'completed',$3,$4, now()) RETURNING id`,
    [elena, aarav, "Interested in learning basics of data analysis.", "Learn pandas and SQL basics"],
  );
  await c.query(
    `INSERT INTO feedback (mentorship_id, from_user_id, to_user_id, rating, comment) VALUES ($1,$2,$3,5,'Elena explained statistics in such a clear way. Highly recommend!')`,
    [m3.rows[0].id, aarav, elena],
  );
}

export function ensureDb(): Promise<void> {
  if (!g.__mbBootstrap) {
    g.__mbBootstrap = (async () => {
      const c = await pool.connect();
      try {
        await c.query("BEGIN");
        await c.query("SELECT pg_advisory_xact_lock(424242)");
        await c.query(DDL);
        await seed(c);
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

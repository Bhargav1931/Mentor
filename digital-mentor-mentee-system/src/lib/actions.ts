"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, or, inArray } from "drizzle-orm";
import { db } from "@/db";
import { users, mentorships, messages, goals, meetings, feedback } from "@/db/schema";
import { createSession, destroySession, hashPassword, verifyPassword, requireUser } from "./auth";
import { ensureDb } from "./bootstrap";

export type FormState = { error?: string; ok?: string } | undefined;

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) => Number(f.get(k) ?? 0) || 0;

async function loadMentorship(id: number, userId: number) {
  const [m] = await db
    .select()
    .from(mentorships)
    .where(and(eq(mentorships.id, id), or(eq(mentorships.mentorId, userId), eq(mentorships.menteeId, userId))))
    .limit(1);
  if (!m) throw new Error("Mentorship not found");
  return m;
}

/* ---------------- Auth ---------------- */

export async function registerAction(_: FormState, f: FormData): Promise<FormState> {
  await ensureDb();
  const name = str(f, "name");
  const email = str(f, "email").toLowerCase();
  const password = str(f, "password");
  const role = str(f, "role");
  if (!name || !email || !password) return { error: "All fields are required." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Please enter a valid email." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };
  if (role !== "mentor" && role !== "mentee") return { error: "Please choose a role." };
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) return { error: "An account with this email already exists." };
  const [u] = await db
    .insert(users)
    .values({ name, email, role, passwordHash: hashPassword(password) })
    .returning({ id: users.id });
  await createSession(u.id);
  redirect("/profile?welcome=1");
}

export async function loginAction(_: FormState, f: FormData): Promise<FormState> {
  await ensureDb();
  const email = str(f, "email").toLowerCase();
  const password = str(f, "password");
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!u || !verifyPassword(password, u.passwordHash)) return { error: "Invalid email or password." };
  await createSession(u.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

/* ---------------- Profile ---------------- */

export async function updateProfileAction(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = str(f, "name");
  if (!name) return { error: "Name is required." };
  const skills = str(f, "skills")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
  await db
    .update(users)
    .set({
      name,
      headline: str(f, "headline").slice(0, 200),
      bio: str(f, "bio"),
      skills,
      yearsExperience: Math.max(0, Math.min(60, num(f, "yearsExperience"))),
      location: str(f, "location").slice(0, 120),
      availability: str(f, "availability").slice(0, 200),
    })
    .where(eq(users.id, user.id));
  revalidatePath("/", "layout");
  return { ok: "Profile saved successfully." };
}

/* ---------------- Requests ---------------- */

export async function requestMentorshipAction(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser();
  if (user.role !== "mentee") return { error: "Only mentees can send mentorship requests." };
  const mentorId = num(f, "mentorId");
  const message = str(f, "message");
  const goalsText = str(f, "goals");
  if (!message) return { error: "Please write a short introduction message." };
  const [mentor] = await db.select().from(users).where(and(eq(users.id, mentorId), eq(users.role, "mentor"))).limit(1);
  if (!mentor) return { error: "Mentor not found." };
  const open = await db
    .select({ id: mentorships.id })
    .from(mentorships)
    .where(
      and(
        eq(mentorships.mentorId, mentorId),
        eq(mentorships.menteeId, user.id),
        inArray(mentorships.status, ["pending", "active"]),
      ),
    )
    .limit(1);
  if (open.length) return { error: "You already have a pending or active mentorship with this mentor." };
  await db.insert(mentorships).values({ mentorId, menteeId: user.id, message, goals: goalsText });
  revalidatePath("/requests");
  revalidatePath(`/mentors/${mentorId}`);
  return { ok: "Request sent! You'll be notified once the mentor responds." };
}

export async function respondRequestAction(f: FormData) {
  const user = await requireUser();
  const id = num(f, "id");
  const decision = str(f, "decision");
  const m = await loadMentorship(id, user.id);
  if (m.mentorId !== user.id || m.status !== "pending") return;
  await db
    .update(mentorships)
    .set({ status: decision === "accept" ? "active" : "declined", respondedAt: new Date() })
    .where(eq(mentorships.id, id));
  if (decision === "accept") {
    await db.insert(messages).values({
      mentorshipId: id,
      senderId: user.id,
      body: `Hi! I've accepted your mentorship request. Looking forward to working together 🎉`,
    });
  }
  revalidatePath("/", "layout");
}

export async function cancelRequestAction(f: FormData) {
  const user = await requireUser();
  const id = num(f, "id");
  const m = await loadMentorship(id, user.id);
  if (m.menteeId !== user.id || m.status !== "pending") return;
  await db.delete(mentorships).where(eq(mentorships.id, id));
  revalidatePath("/", "layout");
}

export async function completeMentorshipAction(f: FormData) {
  const user = await requireUser();
  const id = num(f, "id");
  const m = await loadMentorship(id, user.id);
  if (m.status !== "active") return;
  await db.update(mentorships).set({ status: "completed" }).where(eq(mentorships.id, id));
  revalidatePath("/", "layout");
}

/* ---------------- Messages ---------------- */

export async function sendMessageAction(f: FormData) {
  const user = await requireUser();
  const id = num(f, "mentorshipId");
  const body = str(f, "body");
  if (!body) return;
  const m = await loadMentorship(id, user.id);
  if (m.status !== "active") return;
  await db.insert(messages).values({ mentorshipId: id, senderId: user.id, body });
  revalidatePath(`/mentorships/${id}`);
}

/* ---------------- Goals ---------------- */

export async function addGoalAction(f: FormData) {
  const user = await requireUser();
  const id = num(f, "mentorshipId");
  const title = str(f, "title");
  if (!title) return;
  await loadMentorship(id, user.id);
  await db.insert(goals).values({
    mentorshipId: id,
    title: title.slice(0, 200),
    description: str(f, "description"),
    dueDate: str(f, "dueDate") || null,
  });
  revalidatePath(`/mentorships/${id}`);
}

export async function updateGoalStatusAction(f: FormData) {
  const user = await requireUser();
  const goalId = num(f, "goalId");
  const status = str(f, "status");
  if (!["todo", "in_progress", "done"].includes(status)) return;
  const [g] = await db.select().from(goals).where(eq(goals.id, goalId)).limit(1);
  if (!g) return;
  await loadMentorship(g.mentorshipId, user.id);
  await db.update(goals).set({ status }).where(eq(goals.id, goalId));
  revalidatePath(`/mentorships/${g.mentorshipId}`);
}

export async function deleteGoalAction(f: FormData) {
  const user = await requireUser();
  const goalId = num(f, "goalId");
  const [g] = await db.select().from(goals).where(eq(goals.id, goalId)).limit(1);
  if (!g) return;
  await loadMentorship(g.mentorshipId, user.id);
  await db.delete(goals).where(eq(goals.id, goalId));
  revalidatePath(`/mentorships/${g.mentorshipId}`);
}

/* ---------------- Meetings ---------------- */

export async function scheduleMeetingAction(f: FormData) {
  const user = await requireUser();
  const id = num(f, "mentorshipId");
  const title = str(f, "title");
  const when = str(f, "scheduledAt");
  if (!title || !when) return;
  const date = new Date(when);
  if (isNaN(date.getTime())) return;
  const m = await loadMentorship(id, user.id);
  if (m.status !== "active") return;
  await db.insert(meetings).values({
    mentorshipId: id,
    title: title.slice(0, 200),
    scheduledAt: date,
    durationMin: Math.max(15, Math.min(240, num(f, "durationMin") || 30)),
    meetingLink: str(f, "meetingLink"),
  });
  revalidatePath(`/mentorships/${id}`);
  revalidatePath("/dashboard");
}

export async function updateMeetingAction(f: FormData) {
  const user = await requireUser();
  const meetingId = num(f, "meetingId");
  const [mt] = await db.select().from(meetings).where(eq(meetings.id, meetingId)).limit(1);
  if (!mt) return;
  await loadMentorship(mt.mentorshipId, user.id);
  const status = str(f, "status");
  const patch: { status?: string; notes?: string } = {};
  if (["scheduled", "completed", "cancelled"].includes(status)) patch.status = status;
  if (f.has("notes")) patch.notes = str(f, "notes");
  if (Object.keys(patch).length) await db.update(meetings).set(patch).where(eq(meetings.id, meetingId));
  revalidatePath(`/mentorships/${mt.mentorshipId}`);
  revalidatePath("/dashboard");
}

/* ---------------- Feedback ---------------- */

export async function submitFeedbackAction(f: FormData) {
  const user = await requireUser();
  const id = num(f, "mentorshipId");
  const rating = Math.max(1, Math.min(5, num(f, "rating")));
  const m = await loadMentorship(id, user.id);
  if (m.status === "pending" || m.status === "declined") return;
  const toUserId = m.mentorId === user.id ? m.menteeId : m.mentorId;
  const existing = await db
    .select({ id: feedback.id })
    .from(feedback)
    .where(and(eq(feedback.mentorshipId, id), eq(feedback.fromUserId, user.id)))
    .limit(1);
  if (existing.length) {
    await db.update(feedback).set({ rating, comment: str(f, "comment") }).where(eq(feedback.id, existing[0].id));
  } else {
    await db.insert(feedback).values({ mentorshipId: id, fromUserId: user.id, toUserId, rating, comment: str(f, "comment") });
  }
  revalidatePath(`/mentorships/${id}`);
}

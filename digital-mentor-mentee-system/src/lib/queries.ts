import "server-only";
import { and, avg, count, desc, eq, inArray, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { users, mentorships, feedback, goals, type User } from "@/db/schema";

export async function getUserMentorships(user: User, statuses?: string[]) {
  const mine = user.role === "mentor" ? mentorships.mentorId : mentorships.menteeId;
  const otherCol = user.role === "mentor" ? mentorships.menteeId : mentorships.mentorId;
  const conds: SQL[] = [eq(mine, user.id)];
  if (statuses?.length) conds.push(inArray(mentorships.status, statuses));
  const rows = await db
    .select({ m: mentorships, other: users })
    .from(mentorships)
    .innerJoin(users, eq(users.id, otherCol))
    .where(and(...conds))
    .orderBy(desc(mentorships.createdAt));
  return rows;
}

export async function getGoalProgress(mentorshipIds: number[]) {
  const map = new Map<number, { total: number; done: number }>();
  if (!mentorshipIds.length) return map;
  const rows = await db
    .select({ mid: goals.mentorshipId, status: goals.status, c: count() })
    .from(goals)
    .where(inArray(goals.mentorshipId, mentorshipIds))
    .groupBy(goals.mentorshipId, goals.status);
  for (const r of rows) {
    const e = map.get(r.mid) ?? { total: 0, done: 0 };
    e.total += r.c;
    if (r.status === "done") e.done += r.c;
    map.set(r.mid, e);
  }
  return map;
}

export async function getRatings(userIds: number[]) {
  const map = new Map<number, { avg: number; count: number }>();
  if (!userIds.length) return map;
  const rows = await db
    .select({ uid: feedback.toUserId, a: avg(feedback.rating), c: count() })
    .from(feedback)
    .where(inArray(feedback.toUserId, userIds))
    .groupBy(feedback.toUserId);
  for (const r of rows) map.set(r.uid, { avg: Number(r.a ?? 0), count: r.c });
  return map;
}

export async function getMenteeCounts(mentorIds: number[]) {
  const map = new Map<number, number>();
  if (!mentorIds.length) return map;
  const rows = await db
    .select({ id: mentorships.mentorId, c: count() })
    .from(mentorships)
    .where(and(inArray(mentorships.mentorId, mentorIds), inArray(mentorships.status, ["active", "completed"])))
    .groupBy(mentorships.mentorId);
  for (const r of rows) map.set(r.id, r.c);
  return map;
}

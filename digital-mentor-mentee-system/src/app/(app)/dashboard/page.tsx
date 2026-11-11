import Link from "next/link";
import { and, asc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { meetings, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getGoalProgress, getRatings, getUserMentorships } from "@/lib/queries";
import { respondRequestAction } from "@/lib/actions";
import { Avatar, Badge, Card, EmptyState, SkillChips, Stars, fmtDateTime } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const all = await getUserMentorships(user);
  const active = all.filter((r) => r.m.status === "active");
  const pending = all.filter((r) => r.m.status === "pending");
  const completed = all.filter((r) => r.m.status === "completed");
  const activeIds = active.map((r) => r.m.id);
  const progress = await getGoalProgress(all.map((r) => r.m.id));

  const upcoming = activeIds.length
    ? await db
        .select()
        .from(meetings)
        .where(and(inArray(meetings.mentorshipId, activeIds), eq(meetings.status, "scheduled"), gte(meetings.scheduledAt, new Date(new Date().getTime() - 3600_000))))
        .orderBy(asc(meetings.scheduledAt))
        .limit(5)
    : [];
  const nameById = new Map(all.map((r) => [r.m.id, r.other]));

  let goalsDone = 0, goalsTotal = 0;
  for (const id of activeIds) {
    const p = progress.get(id);
    if (p) { goalsDone += p.done; goalsTotal += p.total; }
  }

  // Recommended mentors for mentees
  let recommended: (typeof users.$inferSelect)[] = [];
  let ratings = new Map<number, { avg: number; count: number }>();
  if (user.role === "mentee") {
    const mentors = await db.select().from(users).where(eq(users.role, "mentor"));
    const mySkills = user.skills.toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
    const connected = new Set(all.filter((r) => r.m.status !== "declined").map((r) => r.other.id));
    recommended = mentors
      .filter((m) => !connected.has(m.id))
      .map((m) => ({ m, score: mySkills.filter((s) => m.skills.toLowerCase().includes(s)).length }))
      .sort((a, b) => b.score - a.score || b.m.yearsExperience - a.m.yearsExperience)
      .slice(0, 3)
      .map((x) => x.m);
    ratings = await getRatings(recommended.map((m) => m.id));
  }

  const stats = [
    { label: "Active mentorships", value: active.length, icon: "🤝" },
    { label: user.role === "mentor" ? "Pending requests" : "Requests awaiting reply", value: pending.length, icon: "📨" },
    { label: "Upcoming sessions", value: upcoming.length, icon: "📅" },
    { label: "Goals completed", value: `${goalsDone}/${goalsTotal}`, icon: "🎯" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Hi, {user.name.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-slate-500">
            {user.role === "mentor" ? "Here's how your mentees are doing." : "Here's an overview of your mentorship journey."}
          </p>
        </div>
        {user.role === "mentee" && <Link href="/mentors" className="btn-primary">Find a mentor</Link>}
      </div>

      {(!user.bio || !user.skills) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <span>Complete your profile (bio & skills) to get better {user.role === "mentor" ? "mentee requests" : "mentor matches"}.</span>
          <Link href="/profile" className="font-semibold underline">Complete profile →</Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="!p-5">
            <div className="text-2xl">{s.icon}</div>
            <p className="mt-2 text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section>
            <h2 className="mb-3 text-lg font-semibold">Active mentorships</h2>
            {active.length === 0 ? (
              <EmptyState
                title="No active mentorships yet"
                text={user.role === "mentor" ? "Accept a request to start mentoring." : "Send a request to a mentor to get started."}
                action={user.role === "mentee" ? <Link href="/mentors" className="btn-primary">Browse mentors</Link> : undefined}
              />
            ) : (
              <div className="space-y-3">
                {active.map(({ m, other }) => {
                  const p = progress.get(m.id) ?? { total: 0, done: 0 };
                  const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
                  return (
                    <Link key={m.id} href={`/mentorships/${m.id}`} className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow">
                      <div className="flex items-center gap-4">
                        <Avatar name={other.name} id={other.id} />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{other.name}</p>
                          <p className="truncate text-sm text-slate-500">{other.headline || (user.role === "mentor" ? "Mentee" : "Mentor")}</p>
                        </div>
                        <Badge status="active" />
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Goal progress</span>
                          <span>{p.done}/{p.total} · {pct}%</span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {user.role === "mentor" && pending.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">New requests</h2>
              <div className="space-y-3">
                {pending.map(({ m, other }) => (
                  <Card key={m.id} className="!p-5">
                    <div className="flex items-start gap-4">
                      <Avatar name={other.name} id={other.id} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{other.name}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{m.message}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <form action={respondRequestAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="decision" value="decline" />
                        <button className="btn-secondary">Decline</button>
                      </form>
                      <form action={respondRequestAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="decision" value="accept" />
                        <button className="btn-primary">Accept</button>
                      </form>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {user.role === "mentee" && recommended.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">Recommended mentors</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {recommended.map((m) => {
                  const r = ratings.get(m.id);
                  return (
                    <Link key={m.id} href={`/mentors/${m.id}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300">
                      <Avatar name={m.name} id={m.id} />
                      <p className="mt-3 font-semibold">{m.name}</p>
                      <p className="line-clamp-1 text-xs text-slate-500">{m.headline}</p>
                      {r && <p className="mt-1 text-xs"><Stars value={r.avg} /> <span className="text-slate-500">({r.count})</span></p>}
                      <div className="mt-3"><SkillChips skills={m.skills} max={2} /></div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <Card>
            <h2 className="font-semibold">Upcoming sessions</h2>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No sessions scheduled.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {upcoming.map((mt) => (
                  <li key={mt.id}>
                    <Link href={`/mentorships/${mt.mentorshipId}?tab=sessions`} className="group flex gap-3">
                      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                        <span className="text-[10px] font-semibold uppercase">{new Date(mt.scheduledAt).toLocaleString("en-US", { month: "short" })}</span>
                        <span className="text-sm font-bold leading-none">{new Date(mt.scheduledAt).getDate()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium group-hover:text-indigo-600">{mt.title}</p>
                        <p className="text-xs text-slate-500">with {nameById.get(mt.mentorshipId)?.name} · {fmtDateTime(mt.scheduledAt)}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <h2 className="font-semibold">Summary</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Completed mentorships</dt><dd className="font-medium">{completed.length}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Total connections</dt><dd className="font-medium">{all.filter((r) => r.m.status !== "declined").length}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Role</dt><dd><Badge status={user.role} /></dd></div>
            </dl>
          </Card>
        </aside>
      </div>
    </div>
  );
}

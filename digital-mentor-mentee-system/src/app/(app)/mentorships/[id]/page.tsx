import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { feedback, goals, meetings, mentorships, messages, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import {
  addGoalAction,
  completeMentorshipAction,
  deleteGoalAction,
  scheduleMeetingAction,
  sendMessageAction,
  submitFeedbackAction,
  updateGoalStatusAction,
  updateMeetingAction,
} from "@/lib/actions";
import { DateTimeInput, LocalTime, ResetForm, SubmitButton } from "@/components/forms";
import { Avatar, Badge, Card, EmptyState, Stars } from "@/components/ui";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "messages", label: "💬 Messages" },
  { key: "goals", label: "🎯 Goals" },
  { key: "sessions", label: "📅 Sessions" },
  { key: "feedback", label: "⭐ Feedback" },
] as const;

export default async function MentorshipPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const tab = TABS.some((t) => t.key === tabParam) ? tabParam! : "messages";
  const mid = Number(id);
  if (!Number.isInteger(mid)) notFound();

  const [m] = await db
    .select()
    .from(mentorships)
    .where(and(eq(mentorships.id, mid), or(eq(mentorships.mentorId, user.id), eq(mentorships.menteeId, user.id))))
    .limit(1);
  if (!m || m.status === "pending" || m.status === "declined") notFound();

  const otherId = m.mentorId === user.id ? m.menteeId : m.mentorId;
  const [[other], msgs, goalList, meetingList, fb] = await Promise.all([
    db.select().from(users).where(eq(users.id, otherId)).limit(1),
    db.select().from(messages).where(eq(messages.mentorshipId, mid)).orderBy(asc(messages.createdAt)),
    db.select().from(goals).where(eq(goals.mentorshipId, mid)).orderBy(asc(goals.createdAt)),
    db.select().from(meetings).where(eq(meetings.mentorshipId, mid)).orderBy(desc(meetings.scheduledAt)),
    db.select().from(feedback).where(eq(feedback.mentorshipId, mid)),
  ]);
  const isActive = m.status === "active";
  const done = goalList.filter((g) => g.status === "done").length;
  const pct = goalList.length ? Math.round((done / goalList.length) * 100) : 0;
  const myFeedback = fb.find((f) => f.fromUserId === user.id);
  const theirFeedback = fb.find((f) => f.fromUserId === otherId);
  const now = Date.now();
  const upcoming = meetingList.filter((x) => x.status === "scheduled" && new Date(x.scheduledAt).getTime() >= now - 3600_000).reverse();
  const past = meetingList.filter((x) => !upcoming.includes(x));

  return (
    <div className="space-y-6">
      <Link href="/mentorships" className="text-sm font-medium text-indigo-600">← All mentorships</Link>

      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={other.name} id={other.id} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{other.name}</h1>
              <Badge status={m.status} />
            </div>
            <p className="text-slate-600">{other.headline}</p>
            <p className="text-sm text-slate-500">Your {user.role === "mentor" ? "mentee" : "mentor"} · {other.email}</p>
          </div>
          {isActive && (
            <form action={completeMentorshipAction}>
              <input type="hidden" name="id" value={m.id} />
              <button className="btn-secondary">✓ Mark as completed</button>
            </form>
          )}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
            <p className="text-xs font-semibold uppercase text-slate-500">Mentorship goals</p>
            <p className="mt-1 text-sm text-slate-700">{m.goals || "—"}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Progress</p>
            <p className="mt-1 text-2xl font-bold">{pct}%</p>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/mentorships/${m.id}?tab=${t.key}`}
            scroll={false}
            className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-center text-sm font-medium ${tab === t.key ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "messages" && (
        <Card className="!p-0">
          <div className="max-h-[480px] space-y-4 overflow-y-auto p-6">
            {msgs.length === 0 && <p className="text-center text-sm text-slate-500">No messages yet. Say hello! 👋</p>}
            {msgs.map((msg) => {
              const mine = msg.senderId === user.id;
              return (
                <div key={msg.id} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                  <Avatar name={mine ? user.name : other.name} id={mine ? user.id : other.id} size="sm" />
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${mine ? "rounded-br-sm bg-indigo-600 text-white" : "rounded-bl-sm bg-slate-100 text-slate-800"}`}>
                    <p className="whitespace-pre-line text-sm">{msg.body}</p>
                    <p className={`mt-1 text-[10px] ${mine ? "text-indigo-200" : "text-slate-400"}`}>
                      <LocalTime iso={msg.createdAt.toISOString()} />
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {isActive ? (
            <ResetForm action={sendMessageAction} className="flex gap-2 border-t border-slate-200 p-4">
              <input type="hidden" name="mentorshipId" value={m.id} />
              <input name="body" required autoComplete="off" placeholder="Write a message…" className="input flex-1" />
              <SubmitButton pendingText="…">Send</SubmitButton>
            </ResetForm>
          ) : (
            <p className="border-t border-slate-200 p-4 text-center text-sm text-slate-500">This mentorship is completed. Messaging is closed.</p>
          )}
        </Card>
      )}

      {tab === "goals" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {goalList.length === 0 && <EmptyState title="No goals yet" text="Add your first goal to start tracking progress." />}
            {goalList.map((g) => (
              <Card key={g.id} className="!p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold ${g.status === "done" ? "text-slate-400 line-through" : ""}`}>{g.title}</p>
                    {g.description && <p className="mt-1 text-sm text-slate-600">{g.description}</p>}
                    {g.dueDate && <p className="mt-2 text-xs text-slate-500">Due {g.dueDate}</p>}
                  </div>
                  <Badge status={g.status} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {(["todo", "in_progress", "done"] as const).map((s) => (
                    <form key={s} action={updateGoalStatusAction}>
                      <input type="hidden" name="goalId" value={g.id} />
                      <input type="hidden" name="status" value={s} />
                      <button
                        disabled={g.status === s}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${g.status === s ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                      >
                        {s === "todo" ? "To do" : s === "in_progress" ? "In progress" : "Done"}
                      </button>
                    </form>
                  ))}
                  <form action={deleteGoalAction} className="ml-auto">
                    <input type="hidden" name="goalId" value={g.id} />
                    <button className="text-xs font-medium text-rose-500 hover:text-rose-700">Delete</button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
          <Card className="h-fit">
            <h2 className="font-semibold">Add a goal</h2>
            <ResetForm action={addGoalAction} className="mt-4 space-y-3">
              <input type="hidden" name="mentorshipId" value={m.id} />
              <input name="title" required placeholder="Goal title" className="input" />
              <textarea name="description" rows={3} placeholder="Details / success criteria" className="input" />
              <div>
                <label className="label">Due date</label>
                <input name="dueDate" type="date" className="input" />
              </div>
              <SubmitButton className="w-full" pendingText="Adding…">Add goal</SubmitButton>
            </ResetForm>
          </Card>
        </div>
      )}

      {tab === "sessions" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section>
              <h2 className="mb-3 font-semibold">Upcoming</h2>
              {upcoming.length === 0 ? (
                <EmptyState title="No upcoming sessions" text="Schedule a 1:1 session to keep momentum." />
              ) : (
                <div className="space-y-3">
                  {upcoming.map((s) => (
                    <Card key={s.id} className="!p-5">
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="flex-1">
                          <p className="font-semibold">{s.title}</p>
                          <p className="text-sm text-slate-500"><LocalTime iso={s.scheduledAt.toISOString()} /> · {s.durationMin} min</p>
                        </div>
                        <Badge status={s.status} />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {s.meetingLink && <a href={s.meetingLink} target="_blank" rel="noreferrer" className="btn-primary !py-1.5 text-xs">Join meeting ↗</a>}
                        <form action={updateMeetingAction}>
                          <input type="hidden" name="meetingId" value={s.id} />
                          <input type="hidden" name="status" value="completed" />
                          <button className="btn-secondary !py-1.5 text-xs">Mark completed</button>
                        </form>
                        <form action={updateMeetingAction}>
                          <input type="hidden" name="meetingId" value={s.id} />
                          <input type="hidden" name="status" value="cancelled" />
                          <button className="btn-danger !py-1.5 text-xs">Cancel</button>
                        </form>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>
            <section>
              <h2 className="mb-3 font-semibold">Past sessions</h2>
              {past.length === 0 ? (
                <p className="text-sm text-slate-500">No past sessions.</p>
              ) : (
                <div className="space-y-3">
                  {past.map((s) => (
                    <Card key={s.id} className="!p-5">
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="flex-1">
                          <p className="font-semibold">{s.title}</p>
                          <p className="text-sm text-slate-500"><LocalTime iso={s.scheduledAt.toISOString()} /> · {s.durationMin} min</p>
                        </div>
                        <Badge status={s.status} />
                      </div>
                      <form action={updateMeetingAction} className="mt-3 space-y-2">
                        <input type="hidden" name="meetingId" value={s.id} />
                        <textarea name="notes" defaultValue={s.notes} rows={2} placeholder="Session notes & key takeaways…" className="input" />
                        <div className="flex justify-end"><SubmitButton className="!py-1.5 text-xs" pendingText="Saving…">Save notes</SubmitButton></div>
                      </form>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
          {isActive && (
            <Card className="h-fit">
              <h2 className="font-semibold">Schedule a session</h2>
              <ResetForm action={scheduleMeetingAction} className="mt-4 space-y-3">
                <input type="hidden" name="mentorshipId" value={m.id} />
                <input name="title" required placeholder="e.g. Mock interview" className="input" />
                <div>
                  <label className="label">Date & time</label>
                  <DateTimeInput name="scheduledAt" required />
                </div>
                <div>
                  <label className="label">Duration</label>
                  <select name="durationMin" defaultValue="30" className="input">
                    {[15, 30, 45, 60, 90].map((d) => <option key={d} value={d}>{d} minutes</option>)}
                  </select>
                </div>
                <input name="meetingLink" type="url" placeholder="Meeting link (Zoom / Meet)" className="input" />
                <SubmitButton className="w-full" pendingText="Scheduling…">Schedule</SubmitButton>
              </ResetForm>
            </Card>
          )}
        </div>
      )}

      {tab === "feedback" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="font-semibold">Your feedback for {other.name.split(" ")[0]}</h2>
            <p className="mt-1 text-sm text-slate-500">Rate your experience and leave a comment. You can update it anytime.</p>
            <form action={submitFeedbackAction} className="mt-4 space-y-4">
              <input type="hidden" name="mentorshipId" value={m.id} />
              <div className="flex flex-row-reverse justify-end gap-1">
                {[5, 4, 3, 2, 1].map((n) => (
                  <label key={n} className="cursor-pointer">
                    <input type="radio" name="rating" value={n} defaultChecked={(myFeedback?.rating ?? 5) === n} className="peer sr-only" />
                    <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 peer-checked:border-amber-400 peer-checked:bg-amber-50 peer-checked:text-amber-700">
                      {n}★
                    </span>
                  </label>
                ))}
              </div>
              <textarea name="comment" rows={4} defaultValue={myFeedback?.comment} placeholder="What went well? What could be better?" className="input" />
              <SubmitButton pendingText="Saving…">{myFeedback ? "Update feedback" : "Submit feedback"}</SubmitButton>
            </form>
          </Card>
          <Card>
            <h2 className="font-semibold">Feedback from {other.name.split(" ")[0]}</h2>
            {theirFeedback ? (
              <div className="mt-4">
                <p className="text-xl"><Stars value={theirFeedback.rating} /></p>
                <p className="mt-2 text-slate-700">{theirFeedback.comment || "No comment."}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No feedback received yet.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

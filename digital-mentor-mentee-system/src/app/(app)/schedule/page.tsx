import Link from "next/link";
import { asc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { meetings } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getUserMentorships } from "@/lib/queries";
import { LocalTime } from "@/components/forms";
import { Badge, Card, EmptyState } from "@/components/ui";

export default async function SchedulePage() {
  const user = await requireUser();
  const relationships = await getUserMentorships(user, ["active", "completed"]);
  const ids = relationships.map(r => r.m.id);
  const sessions = ids.length ? await db.select().from(meetings).where(inArray(meetings.mentorshipId, ids)).orderBy(asc(meetings.scheduledAt)) : [];
  const now = new Date().getTime();
  const upcoming = sessions.filter(s => s.status === "scheduled" && s.scheduledAt.getTime() >= now);
  const past = sessions.filter(s => !upcoming.includes(s)).reverse();
  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold">Schedule</h1><p className="mt-2 text-slate-500">All your mentorship sessions in one place. Times are displayed in your local timezone.</p></div>
    <Card><h2 className="font-semibold">Schedule a session</h2><p className="mt-1 text-sm text-slate-500">Choose an active mentorship to book a meeting.</p><div className="mt-3 flex flex-wrap gap-2">{relationships.filter(r => r.m.status === "active").map(r => <Link key={r.m.id} href={`/mentorships/${r.m.id}?tab=sessions`} className="btn-secondary">{r.other.name} →</Link>)}</div>{!relationships.some(r => r.m.status === "active") && <Link className="mt-3 inline-block text-indigo-600" href="/mentorships">Start a mentorship first →</Link>}</Card>
    {!sessions.length ? <EmptyState title="No sessions yet" text="Once a mentorship is active, book your first session using the options above." /> : [ { title: "Upcoming sessions", list: upcoming }, { title: "Past & cancelled sessions", list: past } ].map(group => <section key={group.title} className="space-y-3"><h2 className="text-xl font-semibold">{group.title}</h2>{!group.list.length && <p className="text-sm text-slate-500">No sessions in this section.</p>}{group.list.map(session => <Card key={session.id}><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{session.title}</h3><Badge status={session.status} /></div><p className="mt-2 text-sm text-slate-600"><LocalTime iso={session.scheduledAt.toISOString()} /> · {session.durationMin} minutes</p><p className="mt-1 text-sm text-slate-500">With {relationships.find(r => r.m.id === session.mentorshipId)?.other.name}</p><Link className="mt-3 inline-block text-sm font-medium text-indigo-600" href={`/mentorships/${session.mentorshipId}?tab=sessions`}>View session & meeting link →</Link></Card>)}</section>)}
  </div>;
}

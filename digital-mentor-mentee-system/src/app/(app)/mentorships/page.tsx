import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getGoalProgress, getUserMentorships } from "@/lib/queries";
import { Avatar, Badge, EmptyState, fmtDate } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function MentorshipsPage() {
  const user = await requireUser();
  const rows = await getUserMentorships(user, ["active", "completed"]);
  const progress = await getGoalProgress(rows.map((r) => r.m.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mentorships</h1>
        <p className="mt-1 text-slate-500">All your active and completed mentorship relationships.</p>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          title="No mentorships yet"
          text={user.role === "mentor" ? "Accept a request to begin mentoring." : "Request a mentor to begin."}
          action={<Link href={user.role === "mentor" ? "/requests" : "/mentors"} className="btn-primary">{user.role === "mentor" ? "View requests" : "Find mentors"}</Link>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map(({ m, other }) => {
            const p = progress.get(m.id) ?? { total: 0, done: 0 };
            const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
            return (
              <Link key={m.id} href={`/mentorships/${m.id}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow">
                <div className="flex items-center gap-4">
                  <Avatar name={other.name} id={other.id} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{other.name}</p>
                    <p className="truncate text-sm text-slate-500">{user.role === "mentor" ? "Mentee" : "Mentor"} · since {fmtDate(m.respondedAt ?? m.createdAt)}</p>
                  </div>
                  <Badge status={m.status} />
                </div>
                {m.goals && <p className="mt-4 line-clamp-2 text-sm text-slate-600">🎯 {m.goals}</p>}
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">{p.done} of {p.total} goals complete</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getUserMentorships } from "@/lib/queries";
import { cancelRequestAction, respondRequestAction } from "@/lib/actions";
import { Avatar, Badge, Card, EmptyState, SkillChips, fmtDate } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const user = await requireUser();
  const rows = await getUserMentorships(user, ["pending", "declined"]);
  const pending = rows.filter((r) => r.m.status === "pending");
  const declined = rows.filter((r) => r.m.status === "declined");
  const isMentor = user.role === "mentor";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{isMentor ? "Incoming requests" : "My requests"}</h1>
        <p className="mt-1 text-slate-500">
          {isMentor ? "Review mentees who would like your guidance." : "Track the mentorship requests you've sent."}
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Pending ({pending.length})</h2>
        {pending.length === 0 ? (
          <EmptyState
            title="No pending requests"
            text={isMentor ? "New requests from mentees will show up here." : "Find a mentor and send a request."}
            action={!isMentor ? <Link href="/mentors" className="btn-primary">Find mentors</Link> : undefined}
          />
        ) : (
          pending.map(({ m, other }) => (
            <Card key={m.id}>
              <div className="flex flex-wrap items-start gap-4">
                <Avatar name={other.name} id={other.id} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{other.name}</p>
                    <Badge status="pending" />
                    <span className="text-xs text-slate-400">· {fmtDate(m.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-500">{other.headline}</p>
                  <div className="mt-2"><SkillChips skills={other.skills} max={5} /></div>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Message</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{m.message}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Goals</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{m.goals || "—"}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                {isMentor ? (
                  <>
                    <form action={respondRequestAction}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="decision" value="decline" />
                      <button className="btn-danger">Decline</button>
                    </form>
                    <form action={respondRequestAction}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="decision" value="accept" />
                      <button className="btn-primary">Accept request</button>
                    </form>
                  </>
                ) : (
                  <form action={cancelRequestAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="btn-danger">Withdraw request</button>
                  </form>
                )}
              </div>
            </Card>
          ))
        )}
      </section>

      {declined.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-500">Declined ({declined.length})</h2>
          {declined.map(({ m, other }) => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 opacity-75">
              <Avatar name={other.name} id={other.id} size="sm" />
              <p className="flex-1 text-sm font-medium">{other.name}</p>
              <span className="text-xs text-slate-400">{fmtDate(m.createdAt)}</span>
              <Badge status="declined" />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

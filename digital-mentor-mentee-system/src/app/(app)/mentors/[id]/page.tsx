import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { feedback, mentorships, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getMenteeCounts, getRatings } from "@/lib/queries";
import { requestMentorshipAction } from "@/lib/actions";
import { StateForm, SubmitButton } from "@/components/forms";
import { Avatar, Badge, Card, SkillChips, Stars, fmtDate } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function MentorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const mentorId = Number(id);
  if (!Number.isInteger(mentorId)) notFound();
  const [mentor] = await db.select().from(users).where(and(eq(users.id, mentorId), eq(users.role, "mentor"))).limit(1);
  if (!mentor) notFound();

  const [ratings, counts, reviews, existing] = await Promise.all([
    getRatings([mentor.id]),
    getMenteeCounts([mentor.id]),
    db
      .select({ f: feedback, author: users })
      .from(feedback)
      .innerJoin(users, eq(users.id, feedback.fromUserId))
      .where(eq(feedback.toUserId, mentor.id))
      .orderBy(desc(feedback.createdAt)),
    db
      .select()
      .from(mentorships)
      .where(and(eq(mentorships.mentorId, mentor.id), eq(mentorships.menteeId, user.id), inArray(mentorships.status, ["pending", "active"])))
      .limit(1),
  ]);
  const r = ratings.get(mentor.id);
  const current = existing[0];

  return (
    <div className="space-y-6">
      <Link href="/mentors" className="text-sm font-medium text-indigo-600">← Back to mentors</Link>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex flex-wrap items-center gap-5">
              <Avatar name={mentor.name} id={mentor.id} size="lg" />
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold">{mentor.name}</h1>
                <p className="text-slate-600">{mentor.headline}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {mentor.location && <>📍 {mentor.location} · </>}
                  {mentor.yearsExperience} years experience
                </p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4 text-center">
              <div><p className="text-xl font-bold">{r ? r.avg.toFixed(1) : "—"}</p><p className="text-xs text-slate-500">Rating</p></div>
              <div><p className="text-xl font-bold">{counts.get(mentor.id) ?? 0}</p><p className="text-xs text-slate-500">Mentees</p></div>
              <div><p className="text-xl font-bold">{reviews.length}</p><p className="text-xs text-slate-500">Reviews</p></div>
            </div>
            <h2 className="mt-6 font-semibold">About</h2>
            <p className="mt-2 whitespace-pre-line text-slate-700">{mentor.bio || "This mentor hasn't added a bio yet."}</p>
            <h2 className="mt-6 font-semibold">Expertise</h2>
            <div className="mt-2"><SkillChips skills={mentor.skills} /></div>
            {mentor.availability && (
              <>
                <h2 className="mt-6 font-semibold">Availability</h2>
                <p className="mt-2 text-slate-700">🕒 {mentor.availability}</p>
              </>
            )}
          </Card>

          <Card>
            <h2 className="font-semibold">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No reviews yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {reviews.map(({ f, author }) => (
                  <li key={f.id} className="py-4 first:pt-0">
                    <div className="flex items-center gap-3">
                      <Avatar name={author.name} id={author.id} size="sm" />
                      <div>
                        <p className="text-sm font-medium">{author.name}</p>
                        <p className="text-xs"><Stars value={f.rating} /> <span className="text-slate-400">· {fmtDate(f.createdAt)}</span></p>
                      </div>
                    </div>
                    {f.comment && <p className="mt-2 text-sm text-slate-600">{f.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside>
          <Card className="sticky top-24">
            {user.role !== "mentee" ? (
              <p className="text-sm text-slate-500">Only mentees can send mentorship requests.</p>
            ) : current ? (
              <div className="space-y-3">
                <p className="font-semibold">Your mentorship</p>
                <Badge status={current.status} />
                <p className="text-sm text-slate-500">
                  {current.status === "pending" ? "Your request is awaiting a response." : "You're currently working with this mentor."}
                </p>
                <Link href={current.status === "active" ? `/mentorships/${current.id}` : "/requests"} className="btn-primary w-full">
                  {current.status === "active" ? "Open mentorship" : "View request"}
                </Link>
              </div>
            ) : (
              <>
                <h2 className="font-semibold">Request mentorship</h2>
                <p className="mt-1 text-sm text-slate-500">Introduce yourself and share what you want to achieve.</p>
                <StateForm action={requestMentorshipAction} className="mt-4 space-y-4" resetOnSuccess>
                  <input type="hidden" name="mentorId" value={mentor.id} />
                  <div>
                    <label className="label" htmlFor="message">Introduction</label>
                    <textarea id="message" name="message" required rows={4} className="input" placeholder={`Hi ${mentor.name.split(" ")[0]}, I'm…`} />
                  </div>
                  <div>
                    <label className="label" htmlFor="goals">Your goals</label>
                    <textarea id="goals" name="goals" rows={3} className="input" placeholder="e.g. Prepare for interviews, learn system design" />
                  </div>
                  <SubmitButton className="w-full" pendingText="Sending…">Send request</SubmitButton>
                </StateForm>
              </>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getMenteeCounts, getRatings } from "@/lib/queries";
import { Avatar, EmptyState, SkillChips, Stars } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function MentorsPage({ searchParams }: { searchParams: Promise<{ q?: string; skill?: string }> }) {
  await requireUser();
  const { q = "", skill = "" } = await searchParams;
  const all = await db.select().from(users).where(eq(users.role, "mentor"));

  const allSkills = Array.from(
    new Set(all.flatMap((m) => m.skills.split(",").map((s) => s.trim()).filter(Boolean))),
  ).sort();

  const ql = q.toLowerCase();
  const mentors = all.filter((m) => {
    const hay = `${m.name} ${m.headline} ${m.bio} ${m.skills} ${m.location}`.toLowerCase();
    const okQ = !ql || hay.includes(ql);
    const okS = !skill || m.skills.toLowerCase().split(",").map((s) => s.trim()).includes(skill.toLowerCase());
    return okQ && okS;
  });

  const ids = mentors.map((m) => m.id);
  const [ratings, menteeCounts] = await Promise.all([getRatings(ids), getMenteeCounts(ids)]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Find a mentor</h1>
        <p className="mt-1 text-slate-500">Browse {all.length} experienced mentors and send a request to start learning.</p>
      </div>

      <form className="flex flex-col gap-3 sm:flex-row">
        <input name="q" defaultValue={q} placeholder="Search by name, skill, role or location…" className="input flex-1" />
        <select name="skill" defaultValue={skill} className="input sm:w-56">
          <option value="">All skills</option>
          {allSkills.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button className="btn-primary">Search</button>
        {(q || skill) && <Link href="/mentors" className="btn-secondary">Clear</Link>}
      </form>

      {mentors.length === 0 ? (
        <EmptyState title="No mentors found" text="Try a different search term or skill." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {mentors.map((m) => {
            const r = ratings.get(m.id);
            return (
              <Link
                key={m.id}
                href={`/mentors/${m.id}`}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <Avatar name={m.name} id={m.id} />
                  <div className="min-w-0">
                    <p className="font-semibold">{m.name}</p>
                    <p className="line-clamp-1 text-sm text-slate-500">{m.headline || "Mentor"}</p>
                  </div>
                </div>
                <p className="mt-4 line-clamp-3 flex-1 text-sm text-slate-600">{m.bio || "No bio yet."}</p>
                <div className="mt-4"><SkillChips skills={m.skills} max={4} /></div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <span>{m.yearsExperience} yrs exp · {menteeCounts.get(m.id) ?? 0} mentees</span>
                  {r ? <span><Stars value={r.avg} /> ({r.count})</span> : <span>New mentor</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, mentorships } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const [[mentorCount], [menteeCount], [activeCount]] = await Promise.all([
    db.select({ c: count() }).from(users).where(eq(users.role, "mentor")),
    db.select({ c: count() }).from(users).where(eq(users.role, "mentee")),
    db.select({ c: count() }).from(mentorships).where(eq(mentorships.status, "active")),
  ]);

  const features = [
    { icon: "🔎", title: "Find the right mentor", text: "Browse mentors by skill, experience and availability. Send a personalised request in seconds." },
    { icon: "🎯", title: "Set & track goals", text: "Create shared goals with due dates and move them from To-do to Done together." },
    { icon: "📅", title: "Schedule sessions", text: "Plan 1:1 meetings with video links, then capture notes and takeaways after each session." },
    { icon: "💬", title: "Built-in messaging", text: "Keep every conversation in one place with a private chat for each mentorship." },
    { icon: "⭐", title: "Feedback & ratings", text: "Share feedback after the mentorship to help mentors grow and mentees choose wisely." },
    { icon: "📊", title: "Progress dashboard", text: "See upcoming sessions, pending requests and goal progress at a glance." },
  ];

  return (
    <main>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary">Log in</Link>
          <Link href="/register" className="btn-primary">Get started</Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-10 lg:grid-cols-2">
        <div>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            Digital mentoring, simplified
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Grow faster with the <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">right mentor</span> by your side.
          </h1>
          <p className="mt-5 text-lg text-slate-600">
            MentorBridge connects mentees with experienced mentors. Match, set goals, meet, message and measure progress — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register?role=mentee" className="btn-primary px-6 py-3 text-base">I want a mentor</Link>
            <Link href="/register?role=mentor" className="btn-secondary px-6 py-3 text-base">I want to mentor</Link>
          </div>
          <div className="mt-10 flex gap-10">
            {[
              [mentorCount.c, "Mentors"],
              [menteeCount.c, "Mentees"],
              [activeCount.c, "Active mentorships"],
            ].map(([n, l]) => (
              <div key={String(l)}>
                <p className="text-3xl font-bold text-slate-900">{n}</p>
                <p className="text-sm text-slate-500">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-indigo-200 via-violet-200 to-sky-200 blur-2xl" />
          <div className="relative space-y-4 rounded-3xl border border-white/60 bg-white/90 p-6 shadow-xl backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 font-semibold text-white">PS</div>
              <div>
                <p className="font-semibold">Priya Sharma</p>
                <p className="text-xs text-slate-500">Senior Software Engineer · Mentor</p>
              </div>
              <span className="ml-auto rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Active</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Goal progress</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
              </div>
              <p className="mt-2 text-sm text-slate-600">2 of 3 goals on track</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Next session</p>
              <p className="mt-1 font-medium">Resume review · Thu 6:00 PM</p>
            </div>
            <div className="rounded-xl bg-indigo-600 p-4 text-sm text-white">
              “Welcome Aarav! Let&apos;s start by reviewing your resume.”
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold">Everything you need for meaningful mentorship</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 p-6">
                <div className="text-3xl">{f.icon}</div>
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-sm text-slate-500">© {new Date().getFullYear()} MentorBridge</footer>
    </main>
  );
}

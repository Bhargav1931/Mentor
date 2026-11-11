import type { ReactNode } from "react";
import Link from "next/link";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { mentorships } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/NavLinks";
import { Avatar, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const [pending] = await db
    .select({ c: count() })
    .from(mentorships)
    .where(
      and(
        eq(user.role === "mentor" ? mentorships.mentorId : mentorships.menteeId, user.id),
        eq(mentorships.status, "pending"),
      ),
    );

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    ...(user.role === "mentee" ? [{ href: "/mentors", label: "Find Mentors" }] : []),
    { href: "/requests", label: "Requests", badge: user.role === "mentor" ? pending.c : 0 },
    { href: "/mentorships", label: "Mentorships" },
    { href: "/profile", label: "Profile" },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
          <Logo href="/dashboard" />
          <div className="order-3 w-full sm:order-none sm:ml-6 sm:w-auto">
            <NavLinks links={links} />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/profile" className="hidden items-center gap-2 sm:flex">
              <Avatar name={user.name} id={user.id} size="sm" />
              <div className="leading-tight">
                <p className="text-sm font-semibold">{user.name}</p>
                <Badge status={user.role} />
              </div>
            </Link>
            <form action={logoutAction}>
              <button className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

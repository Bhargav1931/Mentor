import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { addMemberAction } from "@/lib/actions";
import { StateForm, SubmitButton } from "@/components/forms";
import { Avatar, Badge, Card } from "@/components/ui";

export default async function MembersPage() {
  const user = await requireUser();
  const members = await db.select({ id: users.id, name: users.name, role: users.role, headline: users.headline, availability: users.availability }).from(users).orderBy(asc(users.name));
  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold">Members</h1><p className="mt-2 text-slate-500">Build your mentoring community with real members.</p></div>
    {user.role === "mentor" ? <Card>
      <h2 className="text-xl font-semibold">Add a member</h2>
      <p className="mt-1 text-sm text-slate-500">Create an account with their permission and share the credentials securely. Members can update their profiles after logging in.</p>
      <StateForm action={addMemberAction} resetOnSuccess className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="label">Full name<input name="name" required maxLength={120} className="input" autoComplete="off" /></label>
        <label className="label">Email<input name="email" type="email" required maxLength={200} className="input" autoComplete="off" /></label>
        <label className="label">Initial password<input name="password" type="password" required minLength={8} className="input" autoComplete="new-password" /></label>
        <label className="label">Role<select name="role" className="input"><option value="mentee">Mentee</option><option value="mentor">Mentor</option></select></label>
        <label className="label">Headline<input name="headline" maxLength={200} className="input" /></label>
        <label className="label">Availability<input name="availability" maxLength={200} className="input" placeholder="e.g. Weekday evenings IST" /></label>
        <SubmitButton pendingText="Adding member…">Add member</SubmitButton>
      </StateForm>
    </Card> : <Card>Mentors can add members. New members can also <Link href="/register" className="text-indigo-600">register an account</Link>.</Card>}
    <div className="grid gap-4 sm:grid-cols-2">{members.map(member => <Card key={member.id}>
      <div className="flex items-center gap-3"><Avatar name={member.name} id={member.id} /><div><h2 className="font-semibold">{member.name}</h2><Badge status={member.role} /></div></div>
      <p className="mt-3 text-sm text-slate-600">{member.headline || "Profile not yet completed"}</p>
      <p className="mt-1 text-sm text-slate-500">{member.availability || "Availability not provided"}</p>
      {member.role === "mentor" && member.id !== user.id && <Link className="mt-3 inline-block text-sm font-medium text-indigo-600" href={`/mentors/${member.id}`}>View mentor →</Link>}
    </Card>)}</div>
  </div>;
}

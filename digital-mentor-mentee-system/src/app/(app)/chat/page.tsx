import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getUserMentorships } from "@/lib/queries";
import { Avatar, Badge, Card, EmptyState } from "@/components/ui";

export default async function ChatPage() {
  const user = await requireUser();
  const relationships = await getUserMentorships(user, ["active", "completed"]);
  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold">Chat</h1><p className="mt-2 text-slate-500">Private conversations with your mentors and mentees. Open a conversation to read the latest messages.</p></div>
    {!relationships.length ? <EmptyState title="No conversations yet" text="Send or accept a mentorship request to unlock private chat." action={<Link href="/requests" className="btn-primary">View requests</Link>} /> : <div className="grid gap-4 sm:grid-cols-2">{relationships.map(({ m, other }) => <Card key={m.id}><div className="flex items-center gap-3"><Avatar name={other.name} id={other.id} /><div><h2 className="font-semibold">{other.name}</h2><Badge status={m.status} /></div></div><p className="mt-3 text-sm text-slate-500">{m.status === "active" ? "Continue your conversation or send your first message." : "This mentorship is completed. View your conversation history."}</p><Link href={`/mentorships/${m.id}?tab=messages`} className="btn-primary mt-4">{m.status === "active" ? "Open chat" : "View history"}</Link></Card>)}</div>}
  </div>;
}

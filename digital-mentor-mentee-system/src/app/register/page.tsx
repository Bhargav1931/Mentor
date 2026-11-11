import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { registerAction } from "@/lib/actions";
import { StateForm, SubmitButton } from "@/components/forms";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { role } = await searchParams;
  const defaultRole = role === "mentor" ? "mentor" : "mentee";
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Join as a mentor or a mentee.</p>
          <StateForm action={registerAction} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {(["mentee", "mentor"] as const).map((r) => (
                <label key={r} className="cursor-pointer">
                  <input type="radio" name="role" value={r} defaultChecked={r === defaultRole} className="peer sr-only" />
                  <div className="rounded-xl border-2 border-slate-200 p-4 text-center transition peer-checked:border-indigo-600 peer-checked:bg-indigo-50">
                    <div className="text-2xl">{r === "mentee" ? "🌱" : "🧭"}</div>
                    <div className="mt-1 text-sm font-semibold capitalize">{r}</div>
                    <div className="text-xs text-slate-500">{r === "mentee" ? "I want guidance" : "I want to guide"}</div>
                  </div>
                </label>
              ))}
            </div>
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input id="name" name="name" required className="input" placeholder="Jane Doe" />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required minLength={6} className="input" placeholder="At least 6 characters" />
            </div>
            <SubmitButton className="w-full" pendingText="Creating account…">Create account</SubmitButton>
          </StateForm>
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account? <Link href="/login" className="font-semibold text-indigo-600">Log in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

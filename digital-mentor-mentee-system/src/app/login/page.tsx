import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { loginAction } from "@/lib/actions";
import { StateForm, SubmitButton, DemoFill } from "@/components/forms";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Log in to continue your mentorship journey.</p>
          <StateForm action={loginAction} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required className="input" placeholder="••••••••" />
            </div>
            <SubmitButton className="w-full" pendingText="Logging in…">Log in</SubmitButton>
          </StateForm>
          <p className="mt-6 text-center text-sm text-slate-500">
            New here? <Link href="/register" className="font-semibold text-indigo-600">Create an account</Link>
          </p>
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase text-slate-500">Demo accounts (password: password123) — click to fill</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <DemoFill email="priya@mentor.dev" />
            <DemoFill email="daniel@mentor.dev" />
            <DemoFill email="aarav@mentee.dev" />
            <DemoFill email="sofia@mentee.dev" />
          </div>
        </div>
      </div>
    </main>
  );
}

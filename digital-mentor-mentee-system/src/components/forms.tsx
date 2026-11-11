"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/actions";

export function SubmitButton({ children, className = "", pendingText }: { children: ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`btn-primary ${className}`}>
      {pending ? pendingText ?? "Please wait…" : children}
    </button>
  );
}

export function StateForm({
  action,
  children,
  className = "",
  resetOnSuccess = false,
}: {
  action: (state: FormState, f: FormData) => Promise<FormState>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={className}>
      {state?.error && <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</div>}
      {state?.ok && <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.ok}</div>}
      {children}
    </form>
  );
}

/** Simple form that resets itself after submission (for chat, add goal, etc.) */
export function ResetForm({ action, children, className = "" }: { action: (f: FormData) => Promise<void>; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      className={className}
      action={async (f) => {
        await action(f);
        ref.current?.reset();
      }}
    >
      {children}
    </form>
  );
}

/** datetime-local input that submits an ISO string (timezone-correct on UTC servers) */
export function DateTimeInput({ name, required }: { name: string; required?: boolean }) {
  const hidden = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        type="datetime-local"
        required={required}
        className="input"
        onChange={(e) => {
          if (hidden.current) hidden.current.value = e.target.value ? new Date(e.target.value).toISOString() : "";
        }}
      />
      <input ref={hidden} type="hidden" name={name} />
    </>
  );
}

export function LocalTime({ iso, withTime = true }: { iso: string; withTime?: boolean }) {
  const d = new Date(iso);
  const text = withTime
    ? d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return <time dateTime={iso} suppressHydrationWarning>{text}</time>;
}

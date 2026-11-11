import type { ReactNode } from "react";

const COLORS = [
  "from-indigo-500 to-violet-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-orange-400",
  "from-sky-500 to-cyan-400",
  "from-amber-500 to-yellow-400",
  "from-fuchsia-500 to-pink-500",
];

export function Avatar({ name, id, size = "md" }: { name: string; id: number; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const s = size === "lg" ? "h-20 w-20 text-2xl" : size === "sm" ? "h-8 w-8 text-xs" : "h-12 w-12 text-base";
  return (
    <div
      className={`${s} ${COLORS[id % COLORS.length]} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-sm`}
    >
      {initials}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  active: "bg-emerald-100 text-emerald-800",
  declined: "bg-rose-100 text-rose-800",
  completed: "bg-indigo-100 text-indigo-800",
  scheduled: "bg-sky-100 text-sky-800",
  cancelled: "bg-slate-200 text-slate-600",
  todo: "bg-slate-100 text-slate-700",
  in_progress: "bg-amber-100 text-amber-800",
  done: "bg-emerald-100 text-emerald-800",
  mentor: "bg-violet-100 text-violet-800",
  mentee: "bg-sky-100 text-sky-800",
};

export function Badge({ status, children }: { status: string; children?: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700"}`}>
      {children ?? status.replace("_", " ")}
    </span>
  );
}

export function SkillChips({ skills, max }: { skills: string; max?: number }) {
  const list = skills.split(",").map((s) => s.trim()).filter(Boolean);
  const shown = max ? list.slice(0, max) : list;
  if (!list.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((s) => (
        <span key={s} className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
          {s}
        </span>
      ))}
      {max && list.length > max && <span className="px-1 text-xs text-slate-500">+{list.length - max}</span>}
    </div>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="text-amber-400" aria-label={`${value} out of 5`}>
      {"★".repeat(Math.round(value))}
      <span className="text-slate-300">{"★".repeat(5 - Math.round(value))}</span>
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>{children}</div>;
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
export function fmtDateTime(d: Date | string) {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

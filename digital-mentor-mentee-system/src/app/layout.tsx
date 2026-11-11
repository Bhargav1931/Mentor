import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MentorBridge — Grow together",
  description: "A thoughtful space for mentorship, goals, and meaningful progress.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

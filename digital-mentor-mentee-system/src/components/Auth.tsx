"use client";

import { useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, Sparkles, UserRound, UsersRound } from "lucide-react";

export type Account = {
  name: string;
  email: string;
  password: string;
  account: "mentor" | "mentee";
  title?: string;
  company?: string;
  skills?: string[];
  bio?: string;
};

type Props = {
  onLogin: (email: string, password: string) => string | null;
  onSignup: (account: Account) => string | null;
};

export default function Auth({ onLogin, onSignup }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState<"mentor" | "mentee">("mentee");

  function switchMode(next: "login" | "signup") { setMode(next); setError(""); }
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (mode === "login") {
      const result = onLogin(String(data.get("email")), String(data.get("password")));
      if (result) setError(result);
      return;
    }
    const password = String(data.get("password"));
    if (password.length < 6) { setError("Your password must be at least 6 characters."); return; }
    const result = onSignup({
      name: String(data.get("name")), email: String(data.get("email")), password, account: role,
      title: String(data.get("title") || "Mentee"), company: String(data.get("company") || "MentorBridge"),
      skills: String(data.get("skills") || "Career growth").split(",").map(s => s.trim()).filter(Boolean).slice(0, 3),
      bio: String(data.get("bio") || "Excited to learn, share experiences, and grow with the MentorBridge community."),
    });
    if (result) setError(result);
  }

  return <main className="auth-page">
    <section className="auth-story">
      <div className="auth-brand"><span className="brand-mark"><Sparkles size={20}/></span><span>Mentor<span>Bridge</span></span></div>
      <div className="auth-story-content"><span className="auth-kicker"><UsersRound/> GROW BETTER, TOGETHER</span><h1>A little guidance can change everything.</h1><p>Find people who understand your ambitions, share their experience, and help you turn your next step into real progress.</p><div className="auth-benefits"><span><i><Check/></i>Connect with experienced mentors</span><span><i><Check/></i>Set goals and track your growth</span><span><i><Check/></i>Build meaningful mentoring relationships</span></div></div>
      <div className="auth-quote"><p>“MentorBridge helped me find clarity in my career and someone who genuinely believes in my potential.”</p><div><span className="avatar small violet">AR</span><span><strong>Aarav Rao</strong><small>Product Designer & Mentee</small></span></div></div>
      <span className="auth-orb one"/><span className="auth-orb two"/>
    </section>
    <section className="auth-form-side">
      <div className="auth-mobile-brand"><span className="brand-mark"><Sparkles size={18}/></span>Mentor<span>Bridge</span></div>
      <div className="auth-form-wrap">
        <div className="auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>Log in</button><button className={mode === "signup" ? "active" : ""} onClick={() => switchMode("signup")}>Create account</button></div>
        <div className="auth-heading"><p className="eyebrow">{mode === "login" ? "WELCOME BACK" : "START YOUR JOURNEY"}</p><h2>{mode === "login" ? "Good to see you again" : "Join MentorBridge"}</h2><p>{mode === "login" ? "Log in to continue your mentorship journey." : "Create your account and find your way forward."}</p></div>
        <form className="auth-form" onSubmit={submit} key={mode}>
          {mode === "signup" && <>
            <label>I want to join as a</label><div className="role-picker"><button type="button" className={role === "mentee" ? "selected" : ""} onClick={() => setRole("mentee")}><span>🌱</span><strong>Mentee</strong><small>I want to learn & grow</small></button><button type="button" className={role === "mentor" ? "selected" : ""} onClick={() => setRole("mentor")}><span>🧭</span><strong>Mentor</strong><small>I want to guide others</small></button></div>
            <label>Full name<div className="auth-input"><UserRound/><input name="name" required placeholder="Your full name"/></div></label>
          </>}
          <label>Email address<div className="auth-input"><Mail/><input name="email" type="email" required defaultValue={mode === "login" ? "aarav@mentee.dev" : ""} placeholder="you@example.com"/></div></label>
          <label>Password<div className="auth-input"><LockKeyhole/><input name="password" type={showPassword ? "text" : "password"} required defaultValue={mode === "login" ? "password123" : ""} placeholder={mode === "login" ? "Your password" : "At least 6 characters"}/><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Show password">{showPassword ? <EyeOff/> : <Eye/>}</button></div></label>
          {mode === "signup" && role === "mentor" && <div className="mentor-signup-fields"><div className="form-row"><label>Professional title<input name="title" required placeholder="e.g. Product Designer"/></label><label>Company<input name="company" required placeholder="e.g. Adobe"/></label></div><label>Expertise <span>(comma separated)</span><input name="skills" required placeholder="UX design, Research, Leadership"/></label><label>Short bio<textarea name="bio" required rows={3} placeholder="Tell future mentees how you can help them grow…"/></label><p className="directory-note"><Check/> Your mentor profile will be added to the directory.</p></div>}
          {error && <p className="auth-error">{error}</p>}
          <button className="button primary auth-submit">{mode === "login" ? "Log in to MentorBridge" : `Create ${role} account`}<ArrowRight/></button>
        </form>
        {mode === "login" && <div className="demo-note"><Sparkles/><div><strong>Try the demo account</strong><p>aarav@mentee.dev · password123</p></div></div>}
        <p className="auth-switch">{mode === "login" ? "New to MentorBridge?" : "Already have an account?"} <button onClick={() => switchMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create an account" : "Log in"}</button></p>
      </div>
      <p className="auth-terms">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
    </section>
  </main>;
}

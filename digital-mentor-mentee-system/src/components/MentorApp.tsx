"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Bell, BookOpen, CalendarDays, Check, CheckCircle2, ChevronDown,
  ChevronRight, Circle, Clock3, Compass, Goal, LayoutDashboard, Menu, MessageCircle,
  MoreHorizontal, Plus, Search, Send, LogOut, Sparkles, Star, Target, TrendingUp,
  Video, X, Zap
} from "lucide-react";
import Auth, { type Account } from "./Auth";

const demoAccount: Account = { name: "Aarav Rao", email: "aarav@mentee.dev", password: "password123", account: "mentee" };
const getInitials = (name: string) => name.trim().split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();

type Page = "Overview" | "Find mentors" | "My mentorship" | "Messages" | "Sessions";
type GoalItem = { id: number; title: string; due: string; done: boolean };
type Mentor = { name: string; initials: string; role: string; company: string; skills: string[]; rating: number; reviews: number; sessions: number; color: string; bio: string; available: boolean };
type Session = { id: number; title: string; mentor: string; date: string; time: string; kind: string };

const mentors: Mentor[] = [
  { name: "Priya Sharma", initials: "PS", role: "Senior Product Designer", company: "Atlassian", skills: ["Product design", "UX research", "Leadership"], rating: 4.9, reviews: 48, sessions: 126, color: "violet", bio: "I help designers turn ambiguity into thoughtful products and grow into confident, strategic leaders.", available: true },
  { name: "Daniel Chen", initials: "DC", role: "Engineering Manager", company: "Spotify", skills: ["Engineering", "Career growth", "Management"], rating: 4.8, reviews: 36, sessions: 94, color: "blue", bio: "Former startup founder and engineering leader. I mentor developers navigating their path into technical leadership.", available: true },
  { name: "Maya Rodriguez", initials: "MR", role: "Product Marketing Lead", company: "Notion", skills: ["Marketing", "Strategy", "Storytelling"], rating: 5.0, reviews: 29, sessions: 72, color: "orange", bio: "Helping creative thinkers find their voice, position great products, and build marketing careers with intention.", available: true },
  { name: "Alex Morgan", initials: "AM", role: "Staff Software Engineer", company: "Stripe", skills: ["System design", "React", "Architecture"], rating: 4.9, reviews: 61, sessions: 158, color: "green", bio: "Pragmatic engineer passionate about scalable systems, clean code, and helping developers level up.", available: false },
  { name: "Sarah Kim", initials: "SK", role: "Data Science Manager", company: "Airbnb", skills: ["Data science", "Python", "Leadership"], rating: 4.8, reviews: 24, sessions: 67, color: "pink", bio: "I make data science approachable and help analysts grow into influential, business-minded data leaders.", available: true },
  { name: "James Wilson", initials: "JW", role: "Founder & Startup Advisor", company: "Northstar Labs", skills: ["Startups", "Fundraising", "Strategy"], rating: 4.7, reviews: 42, sessions: 110, color: "yellow", bio: "Two-time founder helping early-stage builders validate ideas, find focus, and build companies that matter.", available: true },
];

const initialGoals: GoalItem[] = [
  { id: 1, title: "Complete portfolio case study", due: "Nov 14", done: false },
  { id: 2, title: "Practice a product critique", due: "Nov 18", done: true },
  { id: 3, title: "Prepare for design interview", due: "Nov 24", done: false },
];
const initialSessions: Session[] = [
  { id: 1, title: "Portfolio review & feedback", mentor: "Priya Sharma", date: "Thursday, Nov 12", time: "6:00 – 6:45 PM", kind: "Video call" },
  { id: 2, title: "Career roadmap check-in", mentor: "Priya Sharma", date: "Thursday, Nov 19", time: "6:00 – 6:45 PM", kind: "Video call" },
];
const nav: { label: Page; icon: typeof LayoutDashboard }[] = [
  { label: "Overview", icon: LayoutDashboard }, { label: "Find mentors", icon: Compass },
  { label: "My mentorship", icon: Goal }, { label: "Messages", icon: MessageCircle }, { label: "Sessions", icon: CalendarDays },
];

function Avatar({ person, small = false }: { person: Mentor | { initials: string; color: string }; small?: boolean }) {
  return <span className={`avatar ${person.color} ${small ? "small" : ""}`}>{person.initials}</span>;
}

export default function MentorApp() {
  const [page, setPage] = useState<Page>("Overview");
  const [currentUser, setCurrentUser] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([demoAccount]);
  const [mentorList, setMentorList] = useState<Mentor[]>(mentors);
  const [hydrated, setHydrated] = useState(false);
  const [goals, setGoals] = useState(initialGoals);
  const [sessions, setSessions] = useState(initialSessions);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [skill, setSkill] = useState("All skills");
  const [modal, setModal] = useState<"goal" | "session" | "request" | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<Mentor>(mentors[0]);
  const [toast, setToast] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { from: "mentor", text: "Hi Aarav! I took a look at your latest case study. The storytelling is much stronger now 👏", time: "10:24 AM" },
    { from: "me", text: "Thank you! I added more context around the research and clarified my design decisions.", time: "10:31 AM" },
    { from: "mentor", text: "That really shows. Let’s walk through the final section together in our next session.", time: "10:33 AM" },
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mentorbridge-data");
      if (saved) {
        const data = JSON.parse(saved);
        if (data.goals) setGoals(data.goals);
        if (data.sessions) setSessions(data.sessions);
        if (data.communityMentors) setMentorList([...mentors, ...data.communityMentors]);
      }
      const savedAuth = localStorage.getItem("mentorbridge-auth");
      if (savedAuth) {
        const auth = JSON.parse(savedAuth);
        if (auth.accounts) setAccounts([demoAccount, ...auth.accounts.filter((a: Account) => a.email !== demoAccount.email)]);
        if (auth.currentUser) setCurrentUser(auth.currentUser);
      }
    } catch { /* use demo data */ }
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem("mentorbridge-data", JSON.stringify({ goals, sessions, communityMentors: mentorList.slice(mentors.length) })); }, [goals, sessions, mentorList, hydrated]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 3200); return () => clearTimeout(t); }, [toast]);

  const go = (p: Page) => { setPage(p); setMobileOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const completed = goals.filter(g => g.done).length;
  const filteredMentors = useMemo(() => mentorList.filter(m => {
    const q = search.toLowerCase();
    return (m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.skills.some(s => s.toLowerCase().includes(q))) && (skill === "All skills" || m.skills.includes(skill));
  }), [search, skill, mentorList]);

  function login(email: string, password: string) {
    const account = accounts.find(a => a.email.toLowerCase() === email.toLowerCase() && a.password === password);
    if (!account) return "Email or password is incorrect. Try the demo account or create a new account.";
    setCurrentUser(account);
    localStorage.setItem("mentorbridge-auth", JSON.stringify({ accounts, currentUser: account }));
    return null;
  }
  function signup(account: Account) {
    if (accounts.some(a => a.email.toLowerCase() === account.email.toLowerCase())) return "An account with this email already exists. Please log in instead.";
    const nextAccounts = [...accounts, account];
    if (account.account === "mentor") {
      const newMentor: Mentor = { name: account.name, initials: getInitials(account.name), role: account.title || "Mentor", company: account.company || "MentorBridge", skills: account.skills || ["Career growth"], rating: 5.0, reviews: 0, sessions: 0, color: "violet", bio: account.bio || "", available: true };
      setMentorList(list => [...list, newMentor]);
    }
    setAccounts(nextAccounts); setCurrentUser(account); setPage(account.account === "mentor" ? "Find mentors" : "Overview");
    localStorage.setItem("mentorbridge-auth", JSON.stringify({ accounts: nextAccounts, currentUser: account }));
    return null;
  }
  function logout() {
    setCurrentUser(null); setPage("Overview");
    localStorage.setItem("mentorbridge-auth", JSON.stringify({ accounts, currentUser: null }));
  }

  if (!hydrated) return <div className="app-loading"><span className="brand-mark"><Sparkles/></span></div>;
  if (!currentUser) return <Auth onLogin={login} onSignup={signup} />;
  const userAvatar = { initials: getInitials(currentUser.name), color: "dark" };

  function addGoal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = new FormData(e.currentTarget);
    setGoals([...goals, { id: Date.now(), title: String(form.get("title")), due: String(form.get("due")) || "No due date", done: false }]);
    setModal(null); setToast("New goal added to your mentorship");
  }
  function addSession(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = new FormData(e.currentTarget);
    setSessions([...sessions, { id: Date.now(), title: String(form.get("title")), mentor: "Priya Sharma", date: String(form.get("date")), time: String(form.get("time")), kind: "Video call" }]);
    setModal(null); setToast("Your session has been scheduled");
  }
  function sendMessage(e: React.FormEvent) {
    e.preventDefault(); if (!message.trim()) return;
    setMessages([...messages, { from: "me", text: message, time: "Just now" }]); setMessage("");
    setTimeout(() => setMessages(prev => [...prev, { from: "mentor", text: "Thanks for the update! I’ll take a look and we can discuss it in our next session.", time: "Just now" }]), 900);
  }

  return <div className="app-shell">
    {mobileOpen && <button className="scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
      <button className="brand" onClick={() => go("Overview")}><span className="brand-mark"><Sparkles size={20}/></span><span>Mentor<span>Bridge</span></span></button>
      <div className="nav-label">WORKSPACE</div>
      <nav>{nav.map(item => <button key={item.label} className={`nav-item ${page === item.label ? "active" : ""}`} onClick={() => go(item.label)}><item.icon size={19}/><span>{item.label}</span>{item.label === "Messages" && <i>2</i>}</button>)}</nav>
      <div className="sidebar-spacer" />
      <div className="streak-card"><span><Zap size={17}/></span><strong>Keep the momentum!</strong><p>You’ve made progress for 3 weeks in a row.</p><div className="week">{["M","T","W","T","F","S","S"].map((d,i) => <b className={i < 4 ? "filled" : ""} key={i}>{i < 4 ? <Check size={12}/> : d}</b>)}</div></div>
      <button className="nav-item settings" onClick={logout}><LogOut size={19}/>Log out</button>
      <div className="profile-mini"><Avatar person={userAvatar} small/><div><strong>{currentUser.name}</strong><span>{currentUser.account === "mentor" ? "Mentor" : "Mentee"} account</span></div><ChevronDown size={16}/></div>
    </aside>

    <main className="main">
      <header className="topbar"><button className="icon-button menu" onClick={() => setMobileOpen(true)}><Menu/></button><div className="global-search"><Search size={18}/><input placeholder="Search mentors, goals, sessions…" onFocus={() => page !== "Find mentors" && go("Find mentors")} value={search} onChange={e => setSearch(e.target.value)}/><kbd>⌘ K</kbd></div><button className="icon-button notification"><Bell size={20}/><i/></button><Avatar person={userAvatar} small/></header>
      <div className="content">
        {page === "Overview" && <>
          <section className="welcome"><div><p className="eyebrow">WEDNESDAY, NOVEMBER 11</p><h1>Good afternoon, {currentUser.name.split(" ")[0]} <span>👋</span></h1><p>You’re building something great. Here’s your mentorship at a glance.</p></div><button className="button primary" onClick={() => setModal("session")}><Plus size={18}/>Schedule session</button></section>
          <section className="stats-grid">
            <div className="stat"><span className="stat-icon purple"><Target/></span><div><p>Goals completed</p><h3>{completed}<small> / {goals.length}</small></h3><span className="trend"><TrendingUp/> On track this month</span></div></div>
            <div className="stat"><span className="stat-icon green"><CalendarDays/></span><div><p>Upcoming sessions</p><h3>{sessions.length}<small> scheduled</small></h3><span className="muted">Next one tomorrow</span></div></div>
            <div className="stat"><span className="stat-icon orange"><Clock3/></span><div><p>Learning time</p><h3>8.5<small> hours</small></h3><span className="trend"><TrendingUp/> +2h from last month</span></div></div>
          </section>
          <div className="dashboard-grid">
            <div className="left-column">
              <section className="panel mentorship-card"><div className="panel-heading"><div><p className="eyebrow">ACTIVE MENTORSHIP</p><h2>Product design & career growth</h2></div><button className="text-button" onClick={() => go("My mentorship")}>View details <ArrowRight/></button></div><div className="mentor-row"><Avatar person={mentors[0]}/><div className="mentor-info"><strong>{mentors[0].name}<span className="online"/></strong><p>{mentors[0].role} at {mentors[0].company}</p><div className="rating"><Star size={14} fill="currentColor"/> {mentors[0].rating} <span>· {mentors[0].sessions} sessions</span></div></div><button className="button soft" onClick={() => go("Messages")}><MessageCircle size={17}/>Message</button></div><div className="progress-label"><span>Overall mentorship progress</span><strong>{Math.round((completed / goals.length) * 100)}%</strong></div><div className="progress"><i style={{width:`${(completed/goals.length)*100}%`}}/></div><p className="progress-note"><Sparkles size={15}/> Great work! One more goal to reach this month’s milestone.</p></section>
              <section className="panel"><div className="panel-heading"><h2>Your goals</h2><button className="text-button" onClick={() => setModal("goal")}><Plus/> Add goal</button></div><div className="goals-list">{goals.map(g => <div className={`goal-row ${g.done ? "done" : ""}`} key={g.id}><button className="check" onClick={() => setGoals(goals.map(x => x.id === g.id ? {...x,done:!x.done}:x))}>{g.done ? <CheckCircle2/> : <Circle/>}</button><div><strong>{g.title}</strong><span><CalendarDays/> {g.done ? "Completed" : `Due ${g.due}`}</span></div><button className="icon-button"><MoreHorizontal/></button></div>)}</div><button className="full-link" onClick={() => go("My mentorship")}>View mentorship plan <ChevronRight/></button></section>
            </div>
            <div className="right-column">
              <section className="panel next-session"><div className="panel-heading"><h2>Next session</h2><span className="badge">TOMORROW</span></div><div className="calendar-date"><span>NOV</span><strong>12</strong></div><h3>{sessions[0]?.title}</h3><p><Clock3/> {sessions[0]?.time}</p><p><Video/> {sessions[0]?.kind} · 45 min</p><div className="session-person"><Avatar person={mentors[0]} small/><span>with <strong>Priya Sharma</strong></span></div><button className="button primary full" onClick={() => setToast("Your meeting room will open 10 minutes before the session")}><Video size={17}/>Join meeting</button><button className="button plain full" onClick={() => go("Sessions")}>View session details</button></section>
              <section className="panel insight"><span><BookOpen/></span><p className="eyebrow">WEEKLY INSIGHT</p><h3>Small steps. Real progress.</h3><p>People who check in with their mentor weekly are <strong>2× more likely</strong> to reach their goals.</p><button onClick={() => go("Messages")}>Send a quick update <ArrowRight/></button></section>
            </div>
          </div>
        </>}

        {page === "Find mentors" && <>
          <section className="page-intro"><p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p><h1>Find someone who’s been there.</h1><p>Connect with experienced people who genuinely want to see you grow.</p></section>
          <div className="filter-bar"><div><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, role, or skill…"/></div><select value={skill} onChange={e=>setSkill(e.target.value)}><option>All skills</option>{["Product design","Engineering","Marketing","Leadership","Data science","Startups"].map(s=><option key={s}>{s}</option>)}</select><span>{filteredMentors.length} mentors</span></div>
          <div className="mentor-grid">{filteredMentors.map(m=><article className="mentor-card" key={m.name}><div className="mentor-card-top"><Avatar person={m}/><span className={m.available ? "available" : "unavailable"}>{m.available ? "Available" : "Waitlist"}</span></div><h2>{m.name}</h2><p className="role">{m.role}</p><p className="company">{m.company}</p><p className="bio">{m.bio}</p><div className="skills">{m.skills.map(s=><span key={s}>{s}</span>)}</div><div className="mentor-meta"><span><Star fill="currentColor"/> <strong>{m.rating}</strong> ({m.reviews})</span><span>{m.sessions} sessions</span></div><button className="button primary full" onClick={()=>{setSelectedMentor(m);setModal("request")}}>{m.available ? "Request mentorship" : "Join waitlist"}<ArrowRight/></button></article>)}</div>
          {!filteredMentors.length && <div className="empty"><Search/><h2>No mentors found</h2><p>Try another name or skill.</p><button className="button soft" onClick={()=>{setSearch("");setSkill("All skills")}}>Clear filters</button></div>}
        </>}

        {page === "My mentorship" && <>
          <section className="welcome"><div><p className="eyebrow">MY MENTORSHIP</p><h1>Product design & career growth</h1><p>A shared plan for your growth, one meaningful step at a time.</p></div><button className="button primary" onClick={()=>setModal("goal")}><Plus/>Add a goal</button></section>
          <section className="panel mentorship-hero"><Avatar person={mentors[0]}/><div><span className="badge">ACTIVE SINCE SEPTEMBER 2026</span><h2>Priya Sharma</h2><p>Senior Product Designer at Atlassian</p></div><button className="button soft" onClick={()=>go("Messages")}><MessageCircle/>Message Priya</button></section>
          <div className="plan-grid"><section className="panel"><div className="panel-heading"><div><h2>Growth plan</h2><p>{completed} of {goals.length} goals completed</p></div><Target/></div><div className="progress"><i style={{width:`${(completed/goals.length)*100}%`}}/></div><div className="goals-list spacious">{goals.map(g=><div className={`goal-row ${g.done?"done":""}`} key={g.id}><button className="check" onClick={()=>setGoals(goals.map(x=>x.id===g.id?{...x,done:!x.done}:x))}>{g.done?<CheckCircle2/>:<Circle/>}</button><div><strong>{g.title}</strong><span>{g.done?"Completed — nice work!":`Target: ${g.due}`}</span></div></div>)}</div></section><section className="panel focus-card"><span><Sparkles/></span><h2>Current focus</h2><p>Build a compelling portfolio that clearly communicates your process, decisions, and impact.</p><div><strong>Next milestone</strong><p>Present your final case study to Priya on Nov 19.</p></div></section></div>
        </>}

        {page === "Messages" && <section className="messages-layout"><div className="conversation-list"><div className="panel-heading"><h1>Messages</h1><button className="icon-button"><Plus/></button></div><div className="conversation active"><Avatar person={mentors[0]} small/><div><strong>Priya Sharma</strong><p>Let’s walk through the final…</p></div><span>10:33</span></div><div className="conversation"><Avatar person={mentors[1]} small/><div><strong>Daniel Chen</strong><p>Happy to help with your…</p></div><span>Mon</span></div></div><div className="chat-panel"><div className="chat-head"><Avatar person={mentors[0]} small/><div><strong>Priya Sharma</strong><span><i/> Online</span></div><button className="icon-button"><Video/></button></div><div className="messages"><div className="day-divider">TODAY</div>{messages.map((m,i)=><div className={`message ${m.from==="me"?"mine":""}`} key={i}><p>{m.text}</p><span>{m.time}</span></div>)}</div><form className="message-form" onSubmit={sendMessage}><input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Write a message…"/><button className="button primary" aria-label="Send message"><Send/></button></form></div></section>}

        {page === "Sessions" && <>
          <section className="welcome"><div><p className="eyebrow">MAKE TIME FOR GROWTH</p><h1>Your sessions</h1><p>Prepare, meet, reflect. Every conversation moves you forward.</p></div><button className="button primary" onClick={()=>setModal("session")}><Plus/>Schedule session</button></section>
          <div className="sessions-list">{sessions.map((s,i)=><section className="panel session-row" key={s.id}><div className="session-date-box"><span>{i===0?"NOV":"NOV"}</span><strong>{12+i*7}</strong></div><div className="session-details"><span className="badge">{i===0?"UPCOMING":"SCHEDULED"}</span><h2>{s.title}</h2><p><Clock3/>{s.date} · {s.time}</p><div><Avatar person={mentors[0]} small/>with <strong>{s.mentor}</strong></div></div><div className="session-actions"><button className="button primary" onClick={()=>setToast("Your meeting room will open 10 minutes before the session")}><Video/>Join meeting</button><button className="button plain">Reschedule</button></div></section>)}</div>
          <section className="panel prep"><BookOpen/><div><h2>A little preparation goes a long way</h2><p>Add your questions, recent wins, and challenges to the session agenda before you meet.</p></div><button className="button soft" onClick={()=>go("Messages")}>Share an update</button></section>
        </>}
      </div>
    </main>

    {modal && <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setModal(null)}><div className="modal"><button className="modal-close icon-button" onClick={()=>setModal(null)}><X/></button>
      {modal === "goal" && <form onSubmit={addGoal}><span className="modal-icon"><Target/></span><h2>What do you want to achieve?</h2><p>Set a clear goal for you and Priya to work toward.</p><label>Goal title<input name="title" required autoFocus placeholder="e.g. Improve my presentation skills"/></label><label>Target date<input name="due" placeholder="e.g. Dec 15"/></label><button className="button primary full">Add to growth plan<ArrowRight/></button></form>}
      {modal === "session" && <form onSubmit={addSession}><span className="modal-icon"><CalendarDays/></span><h2>Schedule a session</h2><p>Make time for a focused conversation with Priya.</p><label>Session topic<input name="title" required autoFocus placeholder="e.g. Portfolio review"/></label><div className="form-row"><label>Date<input name="date" required placeholder="Nov 20"/></label><label>Time<input name="time" required placeholder="6:00 PM"/></label></div><button className="button primary full">Schedule session<ArrowRight/></button></form>}
      {modal === "request" && <form onSubmit={e=>{e.preventDefault();setModal(null);setToast(`Request sent to ${selectedMentor.name}`)}}><Avatar person={selectedMentor}/><h2>Grow with {selectedMentor.name.split(" ")[0]}</h2><p>Share a little about yourself and what you’d love to learn.</p><label>Your mentorship goal<textarea required autoFocus placeholder="I’m hoping to grow my skills in…" rows={4}/></label><button className="button primary full">Send request<Send/></button></form>}
    </div></div>}
    {toast && <div className="toast"><CheckCircle2/>{toast}<button onClick={()=>setToast("")}><X/></button></div>}
  </div>;
}

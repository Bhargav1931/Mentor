import { requireUser } from "@/lib/auth";
import { updateProfileAction } from "@/lib/actions";
import { StateForm, SubmitButton } from "@/components/forms";
import { Avatar, Badge, Card, SkillChips } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireUser();
  const { welcome } = await searchParams;
  const isMentor = user.role === "mentor";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {welcome && (
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
          <p className="text-lg font-semibold">Welcome to MentorBridge, {user.name.split(" ")[0]}! 🎉</p>
          <p className="mt-1 text-sm text-indigo-100">
            Tell us a bit about yourself so {isMentor ? "mentees can find you" : "we can match you with the right mentors"}.
          </p>
        </div>
      )}
      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={user.name} id={user.id} size="lg" />
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="mt-1"><Badge status={user.role} /></div>
          </div>
        </div>
        {user.skills && <div className="mt-4"><SkillChips skills={user.skills} /></div>}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Edit profile</h2>
        <StateForm action={updateProfileAction} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input id="name" name="name" defaultValue={user.name} required className="input" />
            </div>
            <div>
              <label className="label" htmlFor="headline">Headline</label>
              <input id="headline" name="headline" defaultValue={user.headline} className="input" placeholder={isMentor ? "Senior Engineer @ Acme" : "CS Student"} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="bio">Bio</label>
            <textarea id="bio" name="bio" rows={5} defaultValue={user.bio} className="input" placeholder={isMentor ? "Your background and how you can help mentees…" : "Your background and what you're hoping to learn…"} />
          </div>
          <div>
            <label className="label" htmlFor="skills">{isMentor ? "Areas of expertise" : "Skills & interests"} <span className="font-normal text-slate-400">(comma separated)</span></label>
            <input id="skills" name="skills" defaultValue={user.skills} className="input" placeholder="React, Career Growth, Public Speaking" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="yearsExperience">Years of experience</label>
              <input id="yearsExperience" name="yearsExperience" type="number" min={0} max={60} defaultValue={user.yearsExperience} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="location">Location</label>
              <input id="location" name="location" defaultValue={user.location} className="input" placeholder="City, Country" />
            </div>
            <div>
              <label className="label" htmlFor="availability">Availability</label>
              <input id="availability" name="availability" defaultValue={user.availability} className="input" placeholder="Weekday evenings" />
            </div>
          </div>
          <div className="flex justify-end">
            <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
          </div>
        </StateForm>
      </Card>
    </div>
  );
}

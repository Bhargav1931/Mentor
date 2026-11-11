# MentorBridge — Python / Django

The new primary implementation is in **`python-mentor/`**. It uses Python and
Django for both the backend and server-rendered HTML pages; Node.js and TypeScript
are not required to run it. The earlier Next.js implementation remains in
`digital-mentor-mentee-system/` as a reference and to avoid breaking the existing
Vercel deployment while the Python version is evaluated.

## Quick start

Requires Python 3.11 or newer.

```bash
python3 -m venv .venv
# Linux / macOS
source .venv/bin/activate
# Windows PowerShell instead: .venv\Scripts\Activate.ps1
pip install -r python-mentor/requirements.txt
cd python-mentor
python manage.py migrate
python manage.py runserver
```

Open http://127.0.0.1:8000. SQLite is used automatically, so you do not need to
install PostgreSQL for a classroom demonstration. No demo members are seeded.
Create a mentor and a mentee using **Get started**, or let a mentor create another
member from **Members**. Use separate browser profiles to demonstrate both roles.

## Demonstration workflow

1. Register as a **mentor**, then complete your profile.
2. In a different browser profile, register as a **mentee**.
3. As the mentee, find the mentor in **Mentors** and send a request.
4. As the mentor, open **Requests** and accept it.
5. Both participants can now open the mentorship workspace from **Chat** or
   **Mentorships** and send messages, add goals, and schedule sessions.
6. Mark goals done, update session notes/status, and submit feedback.
7. Complete a mentorship to make its workspace read-only (feedback is still allowed).

Chat is persisted in the database. Refresh/open the page to load new messages;
this is not a WebSocket/live-chat implementation. Session inputs and displays use
`TIME_ZONE` (default **Asia/Kolkata**), not the visitor's browser timezone.

## How it works — easy to explain

Django follows a **Model–View–Template** pattern:

| File | Responsibility | Example |
| --- | --- | --- |
| `mentoring/models.py` | Database structure and relationships | A meeting belongs to one mentorship |
| `mentoring/forms.py` | Validate user input | Password checks; future meeting dates; ratings 1–5 |
| `mentoring/views.py` | Request handling and permissions | Only the two participants can open a conversation |
| `mentorbridge/urls.py` | Match a URL to a view | `/schedule/` calls the schedule view |
| `templates/*.html` | Render pages from Python data | Loop over sessions to display a schedule |
| `mentoring/migrations/` | Versioned database changes | Create the tables with `migrate` |
| `mentoring/tests.py` | Automated workflow/security checks | An outsider gets a 404 for a private workspace |

**Example request:** Clicking “Send message” submits a CSRF-protected HTML form.
Django finds the URL, authenticates the session, checks mentorship membership,
validates the form, saves the message with the actual logged-in sender, and
redirects back to the workspace. The template then renders the saved messages.
There is no separate JavaScript API server to configure.

### Data model

- `Member`: Django authentication user plus mentor/mentee role and profile.
- `Mentorship`: links a mentor and mentee; pending → active/declined → completed.
- `Message`: text and sender, scoped to a mentorship.
- `Goal`: shared title, description, due date and progress status.
- `Meeting`: date/time, duration, safe HTTP(S) meeting link, status and notes.
- `Feedback`: one editable 1–5 rating/comment per participant per mentorship.

Django provides password hashing, signed session handling, CSRF protection, HTML
escaping and an optional staff admin site. Member creation is restricted to
mentors. Registration is public and allows either role, matching the earlier app;
mentor status is not an administrator approval mechanism.

## Testing

From the repository root, with the virtual environment active:

```bash
python python-mentor/manage.py check
python python-mentor/manage.py makemigrations --check --dry-run
python python-mentor/manage.py test mentoring
```

Tests cover registration/login, role-based member creation, duplicate requests,
acceptance, private chat access, CSRF, goals, meetings, feedback, completed-workspace
restrictions and cross-mentorship authorization. The suite uses an isolated test
SQLite database; PostgreSQL integration and production browser tests are separate.

## PostgreSQL and production

Configure environment variables in your host's settings, not in source control.
Django reads the process environment; it does **not** automatically load `.env`.
For local PostgreSQL, export variables in your terminal first.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string; include the provider's SSL settings |
| `DJANGO_SECRET_KEY` | Long random secret; required with debug disabled |
| `DJANGO_DEBUG` | Set to `0` in production |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated hostnames, without URL schemes |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | Comma-separated full HTTPS origins |
| `TIME_ZONE` | Optional IANA timezone, default `Asia/Kolkata` |

Deploy `python-mentor/` as a Python web service (for example on Render or Railway):

- Install: `pip install -r requirements.txt`
- Release/migrate: `python manage.py migrate --noinput`
- Collect static assets: `python manage.py collectstatic --noinput`
- Start: `gunicorn mentorbridge.wsgi:application --bind 0.0.0.0:$PORT`
- Set the production variables above and use managed PostgreSQL, not ephemeral SQLite.
- Run `python manage.py check --deploy` and review the host's HTTPS/proxy settings.

The existing Vercel site still runs Next.js. This change does **not** switch that
site to Python or change its environment variables. The Python deployment needs a
separate service configuration; the existing Next.js build command cannot run it.

## Existing data and conversion boundaries

This is a runnable Python reimplementation of the core workflows, **not an
in-place database conversion**. Django creates its own prefixed tables. Existing
Next.js users, passwords, sessions, requests and history are not imported. Use a
separate database initially. A production migration requires a reviewed export/import
plan (including password compatibility or password resets and ID mapping) and a
backup before cutover. Do not delete the legacy app/database yet.

The design is deliberately simpler than the earlier UI. Advanced mentor
recommendations, aggregate directory ratings and browser-local time formatting
are not ported. Live updates were not added. No live site has been replaced by
this Python version.

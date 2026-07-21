# 10. Event Registrations

The website now collects event registrations from visitors. This is a two-part feature:

1. A **public form** (a reusable Page Builder block called **Event Registration Form**) that visitors fill in
2. An **admin inbox** at **Sidebar → Event Registrations** where you see, manage, and act on the submissions

This guide covers the full workflow: setting up the form, wiring it to your existing event listings, and managing the inbox.

---

## A. Set up the registration form

### Step 1 — Create a registration page

You need a page that hosts the form. The simplest setup is one shared registration page that handles **all events** via URL parameters.

1. Go to **Pages → + New Page**
2. Title: `Register for Event` (or whatever name you prefer)
3. Slug: `register-for-event` (must be unique; lowercase, no spaces)
4. Status: **Published**
5. Click **Create** — you land in the Page Builder

### Step 2 — Add the Event Registration Form block

1. In the Page Builder, click **+ Add Block**
2. Search for or scroll to **Event Registration Form**
3. Click to add it to the page
4. Click the new block to open the **edit panel** on the right

### Step 3 — Configure the form

Open these collapsible sections in the edit panel:

#### Form copy
| Field | Recommendation |
|---|---|
| **Heading** | "Event Registration" (default) — change if you want a more specific title |
| **Intro paragraph** | Short instruction shown above the fields |
| **Submit button text** | "Register" (default) |
| **Success message** | Shown after submission. Default: "Thank you! Your registration has been received…" |

#### Field options
- **Show optional student fields (school + class/year)** — leave ON if some events accept students. Turn OFF for events where these fields would be confusing.

#### Default event (used when URL has no `?event=` param)
- **Default event title** — leave **blank** if this page is shared by multiple events. The visitor will be asked to type the event name themselves if no `?event=` is in the URL.
- **Default event date** — same.

#### Manage Section
Standard styling controls (background, padding, margins) like every other block.

5. Click **Save** in the edit panel
6. Click **Save Page** (top right)

---

## B. Wire your existing event blocks to the registration form

The reusable **Latest News** block on your home / events pages already has a `buttonLink` field on each item. Point it at the registration page.

For each item in your **Latest News** block:

1. Open the page that has the event listing
2. Click the **Latest News** block
3. Find the event item and edit its **buttonLink** field to:

```
/register-for-event?event=Eid Drive 2025&date=15 July 2025
```

The values after `event=` and `date=` will appear pre-filled on the registration page so the visitor only fills in their personal details.

> **Tip — URL encoding**: spaces in URLs should be `%20` or `+` for technical correctness, but most browsers also accept plain spaces. To be safe, you can paste the URL as-is — the browser handles encoding automatically.
>
> **Examples:**
> - `/register-for-event?event=Career%20Fair%202025&date=22%20August%202025`
> - `/register-for-event?event=Annual+Iftar+Drive&date=15+March+2025`

4. Save the block, save the page

When a visitor clicks **Register** (or whatever button text you set on the event), they land on the registration page with the event already filled in. They only need to enter their name, email, and other details.

---

## C. Manage submissions in the admin inbox

### Where to find it

Sidebar → **Event Registrations**

The notification bell at the top of the admin will also show new unread registrations as they come in (polled every 5 seconds, same as Contacts and Donations).

### What you see

A table of every submission with:

| Column | What it shows |
|---|---|
| **Event** | The event title (and date if available) the visitor registered for |
| **Applicant** | Name + email |
| **Phone** | Phone number (if provided) |
| **Status** | Dropdown — change inline (`new` / `confirmed` / `waitlisted` / `cancelled`) |
| **Read** | Mark as read with one click |
| **Submitted** | Date and time |
| **Actions** | View full details · Delete |

### Filter and search

Top of the page:
- **Search** by name, email, or event title
- **Status filter** to focus on (e.g.) only `new` registrations
- **Event filter** dropdown — auto-populated from registrations already in the system

### View full registration

Click the **eye icon** on any row. A modal opens showing every captured field: event, status, name, email, phone, school, class/year, message, source page, submission time. Opening the modal automatically marks the registration as read.

### Status workflow

The status is a guideline for **your team's** internal use. Suggested workflow:

| Status | When to use |
|---|---|
| **new** | Just submitted. Default. |
| **confirmed** | You've reviewed and confirmed the spot. |
| **waitlisted** | Event is full; visitor is on the waitlist. |
| **cancelled** | Visitor withdrew, or you rejected the registration. |

You can change a status by clicking the dropdown directly in the table row, or via the modal. Status changes are saved immediately — no separate "Save" button.

### Email notifications

When a visitor submits the form:

1. **They** receive an automatic acknowledgement email (subject: "Registration received — *Event Name*") with all their submitted details
2. **Your admin email** (set via the `EMAIL_TO` / `ADMIN_EMAIL` env var) receives a copy

Both emails are best-effort — if the email service is down, the registration is still saved and you can see it in the admin inbox.

### Delete a registration

Click the **trash icon** on the row. Confirm. **Cannot be undone.**

> **Don't delete cancelled registrations** unless you have to — the audit trail is useful. Use the `cancelled` status instead.

---

## D. Multiple registration pages (advanced)

If different events need different registration forms (e.g. one event collects extra fields), you can create **multiple Event Registration Form blocks** on different pages. Each block has its own copy + field settings, and the data all flows into the same admin inbox.

Examples:
- `/register-for-event` — generic, used by most events
- `/register/scholarship-program-2025` — same form, different intro copy and a forced default event title for the scholarship program

The inbox doesn't distinguish between pages, but the **Submitted from page** field in the detail view tells you which page the visitor was on.

---

## E. Tips and gotchas

- **Always test the link** after editing an event's buttonLink. Click it as a visitor would and confirm the event title appears pre-filled.
- **Honour the inbox**: check it daily and update statuses promptly. Visitors expect a response.
- **Spam protection**: the form has a built-in honeypot field (invisible to humans). Spam bots that fill it are silently rejected. There's also a per-IP rate limit of 5 submissions per minute.
- **No file uploads**: visitors cannot attach documents (e.g. ID proof) yet. If you need that for student applications, ask your developer about the planned **Job Application** module which adds resume upload — the same pattern can be adapted.
- **Renaming an event**: if you rename an event in the Latest News block after registrations have come in, the existing registrations still show the **old** event title (because we save a snapshot at submit time). The visitor's email also referenced the old title. This is intentional — the audit trail is not retroactively rewritten.
- **Stable event IDs (future)**: in a future release, each event item will get a stable unique ID so registrations link to a specific event even if it's renamed. For now, the linking is by title text only.

# 4. Manage Comments

Readers can leave comments on blog posts (if comments are enabled in Theme settings). All comments go through moderation here before they appear publicly.

## Where to find it

Sidebar → **Blogs → Comments**

## What you see

A table of comments with:

- **Author** — name and email of the commenter
- **Comment** — first line of the message
- **Post** — which blog post the comment is attached to (clickable)
- **Status** — `pending` / `approved` / `rejected`
- **Submitted** — timestamp

You can filter by **Status** and search by author name or post.

---

## Moderation actions

For each comment, you can:

| Action | Result |
|---|---|
| **View** | Open a modal showing the full comment text |
| **Approve** | Comment becomes visible on the public blog post |
| **Reject** | Comment is kept in the database but not shown publicly |
| **Delete** | Comment is permanently removed |

> **Default behaviour**: new comments are saved as **pending**. They will not appear on the website until you approve them.

### Approve a comment

1. Click the comment row to open it.
2. Read the message.
3. Click **Approve**.
4. The comment immediately appears on the related blog post.

### Reject an approved comment

If a previously approved comment turns out to be inappropriate, click **Reject**. The comment stays in the database (so you can recover it later by approving again) but no longer appears publicly.

### Delete a comment

Click the **trash icon** in the row, confirm. Deleted comments cannot be recovered.

---

## Enable / disable comments site-wide

Comments are turned on or off in **Theme → Blog**. Look for **"Enable blog comments"**. When disabled:

- The comment form is hidden on all blog posts
- Existing comments stop displaying
- Already-saved comments are not deleted; turning the setting back on restores them

See [Theme Settings](05-theme.md) for details.

---

## Tips for moderation

- **Check comments daily** — pending spam can pile up quickly.
- **Approve neutral comments first**, hide or delete questionable ones.
- **Look for patterns** — multiple comments from the same email with similar content are usually spam.
- **Reply to genuine questions** by emailing the commenter directly (their email is shown in the moderation panel) — there is no built-in reply feature yet.

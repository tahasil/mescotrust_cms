# MESCO Trust CMS — Admin User Guide

Welcome! This guide explains how to operate the MESCO Trust CMS from the admin panel. It is written for **non-technical content managers** — no coding required.

## How to log in

1. Open `https://your-site.com/admin/login` (or `/admin/login` on your domain).
2. Enter your **email** and **password** provided by your administrator.
3. Click **Sign in**. You will land on the **Dashboard**.

> If you forget your password, contact your system administrator. There is no self-serve password reset yet.

---

## Contents

| # | Section | Use this when you need to… |
|---|---|---|
| 1 | [Overview of the Admin Panel](01-overview.md) | Understand the layout, sidebar, and notification bell |
| 2 | [Manage Pages](02-pages.md) | Create or edit any page on the website (Home, About, Contact, etc.) |
| 3 | [Manage Blogs](03-blogs.md) | Write and publish news articles or blog posts |
| 4 | [Manage Comments](04-comments.md) | Approve, hide, or delete reader comments on blog posts |
| 5 | [Theme Settings (Website & Admin)](05-theme.md) | Change colors, fonts, logos, header, footer, and admin look |
| 6 | [Media Library](06-media.md) | Upload images, PDFs, and other files |
| 7 | [Form Submissions (Contacts, Donations, Subscribers)](07-form-submissions.md) | View and act on messages received through the website |
| 8 | [Key Settings](08-key-settings.md) | Configure menus, users, and other important options |
| 9 | [Reusable Page Builder Components Reference](09-reusable-components.md) | Look up which block to use for testimonials, awards, team, events, reports, gallery, etc. |
| 10 | [Event Registrations](10-event-registrations.md) | Set up the visitor registration form, wire it to your event listings, and manage the submission inbox |
| 11 | [Social Media Wall](11-social-media-wall.md) | Embed Instagram, Facebook, YouTube, X feeds and display Follow Us links on any page |
| 12 | [Page Publishing (Draft / Publish)](12-page-publishing.md) &nbsp;([PDF](../../README/12-page-publishing.pdf)) | Add a page, publish it, take it back to draft, or delete it |
| 13 | [Homepage Slider (Editing)](13-home-slider.md) &nbsp;([PDF](../../README/13-home-slider.pdf)) | Edit slider slides, turn a slider on or off, and understand shortcodes |
| 14 | [Navigation Menu (Navbar)](14-navigation-menu.md) &nbsp;([PDF](../../README/14-navigation-menu.pdf)) | Add, reorder, and remove navbar items and dropdown sub-menus |

---

## Quick reference — what lives where

| To do this | Go to |
|---|---|
| Add a new page | **Pages → New Page** |
| Edit the home page | **Pages → Home** |
| Write a news article | **Blogs → All Posts → New Post** |
| Approve a blog comment | **Blogs → Comments** |
| Add a testimonial / award / team member | Open the relevant page in **Pages**, edit the existing block (Testimonials, CommitteeMembers, etc.), add or update the items |
| Change the site logo | **Theme → Brand Identity** |
| Upload an image | **Media → Upload** |
| See contact form messages | **Contacts** |
| See donation records | **Donations** |
| See newsletter sign-ups | **Subscribers** |
| See event registrations | **Event Registrations** |
| Add social media embeds | Open the relevant page in **Pages**, add a **SocialMediaWall** block |
| Add a new admin user | **Users → New User** |
| Edit the navigation menu | **Menus** |
| Publish a page (make it live) | Open the page → **Settings (gear)** → **Status = Published** → **Save** |
| Hide a page temporarily | Open the page → **Settings (gear)** → **Status = Draft** → **Save** |

---

## Roles in the system

There are currently two user roles:

| Role | Can do |
|---|---|
| **Admin** | Everything — including users, theme, donations, and deleting content |
| **Editor** | Create and edit pages, blogs, media, menus, contacts, donations, subscribers. Cannot manage users or theme. |

> If you need a new user added, contact your administrator and provide the person's name, email, and required role.

---

## Tips before you start

- **Always click "Save" before navigating away** — unsaved changes are not preserved.
- **Drafts vs Published**: pages and blogs can be saved as drafts. Drafts are not visible on the public site. Publishing is immediate — there is no separate Publish button. See [Page Publishing](12-page-publishing.md).
- **Preview your work**: use the **Preview** button on Pages and Blogs to see how the change will look before publishing. Always **Save** first — Preview shows the last saved version.
- **Deleting is permanent**: a deleted page cannot be restored. Switch a page to `Draft` instead of deleting it when you only want to hide it.
- **Images should be uploaded in WebP format** for best performance. You can convert images at [squoosh.app](https://squoosh.app/) before uploading.
- **Maximum file size**: 50 MB per upload.

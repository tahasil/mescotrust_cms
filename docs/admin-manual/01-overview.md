# 1. Overview of the Admin Panel

The admin panel is your control room for the entire Mesco Trust website. After logging in at `/admin/login`, you will see three main areas.

## Layout at a glance

```
┌─────────────────────────────────────────────────────────────┐
│  ☰   Search…              🔔 (notifications)   👤 Profile  │  ← Top bar
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│ Sidebar  │             Main content area                    │
│  menu    │                                                  │
│          │   (lists, forms, the page builder, etc.)         │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

### Top bar

| Element | What it does |
|---|---|
| **☰ Toggle** | Collapses or opens the sidebar (helpful on small screens) |
| **Search box** | Placeholder for a future global search. The input is visible but not yet wired up — to find a page or blog post, use the search inside that section instead. |
| **🔔 Bell icon** | Shows unread notifications: new contacts, donations, subscribers. Click any to jump to that record. |
| **Profile menu** | View your account, change theme mode (light/dark for admin), **Sign out** |

### Sidebar — main sections

| Sidebar item | What it manages |
|---|---|
| **Dashboard** | Quick stats and recent activity |
| **Pages** | Every page on the website (Home, About, Contact, etc.) |
| **Components** | Reusable building blocks used inside pages |
| **Blogs** | Articles + Categories + Comments (sub-menu) |
| **Media** | Uploaded images and PDFs |
| **Menus** | Header and footer navigation |
| **Theme** | Site branding, colors, fonts, header/footer settings |
| **Contacts** | Messages received from contact forms |
| **Donations** | Donations received via the website |
| **Subscribers** | Newsletter sign-ups |
| **Users** | Admin and editor accounts (Admin role only) |

### Main content area

This is where you do the actual work — editing forms, viewing tables, the visual page builder, and so on. Each section in this guide covers one area in detail.

---

## Notification bell — what to expect

The bell icon at the top right polls the server every few seconds for new submissions. A red badge tells you how many items are unread.

Currently it tracks:

- **New contact form messages**
- **New donations**
- **New newsletter subscribers**

Click the bell, then click any item in the dropdown to jump straight to that record.

---

## Saving your work

Almost every form has a **Save** or **Update** button at the bottom or top right. The CMS does **not** auto-save. If you close the tab without clicking Save, your changes will be lost.

Most forms will show a small green confirmation message ("Saved successfully") when the change has been stored.

---

## Logging out

Click your profile picture / name in the top right and choose **Sign out**. Your session lasts up to 30 days, but you should always sign out on shared computers.

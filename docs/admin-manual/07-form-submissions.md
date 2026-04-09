# 7. Form Submissions

The website collects three kinds of submissions from visitors. Each has its own admin section.

| Section | What it captures |
|---|---|
| **Contacts** | Messages from the contact form |
| **Donations** | Donation records (every CCAvenue transaction) |
| **Subscribers** | Newsletter sign-ups |

The notification bell (top right of the admin) shows new entries from all three.

---

## A. Contacts

### Where to find it

Sidebar → **Contacts**

### What you see

A table of every contact-form submission, with columns:

- **Name**
- **Email**
- **Message** (truncated)
- **Read / Unread**
- **Submitted**
- **Actions** — View, Mark read, Delete

### View a message

1. Click the row, or click the **View** icon.
2. A panel opens with the full message: name, email, phone, subject, message, the page they submitted from, and the timestamp.
3. While the panel is open, the message is automatically marked as **Read**.

### Reply to a sender

The CMS does not send replies on your behalf. Use your normal email client to reply directly to the sender's email address.

### Delete a message

Click the trash icon, confirm. Deleted messages cannot be recovered.

### Tips

- **Check Contacts daily**. Visitors expect a response within 1–2 working days.
- **Filter by Unread** to focus on what's new.
- If you receive a lot of spam, look at the **Source** field — it shows which form the submission came from. Recurring spam from the same form may need a captcha (ask your developer).

---

## B. Donations

### Where to find it

Sidebar → **Donations**

### What you see

A table of every donation attempt, including:

- **Order ID** — unique receipt number
- **Donor name / email / mobile**
- **Amount** (₹)
- **Purpose** (e.g. General Fund, Education, Zakat)
- **Status** — `pending` / `success` / `failed` / `aborted`
- **Date**
- **Actions** — View

You can filter by **Status** and search by donor email or order ID.

### Status meanings

| Status | What it means |
|---|---|
| **pending** | The donor started a payment but the gateway has not yet confirmed. Usually resolves within minutes. |
| **success** | Payment confirmed by CCAvenue. The donor has been emailed a receipt automatically. |
| **failed** | Payment was attempted but rejected (e.g. wrong card details, insufficient funds). |
| **aborted** | The donor closed the payment window without completing. |

### View donation details

Click the row to open the details panel:

- **Donor info** — name, email, mobile, PAN, full address
- **Amount, currency, purpose, zakat flag, note**
- **Payment details** (only for success/failed): tracking ID, bank reference number, payment mode, status code, status message
- **Timestamps** — created and last updated

### Receipt emails

When a donation reaches **success**, the system automatically sends a receipt email to the donor (and a copy to the admin email if configured). You don't need to do anything.

> **If a donor reports they didn't receive their receipt**:
> 1. Check the donation status — it must be `success`. If it's `pending` for more than 30 minutes, the gateway probably failed to confirm.
> 2. Check the donor's email address in the record — typos happen.
> 3. Ask the donor to check their spam folder.
> 4. If still missing, contact the developer / IT to check the email service logs.

### Tips

- **Reconcile weekly** with the CCAvenue dashboard. Donation records here should match transactions there.
- **Don't delete donation records** — they are your audit trail. If a record is genuinely wrong, ask a developer to investigate.
- **PAN is important** for donors claiming 80G tax exemption. If a donor has PAN missing, you may need to follow up with them.

---

## C. Subscribers

### Where to find it

Sidebar → **Subscribers**

### What you see

A simple list of newsletter subscribers:

- **Email**
- **Status** — `active` / `unsubscribed`
- **Source** — which form they signed up from (e.g. `subscribe-section`, `footer`)
- **Joined** — sign-up date

### Sending newsletters

The CMS only **collects** sign-ups; it does not send newsletters itself. To send out a newsletter:

1. Open the Subscribers list and copy the email addresses you need (or ask a developer to export the list directly from the database).
2. Paste them into a dedicated email service such as **Mailchimp**, **Brevo**, **MailerLite**, or **Sendinblue**.
3. Send the campaign from there.

> A built-in CSV export button is **not yet available** in this version. If you need one regularly, ask your developer to add it.

### Mark as unsubscribed

If a subscriber asks to be removed:

1. Find their row in the Subscribers list.
2. Click the **Unsubscribe** action (or the trash icon to delete entirely).
3. Confirm.

> **Best practice**: prefer **Unsubscribe** over **Delete**. It keeps a record so you don't accidentally re-add them later.

### Tips

- **Check Subscribers weekly** and export new sign-ups to your email tool.
- **Honour unsubscribe requests within 24 hours** — required by privacy law.
- **Never share the subscriber list** with third parties.

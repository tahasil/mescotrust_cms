# 5. Theme Settings (Website & Admin)

The Theme section controls how your website looks — logo, colours, fonts, header, footer, and even how the admin panel itself appears.

## Where to find it

Sidebar → **Theme**

> Only **Admin** users can access Theme settings.

## What you see

A long settings page divided into clear sections. Scroll down to find each section, change what you need, and click **Save Theme** at the bottom.

---

## 1. Brand Identity

| Field | What it does |
|---|---|
| **Site Title** | Appears in the browser tab and Google search results |
| **Tagline** | Optional sub-line shown in the header (if your header layout supports it) |
| **Logo Type** | Choose **Text** (use Site Title) or **Image** (upload logos) |
| **Logo (Light)** | Logo for light backgrounds — header on most pages |
| **Logo (Mobile)** | Optional smaller logo for phone screens |
| **Logo (Dark)** | Logo for dark backgrounds (e.g. footer) |
| **Favicon** | The little icon in the browser tab |
| **Footer Copyright Text** | The line at the very bottom of every page |

> Logos and favicon should be uploaded via **Media** first, then pasted into these fields. Or click the picker icon to choose from the library.

---

## 2. Colours

The named website palette mirrors the Mesco Fable design. Its core tokens are
Primary (`#E03C33`), Black (`#2A283E`), Cream (`#FBFAF7`), Surface
(`#F2F0EA`), White (`#FFFFFF`), Dark (`#211E30`), and Border
(`rgba(42, 40, 62, 0.14)`). Accent, muted, gradient, transparent, and image
filter tokens are available in the same list.

Click **+ Add color** to add a project-specific named color. Saved color names
become selectable from block and site-component editors. Existing installations
using the former default Mesco palette are upgraded automatically; genuinely
custom color collections are preserved.

---

## 3. Typography (Fonts)

| Field | What it does |
|---|---|
| **Heading Font** | Font used for H1–H6 headings |
| **Body Font** | Font used for regular text |
| **Button Font** | Optional override for buttons |
| **Base Font Size** | Default text size in pixels (e.g. 16) |
| **Line Height** | Spacing between lines (e.g. 1.6) |
| **Google Fonts** | Add Google Fonts by family name and weights — they will be loaded automatically |
| **Custom Font URL** | Upload a custom `.woff2` font file via Media and paste the URL here |

---

## 4. Header settings

| Field | What it does |
|---|---|
| **Header Layout** | Pick a built-in header style |
| **Sticky Header** | Keep the header pinned to the top while scrolling |
| **Transparent Header** | Make the header transparent over hero images |
| **Donate Button** | Label, target URL, icon, colours |
| **Volunteer Button** | Label, target URL, icon, colours |
| **Header Background Colour** | Pick from palette |

The header menu items themselves are managed in **Menus** — see [Key Settings](08-key-settings.md).

---

## 5. Footer settings

| Field | What it does |
|---|---|
| **Footer Logo** | Logo shown in the footer (often a dark variant) |
| **Footer Address / Email / Phone** | Contact details shown in the footer |
| **Footer Background / Text Colour** | Visual style |
| **Footer Background Image** | Optional image background |
| **Footer Columns Count** | How many columns to show (typically 3 or 4) |
| **Footer Column 1 / 2 Links** | Custom link lists for the footer columns |
| **Footer Social Icons** | Show or hide the social icons row |
| **Copyright Bar** | The bottom strip — you can change its background |

---

## 6. Blog settings

| Field | What it does |
|---|---|
| **Enable blog comments** | Turn the comment system on or off site-wide |
| **Blog listing layout** | Card grid, list, or other built-in styles |
| **Posts per page** | How many articles appear before pagination |

---

## 7. Page loader

A small animated loader shown while pages first load.

| Field | What it does |
|---|---|
| **Page Loader Enabled** | Turn the loader on or off |
| **Loader Background Colour** | Background of the loader screen |
| **Loader Bar Colour** | Colour of the animated bars |
| **Loader Min Duration** | Minimum time (ms) before the loader hides — keeps it from flashing |

---

## 8. Smooth scroll & animations

- **Smooth Scroll** — adds a smooth scrolling feel
- **Fade Animations** — fades sections in as you scroll
- **Duration / Distance / Threshold** — fine-tune the effect

If unsure, leave these at their defaults.

---

## 9. Google Analytics

| Field | What it does |
|---|---|
| **Google Analytics ID** | Paste your GA4 measurement ID (e.g. `G-XXXXXXXXXX`). Tracking begins **only after the visitor accepts cookies** via the consent banner. Leaving this blank disables analytics entirely. |

---

## 10. Custom Code (advanced)

| Field | What it does |
|---|---|
| **Custom CSS** | Paste CSS to override styles. Be careful — invalid CSS can break the layout. |
| **Head Scripts** | Code to inject into the `<head>` (e.g. third-party verification tags) |
| **Footer Scripts** | Code to inject before the closing `</body>` (e.g. third-party widgets) |

> If you are not familiar with HTML/CSS/JavaScript, leave this section alone or ask a developer.

---

## 11. Admin appearance

You can change how the **admin panel itself** looks. These settings are independent of the public website theme.

| Field | What it does |
|---|---|
| **Admin Site Name** | Brand name shown in the admin sidebar header |
| **Admin Logo** | Logo image shown in the admin sidebar header |
| **Admin Text Colour** | Default text colour inside the admin |
| **Admin Border Colour** | Border lines between cards / sections |
| **Admin CTA Background / Text** | Primary button colours (e.g. Save, Create) |
| **Admin CTA Hover Background / Text** | Primary button hover state |
| **Admin Sidebar Background** | Background colour of the sidebar |
| **Admin Sidebar Text** | Default text colour in the sidebar |
| **Admin Sidebar Hover Background / Text** | Hover state on sidebar items |
| **Admin Sidebar Active Background / Text** | Highlight for the currently selected sidebar item |
| **Admin Loader Colour** | Spinner / progress colour inside the admin |

---

## Saving changes

Always click **Save Theme** at the bottom of the page. Changes apply immediately to the public website (no rebuild needed).

---

## Tips

- **Make small changes one at a time** — saving and previewing in between makes it easier to spot what broke.
- **Use the colour palette** instead of pasting hex codes everywhere — that way you can update one colour later and have it apply across the whole site.
- **Logos**: keep them under 200 KB and ideally as transparent PNG or WebP.
- **Test on mobile** after big theme changes — open the site on your phone or use the browser's responsive view.
- **If something looks broken after a save**, undo by setting the changed field back to its previous value. There is no auto-revert.

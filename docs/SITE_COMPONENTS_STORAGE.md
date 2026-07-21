# Where site components are stored

All site component **content** is stored in the **components** collection (one document per component with `baseComponent` and `defaultProps`).

The public site shell is a separate concern: Admin → Appearance stores its Header and Footer records in the independent `appearance` collection. Those records do not read from or write to the legacy Header/Footer records in `components`. The legacy component routes and editors remain available for component/page-builder compatibility.

**New component add karte waqt:** Naya site component hamesha **LatestNews / HomeHero / Subscribe jaisa hi** banao — 3-file folder, EditForm, `EDITABLE_SITE_EDIT_FORMS`, aur admin edit page me Edit button + preview + refetch. Full checklist: [NEW_SITE_COMPONENT_CHECKLIST.md](./NEW_SITE_COMPONENT_CHECKLIST.md).

| Component   | Collection    | API (GET = public, PUT = admin)     |
|------------|----------------|-------------------------------------|
| **Subscribe** | `components` | GET/PUT `/api/theme/subscribe`  |
| **Header**    | `components` | GET/PUT `/api/theme/header`     |
| **Footer**    | `components` | GET/PUT `/api/theme/footer`     |
| **Marquee**   | `components` | GET/PUT `/api/theme/marquee`    |
| **HomeHero**  | `components` | GET/PUT `/api/theme/home-hero`  |

- **Subscribe**: `baseComponent: "Subscribe"`; `defaultProps` stores the finale heading/accent, two CTA links and targets, newsletter label/input/button text, semantic theme-color keys, and the standard shared Manage Section settings. There are no separate Subscribe-specific background-image fields.
- **Header**: `baseComponent: "Header"`, `defaultProps: { logoType, logoLightUrl, headerVolunteerLabel, ... }`.
- **Footer**: `baseComponent: "Footer"`, `defaultProps: { footerLogoUrl, footerAddress, footerCol1Links, ... }`.
- **Marquee**: `baseComponent: "Marquee"`, `defaultProps: { marqueeTitle, marqueeItems }`.
- **HomeHero**: `baseComponent: "HomeHero"`, `defaultProps: { homeHeroSlides, homeHeroSliderTitleColorKey, ... }`.

GET `/api/theme` still returns the full theme (from `themeconfigs`) and **merges** in Header, Footer, Marquee, HomeHero, Subscribe from the components collection so existing consumers get the same shape.

Appearance uses authenticated `GET/PUT /api/admin/appearance/header` and `GET/PUT /api/admin/appearance/footer`. `lib/layoutData.js` loads the published records directly for server rendering; `PublicShell` renders them immediately on the next request after a save.

The Appearance drawers are design-specific rather than legacy component-schema forms. Header exposes logo, live menu selection, search, action buttons, and rendered colors. Footer exposes only brand/contact, two link columns, social links, legal links, and rendered colors/background. Configurable links store `target` as `_self` or `_blank`; menu links continue to use the existing `Menu.items[].openInNewTab` field managed under Admin → Menus.

## Metadata (all site components)

- **sitecomponentmetas**: One doc per site component with `componentId`, `displayName`, `global`, `order`, `position`, `enabled`. Updated via PUT `/api/admin/site-components/[id]`.

## Page content: pages collection only

- **Admin page edit**: When you open a page in PageBuilder (`/admin/pages/[id]`), the page (including `layout` and every block’s `props`) is loaded from the **pages** collection only via `GET /api/admin/pages/[id]`. Save updates the same page document (pages collection).
- **Frontend**: Page body is loaded from the **pages** collection only. `app/(site)/page.js` and `app/(site)/[slug]/page.js` use `Page.findOne()`, then pass `page.layout` to `ComponentRenderer`. Each block’s content comes from `block.props` on the page document. HomeHero, Marquee, and Subscribe components prefer these page props (`homeHeroSlides`, `marqueeTitle`/`marqueeItems`, `subscribeSubtitle`/`subscribeTitle`, etc.); they only call theme APIs when the block has no such props (e.g. legacy or global usage).
- **Testimonials (and other addable site components)**: When added to a page via Page Builder, **all** settings and items are stored in that block’s `props` on the page (pages collection). The EditForm loads and saves only from the page; no theme/component API is used for page blocks. Each page can have different Testimonials content.
- **Global shell** (header, footer, global before/after): Still from theme + components collection via `getLayoutData()`.

## PageBuilder palette (dynamic from DB)

- The admin PageBuilder loads its **palette and schema** from **GET /api/admin/components** (components collection). There is no hardcoded core list in code.
- Run **`npm run seed`** to populate system components (Paragraph, Heading, Section, etc.) so the Add Block palette is complete.
- Optional Ant Design blocks (Button, Card, Input, …) are still merged when `includeAntdBlocks` is true.

## "Show on all pages" (global) and PageBuilder

- When a site component has **Show on all pages = Yes** (`global: true` in `sitecomponentmetas`), it is **automatically** rendered on every page via the layout: `getLayoutData()` returns `globalBefore` / `globalAfter` (componentIds with `global: true`), and `PublicShell` renders them with `renderGlobalComponent(id)`. No need to add them in the page builder.
- PageBuilder **Add Component** list excludes `global === true` components, so they do not appear in the palette. Editing global components is done in **Admin → Components → [id]/edit**; their content is stored in the components collection and used by the layout on all pages.

## DB backup

- **`npm run backup-db`** exports every collection, including indexes and collection metadata, to **`../mescotrust_cms_backups/YYYY-MM-DD_HH-mm-ss/database/`**. Run before major schema or data changes.

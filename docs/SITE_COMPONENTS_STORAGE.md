# Where site components are stored

All site component **content** is stored in the **components** collection (one document per component with `baseComponent` and `defaultProps`).

| Component   | Collection    | API (GET = public, PUT = admin)     |
|------------|----------------|-------------------------------------|
| **Subscribe** | `components` | GET/PUT `/api/theme/subscribe`  |
| **Header**    | `components` | GET/PUT `/api/theme/header`     |
| **Footer**    | `components` | GET/PUT `/api/theme/footer`     |
| **Marquee**   | `components` | GET/PUT `/api/theme/marquee`    |
| **HomeHero**  | `components` | GET/PUT `/api/theme/home-hero`  |

- **Subscribe**: `baseComponent: "Subscribe"`, `defaultProps: { subscribeSubtitle, subscribeTitle, subscribePlaceholder, subscribeButtonText, subscribeBgUrl }`.
- **Header**: `baseComponent: "Header"`, `defaultProps: { logoType, logoLightUrl, headerVolunteerLabel, ... }`.
- **Footer**: `baseComponent: "Footer"`, `defaultProps: { footerLogoUrl, footerAddress, footerCol1Links, ... }`.
- **Marquee**: `baseComponent: "Marquee"`, `defaultProps: { marqueeTitle, marqueeItems }`.
- **HomeHero**: `baseComponent: "HomeHero"`, `defaultProps: { homeHeroSlides, homeHeroSliderTitleColorKey, ... }`.

GET `/api/theme` still returns the full theme (from `themeconfigs`) and **merges** in Header, Footer, Marquee, HomeHero, Subscribe from the components collection so existing consumers get the same shape.

## Metadata (all site components)

- **sitecomponentmetas**: One doc per site component with `componentId`, `displayName`, `global`, `order`, `position`, `enabled`. Updated via PUT `/api/admin/site-components/[id]`.

## Page content: pages collection only

- **Admin page edit**: When you open a page in PageBuilder (`/admin/pages/[id]`), the page (including `layout` and every block’s `props`) is loaded from the **pages** collection only via `GET /api/admin/pages/[id]`. Save updates the same page document (pages collection).
- **Frontend**: Page body is loaded from the **pages** collection only. `app/(site)/page.js` and `app/(site)/[slug]/page.js` use `Page.findOne()`, then pass `page.layout` to `ComponentRenderer`. Each block’s content comes from `block.props` on the page document. HomeHero, Marquee, and Subscribe components prefer these page props (`homeHeroSlides`, `marqueeTitle`/`marqueeItems`, `subscribeSubtitle`/`subscribeTitle`, etc.); they only call theme APIs when the block has no such props (e.g. legacy or global usage).
- **Global shell** (header, footer, global before/after): Still from theme + components collection via `getLayoutData()`.

## PageBuilder palette (dynamic from DB)

- The admin PageBuilder loads its **palette and schema** from **GET /api/admin/components** (components collection). There is no hardcoded core list in code.
- Run **`npm run seed`** to populate system components (Paragraph, Heading, Section, etc.) so the Add Block palette is complete.
- Optional Ant Design blocks (Button, Card, Input, …) are still merged when `includeAntdBlocks` is true.

## DB backup

- **`npm run backup-db`** exports `users`, `themeconfigs`, `menus`, `pages`, `components`, `sitecomponentmetas` to **`backup/YYYY-MM-DD_HH-mm-ss/*.json`**. Run before major schema or data changes.

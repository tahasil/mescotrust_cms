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

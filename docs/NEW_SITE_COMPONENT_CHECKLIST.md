# New Site Component Checklist

**Important:** Jab bhi naya site component create karein, **exact same pattern** follow karein jaise **LatestNews** (aur HomeHero / Subscribe) — structure, EditForm, API, aur Admin edit page sab same flow hona chahiye.

Reference implementation: `components/site/LatestNews/` (LatestNews.js, EditForm.js, index.js).

---

## 1. File structure (3-file folder)

- `components/site/{ComponentId}/`
  - **{ComponentId}.js** — Main UI; sab content **props** se (theme/layout se merge hota hai).
  - **EditForm.js** — Load/save via `GET/PUT /api/theme/{componentId}`; Form.List for repeatable items; theme color keys from admin custom colors.
  - **index.js** — `export { default, {ComponentId}EditForm } from "./…"`.

Admin se **Create component** karne par ye structure API (`app/api/admin/site-components` POST) automatically bana deta hai. Agar manually add karein to bhi yahi structure use karein.

---

## 2. Registry & exports

- **`lib/siteComponentRegistry.js`** — `SITE_COMPONENT_IDS` array me naya `componentId` add ho (create-component API ye karta hai).
- **`components/site/index.js`**:
  - Export: `export { default as {ComponentId}, {ComponentId}EditForm } from "./{ComponentId}/index";`
  - Import: `import {ComponentId}EditForm from "./{ComponentId}/EditForm";`
  - **`EDITABLE_SITE_EDIT_FORMS`** me entry: `{ComponentId}: {ComponentId}EditForm` — **ye zaroori hai**, iske bina Admin edit page par **Edit** button nahi aata.

---

## 3. Theme API (dynamic route)

- **`/api/theme/[componentId]/route.js`** — Already exists; naye components ke liye `GET` (defaultProps return) aur `PUT` (admin, defaultProps update) use hota hai. Sirf `componentId` registry me hona chahiye (static routes jaise `header`, `home-hero` reserved hain).
- Agar dedicated route chahiye (e.g. `home-hero` jaisa) to `app/api/theme/{component-id}/route.js` bana sakte ho; warna dynamic `[componentId]` use hota hai.

---

## 4. EditForm.js (same flow as LatestNews / HomeHero / Subscribe)

- **Load:** `source === "page"` nahi to `GET /api/theme/{componentId}` + optional `GET /api/theme` for theme color options.
- **Save:** `PUT /api/theme/{componentId}` with payload; success par `onSuccess?.()`.
- **Page block:** `source === "page"` ho to `initialData` / `onSaveToPage` use karein.
- **UI:** Loading (Spin), Collapse sections (e.g. Section headings, Items list, Theme colors), Form.List for repeatable items (add/remove/move), theme color dropdowns **sirf custom colors** (admin/theme) se.
- **Ref:** `useImperativeHandle(ref, () => ({ update: handleUpdate }))` — drawer **Update** button isi `update()` ko call karta hai.

---

## 5. Main component JS — content from props

- Sab editable content **props** se aana chahiye (e.g. a component-specific subtitle and items field). Layout `getLayoutData()` sab site components ke `defaultProps` theme me merge karta hai, to PublicShell `theme` as props pass karta hai.
- Default/fallback values component me hi define karein jab prop missing ho.
- Colors: component-specific theme color **keys** use karein aur `getColor(key)` se resolve karein (admin custom colors + fallbacks).

---

## 6. Admin component edit page (`app/admin/(authenticated)/components/[id]/edit/page.js`)

Naye editable component ke liye **Edit** button aur preview ke liye ye steps follow karein (LatestNews jaisa):

1. **State:** `const [theme{ComponentId}Snapshot, setTheme{ComponentId}Snapshot] = useState(null);`
2. **Flag:** `const is{ComponentId} = record?.componentId === "{ComponentId}";`
3. **Initial fetch:** `useEffect` me `is{ComponentId}` ho to `GET /api/theme/{componentId}` (ya theme merge) se data fetch karke snapshot set karein.
4. **Preview block:** `{is{ComponentId} && ( ... <SiteComponents.{ComponentId} {...(theme{ComponentId}Snapshot || {})} /> )}`
5. **Drawer refetch:** Drawer ke `onSuccess` (refetchAndClose) me `cid === "{ComponentId}"` ke liye theme refetch karke `setTheme{ComponentId}Snapshot(...)` call karein taaki save ke baad preview update ho.
6. **“Other” block:** Jo generic block unlisted components ke liye hai, usme condition me `!is{ComponentId}` add karein taaki naya component apne preview + Edit flow me hi dikhe.

---

## 7. Components collection (DB)

- Naya component create hone par **`Component`** model me doc bhi create hota hai (`baseComponent: componentId`, `defaultProps: {}`) — create-component API ye karta hai.
- `getLayoutData()` aur `GET /api/theme` sab registry components ke `defaultProps` theme me merge karte hain, isliye public site par content dikhta hai.

---

## Summary

| Step | Action |
|------|--------|
| 1 | 3-file folder: `{ComponentId}.js`, `EditForm.js`, `index.js` |
| 2 | Registry + `components/site/index.js` exports + **EDITABLE_SITE_EDIT_FORMS** me entry |
| 3 | Theme API: dynamic `[componentId]` ya dedicated route |
| 4 | EditForm: load/save API, Form.List, theme colors, ref `update()` |
| 5 | Main component: sab props se, `getColor(key)` for colors |
| 6 | Edit page: snapshot state, fetch, preview block, refetch on save, exclude from “other” |
| 7 | Component doc in DB (create API se) |

**Jab bhi naya component add ho, is checklist ko follow karein taaki create + edit flow LatestNews / HomeHero / Subscribe jaisa hi rahe.**

---

*Last updated: 2026-07-21 — LatestNews as reference.*

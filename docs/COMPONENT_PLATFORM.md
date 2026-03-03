# Component platform — naya component banao, code add karo, pages par use karo

Header aur Footer jaisa hi koi bhi naya site component bana sakte ho: pehle admin se component create karo, phir codebase me file me code likho, phir page create/edit karte waqt **Add Component** se use karo.

## Step 1: Naya component banao

1. **Admin → Components** par jao.
2. **New component** dabao.
3. **Component ID** daalo (e.g. `HeroBanner`, `FeatureGrid`) — sirf letters/numbers, no spaces.
4. **Display name** (optional) — jo list me dikhega.
5. **Show on all pages (global)** — agar har page par auto show karna ho to on karo (jaise Header/Footer).
6. **Create** dabao.

Create hone ke baad aap automatically us component ki **Edit** page par chale jaoge. Wahi pe **Preview** aur code file path dikhta hai.

## Step 2: Code add karo codebase me

Naya component create karte hi ye cheezein auto ho jati hain:

- **File:** `components/site/<ComponentId>.js` — yahi file me apna React component likhna hai.
- **Registry:** `lib/siteComponentRegistry.js` me component ID add ho jata hai.
- **Export:** `components/site/index.js` me export add ho jata hai.

Aapko sirf **`components/site/<ComponentId>.js`** open karke apna UI/content likhna hai. Default template me placeholder hota hai; use replace karke apna design daalo.

Example (simple component):

```js
"use client";

export default function MySection(props) {
  return (
    <section className="site-component-mysection">
      <div className="container">
        <h2>My Section</h2>
        <p>Your content here.</p>
      </div>
    </section>
  );
}
```

Theme colors, links, etc. use karne ke liye `@/styles/Theme` (e.g. `getColor`, `ThemeButton`) use kar sakte ho — jaise `HeroBanner.js` me hai.

## Step 3: Pages par use karo

- **Admin → Pages** → koi page **Edit** karo (ya nayi page banao).
- Page builder me **Add Component** (➕) dabao.
- List me aapka naya component dikhega (Display name / Component ID se).
- Use select karo — component page layout me add ho jayega, jahan chahe drag karke reorder kar sakte ho.

Component **global** nahi hai to sirf unhi pages par dikhega jahan aapne Add Component se add kiya hai. **Global** (e.g. Header/Footer) har page par auto render hota hai.

## Summary

| Kya karna hai       | Kahan / Kaise |
|---------------------|----------------|
| Component create    | Admin → Components → New component |
| Code likhna         | `components/site/<ComponentId>.js` |
| Page par use karna | Admin → Pages → Edit page → Add Component → apna component choose karo |

Header / Footer ki tarah hi naya component: **create → code add → page par use**.

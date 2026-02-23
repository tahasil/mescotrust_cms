# Analytics Integration

## Google Analytics

Add Google Analytics by inserting the script tag in the root layout.

In `app/layout.js`, add inside `<head>` (or use `next/script`):

```jsx
import Script from "next/script";

// Inside the layout:
<Script
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
  strategy="afterInteractive"
/>
<Script id="ga" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  `}
</Script>
```

Replace `G-XXXXXXXXXX` with your Measurement ID.

**CSP note:** The default Content-Security-Policy in `next.config.js` restricts external scripts. Add the analytics domain to the `script-src` directive and its data endpoint to `connect-src`:

```js
// In next.config.js → headers → Content-Security-Policy:
"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com",
"connect-src 'self' https://api.resend.com https://www.google-analytics.com",
```

## Plausible Analytics

For a privacy-friendly alternative:

```jsx
<Script
  src="https://plausible.io/js/script.js"
  data-domain="yourdomain.com"
  strategy="afterInteractive"
/>
```

**CSP note:** Add `https://plausible.io` to `script-src` and `connect-src` in `next.config.js`.

## Server-Side Events (Optional)

For internal analytics, create an events table/model in MongoDB:

```js
// models/AnalyticsEvent.js
const eventSchema = new mongoose.Schema({
  event: String,     // e.g. "page_view"
  path: String,      // e.g. "/blog/my-post"
  referrer: String,
  userAgent: String,
  ip: String,
  timestamp: { type: Date, default: Date.now },
});
```

Record events from middleware or API routes and display in admin dashboard.

## Environment Variable

Add `NEXT_PUBLIC_GA_ID` to `.env.local` for dynamic configuration.

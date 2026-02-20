# Analytics (Phase 7)

To add analytics to the public site:

1. **Google Analytics (GA4)**  
   - Create a property at [analytics.google.com](https://analytics.google.com).  
   - Add the gtag script to `app/layout.js` (inside `<body>`) or use `next/script` with `strategy="afterInteractive"`:
   ```js
   <Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX" strategy="afterInteractive" />
   <Script id="gtag" strategy="afterInteractive">
     {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-XXXXXXXXXX');`}
   </Script>
   ```
   - Use `NEXT_PUBLIC_GA_ID` in env for the measurement ID.

2. **Plausible**  
   - Add the Plausible script to the root layout; see [plausible.io/docs](https://plausible.io/docs).

3. **Server-side / API**  
   - For server-side events, call your analytics provider’s API from API routes or Server Actions (e.g. on form submit or key actions).

4. **Internal analytics (optional)**  
   - Store events in MongoDB (e.g. page views, form submissions) and build an admin view to query them.

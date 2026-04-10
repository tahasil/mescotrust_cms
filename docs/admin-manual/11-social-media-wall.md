# 11. Social Media Wall

The **Social Media Wall** component displays social media posts in a masonry (Pinterest-style) card layout. It supports two modes:

- **Manual posts** — admin adds posts with image, caption, username, date, and link
- **Live posts** — auto-fetched from Instagram, Facebook, YouTube, and X/Twitter using API keys configured in `.env`

Both modes work together (hybrid). Clicking any card opens a modal with full details and a "View on Platform" link.

---

## Adding to a Page

1. Go to **Admin > Pages** and edit the page (e.g. "In Media")
2. In the **Page Builder**, click **Add Block**
3. Select **SocialMediaWall** from the component list
4. Configure the block (see sections below)
5. Click **Save** on the page

---

## Managing Manual Posts

### Adding a Post

1. Open the **Manage Posts** panel in the edit form
2. Click **Add post**
3. Fill in:
   - **Platform** — select from: Instagram, Facebook, LinkedIn, YouTube, X (Twitter), WhatsApp, Google Maps, Other
   - **Username / Source** — display name (e.g. `@mescotrust`)
   - **Image URL** — post image (e.g. `/uploads/post.webp` or full URL)
   - **Caption / Text** — post content or description
   - **Date** — when the post was published (e.g. `14 Apr, 2025`)
   - **Post URL** — link to the original post (shown as "View on Platform" button in modal)
   - **Active** — toggle on/off without deleting

### Reordering & Removing
- Drag posts to reorder them
- Click the delete icon to remove a post
- Use the **Active** switch to temporarily hide without deleting

---

## Live Post Fetching (API Integration)

When API keys are configured in `.env`, the component auto-fetches latest posts from these platforms:

| Platform | Env Keys Required |
|----------|------------------|
| Instagram | `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID` |
| Facebook | `FACEBOOK_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID` |
| YouTube | `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID` |
| X (Twitter) | `TWITTER_BEARER_TOKEN`, `TWITTER_USER_ID` |

**No API key = platform skipped silently.** Manual posts always work regardless.

Live posts show a small red **LIVE** badge on the card.

### How to get API keys

#### Instagram / Facebook (Meta Graph API)
1. Go to [developers.facebook.com](https://developers.facebook.com/)
2. Create a new App (Business type)
3. Add Instagram Graph API product
4. Generate a Page Access Token with `instagram_basic`, `pages_show_list` permissions
5. Get your Instagram Business Account ID from the API Explorer
6. Add to `.env`: `INSTAGRAM_ACCESS_TOKEN=...` and `INSTAGRAM_USER_ID=...`
7. For Facebook: use the same token, add `FACEBOOK_PAGE_ID=...`

#### YouTube (Google Data API v3)
1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create a project, enable YouTube Data API v3
3. Create an API Key (restrict to YouTube Data API)
4. Get your Channel ID from your YouTube channel URL
5. Add to `.env`: `YOUTUBE_API_KEY=...` and `YOUTUBE_CHANNEL_ID=...`

#### X / Twitter (API v2)
1. Go to [developer.twitter.com](https://developer.twitter.com/)
2. Create a project and app
3. Generate a Bearer Token
4. Get your User ID using the Twitter API (`GET /2/users/by/username/:username`)
5. Add to `.env`: `TWITTER_BEARER_TOKEN=...` and `TWITTER_USER_ID=...`

### Cache & Refresh
- Live posts are cached server-side for **30 minutes**
- After 30 minutes, fresh posts are fetched automatically
- If an API fails, the last cached data is shown (never blank)

---

## Manual-Only Platforms

These platforms have no public post API. Use **manual posts** for them:

- **LinkedIn** — add posts manually with platform set to "LinkedIn"
- **WhatsApp** — add posts manually with platform set to "WhatsApp"
- **Google Maps** — add posts manually with platform set to "Google Maps"

---

## Section Styling

Open the **Manage Section** panel to configure:
- **Section background** — default, solid color, or background image
- **Padding** — top and bottom spacing
- **Margins** — top and bottom spacing

---

## Title & Colors

Open the **Title & Colors** panel to configure:
- **Show title** / **Show subtitle** — toggle visibility
- **Main title** — section heading (default: "Social Media Wall")
- **Subtitle** — smaller text above the title
- **Title color** / **Subtitle color** — pick theme colors

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No live posts appearing | Check `.env` has the correct API keys. Restart the server after adding keys. |
| Instagram token expired | Meta tokens expire after 60 days. Generate a new long-lived token and update `.env`. |
| YouTube quota exceeded | Google gives 10,000 units/day free. Each search costs 100 units = 100 requests/day max. |
| Manual posts not showing | Ensure the post has **Active** toggled on and the page is saved. |
| Images broken on cards | Check the Image URL is valid. Use `/uploads/...` for local files or full `https://...` URLs. |

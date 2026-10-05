import { connectDB } from "@/lib/db";
import ThemeConfig from "@/models/ThemeConfig";

/**
 * Server-side reader for the Admin Settings theme values.
 *
 * `AdminLayoutClient` used to fetch `/api/theme` on the client, which meant
 * every admin loader/skeleton first painted with the hardcoded default colour
 * and only switched to the configured one after hydration. Reading the saved
 * admin theme on the server and passing it as `initialAdminTheme` makes the
 * configured loader render from the very first paint.
 */

const THEME_QUERY = { $or: [{ themeKey: "default" }, { themeKey: { $exists: false } }] };

const ADMIN_THEME_KEYS = [
  "adminSiteName",
  "adminLogoUrl",
  "adminTextColor",
  "adminBgColor",
  "adminSidebarBg",
  "adminSidebarText",
  "adminSidebarHoverBg",
  "adminSidebarHoverText",
  "adminSidebarActiveBg",
  "adminSidebarActiveText",
  "adminLoaderColor",
  "adminLoaderBgColor",
];

export const ADMIN_THEME_FIELDS = ADMIN_THEME_KEYS;

export async function getAdminThemeSettings() {
  try {
    await connectDB();
    const doc = await ThemeConfig.findOne(THEME_QUERY).sort({ updatedAt: -1 }).lean();
    if (!doc) return null;
    const settings = {};
    for (const key of ADMIN_THEME_KEYS) {
      const value = doc[key];
      if (value !== undefined && value !== null && value !== "") {
        settings[key] = String(value);
      }
    }
    return Object.keys(settings).length > 0 ? settings : null;
  } catch {
    return null;
  }
}
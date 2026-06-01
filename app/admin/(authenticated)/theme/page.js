import { redirect } from "next/navigation";

// Legacy route. The Appearance module is now the single theming surface (matches
// TSUV) — header/footer/menu/background/colors/layouts/effects/loader/advanced/
// branding all live under /admin/appearance/*. Redirect any old /admin/theme link
// there. (Saved theme values stay in sitesettings and keep applying.)
export default function LegacyThemePage() {
  redirect("/admin/appearance/header");
}

import { redirect } from "next/navigation";
import AdminComponentEditPage from "@/app/admin/(authenticated)/components/[id]/edit/page";

// Sliders are edited under /admin/sliders/edit-<componentId> (matches TSUV), reusing
// the shared component editor with the back-href pointing at the Sliders list — so
// slider editing stays in the Sliders section instead of /admin/components.
export default function AdminSliderEditPage({ params }) {
  const rawSlug = params?.slug;
  const slug = typeof rawSlug === "string" ? rawSlug.trim() : "";

  if (!slug.toLowerCase().startsWith("edit-")) {
    redirect("/admin/sliders");
  }

  const componentId = decodeURIComponent(slug.slice(5)).trim();
  if (!componentId) {
    redirect("/admin/sliders");
  }

  return (
    <AdminComponentEditPage
      forcedComponentId={componentId}
      forcedBackHref="/admin/sliders"
    />
  );
}

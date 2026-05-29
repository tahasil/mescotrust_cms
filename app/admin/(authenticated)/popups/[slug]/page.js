import { redirect } from "next/navigation";
import AdminComponentEditPage from "@/app/admin/(authenticated)/components/[id]/edit/page";

export default function AdminPopupEditPage({ params }) {
  const rawSlug = params?.slug;
  const slug = typeof rawSlug === "string" ? rawSlug.trim() : "";

  if (!slug.toLowerCase().startsWith("edit-")) {
    redirect("/admin/popups");
  }

  const componentId = decodeURIComponent(slug.slice(5)).trim();
  if (!componentId) {
    redirect("/admin/popups");
  }

  return (
    <AdminComponentEditPage
      forcedComponentId={componentId}
      forcedBackHref="/admin/popups"
    />
  );
}

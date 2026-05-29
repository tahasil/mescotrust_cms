import { redirect } from "next/navigation";
import PopupEditorPage from "@/components/admin/Popups/PopupEditorPage";

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

  return <PopupEditorPage componentId={componentId} />;
}

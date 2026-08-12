import { redirect } from "next/navigation";

export default function LegacyThemePage({ searchParams }) {
  const section = String(searchParams?.section || "").toLowerCase();
  if (section === "frontend") {
    redirect("/admin/settings/frontend-theme");
  }
  redirect("/admin/settings/admin-theme");
}

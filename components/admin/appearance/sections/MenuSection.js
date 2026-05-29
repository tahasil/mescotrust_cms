"use client";

import dynamic from "next/dynamic";

const AdminMenusPage = dynamic(
  () => import("@/components/admin/menus/AdminMenusManager"),
  { ssr: false },
);

export default function MenuSection() {
  return <AdminMenusPage structureOnly defaultMenuName="Primary Menu" />;
}

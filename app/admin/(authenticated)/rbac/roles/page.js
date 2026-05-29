import { RolesModule } from "@/components/admin/rbac";

export const metadata = {
  title: "Roles & Permissions",
};

export default function AdminRolesPage() {
  return <RolesModule />;
}

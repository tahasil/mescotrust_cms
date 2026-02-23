import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

export default async function AuthenticatedAdminLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/admin/login");
  }

  const userName = session.user?.name || session.user?.email || "Admin";
  const userRole = session.user?.role || "";

  return <AdminLayoutClient userName={userName} userRole={userRole}>{children}</AdminLayoutClient>;
}

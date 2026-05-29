import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";
import { authorizeAdminPageAccess } from "@/lib/rbac/accessControl";

export default async function AuthenticatedAdminLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/admin/login");
  }
  if (session.forceReauth) {
    const reason = encodeURIComponent(String(session.forceReauthReason || "role-updated"));
    redirect(`/admin/login?reason=${reason}`);
  }

  const headersList = headers();
  const pathname = headersList.get("x-pathname") || headersList.get("X-Pathname") || "";

  const authz = await authorizeAdminPageAccess({
    sessionLike: {
      id: session.user?.id,
      role: session.user?.role,
      roleKey: session.user?.roleKey || session.user?.role,
      userType: session.user?.userType || "",
      permissionVersion: session.user?.permissionVersion || 1,
      sessionVersion: session.user?.sessionVersion || 1,
      permissionKeys: session.user?.permissionKeys || [],
    },
    pathname,
  });

  if (!authz.allowed) {
    const target = `/admin/forbidden?requiredPermission=${encodeURIComponent(authz.requiredPermission || "")}&from=${encodeURIComponent(pathname)}`;
    redirect(target);
  }

  const userName = session.user?.name || session.user?.email || "Admin";
  const userRole = authz?.access?.role || session.user?.role || "";
  const userRoleKey = authz?.access?.roleKey || session.user?.roleKey || session.user?.role || "";
  const userType = session.user?.userType || "";
  const permissionKeys = authz?.access?.permissionKeys || session.user?.permissionKeys || [];

  return (
    <AdminLayoutClient
      userName={userName}
      userRole={userRole}
      userRoleKey={userRoleKey}
      userType={userType}
      permissionKeys={permissionKeys}
    >
      {children}
    </AdminLayoutClient>
  );
}

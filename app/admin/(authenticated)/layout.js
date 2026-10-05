import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";
import { authorizeAdminPageAccess } from "@/lib/rbac/accessControl";
import { getAdminThemeSettings } from "@/lib/adminTheme";

export default async function AuthenticatedAdminLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/admin/login");
  }
  if (session.forceReauth) {
    redirect(`/admin/login?reason=${encodeURIComponent(session.forceReauthReason || "role-updated")}`);
  }

  const headersList = headers();
  const pathname = headersList.get("x-pathname") || "";
  const authorization = await authorizeAdminPageAccess({
    sessionLike: {
      id: session.user?.id,
      email: session.user?.email,
      role: session.user?.role,
      roleKey: session.user?.roleKey || session.user?.role,
      permissionVersion: session.user?.permissionVersion || 1,
      sessionVersion: session.user?.sessionVersion || 1,
      permissionKeys: session.user?.permissionKeys || [],
    },
    pathname,
  });
  if (!authorization.allowed) {
    redirect(
      `/admin/forbidden?requiredPermission=${encodeURIComponent(authorization.requiredPermission || "")}&from=${encodeURIComponent(pathname)}`,
    );
  }

  // Resolved on the server so the configured Admin Loader colours are painted
  // with the very first frame instead of flashing the hardcoded defaults.
  const adminTheme = await getAdminThemeSettings();

  const userName = session.user?.name || session.user?.email || "Admin";
  const userRole = authorization.access?.role || session.user?.role || "";
  const userRoleKey = authorization.access?.roleKey || session.user?.roleKey || session.user?.role || "";
  const permissionKeys = authorization.access?.permissionKeys || session.user?.permissionKeys || [];

  return (
    <AdminLayoutClient
      userName={userName}
      userRole={userRole}
      userRoleKey={userRoleKey}
      permissionKeys={permissionKeys}
      initialAdminTheme={adminTheme}
    >
      {children}
    </AdminLayoutClient>
  );
}

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AccessForbiddenPage from "@/components/admin/AccessForbiddenPage";

function getParam(searchParams, key) {
  if (!searchParams) return "";
  const raw = searchParams[key];
  if (Array.isArray(raw)) return String(raw[0] || "");
  return String(raw || "");
}

function sanitizeRole(value) {
  const clean = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9 _-]/g, "");
  return clean.slice(0, 40);
}

function sanitizePermission(value) {
  const clean = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_.-]/g, "");
  return clean.slice(0, 120);
}

function sanitizePath(value) {
  const path = String(value || "").trim();
  if (!path.startsWith("/")) return "";
  return path.slice(0, 240);
}

export default async function AdminForbiddenPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/admin/login?callbackUrl=/admin/forbidden");
  }

  const currentRole = session.user?.role || "";
  const currentRoleKey = session.user?.roleKey || session.user?.role || "";
  const requiredRoleParam = sanitizeRole(getParam(searchParams, "requiredRole"));
  const requiredRole = requiredRoleParam || "Admin";
  const requiredPermission = sanitizePermission(getParam(searchParams, "requiredPermission"));
  const requestedPath = sanitizePath(getParam(searchParams, "from"));

  return (
    <AccessForbiddenPage
      currentRole={currentRole}
      currentRoleKey={currentRoleKey}
      requiredRole={requiredRole}
      requiredPermission={requiredPermission}
      requestedPath={requestedPath}
    />
  );
}

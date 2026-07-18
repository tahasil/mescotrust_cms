import { connectDB } from "@/lib/db";

export async function logPermissionAudit({ req, actorAccess, targetType, targetId, action, before = null, after = null, status = "success", reason = "" }) {
  try {
    await connectDB();
    const PermissionAuditLog = (await import("@/models/PermissionAuditLog")).default;
    await PermissionAuditLog.create({
      actorUserId: actorAccess?.id || null,
      actorRoleKey: actorAccess?.roleKey || actorAccess?.role || "",
      targetType,
      targetId: String(targetId || ""),
      action: String(action || "").toLowerCase(),
      before,
      after,
      status,
      reason: String(reason || ""),
      ip: req?.headers?.get?.("x-forwarded-for")?.split(",")?.[0]?.trim?.() || req?.headers?.get?.("x-real-ip") || "",
      userAgent: req?.headers?.get?.("user-agent") || "",
    });
  } catch {
    // Audit failures must never block the requested admin operation.
  }
}

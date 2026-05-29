import { connectDB } from "@/lib/db";

function getRequestMeta(req) {
  if (!req) return { ip: "", userAgent: "", traceId: "" };
  const ip =
    req.headers?.get?.("x-forwarded-for")?.split(",")?.[0]?.trim?.() ||
    req.headers?.get?.("x-real-ip") ||
    "";
  const userAgent = req.headers?.get?.("user-agent") || "";
  const traceId =
    req.headers?.get?.("x-request-id") ||
    req.headers?.get?.("x-correlation-id") ||
    "";
  return { ip, userAgent, traceId };
}

export async function logPermissionAudit({
  req,
  actorAccess,
  targetType,
  targetId,
  action,
  before = null,
  after = null,
  status = "success",
  reason = "",
}) {
  try {
    await connectDB();
    const PermissionAuditLog = (await import("@/models/PermissionAuditLog")).default;
    const { ip, userAgent, traceId } = getRequestMeta(req);

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
      ip: String(ip || ""),
      userAgent: String(userAgent || ""),
      traceId: String(traceId || ""),
    });
  } catch {
    // Audit logging should not break main flows.
  }
}

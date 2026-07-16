import { connectDB } from "@/lib/db";
import SocialWallConfigAudit from "@/models/SocialWallConfigAudit";
import { toPositiveInt, toSafeString } from "@/lib/socialWallModule/utils";

export async function logSocialWallConfigAudit(entry = {}) {
  await connectDB();
  const entityType = toSafeString(entry?.entityType);
  if (!["settings", "platform-config", "token-refresh"].includes(entityType)) {
    return null;
  }
  const doc = await SocialWallConfigAudit.create({
    entityType,
    entityKey: toSafeString(entry?.entityKey || "social-wall") || "social-wall",
    action: toSafeString(entry?.action || "update") || "update",
    performedBy: toSafeString(entry?.performedBy),
    payload: entry?.payload || null,
  });
  return doc?.toObject ? doc.toObject() : doc;
}

export async function listSocialWallConfigAudits({ page = 1, limit = 20 } = {}) {
  await connectDB();
  const safePage = Math.max(1, toPositiveInt(page, 1));
  const safeLimit = Math.min(100, Math.max(1, toPositiveInt(limit, 20)));
  const total = await SocialWallConfigAudit.countDocuments({});
  const items = await SocialWallConfigAudit.find({})
    .sort({ createdAt: -1, _id: -1 })
    .skip((safePage - 1) * safeLimit)
    .limit(safeLimit)
    .lean();
  return {
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    items: items.map((item) => ({
      id: String(item?._id || ""),
      entityType: toSafeString(item?.entityType),
      entityKey: toSafeString(item?.entityKey),
      action: toSafeString(item?.action),
      performedBy: toSafeString(item?.performedBy),
      payload: item?.payload || null,
      createdAt: item?.createdAt || null,
    })),
  };
}


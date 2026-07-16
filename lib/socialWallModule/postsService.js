import { connectDB } from "@/lib/db";
import mongoose from "mongoose";
import SocialWallPost from "@/models/SocialWallPost";
import { getSocialWallPlatformConfigs } from "@/lib/socialWallModule/platformService";
import {
  SOCIAL_WALL_DEFAULT_POST_LIMIT,
  SOCIAL_WALL_MAX_POST_LIMIT,
} from "@/lib/socialWallModule/constants";
import {
  clampNumber,
  decodeCursor,
  encodeCursor,
  hashString,
  normalizeSortBy,
  normalizeSortOrder,
  normalizeVisibility,
  toDateOrNull,
  toPositiveInt,
  toSafeString,
} from "@/lib/socialWallModule/utils";

function normalizeStatus(value, fallback = "pending") {
  const status = toSafeString(value).toLowerCase();
  if (["pending", "approved", "rejected"].includes(status)) return status;
  return fallback;
}

function normalizeMediaType(value, fallback = "text") {
  const mediaType = toSafeString(value).toLowerCase();
  if (["image", "video", "text"].includes(mediaType)) return mediaType;
  return fallback;
}

function isAllowedStatusTransition(currentStatus, nextStatus) {
  if (!currentStatus || !nextStatus) return false;
  if (currentStatus === nextStatus) return true;
  if (currentStatus === "pending") return nextStatus === "approved" || nextStatus === "rejected";
  if (currentStatus === "approved") return nextStatus === "rejected";
  if (currentStatus === "rejected") return nextStatus === "approved";
  return false;
}

function toEndDateForRange(value) {
  const raw = toSafeString(value);
  if (!raw) return null;
  const parsed = toDateOrNull(value);
  if (!parsed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    parsed.setHours(23, 59, 59, 999);
  }
  return parsed;
}

function buildPostId(input, platform, publishedAt) {
  const postId = toSafeString(input?.postId || input?.id);
  if (postId) return postId;
  return `${platform}-${hashString(`${toSafeString(input?.postUrl)}-${toSafeString(input?.caption)}-${publishedAt}`)}`;
}

function normalizeIncomingPost(input = {}, platform = "") {
  const safePlatform = toSafeString(platform || input?.platform).toLowerCase();
  const publishedAt = toDateOrNull(input?.publishedAt) || new Date();
  const likesCount = Math.max(0, toPositiveInt(input?.likesCount, 0));
  const commentsCount = Math.max(0, toPositiveInt(input?.commentsCount, 0));
  const sharesCount = Math.max(0, toPositiveInt(input?.sharesCount, 0));
  return {
    platform: safePlatform,
    postId: buildPostId(input, safePlatform, publishedAt.toISOString()),
    authorName: toSafeString(input?.authorName),
    authorHandle: toSafeString(input?.authorHandle),
    authorImage: toSafeString(input?.authorImage),
    caption: toSafeString(input?.caption),
    mediaType: normalizeMediaType(input?.mediaType, "text"),
    mediaUrl: toSafeString(input?.mediaUrl),
    thumbnailUrl: toSafeString(input?.thumbnailUrl || input?.mediaUrl),
    videoUrl: toSafeString(input?.videoUrl),
    postUrl: toSafeString(input?.postUrl),
    publishedAt,
    likesCount,
    commentsCount,
    sharesCount,
    engagementScore: likesCount + commentsCount + sharesCount,
    hashtags: Array.isArray(input?.hashtags)
      ? input.hashtags.map((tag) => toSafeString(tag)).filter(Boolean)
      : [],
    source: toSafeString(input?.source).toLowerCase() === "manual" ? "manual" : "live",
    visibility: normalizeVisibility(input?.visibility),
    rawPayload: input?.rawPayload || input || null,
    lastSyncedAt: new Date(),
  };
}

function toResponseItem(doc) {
  return {
    id: String(doc?._id || ""),
    platform: toSafeString(doc?.platform),
    postId: toSafeString(doc?.postId),
    authorName: toSafeString(doc?.authorName),
    authorHandle: toSafeString(doc?.authorHandle),
    authorImage: toSafeString(doc?.authorImage),
    caption: toSafeString(doc?.caption),
    mediaType: normalizeMediaType(doc?.mediaType),
    mediaUrl: toSafeString(doc?.mediaUrl),
    thumbnailUrl: toSafeString(doc?.thumbnailUrl),
    videoUrl: toSafeString(doc?.videoUrl),
    postUrl: toSafeString(doc?.postUrl),
    publishedAt: doc?.publishedAt || null,
    likesCount: Number(doc?.likesCount || 0),
    commentsCount: Number(doc?.commentsCount || 0),
    sharesCount: Number(doc?.sharesCount || 0),
    hashtags: Array.isArray(doc?.hashtags) ? doc.hashtags : [],
    source: toSafeString(doc?.source || "live"),
    status: normalizeStatus(doc?.status, "pending"),
    featured: doc?.featured === true,
    visibility: normalizeVisibility(doc?.visibility),
    moderationNote: toSafeString(doc?.moderationNote),
    moderatedBy: toSafeString(doc?.moderatedBy),
    moderatedAt: doc?.moderatedAt || null,
    moderationHistory: Array.isArray(doc?.moderationHistory)
      ? doc.moderationHistory.map((item) => ({
          action: toSafeString(item?.action),
          performedBy: toSafeString(item?.performedBy),
          performedAt: item?.performedAt || null,
          reason: toSafeString(item?.reason),
        }))
      : [],
    createdAt: doc?.createdAt || null,
    updatedAt: doc?.updatedAt || null,
  };
}

export async function upsertSocialWallPosts({
  platform,
  posts = [],
  moderationMode = "manual",
}) {
  const safePlatform = toSafeString(platform).toLowerCase();
  const items = (Array.isArray(posts) ? posts : [])
    .map((item) => normalizeIncomingPost(item, safePlatform))
    .filter((item) => !!item.platform && !!item.postId);
  if (items.length === 0) return { fetchedCount: 0, newCount: 0, updatedCount: 0 };

  await connectDB();
  const postIds = items.map((item) => item.postId);
  const existingRows = await SocialWallPost.find({
    platform: safePlatform,
    postId: { $in: postIds },
  })
    .select("_id postId")
    .lean();
  const existingSet = new Set(existingRows.map((row) => row.postId));

  const defaultStatus = moderationMode === "auto" ? "approved" : "pending";
  await SocialWallPost.bulkWrite(
    items.map((item) => ({
      updateOne: {
        filter: { platform: safePlatform, postId: item.postId },
        update: {
          $set: {
            authorName: item.authorName,
            authorHandle: item.authorHandle,
            authorImage: item.authorImage,
            caption: item.caption,
            mediaType: item.mediaType,
            mediaUrl: item.mediaUrl,
            thumbnailUrl: item.thumbnailUrl,
            videoUrl: item.videoUrl,
            postUrl: item.postUrl,
            publishedAt: item.publishedAt,
            likesCount: item.likesCount,
            commentsCount: item.commentsCount,
            sharesCount: item.sharesCount,
            engagementScore: item.engagementScore,
            hashtags: item.hashtags,
            source: item.source,
            visibility: item.visibility,
            rawPayload: item.rawPayload,
            lastSyncedAt: item.lastSyncedAt,
          },
          $setOnInsert: {
            platform: safePlatform,
            postId: item.postId,
            status: defaultStatus,
            featured: false,
          },
        },
        upsert: true,
      },
    })),
  );

  const newCount = items.filter((item) => !existingSet.has(item.postId)).length;
  return {
    fetchedCount: items.length,
    newCount,
    updatedCount: items.length - newCount,
  };
}

export async function listSocialWallPostsForAdmin(options = {}) {
  await connectDB();
  const page = Math.max(1, toPositiveInt(options?.page, 1));
  const limit = clampNumber(toPositiveInt(options?.limit, 20), 1, SOCIAL_WALL_MAX_POST_LIMIT);
  const platform = toSafeString(options?.platform).toLowerCase();
  const status = normalizeStatus(options?.status, "");
  const featuredRaw = toSafeString(options?.featured).toLowerCase();
  const search = toSafeString(options?.search);
  const dateFrom = toDateOrNull(options?.dateFrom);
  const dateTo = toEndDateForRange(options?.dateTo);

  const query = {};
  if (platform) query.platform = platform;
  if (status) query.status = status;
  if (featuredRaw === "true" || featuredRaw === "1") query.featured = true;
  if (featuredRaw === "false" || featuredRaw === "0") query.featured = false;
  if (dateFrom || dateTo) {
    query.publishedAt = {
      ...(dateFrom ? { $gte: dateFrom } : {}),
      ...(dateTo ? { $lte: dateTo } : {}),
    };
  }
  if (search) {
    query.$or = [
      { caption: { $regex: search, $options: "i" } },
      { authorName: { $regex: search, $options: "i" } },
      { authorHandle: { $regex: search, $options: "i" } },
      { hashtags: { $elemMatch: { $regex: search, $options: "i" } } },
    ];
  }

  const total = await SocialWallPost.countDocuments(query);
  const items = await SocialWallPost.find(query)
    .sort({ publishedAt: -1, _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    items: items.map(toResponseItem),
  };
}

export async function updateSocialWallPostStatus(id, status, { actor = "", note = "" } = {}) {
  await connectDB();
  const safeStatus = normalizeStatus(status, "pending");
  const safeActor = toSafeString(actor);
  const safeNote = toSafeString(note);
  const existing = await SocialWallPost.findById(id).select("_id status").lean();
  if (!existing?._id) return null;
  const currentStatus = normalizeStatus(existing?.status, "pending");
  if (!isAllowedStatusTransition(currentStatus, safeStatus)) {
    throw new Error(`INVALID_STATUS_TRANSITION: ${currentStatus} -> ${safeStatus}`);
  }
  const now = new Date();
  const updated = await SocialWallPost.findByIdAndUpdate(
    id,
    {
      $set: {
        status: safeStatus,
        moderationNote: safeNote,
        moderatedBy: safeActor,
        moderatedAt: now,
      },
      $push: {
        moderationHistory: {
          action: `status:${safeStatus}`,
          performedBy: safeActor,
          performedAt: now,
          reason: safeNote,
        },
      },
    },
    { new: true },
  ).lean();
  return updated ? toResponseItem(updated) : null;
}

export async function updateSocialWallPostFeatured(id, featured, { actor = "" } = {}) {
  await connectDB();
  const safeActor = toSafeString(actor);
  const now = new Date();
  const updated = await SocialWallPost.findByIdAndUpdate(
    id,
    {
      $set: {
        featured: featured === true,
        moderatedBy: safeActor,
        moderatedAt: now,
      },
      $push: {
        moderationHistory: {
          action: featured === true ? "feature:on" : "feature:off",
          performedBy: safeActor,
          performedAt: now,
          reason: "",
        },
      },
    },
    { new: true },
  ).lean();
  return updated ? toResponseItem(updated) : null;
}

function sortByMode(rows = [], sortBy = "latest", sortOrder = "desc", platformOrderMap = new Map()) {
  const ordered = [...rows];
  if (sortBy === "engagement") {
    ordered.sort((a, b) => {
      const scoreDiff = (b.engagementScore || 0) - (a.engagementScore || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
    });
  } else if (sortBy === "platform-priority") {
    ordered.sort((a, b) => {
      const oa = platformOrderMap.get(a.platform) ?? 999;
      const ob = platformOrderMap.get(b.platform) ?? 999;
      if (oa !== ob) return oa - ob;
      return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
    });
  } else {
    ordered.sort((a, b) => {
      const ta = new Date(a.publishedAt || 0).getTime();
      const tb = new Date(b.publishedAt || 0).getTime();
      if (tb !== ta) return tb - ta;
      return String(b._id).localeCompare(String(a._id));
    });
  }
  if (sortOrder === "asc") ordered.reverse();
  return ordered;
}

export async function listSocialWallPublicFeed(options = {}) {
  await connectDB();
  const limit = clampNumber(
    toPositiveInt(options?.limit, SOCIAL_WALL_DEFAULT_POST_LIMIT),
    1,
    SOCIAL_WALL_MAX_POST_LIMIT,
  );
  const cursor = decodeCursor(options?.cursor);
  const featuredOnly = options?.featured === true || toSafeString(options?.featured) === "true";
  const platform = toSafeString(options?.platform).toLowerCase();
  const selectedPlatforms = Array.isArray(options?.platforms)
    ? options.platforms.map((item) => toSafeString(item).toLowerCase()).filter(Boolean)
    : [];
  const search = toSafeString(options?.search);
  const device = toSafeString(options?.device).toLowerCase();
  const sortBy = normalizeSortBy(options?.sortBy);
  const sortOrder = normalizeSortOrder(options?.sortOrder);

  const queryClauses = [{ status: "approved" }];
  if (device === "mobile") {
    queryClauses.push({ visibility: { $in: ["all", "mobile"] } });
  } else if (device === "desktop") {
    queryClauses.push({ visibility: { $in: ["all", "desktop"] } });
  } else {
    queryClauses.push({ visibility: { $ne: "none" } });
  }
  if (featuredOnly) queryClauses.push({ featured: true });
  if (platform) queryClauses.push({ platform });
  if (selectedPlatforms.length > 0) queryClauses.push({ platform: { $in: selectedPlatforms } });
  if (search) {
    queryClauses.push({
      $or: [
      { caption: { $regex: search, $options: "i" } },
      { authorName: { $regex: search, $options: "i" } },
      { authorHandle: { $regex: search, $options: "i" } },
      { hashtags: { $elemMatch: { $regex: search, $options: "i" } } },
      ],
    });
  }

  if (sortBy === "latest" && sortOrder === "desc" && cursor?.publishedAt && cursor?.id) {
    const cursorDate = toDateOrNull(cursor.publishedAt);
    const cursorObjectId = mongoose.Types.ObjectId.isValid(cursor.id)
      ? new mongoose.Types.ObjectId(cursor.id)
      : null;
    if (cursorDate) {
      queryClauses.push({
        $or: [
        { publishedAt: { $lt: cursorDate } },
        ...(cursorObjectId ? [{ publishedAt: cursorDate, _id: { $lt: cursorObjectId } }] : []),
        ],
      });
    }
  }

  const baseQuery =
    queryClauses.length === 1 ? queryClauses[0] : { $and: queryClauses };
  const fetchLimit =
    sortBy === "latest" && sortOrder === "desc"
      ? limit + 1
      : Math.max(limit * 4, limit + 1);
  const rawRows = await SocialWallPost.find(baseQuery)
    .sort({ publishedAt: -1, _id: -1 })
    .limit(fetchLimit)
    .lean();

  const platformRows = await getSocialWallPlatformConfigs({ includeSecrets: false });
  const platformOrderMap = new Map(
    platformRows.map((item) => [item.platform, toPositiveInt(item.displayOrder, 999)]),
  );
  const sortedRows = sortByMode(rawRows, sortBy, sortOrder, platformOrderMap);
  const sliced = sortedRows.slice(0, limit);

  let nextCursor = null;
  if (sortBy === "latest" && sortOrder === "desc" && rawRows.length > limit) {
    const last = sliced[sliced.length - 1];
    if (last?.publishedAt && last?._id) {
      nextCursor = encodeCursor({
        publishedAt: new Date(last.publishedAt).toISOString(),
        id: String(last._id),
      });
    }
  }

  return {
    items: sliced.map(toResponseItem),
    nextCursor,
  };
}

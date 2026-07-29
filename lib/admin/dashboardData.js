import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import Blog from "@/models/Blog";
import BlogComment from "@/models/BlogComment";
import Event from "@/models/Event";
import EventRegistration from "@/models/EventRegistration";
import Form from "@/models/Form";
import User from "@/models/User";
import {
  getConfiguredSuperAdminEmails,
  ROLE_KEYS,
} from "@/lib/rbac/constants";

const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVITY_DAYS = 7;
const RECENT_UPDATES_LIMIT = 6;

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function unwrapAggregate(result) {
  if (!Array.isArray(result) || !result.length || !result[0]) return null;
  return result[0];
}

async function safeRun(task, fallback) {
  try {
    return await task();
  } catch {
    return fallback;
  }
}

function normalizeText(value, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function toStableId(prefix, ...parts) {
  const base = parts
    .map((item) => String(item || "").trim().toLowerCase())
    .filter(Boolean)
    .join("-");
  const cleaned = base.replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-");
  return `${prefix}-${cleaned || "item"}`;
}

function mapRecentItems(items, moduleKey, moduleLabel, titleField, statusField) {
  const source = Array.isArray(items) ? items : [];

  return source
    .map((item) => {
      const activityDate = item?.updatedAt || item?.createdAt || null;
      const updatedIso = activityDate ? new Date(activityDate).toISOString() : null;
      const title = normalizeText(item?.[titleField], `Untitled ${moduleLabel}`);
      const statusRaw = item?.[statusField];
      const status = normalizeText(statusRaw, "updated").toLowerCase();

      return {
        id: toStableId(moduleKey, item?._id, updatedIso, title),
        moduleKey,
        moduleLabel,
        title,
        status,
        updatedAt: updatedIso,
      };
    })
    .filter((item) => item.updatedAt);
}

export async function getDashboardData() {
  const now = Date.now();
  const since7d = new Date(now - ACTIVITY_DAYS * DAY_MS);
  const superAdminEmails = getConfiguredSuperAdminEmails();

  let dbConnected = true;
  try {
    await connectDB();
  } catch {
    dbConnected = false;
  }

  const emptyModelSummary = { total: 0, published: 0 };
  const emptyPendingSummary = { total: 0, pending: 0 };
  const emptyRegistrationSummary = { total: 0, new: 0 };
  const emptyFormSummary = { total: 0, active: 0 };
  const emptyUserSummary = { total: 0, newUsers7d: 0 };

  let kpis = [
    {
      key: "pages",
      label: "Pages",
      value: 0,
      restricted: false,
      chipLabel: "Published",
      chipValue: 0,
    },
    {
      key: "blogs",
      label: "Blog Posts",
      value: 0,
      restricted: false,
      chipLabel: "Published",
      chipValue: 0,
    },
    {
      key: "blogComments",
      label: "Blog Comments",
      value: 0,
      restricted: false,
      chipLabel: "Pending",
      chipValue: 0,
    },
    {
      key: "events",
      label: "Events",
      value: 0,
      restricted: false,
      chipLabel: "Published",
      chipValue: 0,
    },
    {
      key: "eventRegistrations",
      label: "Event Registrations",
      value: 0,
      restricted: false,
      chipLabel: "New",
      chipValue: 0,
    },
    {
      key: "users",
      label: "Users",
      value: 0,
      restricted: false,
      chipLabel: "New Users",
      chipValue: 0,
    },
    {
      key: "forms",
      label: "Forms",
      value: 0,
      restricted: false,
      chipLabel: "Active",
      chipValue: 0,
    },
  ];

  let recentUpdates = [];

  if (dbConnected) {
    const [
      pagesAgg,
      blogsAgg,
      blogCommentsAgg,
      eventsAgg,
      eventRegistrationsAgg,
      formsAgg,
      usersAgg,
      recentPages,
      recentBlogs,
      recentEvents,
      recentForms,
    ] = await Promise.all([
      safeRun(
        () =>
          Page.aggregate([
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                published: {
                  $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
                },
              },
            },
          ]),
        [],
      ),
      safeRun(
        () =>
          Blog.aggregate([
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                published: {
                  $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
                },
              },
            },
          ]),
        [],
      ),
      safeRun(
        () =>
          BlogComment.aggregate([
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                pending: {
                  $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
                },
              },
            },
          ]),
        [],
      ),
      safeRun(
        () =>
          Event.aggregate([
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                published: {
                  $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
                },
              },
            },
          ]),
        [],
      ),
      safeRun(
        () =>
          EventRegistration.aggregate([
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                new: {
                  $sum: { $cond: [{ $eq: ["$status", "new"] }, 1, 0] },
                },
              },
            },
          ]),
        [],
      ),
      safeRun(
        () =>
          Form.aggregate([
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: {
                  $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
                },
                updated7d: {
                  $sum: { $cond: [{ $gte: ["$updatedAt", since7d] }, 1, 0] },
                },
              },
            },
          ]),
        [],
      ),
      safeRun(
        () =>
          User.aggregate([
            {
              $match: {
                status: "active",
                roleKey: { $ne: ROLE_KEYS.SUPER_ADMIN },
                role: {
                  $not: /^\s*super[\s_-]*admin\s*$/i,
                },
                email: { $nin: superAdminEmails },
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                newUsers7d: {
                  $sum: { $cond: [{ $gte: ["$createdAt", since7d] }, 1, 0] },
                },
              },
            },
          ]),
        [],
      ),
      safeRun(
        () =>
          Page.find({})
            .sort({ updatedAt: -1 })
            .limit(RECENT_UPDATES_LIMIT)
            .select("title status updatedAt createdAt")
            .lean(),
        [],
      ),
      safeRun(
        () =>
          Blog.find({})
            .sort({ updatedAt: -1 })
            .limit(RECENT_UPDATES_LIMIT)
            .select("title status updatedAt createdAt")
            .lean(),
        [],
      ),
      safeRun(
        () =>
          Event.find({})
            .sort({ updatedAt: -1 })
            .limit(RECENT_UPDATES_LIMIT)
            .select("title status updatedAt createdAt")
            .lean(),
        [],
      ),
      safeRun(
        () =>
          Form.find({})
            .sort({ updatedAt: -1 })
            .limit(RECENT_UPDATES_LIMIT)
            .select("name status updatedAt createdAt")
            .lean(),
        [],
      ),
    ]);

    const pageSummary = {
      ...emptyModelSummary,
      ...(unwrapAggregate(pagesAgg) || {}),
    };
    const blogSummary = {
      ...emptyModelSummary,
      ...(unwrapAggregate(blogsAgg) || {}),
    };
    const blogCommentSummary = {
      ...emptyPendingSummary,
      ...(unwrapAggregate(blogCommentsAgg) || {}),
    };
    const eventSummary = {
      ...emptyModelSummary,
      ...(unwrapAggregate(eventsAgg) || {}),
    };
    const eventRegistrationSummary = {
      ...emptyRegistrationSummary,
      ...(unwrapAggregate(eventRegistrationsAgg) || {}),
    };

    const formRow = unwrapAggregate(formsAgg);
    const formSummary = {
      ...emptyFormSummary,
      total: toNumber(formRow?.total),
      active: toNumber(formRow?.active),
    };

    const usersRow = unwrapAggregate(usersAgg);
    const userSummary = {
      ...emptyUserSummary,
      total: toNumber(usersRow?.total),
      newUsers7d: toNumber(usersRow?.newUsers7d),
    };

    kpis = [
      {
        key: "pages",
        label: "Pages",
        value: toNumber(pageSummary.total),
        restricted: false,
        chipLabel: "Published",
        chipValue: toNumber(pageSummary.published),
      },
      {
        key: "blogs",
        label: "Blog Posts",
        value: toNumber(blogSummary.total),
        restricted: false,
        chipLabel: "Published",
        chipValue: toNumber(blogSummary.published),
      },
      {
        key: "blogComments",
        label: "Blog Comments",
        value: toNumber(blogCommentSummary.total),
        restricted: false,
        chipLabel: "Pending",
        chipValue: toNumber(blogCommentSummary.pending),
      },
      {
        key: "events",
        label: "Events",
        value: toNumber(eventSummary.total),
        restricted: false,
        chipLabel: "Published",
        chipValue: toNumber(eventSummary.published),
      },
      {
        key: "eventRegistrations",
        label: "Event Registrations",
        value: toNumber(eventRegistrationSummary.total),
        restricted: false,
        chipLabel: "New",
        chipValue: toNumber(eventRegistrationSummary.new),
      },
      {
        key: "users",
        label: "Users",
        value: toNumber(userSummary.total),
        restricted: false,
        chipLabel: "New Users",
        chipValue: toNumber(userSummary.newUsers7d),
      },
      {
        key: "forms",
        label: "Forms",
        value: toNumber(formSummary.total),
        restricted: false,
        chipLabel: "Active",
        chipValue: toNumber(formSummary.active),
      },
    ];

    recentUpdates = [
      ...mapRecentItems(recentPages, "pages", "Pages", "title", "status"),
      ...mapRecentItems(recentBlogs, "blogs", "Blogs", "title", "status"),
      ...mapRecentItems(recentEvents, "events", "Events", "title", "status"),
      ...mapRecentItems(recentForms, "forms", "Forms", "name", "status"),
    ]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, RECENT_UPDATES_LIMIT);
  }

  return {
    generatedAt: new Date().toISOString(),
    dbConnected,
    kpis,
    recentUpdates,
  };
}

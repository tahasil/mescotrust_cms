import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import Blog from "@/models/Blog";
import Event from "@/models/Event";
import Form from "@/models/Form";
import User from "@/models/User";
import { normalizeRole } from "@/lib/permissions";

const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVITY_DAYS = 7;
const RECENT_UPDATES_LIMIT = 6;

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getAccessByRole(role) {
  const normalized = normalizeRole(role);
  const isAdmin = normalized === "Admin";
  const isEditor = normalized === "Editor";
  const isAuthor = normalized === "Author";

  return {
    pages: isAdmin || isEditor,
    blogs: isAdmin || isEditor || isAuthor,
    events: isAdmin || isEditor || isAuthor,
    forms: isAdmin || isEditor,
    users: isAdmin,
  };
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

export async function getDashboardData(userRole = "") {
  const now = Date.now();
  const since7d = new Date(now - ACTIVITY_DAYS * DAY_MS);
  const access = getAccessByRole(userRole);

  let dbConnected = true;
  try {
    await connectDB();
  } catch {
    dbConnected = false;
  }

  const emptyModelSummary = { total: 0, published: 0 };
  const emptyFormSummary = { total: 0, active: 0 };
  const emptyUserSummary = { total: 0, newUsers7d: 0 };

  let kpis = [
    {
      key: "pages",
      label: "Pages",
      value: 0,
      restricted: !access.pages,
      chipLabel: "Published",
      chipValue: 0,
    },
    {
      key: "blogs",
      label: "Posts",
      value: 0,
      restricted: !access.blogs,
      chipLabel: "Published",
      chipValue: 0,
    },
    {
      key: "users",
      label: "Users",
      value: 0,
      restricted: !access.users,
      chipLabel: "New Users",
      chipValue: 0,
    },
    {
      key: "forms",
      label: "Forms",
      value: 0,
      restricted: !access.forms,
      chipLabel: "Active",
      chipValue: 0,
    },
  ];

  let recentUpdates = [];

  if (dbConnected) {
    const [
      pagesAgg,
      blogsAgg,
      formsAgg,
      usersAgg,
      recentPages,
      recentBlogs,
      recentEvents,
      recentForms,
    ] = await Promise.all([
      access.pages
        ? safeRun(
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
          )
        : [],
      access.blogs
        ? safeRun(
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
          )
        : [],
      access.forms
        ? safeRun(
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
          )
        : [],
      access.users
        ? safeRun(
            () =>
              User.aggregate([
                { $match: { status: "active" } },
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
          )
        : [],
      access.pages
        ? safeRun(
            () =>
              Page.find({})
                .sort({ updatedAt: -1 })
                .limit(RECENT_UPDATES_LIMIT)
                .select("title status updatedAt createdAt")
                .lean(),
            [],
          )
        : [],
      access.blogs
        ? safeRun(
            () =>
              Blog.find({})
                .sort({ updatedAt: -1 })
                .limit(RECENT_UPDATES_LIMIT)
                .select("title status updatedAt createdAt")
                .lean(),
            [],
          )
        : [],
      access.events
        ? safeRun(
            () =>
              Event.find({})
                .sort({ updatedAt: -1 })
                .limit(RECENT_UPDATES_LIMIT)
                .select("title status updatedAt createdAt")
                .lean(),
            [],
          )
        : [],
      access.forms
        ? safeRun(
            () =>
              Form.find({})
                .sort({ updatedAt: -1 })
                .limit(RECENT_UPDATES_LIMIT)
                .select("name status updatedAt createdAt")
                .lean(),
            [],
          )
        : [],
    ]);

    const pageSummary = access.pages
      ? { ...emptyModelSummary, ...(unwrapAggregate(pagesAgg) || {}) }
      : emptyModelSummary;
    const blogSummary = access.blogs
      ? { ...emptyModelSummary, ...(unwrapAggregate(blogsAgg) || {}) }
      : emptyModelSummary;

    const formRow = unwrapAggregate(formsAgg);
    const formSummary = access.forms
      ? {
          ...emptyFormSummary,
          total: toNumber(formRow?.total),
          active: toNumber(formRow?.active),
        }
      : emptyFormSummary;

    const usersRow = unwrapAggregate(usersAgg);
    const userSummary = access.users
      ? {
          ...emptyUserSummary,
          total: toNumber(usersRow?.total),
          newUsers7d: toNumber(usersRow?.newUsers7d),
        }
      : emptyUserSummary;

    kpis = [
      {
        key: "pages",
        label: "Pages",
        value: toNumber(pageSummary.total),
        restricted: !access.pages,
        chipLabel: "Published",
        chipValue: toNumber(pageSummary.published),
      },
      {
        key: "blogs",
        label: "Posts",
        value: toNumber(blogSummary.total),
        restricted: !access.blogs,
        chipLabel: "Published",
        chipValue: toNumber(blogSummary.published),
      },
      {
        key: "users",
        label: "Users",
        value: toNumber(userSummary.total),
        restricted: !access.users,
        chipLabel: "New Users",
        chipValue: toNumber(userSummary.newUsers7d),
      },
      {
        key: "forms",
        label: "Forms",
        value: toNumber(formSummary.total),
        restricted: !access.forms,
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

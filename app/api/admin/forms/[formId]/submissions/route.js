import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Form from "@/models/Form";
import FormSubmission from "@/models/FormSubmission";
import { canAccessFormBuilder } from "@/lib/forms/access";

function normalizeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseBooleanFilter(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return null;
}

function parseDate(value, { endOfDay = false } = {}) {
  if (!value) return null;
  const raw = normalizeText(value);
  const date = new Date(raw);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    if (endOfDay) date.setUTCHours(23, 59, 59, 999);
    else date.setUTCHours(0, 0, 0, 0);
  }
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseQuery(url) {
  const { searchParams } = new URL(url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
  const search = normalizeText(searchParams.get("search"));
  const isRead = parseBooleanFilter(searchParams.get("isRead") || "all");
  let dateFrom = parseDate(searchParams.get("dateFrom"));
  let dateTo = parseDate(searchParams.get("dateTo"), { endOfDay: true });
  if (dateFrom && dateTo && dateFrom > dateTo) {
    [dateFrom, dateTo] = [dateTo, dateFrom];
  }
  const sort = normalizeText(searchParams.get("sort") || "createdAt_desc");
  return {
    page,
    limit,
    search,
    isRead,
    dateFrom,
    dateTo,
    sort,
  };
}

function toListItem(doc) {
  return {
    _id: doc._id,
    formId: doc.formId,
    isRead: Boolean(doc.isRead),
    createdAt: doc.createdAt,
    source: doc.source || "",
    pagePath: doc.pagePath || "",
    payloadByFieldNameSnapshot: doc.payloadByFieldNameSnapshot || {},
  };
}

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canAccessFormBuilder(session)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  try {
    await connectDB();

    const formId = normalizeText(params?.formId);
    if (!formId) {
      return NextResponse.json({ error: "formId is required" }, { status: 400 });
    }

    const form = await Form.findOne({ formId }, { _id: 1, name: 1, formId: 1 }).lean();
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const { page, limit, search, isRead, dateFrom, dateTo, sort } = parseQuery(req.url);
    const filter = { formId };

    if (typeof isRead === "boolean") {
      filter.isRead = isRead;
    }
    if (search) {
      filter.searchText = { $regex: escapeRegex(search), $options: "i" };
    }
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = dateFrom;
      if (dateTo) filter.createdAt.$lte = dateTo;
    }

    const sortOrder = sort === "createdAt_asc" ? 1 : -1;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      FormSubmission.find(
        filter,
        {
          _id: 1,
          formId: 1,
          isRead: 1,
          createdAt: 1,
          source: 1,
          pagePath: 1,
          payloadByFieldNameSnapshot: 1,
        },
      )
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      FormSubmission.countDocuments(filter),
    ]);

    return NextResponse.json(
      {
        form: {
          formId: form.formId,
          name: form.name,
        },
        items: (items || []).map(toListItem),
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to load form submissions" },
      { status: 500 },
    );
  }
}

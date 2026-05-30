import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { canAccessFormBuilder } from "@/lib/formBuilder/permissions";
import { normalizeFormId } from "@/lib/formBuilder/shortcode";
import Form from "@/models/Form";
import FormSubmission from "@/models/FormSubmission";

function noStoreJson(payload, init = {}) {
  return NextResponse.json(payload, {
    ...init,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      ...(init.headers || {}),
    },
  });
}

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canAccessFormBuilder(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const search = String(searchParams.get("search") || "").trim();
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const formId = normalizeFormId(searchParams.get("formId"));

    const query = {};
    if (formId) query.formId = formId;
    if (unreadOnly) query.isRead = false;
    if (search) query.searchableText = { $regex: search, $options: "i" };

    const [items, total, forms] = await Promise.all([
      FormSubmission.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      FormSubmission.countDocuments(query),
      Form.find({}).select("formId name").lean(),
    ]);

    const formById = Object.fromEntries((forms || []).map((form) => [form.formId, form]));
    const decoratedItems = (items || []).map((item) => ({
      ...item,
      formName: formById[item.formId]?.name || "",
    }));

    return noStoreJson({
      items: decoratedItems,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      limit,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to load form submissions" },
      { status: 500 },
    );
  }
}


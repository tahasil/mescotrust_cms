import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Form from "@/models/Form";
import { canAccessFormBuilder } from "@/lib/forms/access";
import { FORM_DEFAULTS, FORM_STATUS_VALUES } from "@/lib/forms/constants";
import { createDefaultFormSchema, validateAndNormalizeFormSchema } from "@/lib/forms/schemaValidation";
import { generateUniqueShortcode, getNextFormId, getShortcodeAltFromFormId } from "@/lib/forms/id";

function toListItem(doc) {
  return {
    _id: doc._id,
    formId: doc.formId,
    name: doc.name,
    status: doc.status,
    shortcode: doc.shortcode,
    shortcodeAlt: doc.shortcodeAlt || "",
    schemaVersion: doc.schemaVersion,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function parseQuery(reqUrl) {
  const { searchParams } = new URL(reqUrl);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
  const search = String(searchParams.get("search") || "").trim();
  const status = String(searchParams.get("status") || "").trim();
  return { page, limit, search, status };
}

function buildFilter({ search, status }) {
  const filter = {};
  if (status && FORM_STATUS_VALUES.includes(status)) filter.status = status;
  if (search) {
    filter.$or = [
      { formId: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
      { shortcode: { $regex: search, $options: "i" } },
      { shortcodeAlt: { $regex: search, $options: "i" } },
    ];
  }
  return filter;
}

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canAccessFormBuilder(session)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  try {
    await connectDB();
    const { page, limit, search, status } = parseQuery(req.url);
    const filter = buildFilter({ search, status });
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Form.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Form.countDocuments(filter),
    ]);

    return NextResponse.json({
      items: items.map(toListItem),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to list forms" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canAccessFormBuilder(session)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const name = String(body?.name || "").trim() || FORM_DEFAULTS.name;
    const providedSchema = body?.schema || body?.formSchema;

    const normalized = providedSchema
      ? validateAndNormalizeFormSchema(providedSchema)
      : { valid: true, schema: createDefaultFormSchema(), errors: [] };
    if (!normalized.valid) {
      return NextResponse.json({ error: normalized.errors.join("; ") }, { status: 400 });
    }

    let lastError = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const formId = await getNextFormId();
        const requestedShortcode = String(body?.shortcode || "").trim();
        const shortcode = await generateUniqueShortcode(requestedShortcode || name || formId);
        const shortcodeAlt = getShortcodeAltFromFormId(formId);

        const created = await Form.create({
          formId,
          name,
          submitLabel: FORM_DEFAULTS.submitLabel,
          successMessage: FORM_DEFAULTS.successMessage,
          status: "draft",
          shortcode,
          shortcodeAlt,
          formSchema: normalized.schema,
          schemaVersion: 1,
          createdBy: String(session?.id || ""),
          updatedBy: String(session?.id || ""),
        });

        return NextResponse.json(toListItem(created.toObject()), { status: 201 });
      } catch (err) {
        lastError = err;
        if (err?.code !== 11000) throw err;
      }
    }

    return NextResponse.json(
      { error: lastError?.message || "Failed to create form after retries" },
      { status: 500 },
    );
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to create form" }, { status: 500 });
  }
}

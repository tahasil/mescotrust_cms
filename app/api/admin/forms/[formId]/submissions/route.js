import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Form from "@/models/Form";
import FormSubmission from "@/models/FormSubmission";
import { canAccessFormBuilder } from "@/lib/forms/access";
import {
  buildSubmissionExportColumns,
  buildSubmissionFilter,
  buildSubmissionSnapshot,
  getOrderedFormQuestions,
  getQuestionLabel,
  getSubmissionSortOrder,
  normalizeDateRange,
  normalizeText,
  parseBooleanFilter,
  parseDate,
  parseSubmissionSort,
  resolveSnapshotQuestions,
} from "@/lib/forms/submissionUtils";

function parseQuery(url) {
  const { searchParams } = new URL(url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
  const search = normalizeText(searchParams.get("search"));
  const isRead = parseBooleanFilter(searchParams.get("isRead") || "all");

  const parsedFrom = parseDate(searchParams.get("dateFrom"));
  const parsedTo = parseDate(searchParams.get("dateTo"), { endOfDay: true });
  const { dateFrom, dateTo } = normalizeDateRange(parsedFrom, parsedTo);

  const sort = parseSubmissionSort(searchParams.get("sort"));
  return { page, limit, search, isRead, dateFrom, dateTo, sort };
}

function toListItem(doc, snapshotQuestions) {
  return {
    _id: doc._id,
    formId: doc.formId,
    isRead: Boolean(doc.isRead),
    createdAt: doc.createdAt,
    source: doc.source || "",
    pagePath: doc.pagePath || "",
    payloadByFieldNameSnapshot: doc.payloadByFieldNameSnapshot || {},
    snapshot: buildSubmissionSnapshot(doc, snapshotQuestions),
  };
}

function buildSnapshotColumns(snapshotQuestions) {
  const [primary, secondary] = Array.isArray(snapshotQuestions) ? snapshotQuestions : [];
  return {
    primary: {
      key: normalizeText(primary?.fieldKey),
      label: primary ? getQuestionLabel(primary, "Column 1") : "Column 1",
    },
    secondary: {
      key: normalizeText(secondary?.fieldKey),
      label: secondary ? getQuestionLabel(secondary, "Column 2") : "Column 2",
    },
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

    const form = await Form.findOne(
      { formId },
      {
        _id: 1,
        name: 1,
        formId: 1,
        "formSchema.questions.fieldKey": 1,
        "formSchema.questions.fieldName": 1,
        "formSchema.questions.label": 1,
        "formSchema.questions.type": 1,
        "formSchema.questions.order": 1,
      },
    ).lean();
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const { page, limit, search, isRead, dateFrom, dateTo, sort } = parseQuery(req.url);
    const filter = buildSubmissionFilter({ formId, isRead, search, dateFrom, dateTo });
    const sortOrder = getSubmissionSortOrder(sort);
    const skip = (page - 1) * limit;

    const questions = getOrderedFormQuestions(form.formSchema);
    const snapshotQuestions = resolveSnapshotQuestions(questions);
    const exportColumns = buildSubmissionExportColumns(questions);

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
          payloadByFieldKey: 1,
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
          snapshotColumns: buildSnapshotColumns(snapshotQuestions),
          exportColumns: exportColumns.map((column) => ({
            key: column.key,
            label: column.label,
          })),
        },
        items: (items || []).map((item) => toListItem(item, snapshotQuestions)),
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

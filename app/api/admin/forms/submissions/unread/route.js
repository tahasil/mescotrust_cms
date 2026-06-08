import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import Form from "@/models/Form";
import { canAccessFormBuilder } from "@/lib/forms/access";

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canAccessFormBuilder(session)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10));

    const items = await FormSubmission.find(
      { isRead: false, isDeleted: { $ne: true } },
      {
        _id: 1,
        formId: 1,
        isRead: 1,
        createdAt: 1,
        payloadByFieldNameSnapshot: 1,
      },
    )
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const formIds = [...new Set((items || []).map((item) => String(item.formId || "").trim()).filter(Boolean))];
    const forms = formIds.length
      ? await Form.find({ formId: { $in: formIds } }, { _id: 0, formId: 1, name: 1 }).lean()
      : [];
    const formNameById = new Map((forms || []).map((form) => [form.formId, form.name || ""]));

    return NextResponse.json({
      items: (items || []).map((item) => ({
        _id: item._id,
        formId: item.formId,
        formName: formNameById.get(item.formId) || "",
        isRead: item.isRead,
        createdAt: item.createdAt,
        payloadByFieldNameSnapshot: item.payloadByFieldNameSnapshot || {},
      })),
      limit,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch unread form submissions" },
      { status: 500 },
    );
  }
}

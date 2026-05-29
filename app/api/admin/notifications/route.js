import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import ContactSubmission from "@/models/ContactSubmission";
import Form from "@/models/Form";
import { isContactSubmissionIdentifier } from "@/lib/contactSubmissionIdentifiers";

export async function GET(req) {
  const session = await requirePermission(req, "dashboard.view");
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit")) || 10));

    await connectDB();

    const [contacts, formSubmissions] = await Promise.all([
      ContactSubmission.find({ isRead: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select({ _id: 1, createdAt: 1, payload: 1 })
      .lean(),
      Form.aggregate([
        { $unwind: "$submissions" },
        { $match: { "submissions.isRead": { $ne: true } } },
        { $sort: { "submissions.submittedAt": -1 } },
        { $limit: limit },
        {
          $project: {
            _id: "$submissions._id",
            formKey: 1,
            formName: "$name",
            submittedAt: "$submissions.submittedAt",
            payload: "$submissions.payload",
          },
        },
      ]),
    ]);

    const contactItems = (Array.isArray(contacts) ? contacts : []).map((c) => ({
      id: c._id,
      type: "contact",
      title: `New message from ${c?.payload?.name || "Unknown"}`,
      time: c.createdAt,
      link: "/admin/contacts",
    }));

    const formItems = (Array.isArray(formSubmissions) ? formSubmissions : []).map((s) => {
      const formIdentifier = String(s?.formName || s?.formKey || "");
      const link = isContactSubmissionIdentifier(formIdentifier)
        ? "/admin/contacts"
        : `/admin/submission/${encodeURIComponent(formIdentifier)}`;
      return {
        id: s._id,
        type: "form",
        title: `New ${s?.formName || "form"} submission from ${s?.payload?.name || "Unknown"}`,
        time: s?.submittedAt,
        link,
      };
    });

    const items = [...contactItems, ...formItems]
      .sort((a, b) => new Date(b?.time || 0).getTime() - new Date(a?.time || 0).getTime())
      .slice(0, limit);

    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

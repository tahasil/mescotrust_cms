import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Form from "@/models/Form";

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeIdentifier(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const plusNormalized = raw.replace(/\+/g, " ");
  try {
    return decodeURIComponent(plusNormalized);
  } catch {
    return plusNormalized;
  }
}

function buildIdentifierCandidates(value) {
  const raw = String(value || "").trim();
  const decodedOnce = decodeIdentifier(raw);
  const decodedTwice = decodeIdentifier(decodedOnce);
  return Array.from(
    new Set([raw, decodedOnce, decodedTwice].map((item) => String(item || "").trim()).filter(Boolean)),
  );
}

export async function GET(req) {
  const session = await requirePermission(req, "submissions.view");
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const formKey = String(searchParams.get("formKey") || "").trim();
    const rawFormIdentifier = String(searchParams.get("form") || "").trim() || formKey;
    if (!rawFormIdentifier) {
      return NextResponse.json({ error: "form identifier is required" }, { status: 400 });
    }
    const identifierCandidates = buildIdentifierCandidates(rawFormIdentifier);

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));

    await connectDB();
    const escapedCandidates = identifierCandidates.map((item) => escapeRegex(item));

    let form = await Form.findOne({ formKey: { $in: identifierCandidates } })
      .select({ name: 1, formKey: 1, submissions: 1 })
      .lean();

    if (!form) {
      form = await Form.findOne({ name: { $in: identifierCandidates } })
        .select({ name: 1, formKey: 1, submissions: 1 })
        .lean();
    }

    if (!form && escapedCandidates.length) {
      form = await Form.findOne({
        $or: escapedCandidates.map((escapedIdentifier) => ({
          name: { $regex: `^${escapedIdentifier}$`, $options: "i" },
        })),
      })
        .select({ name: 1, formKey: 1, submissions: 1 })
        .lean();
    }

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const submissions = Array.isArray(form.submissions) ? form.submissions : [];
    const sorted = submissions
      .slice()
      .sort((a, b) => new Date(b?.submittedAt || 0).getTime() - new Date(a?.submittedAt || 0).getTime());

    const total = sorted.length;
    const skip = (page - 1) * limit;
    const items = sorted.slice(skip, skip + limit);

    return NextResponse.json({
      form: { name: form.name, formKey: form.formKey },
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to load submissions" }, { status: 500 });
  }
}

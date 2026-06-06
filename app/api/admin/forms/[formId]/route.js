import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Form from "@/models/Form";
import FormSubmission from "@/models/FormSubmission";
import { canAccessFormBuilder } from "@/lib/forms/access";
import { FORM_DEFAULTS } from "@/lib/forms/constants";

function toDetail(doc) {
  const schema = doc.formSchema || { sections: [], questions: [] };
  return {
    _id: doc._id,
    formId: doc.formId,
    name: doc.name,
    submitLabel: String(doc.submitLabel || FORM_DEFAULTS.submitLabel),
    successMessage: String(doc.successMessage || FORM_DEFAULTS.successMessage),
    status: doc.status,
    shortcode: doc.shortcode,
    shortcodeAlt: doc.shortcodeAlt || "",
    schema,
    formSchema: schema,
    schemaVersion: doc.schemaVersion,
    createdBy: doc.createdBy || "",
    updatedBy: doc.updatedBy || "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
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
    const form = await Form.findOne({ formId: params.formId }).lean();
    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
    return NextResponse.json(toDetail(form));
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to fetch form" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canAccessFormBuilder(session)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  try {
    await connectDB();
    const form = await Form.findOne({ formId: params.formId });
    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    const body = await req.json();
    if (body?.formId || body?.shortcode || body?.shortcodeAlt) {
      return NextResponse.json(
        { error: "formId/shortcode values are immutable and cannot be changed" },
        { status: 400 },
      );
    }
    if (body?.status) {
      return NextResponse.json(
        { error: "Use lifecycle endpoints to change status" },
        { status: 400 },
      );
    }
    if (body?.schema || body?.formSchema) {
      return NextResponse.json(
        { error: "Use /api/admin/forms/[formId]/schema to update schema" },
        { status: 400 },
      );
    }

    const nextName = String(body?.name || form.name || "").trim();
    if (!nextName) return NextResponse.json({ error: "name is required" }, { status: 400 });
    const nextSubmitLabel = String(
      body?.submitLabel ?? form.submitLabel ?? FORM_DEFAULTS.submitLabel,
    ).trim();
    const nextSuccessMessage = String(
      body?.successMessage ?? form.successMessage ?? FORM_DEFAULTS.successMessage,
    ).trim();

    if (!nextSubmitLabel) {
      return NextResponse.json({ error: "submitLabel is required" }, { status: 400 });
    }
    if (!nextSuccessMessage) {
      return NextResponse.json({ error: "successMessage is required" }, { status: 400 });
    }

    form.name = nextName;
    form.submitLabel = nextSubmitLabel;
    form.successMessage = nextSuccessMessage;
    form.updatedBy = String(session?.id || "");
    await form.save();

    return NextResponse.json(toDetail(form.toObject()));
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to update form" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canAccessFormBuilder(session)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  try {
    await connectDB();
    const form = await Form.findOne({ formId: params.formId }, { _id: 1, formId: 1 }).lean();
    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    const submissionsCount = await FormSubmission.countDocuments({ formId: params.formId });
    if (submissionsCount > 0) {
      return NextResponse.json(
        { error: "This form has submissions. Archive the form instead of deleting.", submissionsCount },
        { status: 409 },
      );
    }

    await Form.deleteOne({ _id: form._id });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to delete form" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Form from "@/models/Form";
import { canAccessFormBuilder } from "@/lib/forms/access";
import { validateAndNormalizeFormSchema } from "@/lib/forms/schemaValidation";

function stableJson(value) {
  return JSON.stringify(value ?? {});
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
    const inputSchema = body?.schema || body?.formSchema;
    if (!inputSchema || typeof inputSchema !== "object") {
      return NextResponse.json({ error: "schema is required" }, { status: 400 });
    }

    const normalized = validateAndNormalizeFormSchema(inputSchema);
    if (!normalized.valid) {
      return NextResponse.json({ error: normalized.errors.join("; ") }, { status: 400 });
    }

    const previous = stableJson(form.formSchema);
    const next = stableJson(normalized.schema);
    form.formSchema = normalized.schema;
    form.updatedBy = String(session?.id || "");
    if (previous !== next) {
      form.schemaVersion = Number(form.schemaVersion || 1) + 1;
    }
    await form.save();

    return NextResponse.json({
      formId: form.formId,
      schemaVersion: form.schemaVersion,
      schema: form.formSchema,
      formSchema: form.formSchema,
      updatedAt: form.updatedAt,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to update schema" }, { status: 500 });
  }
}

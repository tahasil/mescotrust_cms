import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Form from "@/models/Form";
import { FORM_DEFAULTS } from "@/lib/forms/constants";

function toPublicForm(doc) {
  const formSchema = doc?.formSchema || { sections: [], questions: [] };
  return {
    formId: doc.formId,
    name: doc.name,
    shortcode: doc.shortcode,
    schemaVersion: doc.schemaVersion,
    status: doc.status,
    schema: formSchema,
    formSchema,
    defaults: {
      submitLabel: String(doc?.submitLabel || FORM_DEFAULTS.submitLabel),
      successMessage: String(doc?.successMessage || FORM_DEFAULTS.successMessage),
    },
  };
}

export async function GET(req, { params }) {
  try {
    await connectDB();
    const formId = String(params?.formId || "").trim();
    if (!formId) {
      return NextResponse.json({ error: "formId is required" }, { status: 400 });
    }

    const form = await Form.findOne(
      { formId, status: "published" },
      {
        _id: 0,
        formId: 1,
        name: 1,
        status: 1,
        shortcode: 1,
        schemaVersion: 1,
        submitLabel: 1,
        successMessage: 1,
        formSchema: 1,
      },
    ).lean();

    if (!form) {
      return NextResponse.json({ error: "Form not found or not published" }, { status: 404 });
    }

    return NextResponse.json(toPublicForm(form), {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to load form" }, { status: 500 });
  }
}

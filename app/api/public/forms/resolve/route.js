import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Form from "@/models/Form";
import { FORM_DEFAULTS } from "@/lib/forms/constants";

function toResolvedForm(doc) {
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

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const shortcode = String(searchParams.get("shortcode") || "")
      .trim()
      .toLowerCase();
    if (!shortcode) {
      return NextResponse.json({ error: "shortcode is required" }, { status: 400 });
    }

    const form = await Form.findOne(
      {
        status: "published",
        $or: [{ shortcode }, { shortcodeAlt: shortcode }],
      },
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

    return NextResponse.json(toResolvedForm(form), {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to resolve form" }, { status: 500 });
  }
}

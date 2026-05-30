import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { FORM_STATUS } from "@/lib/formBuilder/constants";
import { normalizeFormId } from "@/lib/formBuilder/shortcode";
import { getFormBundle } from "@/lib/formBuilder/service";

function noStoreJson(payload, init = {}) {
  return NextResponse.json(payload, {
    ...init,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      ...(init.headers || {}),
    },
  });
}

function runtimeBlockedResponse(form, configuration) {
  if (form.status === FORM_STATUS.DRAFT) {
    return NextResponse.json(
      { error: "This form is not published yet." },
      { status: 403 },
    );
  }
  if (form.status === FORM_STATUS.ARCHIVED && configuration?.allowArchivedRender !== true) {
    return NextResponse.json(
      { error: "This form has been archived." },
      { status: 403 },
    );
  }
  return null;
}

export async function GET(req, { params }) {
  try {
    await connectDB();
    const formId = normalizeFormId(params.formId);
    if (!formId) return NextResponse.json({ error: "Invalid formId" }, { status: 400 });

    const bundle = await getFormBundle(formId);
    if (!bundle) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    const blocked = runtimeBlockedResponse(bundle.form, bundle.configuration);
    if (blocked) return blocked;

    return noStoreJson({
      form: {
        formId: bundle.form.formId,
        name: bundle.form.name,
        status: bundle.form.status,
        shortcode: bundle.form.shortcode,
        shortcodeAlt: bundle.form.shortcodeAlt,
      },
      fields: bundle.fields,
      configuration: bundle.configuration,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to load form" },
      { status: 500 },
    );
  }
}


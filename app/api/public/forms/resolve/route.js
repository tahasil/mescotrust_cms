import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Form from "@/models/Form";
import { FORM_DEFAULTS } from "@/lib/forms/constants";

function normalizeSubmissionSettings(input) {
  const source = input && typeof input === "object" ? input : {};
  const submitButtonAlignment = String(source.submitButtonAlignment || "").trim().toLowerCase();
  const normalizedSubmitButtonAlignment =
    submitButtonAlignment === "center" || submitButtonAlignment === "right"
      ? submitButtonAlignment
      : FORM_DEFAULTS.submissionSettings.submitButtonAlignment;
  return {
    resetOnSuccess:
      source.resetOnSuccess == null
        ? FORM_DEFAULTS.submissionSettings.resetOnSuccess
        : Boolean(source.resetOnSuccess),
    notifyOnSuccess:
      source.notifyOnSuccess == null
        ? FORM_DEFAULTS.submissionSettings.notifyOnSuccess
        : Boolean(source.notifyOnSuccess),
    notifyOnError:
      source.notifyOnError == null
        ? FORM_DEFAULTS.submissionSettings.notifyOnError
        : Boolean(source.notifyOnError),
    submitButtonAlignment: normalizedSubmitButtonAlignment,
  };
}

function normalizeStyleSettings(input) {
  const source = input && typeof input === "object" ? input : {};
  const defaults = FORM_DEFAULTS.styleSettings || {};
  return {
    inputBorderColor: String(source.inputBorderColor || defaults.inputBorderColor).trim(),
    inputFocusColor: String(source.inputFocusColor || defaults.inputFocusColor).trim(),
    inputErrorColor: String(source.inputErrorColor || defaults.inputErrorColor).trim(),
    buttonBgColor: String(source.buttonBgColor || defaults.buttonBgColor).trim(),
    buttonHoverColor: String(source.buttonHoverColor || defaults.buttonHoverColor).trim(),
    buttonFocusColor: String(source.buttonFocusColor || defaults.buttonFocusColor).trim(),
    buttonTextColor: String(source.buttonTextColor || defaults.buttonTextColor).trim(),
    checkboxColor: String(source.checkboxColor || defaults.checkboxColor).trim(),
    radioColor: String(source.radioColor || defaults.radioColor).trim(),
    switchColor: String(source.switchColor || defaults.switchColor).trim(),
    requiredIndicatorColor: String(
      source.requiredIndicatorColor || defaults.requiredIndicatorColor,
    ).trim(),
    successMessageColor: String(source.successMessageColor || defaults.successMessageColor).trim(),
    errorMessageColor: String(source.errorMessageColor || defaults.errorMessageColor).trim(),
  };
}

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
      submissionSettings: normalizeSubmissionSettings(doc?.submissionSettings),
      styleSettings: normalizeStyleSettings(doc?.styleSettings),
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
        submissionSettings: 1,
        styleSettings: 1,
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

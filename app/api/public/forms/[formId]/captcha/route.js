import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Form from "@/models/Form";
import { FORM_DEFAULTS } from "@/lib/forms/constants";
import {
  generateCaptchaChallenge,
  isCaptchaEnabled,
  normalizeCaptchaType,
} from "@/lib/forms/captcha";

function normalizeSubmissionSettings(input) {
  const source = input && typeof input === "object" ? input : {};
  return {
    captchaEnabled:
      source.captchaEnabled == null
        ? FORM_DEFAULTS.submissionSettings.captchaEnabled
        : Boolean(source.captchaEnabled),
    captchaType: normalizeCaptchaType(
      source.captchaType,
      FORM_DEFAULTS.submissionSettings.captchaType,
    ),
    recaptchaSiteKey: String(
      source.recaptchaSiteKey ||
        source.siteKey ||
        source.googleRecaptchaSiteKey ||
        FORM_DEFAULTS.submissionSettings.recaptchaSiteKey,
    ).trim(),
    recaptchaSecretKey: String(
      source.recaptchaSecretKey ||
        source.secretKey ||
        source.googleRecaptchaSecretKey ||
        FORM_DEFAULTS.submissionSettings.recaptchaSecretKey,
    ).trim(),
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
      { _id: 0, formId: 1, submissionSettings: 1 },
    ).lean();
    if (!form) {
      return NextResponse.json({ error: "Form not found or not published" }, { status: 404 });
    }

    const submissionSettings = normalizeSubmissionSettings(form?.submissionSettings);
    if (!isCaptchaEnabled(submissionSettings)) {
      return NextResponse.json({ error: "Captcha is not enabled for this form" }, { status: 400 });
    }

    const challenge = generateCaptchaChallenge({
      formId,
      captchaType: submissionSettings.captchaType,
      submissionSettings,
    });

    return NextResponse.json(
      {
        formId,
        captcha: {
          enabled: true,
          ...challenge,
        },
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to generate captcha challenge" },
      { status: 500 },
    );
  }
}

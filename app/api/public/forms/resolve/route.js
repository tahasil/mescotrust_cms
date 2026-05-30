import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Form from "@/models/Form";
import { parseFormShortcode } from "@/lib/formBuilder/shortcode";

function noStoreJson(payload, init = {}) {
  return NextResponse.json(payload, {
    ...init,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      ...(init.headers || {}),
    },
  });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const shortcode = String(searchParams.get("shortcode") || "").trim();
    if (!shortcode) {
      return NextResponse.json(
        { error: "shortcode query param is required" },
        { status: 400 },
      );
    }

    const parsed = parseFormShortcode(shortcode);
    if (!parsed.matched || !parsed.formId) {
      return NextResponse.json({ error: "Invalid shortcode" }, { status: 400 });
    }

    await connectDB();
    const form = await Form.findOne({ formId: parsed.formId })
      .select("formId name status shortcode shortcodeAlt")
      .lean();
    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    return noStoreJson({ form });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to resolve shortcode" },
      { status: 500 },
    );
  }
}


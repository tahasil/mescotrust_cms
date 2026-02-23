import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Component from "@/models/Component";

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const components = await Component.find().sort({ category: 1, name: 1 }).lean();
    return NextResponse.json(components);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function validateDefaultProps(schema, defaults) {
  if (!Array.isArray(schema) || !defaults || typeof defaults !== "object") return [];
  const errors = [];
  for (const field of schema) {
    const val = defaults[field.key];
    if (field.required && (val === undefined || val === "")) {
      errors.push(`defaultProps: "${field.key}" is required by schema`);
    }
    if (field.maxLength && typeof val === "string" && val.length > field.maxLength) {
      errors.push(`defaultProps: "${field.key}" exceeds maxLength ${field.maxLength}`);
    }
  }
  return errors;
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const { name, displayName, type, category, baseComponent, propsSchema, defaultProps, active } = body;

    const schema = propsSchema || [];
    const defaults = defaultProps || {};
    const validationErrors = validateDefaultProps(schema, defaults);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors.join("; ") }, { status: 400 });
    }

    await connectDB();
    const component = await Component.create({
      name: name || "Unnamed",
      displayName: displayName || name || "",
      type: type || "custom",
      category: category || "",
      baseComponent: baseComponent || name || "Paragraph",
      propsSchema: schema,
      defaultProps: defaults,
      active: active !== false,
    });
    return NextResponse.json(component);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

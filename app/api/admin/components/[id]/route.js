import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Component from "@/models/Component";
import Page from "@/models/Page";

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

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await connectDB();
    const component = await Component.findById(id).lean();
    if (!component) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(component);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const body = await req.json();
    const { name, displayName, type, category, baseComponent, propsSchema, defaultProps, layout, container, active } = body;

    await connectDB();
    const component = await Component.findById(id);
    if (!component) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (name !== undefined) component.name = name;
    if (displayName !== undefined) component.displayName = displayName;
    if (type !== undefined) component.type = type;
    if (category !== undefined) component.category = category;
    if (baseComponent !== undefined) component.baseComponent = baseComponent;
    if (propsSchema !== undefined) {
      component.propsSchema = propsSchema;
      component.markModified("propsSchema");
    }
    if (defaultProps !== undefined) {
      component.defaultProps = defaultProps;
      component.markModified("defaultProps");
    }
    if (Array.isArray(layout)) {
      // Deep clone so Mongoose persists the full nested structure (menu position, buttons, section settings, etc.)
      component.layout = JSON.parse(JSON.stringify(layout));
      component.markModified("layout");
    }
    if (container === "container" || container === "container-fluid") component.container = container;
    if (typeof active === "boolean") component.active = active;

    const finalSchema = component.propsSchema || [];
    const finalDefaults = component.defaultProps || {};
    const valErrors = validateDefaultProps(finalSchema, finalDefaults);
    if (valErrors.length > 0) {
      return NextResponse.json({ error: valErrors.join("; ") }, { status: 400 });
    }

    await component.save();
    // Return the document as stored in DB so the client sees exactly what persisted
    const persisted = await Component.findById(id).lean();
    return NextResponse.json(persisted);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await connectDB();
    const existing = await Component.findById(id).lean();
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.type === "system") {
      return NextResponse.json(
        { error: "System components cannot be deleted. Deactivate instead." },
        { status: 400 }
      );
    }
    const count = await Page.countDocuments({ "layout.componentId": id });
    if (count > 0) {
      return NextResponse.json(
        { error: `This component is used by ${count} page(s). Deactivate instead of delete, or remove it from pages first.` },
        { status: 400 }
      );
    }
    await Component.findByIdAndDelete(id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

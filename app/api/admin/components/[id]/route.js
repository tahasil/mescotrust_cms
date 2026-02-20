import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Component from "@/models/Component";
import Page from "@/models/Page";

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
    const { name, displayName, type, category, baseComponent, propsSchema, defaultProps, active } = body;

    await connectDB();
    const component = await Component.findById(id);
    if (!component) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (name !== undefined) component.name = name;
    if (displayName !== undefined) component.displayName = displayName;
    if (type !== undefined) component.type = type;
    if (category !== undefined) component.category = category;
    if (baseComponent !== undefined) component.baseComponent = baseComponent;
    if (propsSchema !== undefined) component.propsSchema = propsSchema;
    if (defaultProps !== undefined) component.defaultProps = defaultProps;
    if (typeof active === "boolean") component.active = active;

    await component.save();
    return NextResponse.json(component);
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
    const count = await Page.countDocuments({ "layout.componentId": id });
    if (count > 0) {
      return NextResponse.json(
        { error: `This component is used by ${count} page(s). Deactivate instead of delete, or remove it from pages first.` },
        { status: 400 }
      );
    }
    const component = await Component.findByIdAndDelete(id);
    if (!component) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

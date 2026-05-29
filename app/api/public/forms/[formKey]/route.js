import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Form from "@/models/Form";

export async function GET(_req, { params }) {
  try {
    const formKey = String(params?.formKey || "").trim();
    if (!formKey) {
      return NextResponse.json({ error: "Form key is required" }, { status: 400 });
    }

    await connectDB();
    const form = await Form.findOne({ formKey, isActive: true })
      .select({
        _id: 0,
        name: 1,
        formKey: 1,
        shortcode: 1,
        successMessage: 1,
        ui: 1,
        scaffold: 1,
      })
      .lean();

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    return NextResponse.json({ form });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to load form" }, { status: 500 });
  }
}

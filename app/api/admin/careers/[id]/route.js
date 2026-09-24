import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/apiAuth";
import CareerApplication from "@/models/CareerApplication";

export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id } = params;
    const body = await req.json();
    const { status, notes } = body;

    await connectDB();
    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const application = await CareerApplication.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, application });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to update application" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id } = params;
    await connectDB();
    const application = await CareerApplication.findByIdAndDelete(id);

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Application deleted" });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to delete application" },
      { status: 500 }
    );
  }
}

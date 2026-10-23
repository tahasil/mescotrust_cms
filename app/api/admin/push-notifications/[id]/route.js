import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import PushNotification from "@/models/PushNotification";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { id } = params;
    await connectDB();

    const doc = await PushNotification.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json(doc);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { id } = params;
    const body = await req.json();
    const { title, message: notifMessage, imageUrl, clickUrl, type } = body || {};

    await connectDB();

    const existing = await PushNotification.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    if (existing.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft notifications can be edited. This notification has already been processed." },
        { status: 400 }
      );
    }

    if (title !== undefined) {
      const cleanTitle = String(title || "").trim();
      if (!cleanTitle) {
        return NextResponse.json({ error: "Notification title cannot be empty." }, { status: 400 });
      }
      existing.title = cleanTitle.slice(0, 120);
    }

    if (notifMessage !== undefined) {
      const cleanMessage = String(notifMessage || "").trim();
      if (!cleanMessage) {
        return NextResponse.json({ error: "Notification message cannot be empty." }, { status: 400 });
      }
      existing.message = cleanMessage.slice(0, 300);
    }

    if (type !== undefined) {
      if (["announcement", "event", "campaign"].includes(type)) {
        existing.type = type;
      }
    }

    if (imageUrl !== undefined) {
      existing.imageUrl = String(imageUrl || "").trim();
    }

    if (clickUrl !== undefined) {
      existing.clickUrl = String(clickUrl || "").trim() || "/";
    }

    existing.updatedBy = session?.email || "Admin";
    await existing.save();

    return NextResponse.json(existing);
  } catch (err) {
    console.error("[api/admin/push-notifications/[id]] PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { id } = params;
    await connectDB();

    const existing = await PushNotification.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    await PushNotification.findByIdAndDelete(id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[api/admin/push-notifications/[id]] DELETE error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

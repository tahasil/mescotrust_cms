import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import PushNotification from "@/models/PushNotification";
import { broadcastPushNotification } from "@/lib/webPush";

export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { id } = params;
    await connectDB();

    const existing = await PushNotification.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    if (existing.status === "sending") {
      return NextResponse.json(
        { error: "This notification is currently in the process of being sent." },
        { status: 400 }
      );
    }

    if (existing.status === "sent") {
      return NextResponse.json(
        { error: "This notification has already been sent." },
        { status: 400 }
      );
    }

    existing.updatedBy = session?.email || "Admin";
    await existing.save();

    const stats = await broadcastPushNotification(existing);
    const updated = await PushNotification.findById(id).lean();

    return NextResponse.json({ success: true, notification: updated, stats });
  } catch (err) {
    console.error("[api/admin/push-notifications/[id]/send] POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

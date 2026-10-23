import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import PushNotification from "@/models/PushNotification";
import PushSubscription from "@/models/PushSubscription";
import { broadcastPushNotification } from "@/lib/webPush";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";
    const search = (searchParams.get("search") || "").trim();

    await connectDB();

    const filter = {};
    if (status && ["draft", "sending", "sent", "failed"].includes(status)) {
      filter.status = status;
    }
    if (type && ["announcement", "event", "campaign"].includes(type)) {
      filter.type = type;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    const [items, total, activeSubscribersCount] = await Promise.all([
      PushNotification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      PushNotification.countDocuments(filter),
      PushSubscription.countDocuments({ status: "active" }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      activeSubscribersCount,
    });
  } catch (err) {
    console.error("[api/admin/push-notifications] GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const {
      title,
      message: notifMessage,
      imageUrl,
      clickUrl,
      type,
      sendImmediately,
    } = body || {};

    const cleanTitle = String(title || "").trim();
    const cleanMessage = String(notifMessage || "").trim();

    if (!cleanTitle) {
      return NextResponse.json({ error: "Notification title is required." }, { status: 400 });
    }
    if (!cleanMessage) {
      return NextResponse.json({ error: "Notification message is required." }, { status: 400 });
    }

    const notifType = ["announcement", "event", "campaign"].includes(type)
      ? type
      : "announcement";

    const cleanClickUrl = String(clickUrl || "").trim() || "/";
    const cleanImageUrl = String(imageUrl || "").trim();
    const creatorEmail = session?.email || "Admin";

    await connectDB();

    const doc = await PushNotification.create({
      title: cleanTitle.slice(0, 120),
      message: cleanMessage.slice(0, 300),
      imageUrl: cleanImageUrl,
      clickUrl: cleanClickUrl,
      type: notifType,
      status: "draft",
      createdBy: creatorEmail,
      updatedBy: creatorEmail,
    });

    if (sendImmediately === true) {
      const stats = await broadcastPushNotification(doc);
      const updated = await PushNotification.findById(doc._id).lean();
      return NextResponse.json({ ...updated, stats });
    }

    return NextResponse.json(doc);
  } catch (err) {
    console.error("[api/admin/push-notifications] POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PushSubscription from "@/models/PushSubscription";

export const dynamic = "force-dynamic";

function isValidPushEndpoint(endpoint) {
  if (!endpoint || typeof endpoint !== "string") return false;
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { endpoint, keys, userAgent, deviceType, browser } = body || {};

    if (!isValidPushEndpoint(endpoint)) {
      return NextResponse.json({ error: "Invalid push service endpoint." }, { status: 400 });
    }

    if (!keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Missing required push encryption keys." }, { status: 400 });
    }

    await connectDB();

    const doc = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        $set: {
          endpoint,
          keys: {
            p256dh: String(keys.p256dh).trim(),
            auth: String(keys.auth).trim(),
          },
          status: "active",
          userAgent: String(userAgent || "").trim().slice(0, 500),
          deviceType: ["desktop", "mobile", "tablet", "unknown"].includes(deviceType)
            ? deviceType
            : "unknown",
          browser: String(browser || "").trim().slice(0, 100),
          failureCount: 0,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, id: doc._id });
  } catch (err) {
    console.error("[api/public/push-subscription] POST error:", err);
    return NextResponse.json({ error: err.message || "Failed to save push subscription." }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { endpoint } = body || {};

    if (!endpoint || !isValidPushEndpoint(endpoint)) {
      return NextResponse.json({ error: "Invalid endpoint provided." }, { status: 400 });
    }

    await connectDB();

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { $set: { status: "unsubscribed" } }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/public/push-subscription] DELETE error:", err);
    return NextResponse.json({ error: err.message || "Failed to unsubscribe." }, { status: 500 });
  }
}

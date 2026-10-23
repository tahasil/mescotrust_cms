import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/apiAuth";
import PushNotificationSettings from "@/models/PushNotificationSettings";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    let settings = await PushNotificationSettings.findOne({ moduleName: "push-settings" }).lean();
    if (!settings) {
      settings = {
        cardTitle: "Notifications",
        cardDescription:
          "Stay connected with MESCO Trust! Enable notifications to receive timely updates on emergency relief, education aid, and community events.",
        enableButtonText: "Enable Alerts",
        dismissButtonText: "Not Now",
        enabled: true,
      };
    }

    return NextResponse.json({ success: true, settings });
  } catch (err) {
    console.error("[GET /api/admin/push-notifications/settings] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectDB();

    const updateData = {
      cardTitle: (body.cardTitle || "Notifications").trim(),
      cardDescription: (body.cardDescription || "").trim(),
      enableButtonText: (body.enableButtonText || "Enable Alerts").trim(),
      dismissButtonText: (body.dismissButtonText || "Not Now").trim(),
      enabled: body.enabled !== false,
      updatedBy: auth.user?.email || "admin",
    };

    const settings = await PushNotificationSettings.findOneAndUpdate(
      { moduleName: "push-settings" },
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, settings });
  } catch (err) {
    console.error("[PUT /api/admin/push-notifications/settings] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to save settings" }, { status: 500 });
  }
}

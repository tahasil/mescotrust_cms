import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PushNotificationSettings from "@/models/PushNotificationSettings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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

    return NextResponse.json({
      success: true,
      settings: {
        cardTitle: settings.cardTitle || "Notifications",
        cardDescription:
          settings.cardDescription ||
          "Stay connected with MESCO Trust! Enable notifications to receive timely updates on emergency relief, education aid, and community events.",
        enableButtonText: settings.enableButtonText || "Enable Alerts",
        dismissButtonText: settings.dismissButtonText || "Not Now",
        enabled: settings.enabled !== false,
      },
    });
  } catch (err) {
    console.error("[GET /api/public/push-subscription/settings] Error:", err);
    return NextResponse.json(
      {
        success: false,
        settings: {
          cardTitle: "Notifications",
          cardDescription:
            "Stay connected with MESCO Trust! Enable notifications to receive timely updates on emergency relief, education aid, and community events.",
          enableButtonText: "Enable Alerts",
          dismissButtonText: "Not Now",
          enabled: true,
        },
      },
      { status: 200 }
    );
  }
}

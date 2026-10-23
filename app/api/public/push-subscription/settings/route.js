import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PushNotificationSettings from "@/models/PushNotificationSettings";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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
        showBellIcon: true,
      };
    }

    return NextResponse.json(
      {
        success: true,
        settings: {
          cardTitle: settings.cardTitle || "Notifications",
          cardDescription:
            settings.cardDescription ||
            "Stay connected with MESCO Trust! Enable notifications to receive timely updates on emergency relief, education aid, and community events.",
          enableButtonText: settings.enableButtonText || "Enable Alerts",
          dismissButtonText: settings.dismissButtonText || "Not Now",
          enabled: true,
          showBellIcon:
            typeof settings.showBellIcon === "boolean" ? settings.showBellIcon : true,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
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
          showBellIcon: true,
        },
      },
      { status: 200 }
    );
  }
}

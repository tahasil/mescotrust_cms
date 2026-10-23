import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import PushSubscription from "@/models/PushSubscription";
import PushNotification from "@/models/PushNotification";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();

    const [
      totalSubscribers,
      activeSubscribers,
      unsubscribedCount,
      expiredCount,
      totalSentNotifications,
      totalDraftNotifications,
      aggregateStats,
    ] = await Promise.all([
      PushSubscription.countDocuments(),
      PushSubscription.countDocuments({ status: "active" }),
      PushSubscription.countDocuments({ status: "unsubscribed" }),
      PushSubscription.countDocuments({ status: "expired" }),
      PushNotification.countDocuments({ status: "sent" }),
      PushNotification.countDocuments({ status: "draft" }),
      PushNotification.aggregate([
        { $match: { status: "sent" } },
        {
          $group: {
            _id: null,
            totalSuccessful: { $sum: "$stats.successfulSends" },
            totalFailed: { $sum: "$stats.failedSends" },
            totalTargeted: { $sum: "$stats.totalSubscribers" },
          },
        },
      ]),
    ]);

    const totals = aggregateStats[0] || {
      totalSuccessful: 0,
      totalFailed: 0,
      totalTargeted: 0,
    };

    const deliveryRate =
      totals.totalTargeted > 0
        ? Math.round((totals.totalSuccessful / totals.totalTargeted) * 100)
        : 100;

    return NextResponse.json({
      totalSubscribers,
      activeSubscribers,
      unsubscribedCount,
      expiredCount,
      totalSentNotifications,
      totalDraftNotifications,
      totalDelivered: totals.totalSuccessful,
      deliveryRate,
    });
  } catch (err) {
    console.error("[api/admin/push-notifications/stats] GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

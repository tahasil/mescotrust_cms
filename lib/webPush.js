const webpush = require("web-push");

let PushSubscriptionModel = null;
let PushNotificationModel = null;

function getModels() {
  if (!PushSubscriptionModel) {
    try {
      PushSubscriptionModel = require("@/models/PushSubscription");
    } catch {
      PushSubscriptionModel = require("../models/PushSubscription");
    }
  }
  if (!PushNotificationModel) {
    try {
      PushNotificationModel = require("@/models/PushNotification");
    } catch {
      PushNotificationModel = require("../models/PushNotification");
    }
  }
  return {
    PushSubscription: PushSubscriptionModel,
    PushNotification: PushNotificationModel,
  };
}

let vapidConfigured = false;

function ensureVapidConfig() {
  if (vapidConfigured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:info@mescotrust.org";

  if (!publicKey || !privateKey) {
    console.warn("[webPush] VAPID keys are missing from environment variables.");
    return false;
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
    return true;
  } catch (err) {
    console.error("[webPush] Failed to set VAPID details:", err.message);
    return false;
  }
}

function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
}

/**
 * Send a push notification to a single browser subscription.
 */
async function sendSingleNotification(subscription, payload) {
  if (!ensureVapidConfig()) {
    throw new Error("VAPID credentials not configured.");
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  };

  const payloadString = typeof payload === "string" ? payload : JSON.stringify(payload);

  return webpush.sendNotification(pushSubscription, payloadString, {
    TTL: 86400, // 24 hours
  });
}

/**
 * Execute broadcast sending of a notification to all active subscribers.
 * Uses chunked Promise.allSettled concurrency to avoid socket exhaustion.
 * Automatically cleans up expired/unsubscribed endpoints (HTTP 410 or 404).
 *
 * @param {Object} notificationDoc - The PushNotification mongoose document or plain object
 * @returns {Promise<Object>} Final delivery statistics
 */
async function broadcastPushNotification(notificationDoc) {
  if (!ensureVapidConfig()) {
    throw new Error("VAPID keys not configured in server environment.");
  }

  const { PushSubscription, PushNotification } = getModels();
  const notifId = notificationDoc._id;

  // Mark notification as sending
  await PushNotification.findByIdAndUpdate(notifId, {
    status: "sending",
  });

  const activeSubscriptions = await PushSubscription.find({ status: "active" }).lean();
  const totalSubscribers = activeSubscriptions.length;

  if (totalSubscribers === 0) {
    const finalStats = {
      totalSubscribers: 0,
      successfulSends: 0,
      failedSends: 0,
      expiredCleaned: 0,
    };
    await PushNotification.findByIdAndUpdate(notifId, {
      status: "sent",
      sentAt: new Date(),
      stats: finalStats,
      errorMessage: "No active subscribers found.",
    });
    return finalStats;
  }

  const payload = {
    title: notificationDoc.title,
    message: notificationDoc.message,
    imageUrl: notificationDoc.imageUrl || "",
    image: notificationDoc.imageUrl || "",
    clickUrl: notificationDoc.clickUrl || "/",
    type: notificationDoc.type || "announcement",
    notificationId: String(notifId),
  };
  const payloadString = JSON.stringify(payload);

  let successfulSends = 0;
  let failedSends = 0;
  let expiredCleaned = 0;

  const expiredEndpointIds = [];
  const BATCH_SIZE = 30;

  for (let i = 0; i < activeSubscriptions.length; i += BATCH_SIZE) {
    const batch = activeSubscriptions.slice(i, i + BATCH_SIZE);

    const promises = batch.map(async (sub) => {
      try {
        await sendSingleNotification(sub, payloadString);
        successfulSends++;
      } catch (err) {
        const statusCode = err?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          // Endpoint expired or unsubscribed by user
          expiredCleaned++;
          expiredEndpointIds.push(sub._id);
        } else {
          failedSends++;
          console.warn(`[webPush] Delivery failed for ${sub._id}:`, err?.message || err);
        }
      }
    });

    await Promise.allSettled(promises);
  }

  // Deactivate expired subscriptions in bulk
  if (expiredEndpointIds.length > 0) {
    try {
      await PushSubscription.updateMany(
        { _id: { $in: expiredEndpointIds } },
        { $set: { status: "expired" } }
      );
    } catch (cleanupErr) {
      console.error("[webPush] Failed to update expired subscriptions:", cleanupErr.message);
    }
  }

  const finalStats = {
    totalSubscribers,
    successfulSends,
    failedSends,
    expiredCleaned,
  };

  const finalStatus = successfulSends > 0 || totalSubscribers === 0 ? "sent" : "failed";

  await PushNotification.findByIdAndUpdate(notifId, {
    status: finalStatus,
    sentAt: new Date(),
    stats: finalStats,
    ...(finalStatus === "failed" && {
      errorMessage: `Failed to deliver to any subscriber (${failedSends} failures).`,
    }),
  });

  return finalStats;
}

module.exports = {
  ensureVapidConfig,
  getVapidPublicKey,
  sendSingleNotification,
  broadcastPushNotification,
};

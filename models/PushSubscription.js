const mongoose = require("mongoose");

const pushSubscriptionSchema = new mongoose.Schema(
  {
    endpoint: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    keys: {
      p256dh: { type: String, required: true, trim: true },
      auth: { type: String, required: true, trim: true },
    },
    status: {
      type: String,
      enum: ["active", "unsubscribed", "expired"],
      default: "active",
      index: true,
    },
    userAgent: { type: String, default: "", trim: true },
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      default: "unknown",
    },
    browser: { type: String, default: "" },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      nullable: true,
    },
    failureCount: { type: Number, default: 0 },
    lastDeliveredAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "push_subscriptions" }
);

pushSubscriptionSchema.index({ status: 1, createdAt: -1 });
pushSubscriptionSchema.index({ userId: 1 });

module.exports =
  (mongoose.models && mongoose.models.PushSubscription) ||
  mongoose.model("PushSubscription", pushSubscriptionSchema);

const mongoose = require("mongoose");

const pushNotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    clickUrl: {
      type: String,
      default: "/",
      trim: true,
    },
    type: {
      type: String,
      enum: ["announcement", "event", "campaign"],
      default: "announcement",
    },
    status: {
      type: String,
      enum: ["draft", "sending", "sent", "failed"],
      default: "draft",
    },
    stats: {
      totalSubscribers: { type: Number, default: 0 },
      successfulSends: { type: Number, default: 0 },
      failedSends: { type: Number, default: 0 },
      expiredCleaned: { type: Number, default: 0 },
    },
    errorMessage: { type: String, default: "" },
    sentAt: { type: Date, default: null },
    createdBy: { type: String, default: "", trim: true },
    updatedBy: { type: String, default: "", trim: true },
  },
  { timestamps: true, collection: "push_notifications" }
);

pushNotificationSchema.index({ status: 1, createdAt: -1 });
pushNotificationSchema.index({ type: 1 });
pushNotificationSchema.index({ createdAt: -1 });

module.exports =
  (mongoose.models && mongoose.models.PushNotification) ||
  mongoose.model("PushNotification", pushNotificationSchema);

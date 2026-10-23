const mongoose = require("mongoose");

const pushNotificationSettingsSchema = new mongoose.Schema(
  {
    moduleName: { type: String, required: true, default: "push-settings", unique: true },
    cardTitle: {
      type: String,
      default: "Notifications",
      trim: true,
      maxlength: 80,
    },
    cardDescription: {
      type: String,
      default:
        "Stay connected with MESCO Trust! Enable notifications to receive timely updates on emergency relief, education aid, and community events.",
      trim: true,
      maxlength: 300,
    },
    enableButtonText: {
      type: String,
      default: "Enable Alerts",
      trim: true,
      maxlength: 40,
    },
    dismissButtonText: {
      type: String,
      default: "Not Now",
      trim: true,
      maxlength: 40,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true, collection: "push_notification_settings" }
);

module.exports =
  (mongoose.models && mongoose.models.PushNotificationSettings) ||
  mongoose.model("PushNotificationSettings", pushNotificationSettingsSchema);

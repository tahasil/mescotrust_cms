const mongoose = require("mongoose");

const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    status: { type: String, enum: ["active", "unsubscribed"], default: "active" },
    source: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

// email already gets a unique index from `unique: true` — no separate decl
// (avoids the duplicate-index conflict on createIndexes).
subscriberSchema.index({ status: 1 });
subscriberSchema.index({ createdAt: -1 });

module.exports =
  (mongoose.models && mongoose.models.Subscriber) ||
  mongoose.model("Subscriber", subscriberSchema);

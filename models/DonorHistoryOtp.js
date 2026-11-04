const mongoose = require("mongoose");

/**
 * One-time codes for the public donation history page (UAT DON-05).
 *
 * One document per code sent. The plain code is never stored: `codeHash` is an
 * HMAC bound to `challengeId` (see lib/donations/donorHistoryAuth.js).
 *
 * `expiresAt` is when the code stops working (10 minutes). `purgeAt` is when
 * MongoDB deletes the row (1 hour), kept longer so the per-email hourly send
 * cap can still be counted after the code itself has expired.
 */
const donorHistoryOtpSchema = new mongoose.Schema(
  {
    challengeId: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    consumedAt: { type: Date, default: null },
    invalidatedAt: { type: Date, default: null },
    purgeAt: { type: Date, required: true },
  },
  {
    timestamps: true,
    collection: "donor_history_otps",
  },
);

donorHistoryOtpSchema.index({ email: 1, createdAt: -1 });
donorHistoryOtpSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });

module.exports =
  (mongoose.models && mongoose.models.DonorHistoryOtp) ||
  mongoose.model("DonorHistoryOtp", donorHistoryOtpSchema);

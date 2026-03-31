const mongoose = require("mongoose");

const donorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    pan: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    state: { type: String, default: "", trim: true },
    country: { type: String, default: "", trim: true },
    pincode: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    trackingId: { type: String, default: "" },
    bankRefNo: { type: String, default: "" },
    paymentMode: { type: String, default: "" },
    cardName: { type: String, default: "" },
    statusCode: { type: String, default: "" },
    statusMsg: { type: String, default: "" },
  },
  { _id: false }
);

const donationSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, trim: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    purpose: { type: String, default: "", trim: true },
    zakat: { type: String, default: "No", trim: true },
    note: { type: String, default: "", trim: true },
    donor: { type: donorSchema, required: true },
    payment: { type: paymentSchema, default: () => ({}) },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "aborted"],
      default: "pending",
    },
  },
  { timestamps: true }
);

donationSchema.index({ orderId: 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ "donor.email": 1 });
donationSchema.index({ createdAt: -1 });

module.exports =
  (mongoose.models && mongoose.models.Donation) ||
  mongoose.model("Donation", donationSchema);

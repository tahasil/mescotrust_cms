const mongoose = require("mongoose");

const donorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    mobile: { type: String, required: true, trim: true },
    pan: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    state: { type: String, default: "", trim: true },
    country: { type: String, default: "", trim: true },
    pincode: { type: String, default: "", trim: true },
  },
  { _id: false },
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
  { _id: false },
);

const lookupSchema = new mongoose.Schema(
  {
    query: { type: String, default: "", trim: true },
    method: {
      type: String,
      enum: ["email", "mobile", "none"],
      default: "none",
    },
    matched: { type: Boolean, default: false },
    matchedSubmissionId: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const donateNowSubmissionSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, trim: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR", trim: true },
    purpose: { type: String, default: "", trim: true },
    purposeId: { type: String, default: "", trim: true, index: true },
    zakat: { type: String, default: "No", trim: true },
    interestMoney: { type: String, default: "No", trim: true },
    studentsCount: { type: String, default: "", trim: true },
    note: { type: String, default: "", trim: true },
    donor: { type: donorSchema, required: true },
    additionalFields: { type: Object, default: {} },
    termsAccepted: { type: Boolean, default: false },
    purposeRuleSnapshot: { type: Object, default: {} },
    paymentSettingsSnapshot: { type: Object, default: {} },
    lookup: { type: lookupSchema, default: () => ({}) },
    source: { type: String, default: "DonateNow", trim: true },
    pagePath: { type: String, default: "", trim: true },
    payment: { type: paymentSchema, default: () => ({}) },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "aborted"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "donate_now_submissions",
  },
);

donateNowSubmissionSchema.index({ status: 1, createdAt: -1 });
donateNowSubmissionSchema.index({ "donor.email": 1 });
donateNowSubmissionSchema.index({ "donor.mobile": 1 });
donateNowSubmissionSchema.index({ purposeId: 1, createdAt: -1 });

module.exports =
  (mongoose.models && mongoose.models.DonateNowSubmission) ||
  mongoose.model("DonateNowSubmission", donateNowSubmissionSchema);

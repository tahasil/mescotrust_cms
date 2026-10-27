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

/**
 * Persisted gateway reconciliation data.
 *
 * Deliberately NOT stored (removed 2026-10): trackingId, paymentId,
 * orderStatus (Gateway Status) and verificationStatus. These were gateway
 * echoes that duplicated information already captured by transactionId,
 * statusCode/statusMsg/failureMessage and the donation `status` itself, and
 * they carried raw gateway identifiers that must not be retained.
 * `verificationMessage` is kept as the audit trail of *why* verification
 * failed, without the coarse status enum.
 */
const paymentSchema = new mongoose.Schema(
  {
    gateway: { type: String, default: "CCAvenue" },
    // Gateway-side order reference (CCAvenue reuses our orderId; Razorpay
    // issues its own order id that callbacks are matched on).
    gatewayOrderId: { type: String, default: "", trim: true },
    transactionId: { type: String, default: "" },
    bankRefNo: { type: String, default: "" },
    paymentMode: { type: String, default: "" },
    cardName: { type: String, default: "" },
    amount: { type: Number, default: null },
    currency: { type: String, default: "" },
    statusCode: { type: String, default: "" },
    statusMsg: { type: String, default: "" },
    failureMessage: { type: String, default: "" },
    responseCode: { type: String, default: "" },
    verificationMessage: { type: String, default: "" },
    responseHash: { type: String, default: "" },
    callbackReceivedAt: { type: Date, default: null },
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

const schemeEntrySchema = new mongoose.Schema(
  {
    schemeId: { type: String, default: "", trim: true },
    schemeName: { type: String, default: "", trim: true },
    amount: { type: Number, default: 0 },
    quantity: { type: Number, default: 1 },
    subtotal: { type: Number, default: 0 },
  },
  { _id: false },
);

const donateNowSubmissionSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, trim: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR", trim: true },
    purpose: { type: String, default: "", trim: true },
    schemes: { type: [schemeEntrySchema], default: [] },
    donationCategory: { type: String, default: "", trim: true },
    zakat: { type: String, default: "No", trim: true },
    interestMoney: { type: String, default: "No", trim: true },
    studentsCount: { type: String, default: "", trim: true },
    note: { type: String, default: "", trim: true },
    donor: { type: donorSchema, required: true },
    additionalFields: { type: Object, default: {} },
    termsAccepted: { type: Boolean, default: false },
    /**
     * Snapshot of the purpose rule set active at submit time. The purpose
     * object is sanitized server-side to drop its `id` (Purpose ID) before
     * persistence — see sanitizePurposeRuleSnapshot in app/api/payment/initiate.
     */
    purposeRuleSnapshot: { type: Object, default: {} },
    paymentSettingsSnapshot: { type: Object, default: {} },
    lookup: { type: lookupSchema, default: () => ({}) },
    donorType: {
      type: String,
      enum: ["new", "existing"],
      default: "new",
      index: true,
    },
    source: { type: String, default: "DonateNow", trim: true },
    pagePath: { type: String, default: "", trim: true },
    payment: { type: paymentSchema, default: () => ({}) },
    initiatedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled", "aborted"],
      default: "pending",
      index: true,
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: String, default: "", trim: true },
  },
  {
    timestamps: true,
    collection: "donate_now_submissions",
  },
);

donateNowSubmissionSchema.index({ status: 1, createdAt: -1 });
donateNowSubmissionSchema.index({ isDeleted: 1, createdAt: -1 });
donateNowSubmissionSchema.index({ "donor.email": 1 });
donateNowSubmissionSchema.index({ "donor.mobile": 1 });
donateNowSubmissionSchema.index({ "payment.gatewayOrderId": 1 });

if (
  mongoose.models &&
  mongoose.models.DonateNowSubmission &&
  (!mongoose.models.DonateNowSubmission.schema?.paths?.schemes ||
    !mongoose.models.DonateNowSubmission.schema?.paths?.donationCategory)
) {
  delete mongoose.models.DonateNowSubmission;
}

module.exports =
  (mongoose.models && mongoose.models.DonateNowSubmission) ||
  mongoose.model("DonateNowSubmission", donateNowSubmissionSchema);

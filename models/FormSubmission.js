const mongoose = require("mongoose");

const fieldSnapshotSchema = new mongoose.Schema(
  {
    fieldKey: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    name: { type: String, default: "", trim: true },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

const formSubmissionSchema = new mongoose.Schema(
  {
    formId: { type: String, required: true, trim: true, index: true },
    schemaVersion: { type: Number, required: true, min: 1 },
    fieldSnapshot: { type: [fieldSnapshotSchema], default: [] },
    payloadByFieldKey: { type: mongoose.Schema.Types.Mixed, default: {} },
    payloadByFieldNameSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ["new", "read"],
      default: "new",
      index: true,
    },
    readAt: { type: Date, default: null },
    readBy: { type: String, default: "", trim: true },
    source: { type: String, default: "", trim: true },
    page: { type: String, default: "", trim: true },
    referrer: { type: String, default: "", trim: true },
    ip: { type: String, default: "", trim: true },
    userAgent: { type: String, default: "", trim: true },
    searchableText: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

formSubmissionSchema.index({ formId: 1, createdAt: -1 });
formSubmissionSchema.index({ formId: 1, isRead: 1, createdAt: -1 });
formSubmissionSchema.index({ formId: 1, searchableText: 1 });

module.exports =
  (mongoose.models && mongoose.models.FormSubmission) ||
  mongoose.model("FormSubmission", formSubmissionSchema);

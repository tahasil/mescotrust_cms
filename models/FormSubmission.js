const mongoose = require("mongoose");

const formSubmissionSchema = new mongoose.Schema(
  {
    formId: { type: String, required: true, trim: true, index: true },
    schemaVersion: { type: Number, required: true, min: 1 },
    fieldSnapshot: { type: mongoose.Schema.Types.Mixed, required: true, default: {} },
    payloadByFieldKey: { type: mongoose.Schema.Types.Mixed, required: true, default: {} },
    payloadByFieldNameSnapshot: { type: mongoose.Schema.Types.Mixed, required: true, default: {} },
    searchText: { type: String, default: "", trim: true },
    isRead: { type: Boolean, default: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: String, default: "", trim: true },
    source: { type: String, default: "", trim: true },
    pagePath: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

formSubmissionSchema.index({ formId: 1, createdAt: -1 });
formSubmissionSchema.index({ formId: 1, isRead: 1, createdAt: -1 });
formSubmissionSchema.index({ formId: 1, isDeleted: 1, createdAt: -1 });
formSubmissionSchema.index({ searchText: "text" });

module.exports =
  (mongoose.models && mongoose.models.FormSubmission) ||
  mongoose.model("FormSubmission", formSubmissionSchema);


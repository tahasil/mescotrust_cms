const mongoose = require("mongoose");

const contactSubmissionSchema = new mongoose.Schema(
  {
    payload: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      phone: { type: String, default: "", trim: true },
      subject: { type: String, default: "", trim: true },
      message: { type: String, required: true, trim: true },
    },
    page: { type: String, default: "" },
    source: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

contactSubmissionSchema.index({ isDeleted: 1, createdAt: -1 });

module.exports =
  (mongoose.models && mongoose.models.ContactSubmission) || mongoose.model("ContactSubmission", contactSubmissionSchema);

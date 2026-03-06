const mongoose = require("mongoose");

const contactSubmissionSchema = new mongoose.Schema(
  {
    payload: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      message: { type: String, required: true, trim: true },
    },
    page: { type: String, default: "" },
    source: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports =
  (mongoose.models && mongoose.models.ContactSubmission) || mongoose.model("ContactSubmission", contactSubmissionSchema);

import mongoose from "mongoose";

const ContactSubmissionSchema = new mongoose.Schema(
  {
    payload: { type: String, required: true },
    formId: String,
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ContactSubmissionSchema.index({ createdAt: -1 });

export const ContactSubmission = mongoose.models.ContactSubmission ?? mongoose.model("ContactSubmission", ContactSubmissionSchema);

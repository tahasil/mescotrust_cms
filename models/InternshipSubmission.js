const mongoose = require("mongoose");

const internshipSubmissionSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    roleTitle: { type: String, default: "General Internship", trim: true },
    department: { type: String, default: "", trim: true },
    customRole: { type: String, default: "", trim: true },
    roleCategory: {
      type: String,
      enum: ["ActiveRole", "Other", ""],
      default: "ActiveRole",
      trim: true,
    },
    skills: { type: String, default: "", trim: true },
    workMode: {
      type: String,
      enum: ["Office", "Hybrid", "Remote", "Not specified", ""],
      default: "Not specified",
      trim: true,
    },
    duration: { type: String, default: "", trim: true },
    startDate: { type: String, default: "", trim: true },
    currentCity: { type: String, default: "", trim: true },
    statement: { type: String, default: "", trim: true },
    resume: {
      filename: { type: String, default: "", trim: true },
      originalName: { type: String, default: "", trim: true },
      mimeType: { type: String, default: "", trim: true },
      size: { type: Number, default: 0 },
      storagePath: { type: String, default: "", trim: true },
      url: { type: String, default: "", trim: true },
    },
    status: {
      type: String,
      enum: ["new", "reviewed", "shortlisted", "rejected", "archived"],
      default: "new",
      index: true,
    },
    isRead: { type: Boolean, default: false, index: true },
    sourcePage: { type: String, default: "", trim: true },
    source: { type: String, default: "internship-upload", trim: true },
  },
  { timestamps: true },
);

internshipSubmissionSchema.index({ createdAt: -1 });
internshipSubmissionSchema.index({ email: 1 });
internshipSubmissionSchema.index({ phone: 1 });
internshipSubmissionSchema.index({ roleTitle: 1 });
internshipSubmissionSchema.index({ status: 1 });

module.exports =
  (mongoose.models && mongoose.models.InternshipSubmission) ||
  mongoose.model("InternshipSubmission", internshipSubmissionSchema);


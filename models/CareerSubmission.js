const mongoose = require("mongoose");

const careerSubmissionSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    position: { type: String, default: "General Application", trim: true },
    qualification: { type: String, default: "", trim: true },
    experience: { type: String, default: "", trim: true },
    currentCity: { type: String, default: "", trim: true },
    coverLetter: { type: String, default: "", trim: true },
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
    source: { type: String, default: "careers-upload", trim: true },
  },
  { timestamps: true },
);

careerSubmissionSchema.index({ createdAt: -1 });
careerSubmissionSchema.index({ email: 1 });
careerSubmissionSchema.index({ phone: 1 });
careerSubmissionSchema.index({ position: 1 });
careerSubmissionSchema.index({ status: 1 });

module.exports =
  (mongoose.models && mongoose.models.CareerSubmission) ||
  mongoose.model("CareerSubmission", careerSubmissionSchema);

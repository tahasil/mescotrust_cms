const mongoose = require("mongoose");

const volunteersFeedbackSubmissionSchema = new mongoose.Schema(
  {
    payload: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true },
      message: { type: String, required: true, trim: true },
    },
    page: { type: String, default: "", trim: true },
    source: { type: String, default: "", trim: true },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

volunteersFeedbackSubmissionSchema.index({ createdAt: -1 });
volunteersFeedbackSubmissionSchema.index({ "payload.email": 1 });
volunteersFeedbackSubmissionSchema.index({ "payload.phone": 1 });
volunteersFeedbackSubmissionSchema.index({ source: 1 });

module.exports =
  (mongoose.models && mongoose.models.VolunteersFeedbackSubmission) ||
  mongoose.model(
    "VolunteersFeedbackSubmission",
    volunteersFeedbackSubmissionSchema,
  );

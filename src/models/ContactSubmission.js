import mongoose from 'mongoose';

const ContactSubmissionSchema = new mongoose.Schema(
  {
    formId: {
      type: String,
      default: 'default',
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    page: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.ContactSubmission ||
  mongoose.model('ContactSubmission', ContactSubmissionSchema);

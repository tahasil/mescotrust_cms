import mongoose from "mongoose";

const CareerApplicationSchema = new mongoose.Schema(
  {
    jobTitle: { type: String, required: true, trim: true },
    jobId: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    experience: { type: String, trim: true },
    currentOrganization: { type: String, trim: true },
    resumeUrl: { type: String, required: true, trim: true },
    coverLetter: { type: String, trim: true },
    status: {
      type: String,
      enum: ["new", "reviewed", "shortlisted", "rejected", "hired"],
      default: "new",
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.CareerApplication ||
  mongoose.model("CareerApplication", CareerApplicationSchema);

import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    permissions: [String],
  },
  { timestamps: true }
);

export const Role = mongoose.models.Role ?? mongoose.model("Role", RoleSchema);

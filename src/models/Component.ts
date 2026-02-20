import mongoose from "mongoose";

const ComponentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    schemaJSON: { type: String, required: true },
    defaultPropsJSON: String,
    isSystemComponent: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Component = mongoose.models.Component ?? mongoose.model("Component", ComponentSchema);

import mongoose from 'mongoose';

const LayoutItemSchema = new mongoose.Schema({
  componentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Component',
    required: true,
  },
  componentType: {
    type: String,
    enum: ['system', 'custom'],
    required: true,
  },
  props: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  order: {
    type: Number,
    required: true,
  },
  isEnabled: {
    type: Boolean,
    default: true,
  },
});

const PageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Page title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Page slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    layout: [LayoutItemSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.models.Page || mongoose.model('Page', PageSchema);

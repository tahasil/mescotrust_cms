import mongoose from 'mongoose';

// Sub-field schema (one level deep for repeater fields)
const SubFieldSchema = new mongoose.Schema(
  {
    fieldName: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ['text', 'richtext', 'image', 'video', 'number', 'select', 'boolean'],
      required: true,
    },
    required: { type: Boolean, default: false },
    defaultValue: { type: mongoose.Schema.Types.Mixed },
    options: [{ label: String, value: String }],
  },
  { _id: false }
);

const PropsSchemaFieldSchema = new mongoose.Schema(
  {
    fieldName: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'richtext', 'image', 'video', 'number', 'select', 'boolean', 'repeater'],
      required: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
    defaultValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    options: [
      {
        label: String,
        value: String,
      },
    ],
    fields: [SubFieldSchema], // Repeater sub-fields (one level deep)
  },
  { _id: false }
);

const ComponentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Component name is required'],
      unique: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['system', 'custom'],
      required: true,
    },
    category: {
      type: String,
      enum: ['layout', 'content', 'marketing', 'navigation'],
      default: 'content',
    },
    baseComponent: {
      type: String,
      required: true,
    },
    propsSchema: [PropsSchemaFieldSchema],
    defaultProps: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.models.Component || mongoose.model('Component', ComponentSchema);

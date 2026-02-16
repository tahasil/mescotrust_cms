import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    altText: {
      type: String,
      default: '',
    },
    caption: {
      type: String,
      default: '',
    },
    folder: {
      type: String,
      default: 'general',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.models.Media || mongoose.model('Media', MediaSchema);

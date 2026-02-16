import mongoose from 'mongoose';

const ThemeConfigSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
    primaryColor: {
      type: String,
      default: '#CF372F',
    },
    secondaryColor: {
      type: String,
      default: '#691C18',
    },
    fontFamily: {
      type: String,
      default: 'Inter',
    },
    fontSize: {
      base: { type: String, default: '16px' },
      heading: { type: String, default: '36px' },
    },
    layoutWidth: {
      type: String,
      default: '1400px',
    },
    headerStyle: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    footerStyle: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.models.ThemeConfig || mongoose.model('ThemeConfig', ThemeConfigSchema);

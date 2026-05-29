const mongoose = require("mongoose");
const softDeletePlugin = require("./plugins/softDelete");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, default: "" },
    content: { type: String, default: "" },
    featuredImageDesktop: { type: String, default: "" },
    featuredImageMobile: { type: String, default: "" },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    time: { type: String, default: "" },
    location: { type: String, default: "" },
    isOnline: { type: Boolean, default: false },
    eventLink: { type: String, default: "" },
    eventLinkTarget: { type: String, enum: ["_self", "_blank"], default: "_self" },
    eventLinkOpenInNewTab: { type: Boolean, default: false },
    tags: [{ type: String, trim: true }],
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    meta: {
      metaTitle: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
    },
    locale: { type: String, default: "en", index: true },
    createdBy: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

eventSchema.index({ status: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ updatedAt: -1 });
// Public events listings filter by status + sort by startDate.
eventSchema.index({ status: 1, startDate: -1 });

eventSchema.plugin(softDeletePlugin);

module.exports =
  (mongoose.models && mongoose.models.Event) || mongoose.model("Event", eventSchema);

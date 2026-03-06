const mongoose = require("mongoose");

const siteComponentMetaSchema = new mongoose.Schema(
  {
    /** Matches the component file name (e.g. Header, Footer, HeroHome). */
    componentId: { type: String, required: true, unique: true, trim: true },
    displayName: { type: String, default: "" },
    /** If true, this component is rendered on every page (e.g. header, footer). */
    global: { type: Boolean, default: false },
    /** Order when rendering global components (lower = first). */
    order: { type: Number, default: 0 },
    /** For global components: "before" = above main content, "after" = below. */
    position: { type: String, enum: ["before", "after"], default: "before" },
    /** If false, component is hidden from Add Component and not offered in the list. */
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

siteComponentMetaSchema.index({ global: 1, position: 1, order: 1 });

module.exports =
  (mongoose.models && mongoose.models.SiteComponentMeta) ||
  mongoose.model("SiteComponentMeta", siteComponentMetaSchema);

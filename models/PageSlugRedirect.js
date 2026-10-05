const mongoose = require("mongoose");

/**
 * Permanent record of a page slug that used to resolve.
 *
 * Whenever a page is moved or renamed (from the Page Builder "Parent Menu"
 * change or from a Menu reorder/move), the old slug is stored here so the
 * public site can answer with a redirect instead of a 404.
 */
const pageSlugRedirectSchema = new mongoose.Schema(
  {
    /** The slug (path without leading slash) that no longer resolves. */
    from: { type: String, required: true, unique: true, trim: true, lowercase: true },
    /** The slug it now resolves to. */
    to: { type: String, required: true, trim: true, lowercase: true },
    /** Why the move happened — useful for debugging in the admin. */
    reason: {
      type: String,
      enum: ["page_move", "page_rename", "menu_move", "manual"],
      default: "page_move",
    },
  },
  { timestamps: true }
);

pageSlugRedirectSchema.index({ to: 1 });

module.exports =
  (mongoose.models && mongoose.models.PageSlugRedirect) ||
  mongoose.model("PageSlugRedirect", pageSlugRedirectSchema);
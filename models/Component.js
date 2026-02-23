const mongoose = require("mongoose");

const componentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    displayName: { type: String, default: "" },
    type: { type: String, enum: ["system", "custom"], default: "custom" },
    category: { type: String, default: "" },
    baseComponent: { type: String, required: true },
    propsSchema: { type: mongoose.Schema.Types.Mixed, default: [] },
    defaultProps: { type: mongoose.Schema.Types.Mixed, default: {} },
    /** Layout designed in visual editor: array of blocks (same shape as page layout). */
    layout: { type: mongoose.Schema.Types.Mixed, default: [] },
    /** Wrapper class for component content: "container" or "container-fluid". */
    container: { type: String, enum: ["container", "container-fluid"], default: "container" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

componentSchema.index({ baseComponent: 1 });

module.exports = mongoose.models.Component || mongoose.model("Component", componentSchema);

const mongoose = require("mongoose");
const softDeletePlugin = require("./plugins/softDelete");

const popupSchema = new mongoose.Schema(
  {
    componentId: { type: String, required: true, unique: true, trim: true },
    displayName: { type: String, default: "" },
    defaultProps: { type: mongoose.Schema.Types.Mixed, default: {} },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "popups" },
);

popupSchema.plugin(softDeletePlugin);

module.exports =
  (mongoose.models && mongoose.models.Popup) ||
  mongoose.model("Popup", popupSchema);



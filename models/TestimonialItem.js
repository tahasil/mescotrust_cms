const mongoose = require("mongoose");

/**
 * Global shared pool of testimonial entries. Every testimonial group
 * (card view / slider view) renders its items from this single collection,
 * so content is maintained in one place.
 */
const testimonialItemSchema = new mongoose.Schema(
  {
    quote: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "", trim: true },
    // Card view renders every pool item; the slider view only renders items
    // with this flag turned on.
    showInSlider: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    createdBy: { type: String, default: "", trim: true },
    updatedBy: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

module.exports =
  (mongoose.models && mongoose.models.TestimonialItem) ||
  mongoose.model("TestimonialItem", testimonialItemSchema);

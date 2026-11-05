const mongoose = require("mongoose");

const testimonialItemSchema = new mongoose.Schema(
  {
    quote: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "", trim: true },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: true },
);

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, default: "Untitled Testimonials" },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    shortcode: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    // "card" renders the DonorTestimonials card grid; "slider" renders the Testimonials slider.
    style: { type: String, enum: ["card", "slider"], default: "card", index: true },
    description: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["published", "draft", "archived"],
      default: "published",
      index: true,
    },
    order: { type: Number, default: 0 },

    // Title configuration
    subTitle: { type: String, default: "", trim: true },
    mainTitle: { type: String, default: "", trim: true },

    // Typography & text colors (card view; mirror the DonorTestimonials settings)
    quoteIconColorKey: { type: String, default: "", trim: true },
    quoteTextColorKey: { type: String, default: "", trim: true },
    nameColorKey: { type: String, default: "", trim: true },
    roleColorKey: { type: String, default: "", trim: true },
    quoteIconFontSize: { type: Number, default: null },
    quoteTextFontSize: { type: Number, default: null },
    nameFontSize: { type: Number, default: null },
    roleFontSize: { type: Number, default: null },
    paragraphAlign: { type: String, default: "", trim: true },

    // Testimonials collection
    items: { type: [testimonialItemSchema], default: [] },

    createdBy: { type: String, default: "", trim: true },
    updatedBy: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

module.exports =
  (mongoose.models && mongoose.models.Testimonial) ||
  mongoose.model("Testimonial", testimonialSchema);

const mongoose = require("mongoose");

const galleryImageSchema = new mongoose.Schema(
  {
    urlDesktop: { type: String, default: "", trim: true },
    urlMobile: { type: String, default: "", trim: true },
    url: { type: String, default: "", trim: true },
    alt: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const galleryItemSchema = new mongoose.Schema(
  {
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    date: { type: String, default: "", trim: true },

    // Image Gallery fields (Album style)
    imageDesktop: { type: String, default: "", trim: true },
    imageMobile: { type: String, default: "", trim: true },
    image: { type: String, default: "", trim: true },
    images: { type: [galleryImageSchema], default: [] },
    type: { type: String, enum: ["album", "link"], default: "album" },
    linkType: { type: String, enum: ["internal", "external"], default: "internal" },
    linkUrl: { type: String, default: "", trim: true },

    // Video Gallery fields (Video card style)
    videoId: { type: String, default: "", trim: true },

    // Categories (Shared)
    categories: { type: [String], default: [] },
  },
  { _id: true },
);

const gallerySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    shortcode: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    type: { type: String, enum: ["image", "video"], required: true, default: "image", index: true },
    status: {
      type: String,
      enum: ["published", "draft", "archived"],
      default: "published",
      index: true,
    },
    description: { type: String, default: "", trim: true },
    order: { type: Number, default: 0 },

    // Filter tabs configured for this gallery
    tabs: { type: [String], default: ["All", "Education", "Medical", "Events", "Community"] },

    // Gallery items (Albums for Image Gallery, Videos for Video Gallery)
    items: { type: [galleryItemSchema], default: [] },

    // Full config payload storing section styles, typography, color keys, limits, etc.
    config: { type: mongoose.Schema.Types.Mixed, default: {} },

    createdBy: { type: String, default: "", trim: true },
    updatedBy: { type: String, default: "", trim: true },
  },
  {
    timestamps: true,
    collection: "galleries",
  },
);

gallerySchema.index({ type: 1, status: 1, updatedAt: -1 });
gallerySchema.index({ name: 1 });

if (mongoose.models && mongoose.models.Gallery) {
  delete mongoose.models.Gallery;
}

module.exports = mongoose.model("Gallery", gallerySchema);

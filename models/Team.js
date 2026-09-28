const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    qualification: { type: String, default: "", trim: true },
    title: { type: String, default: "", trim: true },
    imageDesktop: { type: String, default: "", trim: true },
    imageMobile: { type: String, default: "", trim: true },
    image: { type: String, default: "", trim: true },
    bio: { type: String, default: "", trim: true },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: true },
);

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, default: "Untitled Team" },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    shortcode: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    description: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["published", "draft", "archived"],
      default: "published",
      index: true,
    },
    order: { type: Number, default: 0 },

    // Title & Color configuration
    subTitle: { type: String, default: "", trim: true },
    mainTitle: { type: String, default: "Committee Members", trim: true },
    subTitleColorKey: { type: String, default: "", trim: true },
    titleColorKey: { type: String, default: "", trim: true },
    titleHighlightColorKey: { type: String, default: "", trim: true },
    cardTitleColorKey: { type: String, default: "", trim: true },
    cardDescriptionColorKey: { type: String, default: "", trim: true },
    buttonBgColorKey: { type: String, default: "", trim: true },
    buttonTextColorKey: { type: String, default: "", trim: true },
    buttonBorderColorKey: { type: String, default: "", trim: true },
    buttonHoverBgColorKey: { type: String, default: "", trim: true },
    buttonHoverTextColorKey: { type: String, default: "", trim: true },
    buttonHoverBorderColorKey: { type: String, default: "", trim: true },
    modalBgColorKey: { type: String, default: "", trim: true },
    modalNameColorKey: { type: String, default: "", trim: true },
    modalQualificationColorKey: { type: String, default: "", trim: true },
    modalRoleColorKey: { type: String, default: "", trim: true },
    modalBioColorKey: { type: String, default: "", trim: true },
    modalDividerColorKey: { type: String, default: "", trim: true },
    modalImageBorderColorKey: { type: String, default: "", trim: true },

    // Manage Section fields
    sectionBgType: { type: String, default: "default", trim: true },
    sectionBgImage: { type: String, default: "", trim: true },
    sectionBgColorKey: { type: String, default: "", trim: true },
    sectionPaddingTop: { type: Number, default: null },
    sectionPaddingBottom: { type: Number, default: null },
    sectionMarginTop: { type: Number, default: null },
    sectionMarginBottom: { type: Number, default: null },

    pageContainerBgType: { type: String, default: "default", trim: true },
    pageContainerBgImage: { type: String, default: "", trim: true },
    pageContainerBgColorKey: { type: String, default: "", trim: true },
    containerPaddingTop: { type: Number, default: null },
    containerPaddingRight: { type: Number, default: null },
    containerPaddingBottom: { type: Number, default: null },
    containerPaddingLeft: { type: Number, default: null },
    containerMarginTop: { type: Number, default: null },
    containerMarginBottom: { type: Number, default: null },

    // Members collection
    members: { type: [memberSchema], default: [] },

    createdBy: { type: String, default: "", trim: true },
    updatedBy: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

module.exports =
  (mongoose.models && mongoose.models.Team) ||
  mongoose.model("Team", teamSchema);

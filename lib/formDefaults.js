/**
 * Canonical default UI + success message for Forms.
 *
 * Single source of truth for the SERVER side of the Forms module: the scaffold
 * default applied on create (app/api/admin/forms/route.js) and the patch
 * fallback on update (app/api/admin/forms/[id]/route.js) must stay identical, so
 * they both import from here. Button/map colors are intentionally left empty so a
 * freshly-created form inherits the site theme rather than baking in brand hex
 * (see §2B sanitization). The Forms editor (components/admin/forms/FormEditPage.js)
 * keeps its OWN, deliberately-different defaults: concrete MESCO-primary fallbacks
 * so the color pickers show sensible values — that copy is not derived from this.
 */
export const DEFAULT_FORM_UI = {
  sectionBgGradient: "",
  cardBg: "#ffffff",
  cardBorderRadius: 16,
  cardPadding: 24,
  titleColor: "#0b2130",
  labelColor: "#334155",
  labelColorKey: "",
  inputBg: "#ffffff",
  inputBorderColor: "#e5e7eb",
  inputTextColor: "#111827",
  buttonBg: "",
  buttonBgColorKey: "",
  buttonTextColor: "",
  buttonTextColorKey: "",
  buttonHoverBg: "#ffffff",
  buttonHoverBgColorKey: "",
  buttonHoverTextColor: "",
  buttonHoverTextColorKey: "",
  buttonRadius: 24,
  leftContentHtml:
    "<p>If you would like to get involved or collaborate with us, please register your interest here and we will get back to you.</p>",
  leftContentColor: "#1f2933",
  leftContentColorKey: "",
  leftContentAlign: "left",
  leftContentFontSize: 16,
  leftContentLineHeight: 1.6,
  leftContentBottomSpacing: 16,
  leftMapTopSpacing: 18,
  mapEmbedUrl: "",
  mapHeightDesktop: 370,
  mapHeightTablet: 300,
  mapHeightMobile: 260,
  mapBorderRadius: 4,
  mapBorderColor: "#edf0f3",
  mapBorderColorKey: "",
};

export const DEFAULT_SUCCESS_MESSAGE = "Form submitted successfully.";

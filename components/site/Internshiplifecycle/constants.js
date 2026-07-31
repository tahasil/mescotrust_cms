export const INTERNSHIP_LIFECYCLE_DEFAULT_STEPS = [
  {
    title: "Application submission",
    description: "tell us who you are and where you'd like to help.",
    icon: "/images/internship-lifecycle/application-submission.svg",
    highlighted: true,
  },
  {
    title: "Screening and interview with the volunteer coordination team.",
    description: "",
    icon: "/images/internship-lifecycle/screening-interview.svg",
    highlighted: false,
  },
  {
    title: "Orientation and role assignment matched to your skills and availability.",
    description: "",
    icon: "/images/internship-lifecycle/orientation-assignment.svg",
    highlighted: false,
  },
  {
    title: "Active engagement with periodic reviews and feedback.",
    description: "",
    icon: "/images/internship-lifecycle/active-engagement.svg",
    highlighted: false,
  },
  {
    title: "Completion certification recognising your contribution.",
    description: "",
    icon: "/images/internship-lifecycle/completion-certification.svg",
    highlighted: false,
  },
];

export const INTERNSHIP_LIFECYCLE_DEFAULTS = {
  mainTitle: "From application to certificate",
  titleColorKey: "black",
  internshiplifecycleAccentColorKey: "primary",
  internshiplifecycleDescriptionColorKey: "black",
  internshiplifecycleCircleBgColorKey: "black",
  internshiplifecycleCircleHoverBgColorKey: "primary",
  internshiplifecycleIconColorKey: "white",
  internshiplifecycleIconHoverColorKey: "white",
  internshiplifecycleConnectorColorKey: "themeBorder",
  internshiplifecycleTitleFontFamily: "",
  internshiplifecycleTitleFontSize: 52,
  internshiplifecycleTitleFontWeight: 700,
  internshiplifecycleTitleLineHeight: 1.12,
  internshiplifecycleTitleLetterSpacing: 0,
  internshiplifecycleTitleTextTransform: "none",
  internshiplifecycleCircleSize: 52,
  internshiplifecycleIconSize: 24,
  internshiplifecycleStepGap: 32,
  internshiplifecycleItems: INTERNSHIP_LIFECYCLE_DEFAULT_STEPS,
};

const LEGACY_LIFECYCLE_TITLES = [
  "application submission",
  "screening and interview",
  "orientation and role assignment",
  "active engagement and periodic reviews",
  "completion certification",
];

function isLegacyLifecycle(items) {
  return (
    Array.isArray(items) &&
    items.length === LEGACY_LIFECYCLE_TITLES.length &&
    items.every(
      (item, index) =>
        String(item?.title || "").trim().toLowerCase() ===
          LEGACY_LIFECYCLE_TITLES[index] &&
        !String(item?.description || "").trim(),
    )
  );
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function normalizeInternshipLifecycleItem(item, fallback = {}) {
  return {
    title:
      item?.title != null
        ? String(item.title).trim()
        : fallback?.title != null
          ? String(fallback.title).trim()
          : "",
    description:
      item?.description != null
        ? String(item.description).trim()
        : fallback?.description != null
          ? String(fallback.description).trim()
          : "",
    icon:
      item?.icon != null
        ? String(item.icon).trim()
        : fallback?.icon != null
          ? String(fallback.icon).trim()
          : "",
    highlighted:
      item?.highlighted != null
        ? Boolean(item.highlighted)
        : Boolean(fallback?.highlighted),
  };
}

export function normalizeInternshipLifecycleItems(items) {
  const source =
    Array.isArray(items) && items.length > 0 && !isLegacyLifecycle(items)
      ? items
      : INTERNSHIP_LIFECYCLE_DEFAULT_STEPS;
  return source.map((item, index) =>
    normalizeInternshipLifecycleItem(
      item,
      INTERNSHIP_LIFECYCLE_DEFAULT_STEPS[index] ||
        INTERNSHIP_LIFECYCLE_DEFAULT_STEPS[0],
    ),
  );
}

export function getInternshipLifecycleDefaults(data = {}) {
  const defaults = INTERNSHIP_LIFECYCLE_DEFAULTS;
  const suppliedTitle =
    data?.mainTitle != null ? String(data.mainTitle).trim() : "";
  const isLegacyTitle = ["internship lifecycle", "internship *lifecycle*"].includes(
    suppliedTitle.toLowerCase(),
  );
  return {
    ...defaults,
    ...data,
    mainTitle: suppliedTitle && !isLegacyTitle ? suppliedTitle : defaults.mainTitle,
    titleColorKey:
      data?.titleColorKey != null
        ? String(data.titleColorKey).trim()
        : defaults.titleColorKey,
    internshiplifecycleAccentColorKey:
      data?.internshiplifecycleAccentColorKey != null
        ? String(data.internshiplifecycleAccentColorKey).trim()
        : defaults.internshiplifecycleAccentColorKey,
    internshiplifecycleDescriptionColorKey:
      data?.internshiplifecycleDescriptionColorKey != null
        ? String(data.internshiplifecycleDescriptionColorKey).trim()
        : defaults.internshiplifecycleDescriptionColorKey,
    internshiplifecycleCircleBgColorKey:
      data?.internshiplifecycleCircleBgColorKey != null
        ? String(data.internshiplifecycleCircleBgColorKey).trim()
        : defaults.internshiplifecycleCircleBgColorKey,
    internshiplifecycleCircleHoverBgColorKey:
      data?.internshiplifecycleCircleHoverBgColorKey != null
        ? String(data.internshiplifecycleCircleHoverBgColorKey).trim()
        : defaults.internshiplifecycleCircleHoverBgColorKey,
    internshiplifecycleIconColorKey:
      data?.internshiplifecycleIconColorKey != null
        ? String(data.internshiplifecycleIconColorKey).trim()
        : defaults.internshiplifecycleIconColorKey,
    internshiplifecycleIconHoverColorKey:
      data?.internshiplifecycleIconHoverColorKey != null
        ? String(data.internshiplifecycleIconHoverColorKey).trim()
        : defaults.internshiplifecycleIconHoverColorKey,
    internshiplifecycleConnectorColorKey:
      data?.internshiplifecycleConnectorColorKey != null
        ? String(data.internshiplifecycleConnectorColorKey).trim()
        : defaults.internshiplifecycleConnectorColorKey,
    internshiplifecycleTitleFontFamily:
      data?.internshiplifecycleTitleFontFamily != null
        ? String(data.internshiplifecycleTitleFontFamily).trim()
        : defaults.internshiplifecycleTitleFontFamily,
    internshiplifecycleTitleFontSize: clampNumber(
      data?.internshiplifecycleTitleFontSize,
      20,
      120,
      defaults.internshiplifecycleTitleFontSize,
    ),
    internshiplifecycleTitleFontWeight: clampNumber(
      data?.internshiplifecycleTitleFontWeight,
      100,
      900,
      defaults.internshiplifecycleTitleFontWeight,
    ),
    internshiplifecycleTitleLineHeight: clampNumber(
      data?.internshiplifecycleTitleLineHeight,
      0.8,
      2.2,
      defaults.internshiplifecycleTitleLineHeight,
    ),
    internshiplifecycleTitleLetterSpacing: clampNumber(
      data?.internshiplifecycleTitleLetterSpacing,
      -4,
      20,
      defaults.internshiplifecycleTitleLetterSpacing,
    ),
    internshiplifecycleTitleTextTransform:
      data?.internshiplifecycleTitleTextTransform != null
        ? String(data.internshiplifecycleTitleTextTransform).trim() || "none"
        : defaults.internshiplifecycleTitleTextTransform,
    internshiplifecycleCircleSize: clampNumber(
      data?.internshiplifecycleCircleSize,
      40,
      120,
      defaults.internshiplifecycleCircleSize,
    ),
    internshiplifecycleIconSize: clampNumber(
      data?.internshiplifecycleIconSize,
      16,
      84,
      defaults.internshiplifecycleIconSize,
    ),
    internshiplifecycleStepGap: clampNumber(
      data?.internshiplifecycleStepGap,
      8,
      80,
      defaults.internshiplifecycleStepGap,
    ),
    internshiplifecycleItems: normalizeInternshipLifecycleItems(
      data?.internshiplifecycleItems,
    ),
  };
}


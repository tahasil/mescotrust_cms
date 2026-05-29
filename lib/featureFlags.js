function toBool(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function resolveFlagValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return "";
}

export function isEventsFeatureEnabled() {
  return toBool(
    resolveFlagValue(
      process.env.NEXT_PUBLIC_ENABLE_EVENTS,
      process.env.ENABLE_EVENTS,
      process.env.FEATURE_EVENTS,
    ),
  );
}

export function isAdminSlidersCreateEnabled() {
  return toBool(
    resolveFlagValue(
      process.env.NEXT_PUBLIC_ENABLE_ADMIN_SLIDERS_CREATE,
      process.env.ENABLE_ADMIN_SLIDERS_CREATE,
      process.env.FEATURE_ADMIN_SLIDERS_CREATE,
    ),
  );
}

export function isAdminFormsCreateEnabled() {
  return toBool(
    resolveFlagValue(
      process.env.NEXT_PUBLIC_ENABLE_ADMIN_FORMS_CREATE,
      process.env.ENABLE_ADMIN_FORMS_CREATE,
      process.env.FEATURE_ADMIN_FORMS_CREATE,
    ),
  );
}

export function isAdminFormsDeleteEnabled() {
  return toBool(
    resolveFlagValue(
      process.env.NEXT_PUBLIC_ENABLE_ADMIN_FORMS_DELETE,
      process.env.ENABLE_ADMIN_FORMS_DELETE,
      process.env.FEATURE_ADMIN_FORMS_DELETE,
    ),
  );
}

export function isAdminThemeComponentsCreateEnabled() {
  return toBool(
    resolveFlagValue(
      process.env.NEXT_PUBLIC_ENABLE_ADMIN_THEME_COMPONENTS_CREATE,
      process.env.ENABLE_ADMIN_THEME_COMPONENTS_CREATE,
      process.env.FEATURE_ADMIN_THEME_COMPONENTS_CREATE,
    ),
  );
}

export function isAdminThemeComponentsDeleteEnabled() {
  return toBool(
    resolveFlagValue(
      process.env.NEXT_PUBLIC_ENABLE_ADMIN_THEME_COMPONENTS_DELETE,
      process.env.ENABLE_ADMIN_THEME_COMPONENTS_DELETE,
      process.env.FEATURE_ADMIN_THEME_COMPONENTS_DELETE,
    ),
  );
}

export function isAdminPopupsCreateEnabled() {
  return toBool(
    resolveFlagValue(
      process.env.NEXT_PUBLIC_ENABLE_ADMIN_POPUPS_CREATE,
      process.env.ENABLE_ADMIN_POPUPS_CREATE,
      process.env.FEATURE_ADMIN_POPUPS_CREATE,
    ),
  );
}

export function isAdminSlidersDeleteEnabled() {
  return toBool(
    resolveFlagValue(
      process.env.NEXT_PUBLIC_ENABLE_ADMIN_SLIDERS_DELETE,
      process.env.ENABLE_ADMIN_SLIDERS_DELETE,
      process.env.FEATURE_ADMIN_SLIDERS_DELETE,
    ),
  );
}

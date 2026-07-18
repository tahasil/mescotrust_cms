export const SOCIAL_WALL_MODULE_NAME = "social-wall";

export const SOCIAL_WALL_PLATFORM_DEFINITIONS = Object.freeze([
  { platform: "instagram", label: "Instagram", liveCapable: true, defaultMode: "live" },
  { platform: "facebook", label: "Facebook", liveCapable: true, defaultMode: "live" },
  { platform: "youtube", label: "YouTube", liveCapable: true, defaultMode: "live" },
  { platform: "twitter", label: "X (Twitter)", liveCapable: true, defaultMode: "live" },
  { platform: "linkedin", label: "LinkedIn", liveCapable: false, defaultMode: "manual-only" },
  { platform: "pinterest", label: "Pinterest", liveCapable: false, defaultMode: "manual-only" },
  { platform: "snapchat", label: "Snapchat", liveCapable: false, defaultMode: "manual-only" },
]);

export const SOCIAL_WALL_PLATFORM_SET = new Set(
  SOCIAL_WALL_PLATFORM_DEFINITIONS.map((item) => item.platform),
);

export const SOCIAL_WALL_DEFAULT_SETTINGS = Object.freeze({
  moduleEnabled: true,
  defaultLayout: "grid",
  defaultPostLimit: 12,
  defaultSortBy: "latest",
  defaultSortOrder: "desc",
  filtersEnabled: true,
  moderationMode: "manual",
  cardStylePreset: "clean",
});

export const SOCIAL_WALL_FETCH_COOLDOWN_MS = 5 * 60 * 1000;
export const SOCIAL_WALL_MAX_POST_LIMIT = 60;
export const SOCIAL_WALL_DEFAULT_POST_LIMIT = 12;
export const SOCIAL_WALL_MAX_SYNC_POST_LIMIT = 50;
const ENV_FETCH_INTERVAL = Number(process.env.SOCIAL_WALL_DEFAULT_FETCH_INTERVAL || 30);
export const SOCIAL_WALL_DEFAULT_FETCH_INTERVAL_MINUTES =
  Number.isFinite(ENV_FETCH_INTERVAL) && ENV_FETCH_INTERVAL >= 5 && ENV_FETCH_INTERVAL <= 1440
    ? Math.floor(ENV_FETCH_INTERVAL)
    : 30;
